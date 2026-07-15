# Testes e integração contínua

## Dependências de desenvolvimento

```bash
python -m pip install -r requirements-dev.txt
python -m pip check
```

O baseline usa Python 3.13.14 e dependências fixadas por versão.

## Validação local completa

```bash
python -m compileall -q app migrations scripts tests
ruff check app tests migrations scripts
ruff format --check app tests migrations scripts
pytest --cov=app --cov-report=term-missing --cov-report=xml -m "not sandbox"
alembic heads
alembic current
```

`alembic current` exige banco acessível pela `DATABASE_URL`.

## Serviços de teste

O arquivo `docker-compose.test.yml` fornece:

```text
PostgreSQL 16.14 em localhost:55432
Redis 7.4.2 em localhost:56379
```

Inicialização:

```bash
docker compose -f docker-compose.test.yml up -d
```

Variáveis:

```bash
export APP_ENV=test
export DATABASE_URL=postgresql+psycopg2://burnix:burnix_test_password@127.0.0.1:55432/burnix_test
export TEST_DATABASE_URL="$DATABASE_URL"
export SECRET_KEY=ci-only-secret-key-with-at-least-32-characters
export BACKEND_CORS_ORIGINS='[]'
export OPENPIX_BASE_URL=https://api.woovi-sandbox.com
export TEST_REDIS_URL=redis://127.0.0.1:56379/15
```

Preparação:

```bash
alembic upgrade head
pytest -m "not sandbox"
```

Encerramento:

```bash
docker compose -f docker-compose.test.yml down -v
```

## Organização da suíte

### Unitários

```text
tests/unit
```

Cobrem regras sem depender de toda a pilha HTTP, incluindo:

- regras temporais do evento;
- transições de status;
- disponibilidade de inscrição;
- máquina de estados do pagamento;
- chaves e identificação de IP do rate limit;
- job de encerramento;
- sanitização de logs e opções de pool.

### Integração

```text
tests/integration
```

Cobrem:

- rotas canônicas sem `307`;
- autenticação e ownership;
- criação e atualização de evento;
- optimistic locking por `version`;
- duplicidade e concorrência de inscrição;
- capacidade;
- migrations;
- disponibilidade pública;
- criação e webhook de pagamento;
- rate limit com respostas `429`;
- payloads `413`;
- request ID e readiness.

### E2E externo

```text
tests/e2e/test_openpix_sandbox.py
```

É marcado como `sandbox` e não roda por padrão.

Execução explícita:

```bash
export RUN_OPENPIX_SANDBOX_E2E=1
export OPENPIX_APP_ID='<appid-sandbox>'
export OPENPIX_BASE_URL=https://api.woovi-sandbox.com
pytest -m sandbox tests/e2e/test_openpix_sandbox.py -q
```

Nunca use AppID de produção.

## Testes que exigem PostgreSQL real

São necessários para validar corretamente:

- `SELECT ... FOR UPDATE`;
- concorrência entre sessões;
- índice único parcial de pagamentos pendentes;
- constraints específicas;
- chain completa de migrations.

Executar apenas com SQLite não é suficiente para liberar produção.

## Testes que exigem Redis real

`TEST_REDIS_URL` habilita o teste que confirma contadores compartilhados por instâncias independentes do rate limiter.

Esse teste garante que o limite não fica isolado por worker.

## Migrações

Validações mínimas:

```bash
test "$(alembic heads | wc -l)" -eq 1
alembic upgrade head
alembic current
```

A suíte também cobre:

- compatibilidade de migrations;
- backfill de eventos legados;
- constraints de unicidade;
- rejeição de dados incompatíveis.

## OpenAPI

A geração do OpenAPI precisa ser validada porque consumidores dependem de:

- paths sem barra final;
- aliases de compatibilidade com barra final ocultos do schema;
- schemas de request e response;
- esquemas `OrganizerBearer` e `ParticipantBearer`;
- respostas `413`, `429` e erros de domínio;
- marcação das rotas depreciadas.

Comando simples:

```bash
python - <<'PY'
from app.main import app
spec = app.openapi()
assert "/contracts" in spec["paths"]
assert "/contracts/" not in spec["paths"]
print(len(spec["paths"]))
PY
```

Configure `DATABASE_URL` e `SECRET_KEY` antes de importar a aplicação.

## CI

Workflow:

```text
.github/workflows/backend-tests.yml
```

Executado em push para `main` ou `master` e em pull requests.

Etapas:

1. provisiona PostgreSQL e Redis;
2. instala dependências;
3. executa `pip check`;
4. compila fontes;
5. confirma um único head Alembic;
6. aplica migrations;
7. executa Ruff;
8. executa testes com cobertura;
9. constrói a imagem Docker;
10. inicia a imagem;
11. valida `/ready`, `/ping` e logs do container.

## Critérios de aprovação

Uma alteração não deve ser promovida quando ocorrer qualquer um destes casos:

- falha de compilação;
- divergência de formatação;
- erro de lint;
- teste `not sandbox` falhando;
- mais de um head Alembic;
- migration que não aplica em PostgreSQL;
- imagem Docker que não constrói;
- container que não fica ready;
- regressão de ownership, status, capacidade, idempotência ou rate limit;
- OpenAPI incompatível sem versionamento explícito.

## Testes por área

| Área | Arquivos principais |
|---|---|
| Rotas sem redirect | `tests/integration/test_collection_routes.py` |
| Eventos e concorrência | `tests/unit/test_contract_rules.py`, `tests/integration/test_contract_updates.py` |
| Status de evento | `tests/unit/test_contract_status_transitions.py` |
| Inscrições | `tests/integration/test_duplicate_registration.py`, `tests/test_registration_concurrency.py` |
| Disponibilidade | `tests/unit/test_registration_availability.py`, `tests/integration/test_public_contract_availability.py` |
| Job | `tests/unit/test_close_finished_events.py` |
| Pagamentos | `tests/integration/test_payment_creation.py`, `tests/integration/test_openpix_webhook.py` |
| Rate limit | `tests/unit/test_rate_limit_keys.py`, `tests/integration/test_rate_limits.py` |
| Payload e operação | `tests/integration/test_payload_limits.py`, `tests/integration/test_operational_readiness.py` |
| Migrations | `tests/integration/test_migrations.py`, `tests/integration/test_event_lifecycle_migration.py` |
