# Deploy

## Artefato de produção

O projeto inclui `Dockerfile` multi-stage.

Características da imagem:

- base `python:3.13.14-slim-bookworm`;
- dependências instaladas em virtualenv separado;
- somente dependências de runtime;
- usuário não privilegiado `burnix` com UID/GID 10001;
- diretório de trabalho `/app`;
- `PYTHONDONTWRITEBYTECODE=1`;
- `PYTHONUNBUFFERED=1`;
- porta padrão 8000;
- dois workers por padrão;
- health check em `/ready`;
- proxy headers do Uvicorn desativados.

Build:

```bash
docker build -t burnix-backend:local .
```

## Execução local em container

O container exige pelo menos `DATABASE_URL` e `SECRET_KEY`.

```bash
docker run --rm \
  --name burnix-backend \
  -p 8000:8000 \
  --env-file .env \
  -e WEB_CONCURRENCY=1 \
  burnix-backend:local
```

O container não aplica migrations automaticamente.

## Execução sem Docker

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`--reload` deve ser usado somente em desenvolvimento.

## Dependências de infraestrutura

### PostgreSQL

Obrigatório em todos os ambientes implantados.

Baseline:

```text
PostgreSQL 16.14
```

Requisitos:

- conexão TLS quando trafegar fora de rede privada;
- backups e point-in-time recovery conforme o RPO;
- limite de conexões compatível com workers e réplicas;
- usuário da aplicação sem privilégios administrativos desnecessários.

### Redis

Obrigatório quando `RATE_LIMIT_ENABLED=true`.

Baseline de CI:

```text
Redis 7.4.2
```

Produção deve usar instância compartilhada, com persistência e alta disponibilidade definidas de acordo com a política de fail-open ou fail-closed.

### Scheduler

Necessário para executar:

```bash
python -m app.jobs.close_finished_events
```

O scheduler deve ficar fora do Uvicorn.

### OpenPix

Staging usa sandbox; produção usa endpoint oficial. AppID e credenciais do webhook devem vir de secret manager.

## Variáveis de processo

| Variável | Padrão | Uso |
|---|---:|---|
| `PORT` | `8000` | Porta HTTP no container |
| `WEB_CONCURRENCY` | `2` | Quantidade de workers Uvicorn |

`WEB_CONCURRENCY` afeta diretamente o total potencial de conexões PostgreSQL.

## Ordem de deploy

### 1. Construir e identificar o artefato

```bash
docker build -t registry.example.com/burnix/backend:<commit> .
docker push registry.example.com/burnix/backend:<commit>
```

Registre o digest imutável da imagem.

### 2. Validar a configuração

Confirme:

```text
APP_ENV correto
DEBUG=false em produção
DATABASE_URL correta
SECRET_KEY forte
CORS explícito
Redis e modo de rate limit
proxies confiáveis
OpenPix do ambiente correto
segurança do webhook
pool do banco
limites de payload
```

### 3. Fazer backup

```bash
pg_dump "$DATABASE_URL" --format=custom --file=burnix-predeploy.dump
pg_restore --list burnix-predeploy.dump >/dev/null
```

### 4. Pré-validar dados

Quando o banco ainda não estiver no head atual:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/check_registration_duplicates.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/check_event_lifecycle_migration.sql
```

### 5. Aplicar migrations

Execute uma única vez por ambiente:

```bash
alembic heads
alembic current
alembic upgrade head
alembic current
```

Head esperado:

```text
f7a1c2d3e4b5
```

### 6. Publicar canário

Suba uma instância ou pequena fração das réplicas com a imagem nova.

Valide:

```bash
curl --fail https://api.example.com/ping
curl --fail https://api.example.com/ready
curl -i https://api.example.com/ping | grep -i '^x-request-id:'
```

### 7. Executar smoke funcional

- login de organizador;
- `GET /auth/me`;
- listagem de `/contracts`, `/clients` e `/payments` sem `3xx`;
- consulta pública de evento;
- login de participante;
- listagem das próprias inscrições;
- criação controlada de inscrição em staging;
- criação Pix sandbox;
- webhook assinado;
- execução do job de encerramento.

### 8. Liberar tráfego progressivamente

Aumente a fração de tráfego enquanto monitora:

- `5xx`;
- latência;
- pool PostgreSQL;
- Redis;
- OpenPix;
- `429`;
- readiness;
- reinícios.

### 9. Ativar ou confirmar scheduler

O job deve usar a mesma imagem e configuração do backend, com `EVENT_CLOSE_JOB_BATCH_SIZE` adequado.

## Proxy e balanceador

O proxy deve:

- terminar TLS ou encaminhar para uma camada TLS interna;
- preservar `X-Request-ID`;
- adicionar `X-Forwarded-For` de forma controlada;
- usar um endereço pertencente a `RATE_LIMIT_TRUSTED_PROXIES`;
- encaminhar bodies sem truncar o webhook;
- respeitar limites de timeout compatíveis com a OpenPix;
- consultar `/ready` para readiness e `/ping` para liveness.

Não habilite `--proxy-headers` no Uvicorn sem rever a estratégia de confiança do IP.

## Estratégia de rollout do rate limit

1. staging em `observe`;
2. observar distribuição real por regra;
3. produção em `observe` durante janela controlada, quando permitido;
4. ativar `enforce`;
5. manter alertas de falso positivo;
6. ajustar valores somente por configuração versionada ou secret/config manager.

## Rollback de aplicação

Rollback do container pode ser feito para o digest anterior quando:

- a migration é compatível com a versão anterior;
- nenhum contrato HTTP novo obrigatório impede o cliente antigo;
- o banco não recebeu dados impossíveis de interpretar pela versão anterior.

Quando a migration não é backward-compatible, priorize correção forward.

## Staging

Staging deve usar:

```text
mesma imagem de produção
PostgreSQL real
Redis real
OPENPIX_BASE_URL de sandbox
AppID exclusivo de sandbox
webhook assinado
scheduler habilitado
```

Não use mocks como única validação pré-produção dos fluxos financeiros.

## Produção

Condições mínimas:

- imagem imutável;
- secrets fora da imagem;
- pelo menos uma política de backup restaurável;
- migrations aplicadas de forma serializada;
- rate limit compartilhado;
- logs centralizados;
- alertas de readiness e pagamento;
- job externo ativo;
- HTTPS;
- proxy confiável corretamente configurado.
