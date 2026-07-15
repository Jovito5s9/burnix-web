# Backend Burnix

Backend FastAPI da Burnix para organizadores, eventos, participantes, inscrições
e pagamentos Pix em um modelo SaaS multi-organizador.

No domínio técnico atual:

```text
User        = organizador
Participant = conta autenticada do participante
Contract    = evento
Client      = inscrição
Payment     = cobrança
```

## Estado desta entrega

Esta versão contém:

- a **Estabilização de produção — Etapas 0 e 1**, com baseline reproduzível,
  teste de regressão do `307`, URLs canônicas sem barra final e aliases de
  compatibilidade para as coleções consumidas por versões anteriores do frontend;
- as **Etapas 2 e 3 do ciclo de eventos**, com horários timezone-aware,
  validação integral, publicação/encerramento/cancelamento/reabertura, auditoria e
  concorrência otimista por `version`;
- as **Etapas 4 e 5 de disponibilidade e encerramento**, com estado público
  calculado pelo relógio do servidor e job externo idempotente após `end_at`;
- a **Etapa 6 de rate limit em múltiplas camadas**, com Redis compartilhado,
  identificação segura do IP, políticas por principal e resposta `429`;
- a **Etapa 1**, com segurança pública, webhook fechado e OpenPix com subcontas;
- a **Etapa 2**, com identidade própria de participante e área “Meus eventos”;
- a **Etapa 3**, com unicidade de inscrição, controle concorrente de capacidade,
  expiração de reserva e suporte correto a eventos gratuitos;
- a **Etapa 4**, com credenciais OpenPix isoladas por ambiente, validação de
  startup e status administrativo sem segredos;
- a **Etapa 5**, com ciclo de vida, idempotência e testes de pagamentos;
- a **Etapa 6**, com contratos estáveis de erro, mensagens seguras e logs
  técnicos sem exposição ao cliente.

Principais garantias das Etapas 2 a 6:

- organizadores e participantes usam entidades e tokens separados;
- o JWT contém `token_kind=organizer` ou `token_kind=participant`;
- token de participante não acessa rotas do organizador, e vice-versa;
- novas inscrições exigem uma conta de participante autenticada;
- `participant_id` e e-mail são derivados do token, nunca do payload;
- um participante lista inscrições feitas em eventos de vários organizadores;
- outro participante recebe `404` ao tentar consultar ou pagar uma inscrição alheia;
- o organizador continua restrito a registros do próprio `owner_user_id`;
- inscrições antigas permanecem com `participant_id = null` e não são associadas
  automaticamente por e-mail ou documento;
- a listagem carrega evento e pagamento mais recente em uma única consulta SQL,
  sem N+1;
- o banco impede mais de uma inscrição por `participant_id + contract_id`;
- a criação bloqueia a linha do evento com `SELECT ... FOR UPDATE`;
- capacidade, duplicidade e insert são avaliados na mesma transação;
- uma inscrição expirada deixa de ocupar vaga;
- eventos gratuitos são confirmados com `payment_status=not_required` e não
  criam cobrança;
- staging aceita somente a API de sandbox e produção somente a API oficial;
- staging e produção exigem AppID e segurança de webhook no startup;
- o AppID é enviado apenas pelo backend no header `Authorization`;
- o status administrativo nunca devolve AppID ou segredos de webhook;
- erros da API seguem `detail.code` + `detail.message`;
- falhas internas da OpenPix ficam nos logs e em campos internos de auditoria;
- respostas 5xx nunca expõem AppID, URL interna, resposta bruta do provedor,
  stack trace ou mensagem de exceção;
- erros de validação 422 não ecoam valores sensíveis enviados no request.

Documentação detalhada:

```text
docs/participant-identity-my-events.md
docs/registration-uniqueness-concurrency.md
docs/openpix-environments-stage-4.md
docs/payment-lifecycle-stage-5.md
docs/error-contracts-stage-6.md
docs/release-checklist-stage-7.md
docs/preproduction-security-openpix.md
docs/backend-architecture.md
docs/production-baseline.md
docs/validation-report-production-stages-0-1.md
docs/event-lifecycle-stages-2-3.md
docs/validation-report-stages-2-3.md
docs/registration-availability-and-auto-close-stages-4-5.md
docs/validation-report-stages-4-5.md
docs/rate-limit-stage-6.md
docs/validation-report-rate-limit-stage-6.md
docs/validation-report-stage-6.md
```

## Stack

- CPython 3.13.14
- PostgreSQL 16.14 (`postgres:16.14-alpine` no ambiente de teste)
- FastAPI
- Pydantic 2
- SQLAlchemy 2
- Alembic
- OpenPix/Woovi

## Instalação

```bash
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
# .venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Para desenvolvimento e testes:

```bash
pip install -r requirements-dev.txt
```

Copie e preencha a configuração:

```bash
cp .env.example .env
```

## Banco de dados e migrations

As Etapas 2 e 3 **alteram o banco de dados**. O head atual é:

```text
f7a1c2d3e4b5
```

Antes do upgrade, faça backup e execute a pré-validação:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/check_event_lifecycle_migration.sql
alembic current
alembic heads
alembic upgrade head
alembic current
```

O último comando deve mostrar `f7a1c2d3e4b5 (head)`.

As Etapas 4 e 5 desta entrega não adicionam migration. Se o banco já está em
`f7a1c2d3e4b5`, não há novo `alembic upgrade head` a executar.

A Etapa 6 de rate limit também não adiciona migration. Ela exige Redis somente
quando `RATE_LIMIT_ENABLED=true`.

A migration de unicidade `d4a8f2c1e9b3` interrompe a execução quando encontra
pares duplicados de `participant_id + contract_id`. Antes de aplicá-la em uma
base antiga, execute:

```bash
psql "$DATABASE_URL" -f scripts/check_registration_duplicates.sql
```

Não crie nem force a constraint antes de limpar ou consolidar as linhas
reportadas. Inscrições legadas com `participant_id = null` continuam permitidas
pelo PostgreSQL e não são associadas automaticamente.

## Baseline reproduzível e validação

Use a versão registrada em `.python-version` e instale as dependências de
desenvolvimento com pins exatos:

```bash
python --version
python -m pip install -r requirements-dev.txt
```

Validação local de referência:

```bash
python -m compileall -q app migrations scripts tests
ruff check app tests migrations scripts
ruff format --check app tests migrations scripts
pytest -q -m "not sandbox"
alembic heads
alembic current
```

A configuração completa de runtime, banco, variáveis e CI está documentada em
`docs/production-baseline.md`.

## Convenção de URLs de coleção

As coleções usam URL canônica **sem barra final**:

```text
GET/POST /contracts
GET      /payments
GET/POST /clients
GET      /billing-profiles
GET/POST /contracts/{contract_id}/form-fields
```

A aplicação permanece configurada com `redirect_slashes=False`, portanto não
gera `307 Temporary Redirect` para corrigir URLs automaticamente. Para manter
compatibilidade com versões anteriores do frontend, existem aliases explícitos
e ocultos do OpenAPI para `GET/POST /contracts/` e `GET /payments/`. As demais
coleções continuam rejeitando variantes com barra final com `404`.

Novas integrações devem usar sempre as URLs canônicas sem barra final.

### Resposta paginada de eventos

`GET /contracts?skip=0&limit=20` retorna um envelope compatível com o frontend:

```json
{
  "items": [],
  "total": 0,
  "skip": 0,
  "limit": 20
}
```

`items` contém a página solicitada, `total` contém a quantidade total de eventos
do organizador antes de `skip` e `limit`, e os metadados repetem a paginação
validada pela API. `skip` deve ser maior ou igual a zero e `limit` deve estar
entre 1 e 100.

## Execução

```bash
uvicorn app.main:app --reload
```

Rotas de saúde:

```text
GET /ping
GET /db-check
```

Documentação local:

```text
/docs
/redoc
```

## Disponibilidade pública e encerramento automático

`GET /public/contracts/{contract_id}` retorna, além dos dados do evento:

```text
registration_open
registration_state
registration_closed_reason
registration_closed_message
server_time
remaining_capacity
```

O formulário deve ser exibido somente quando `registration_open=true`. O valor
é calculado no servidor e considera status, `end_at`, prazo e capacidade. A
criação da inscrição continua repetindo essas validações dentro da transação.

O encerramento persistido é executado fora dos workers HTTP:

```bash
python -m app.jobs.close_finished_events
# ou
python scripts/run_scheduled_jobs.py
```

Agende o comando a cada minuto ou a cada cinco minutos. Ele é idempotente,
incrementa `version` e não altera inscrições nem pagamentos. Não inicie esse
scheduler no startup do Uvicorn.

## Rate limit e Redis

Staging e produção usam Redis para compartilhar contadores entre workers e
réplicas. O modo de observação registra contagens sem bloquear; o modo de
execução retorna `429` com `Retry-After`.

Configuração mínima:

```env
REDIS_URL=redis://redis:6379/0
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=observe
RATE_LIMIT_TRUSTED_PROXIES=["10.0.0.0/8"]
```

Troque para `RATE_LIMIT_MODE=enforce` depois de observar o tráfego. Configure
apenas as redes reais do proxy; headers encaminhados vindos de peers não
confiáveis são ignorados. As políticas e o procedimento operacional estão em
`docs/rate-limit-stage-6.md`.

## Autenticação do organizador

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

O login gera JWT com:

```json
{
  "sub": "123",
  "token_kind": "organizer",
  "role": "contractor"
}
```

Tokens emitidos antes desta versão não possuem `token_kind` e precisam ser
renovados por novo login.

## Autenticação do participante

```text
POST /participant-auth/register
POST /participant-auth/login
GET  /participant-auth/me
```

Cadastro e login retornam:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "participant": {
    "id": 10,
    "email": "pessoa@example.com",
    "is_active": true,
    "email_verified_at": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

O JWT do participante contém:

```json
{
  "sub": "10",
  "token_kind": "participant"
}
```

O e-mail é normalizado para letras minúsculas antes de ser persistido. O campo
`email_verified_at` foi preparado para um fluxo futuro de verificação; esta
entrega não bloqueia login enquanto ele estiver nulo.

## Eventos públicos e criação de inscrição

A página do evento continua pública:

```text
GET /public/contracts/{contract_id}
```

Comportamento por status:

| Status | Página pública | Nova inscrição autenticada |
|---|---:|---:|
| `draft` | 404 | 404 |
| `published` | disponível | permitida |
| `closed` | disponível | bloqueada |
| `cancelled` | 404 | 404 |

A rota pública antiga de criação foi bloqueada:

```text
POST /public/contracts/{contract_id}/registrations
→ 401 participant_authentication_required
```

A rota vigente é:

```text
POST /participant/contracts/{contract_id}/registrations
Authorization: Bearer <participant_token>
```

Payload:

```json
{
  "name": "Pessoa Participante",
  "phone": "+55...",
  "document": "...",
  "sex": null,
  "age": null,
  "extra_fields": {}
}
```

O payload não aceita `participant_id` nem `email`. Esses valores são definidos
pelo backend a partir do token autenticado.

## Unicidade e concorrência da inscrição

A identidade principal da inscrição é:

```text
participant_id + contract_id
```

A proteção ocorre em duas camadas:

1. `SELECT ... FOR UPDATE` na linha do evento serializa criações concorrentes;
2. `uq_registration_participant_contract` impede duplicidade mesmo se um fluxo
   futuro não usar o serviço central.

Dentro do mesmo lock são executados:

```text
status e prazo -> duplicidade -> capacidade -> insert -> commit
```

Uma tentativa repetida retorna `409 Conflict` sem dados pessoais completos:

```json
{
  "detail": {
    "code": "registration_already_exists",
    "message": "Você já possui uma inscrição neste evento.",
    "registration_id": 42,
    "can_resume_payment": true
  }
}
```

Quando `can_resume_payment=true`, o participante pode continuar pela rota de Pix
da própria inscrição.

O valor de apresentação de telefone e documento é preservado. Para comparação e
integrações, o backend persiste:

```text
phone_normalized    -> somente dígitos
document_normalized -> somente dígitos
email               -> strip + lowercase
```

Não foi ativada unicidade por CPF/documento nesta etapa, pois essa regra era
condicional no contexto-base. A unicidade obrigatória é a identidade autenticada
do participante por evento.

## “Meus eventos”

```text
GET /participant/registrations
GET /participant/registrations/{registration_id}
```

A listagem cruza todos os organizadores, mas filtra exclusivamente por
`Client.participant_id`.

Exemplo:

```json
[
  {
    "id": 42,
    "registration_status": "confirmed",
    "payment_status": "paid",
    "created_at": "2026-07-10T12:00:00Z",
    "event": {
      "id": 10,
      "title": "Evento exemplo",
      "status": "published",
      "price": "100.00",
      "currency": "BRL",
      "start_date": "2026-08-10",
      "end_date": "2026-08-11"
    },
    "latest_payment": {
      "id": 87,
      "status": "paid",
      "amount": "100.00",
      "currency": "BRL",
      "checkout_url": null,
      "qr_code_base64": null,
      "copy_and_paste": null,
      "expires_at": null
    }
  }
]
```

A resposta não inclui `owner_user_id`, payload bruto da OpenPix, documento do
pagador armazenado no pagamento ou IDs internos do gateway.

## Pagamento autenticado do participante

```text
POST /participant/registrations/{registration_id}/payments/pix
Authorization: Bearer <participant_token>
Content-Type: application/json

{"idempotency_key":"opcional"}
```

O backend localiza a inscrição usando simultaneamente:

```text
registration_id + participant_id do token
```

Alterar apenas o ID da URL não autoriza acesso a outra inscrição.

A rota legada da Etapa 1 continua temporariamente disponível apenas para
inscrições que já possuam token opaco:

```text
POST /payments/registrations/{registration_id}/pix
X-Registration-Token: <token-legado>
```

Novas inscrições autenticadas não recebem nem persistem esse token.

### Eventos gratuitos

Ao criar inscrição em evento com preço zero:

```text
registration_status = confirmed
payment_status      = not_required
```

Nenhuma linha é criada em `payments`. Se um frontend antigo ainda chamar a rota
de Pix, a API responde de forma controlada com `status=not_required`, sem chamar
a OpenPix.

## Isolamento do organizador

O organizador continua consultando apenas inscrições do próprio evento:

```text
GET /contracts/{contract_id}/registrations
```

As consultas permanecem isoladas por `owner_user_id`. Vincular uma inscrição a
um participante não transfere a propriedade do registro para outro organizador.

## OpenPix multi-organizador

Cada organizador precisa de uma subconta ativa:

```text
GET  /integrations/openpix/status
POST /integrations/openpix/subaccount
POST /integrations/openpix/subaccount/sync
```

Configuração financeira padrão:

```env
OPENPIX_SETTLEMENT_MODE=split
PAYMENT_PLATFORM_FEE_PERCENT=0.03
OPENPIX_SPLIT_TYPE=SPLIT_SUB_ACCOUNT
```

Sem subconta ativa ou quando o provedor está indisponível, a resposta pública
não revela a configuração financeira do organizador:

```text
503 payment_provider_unavailable
```

## Webhook OpenPix

```text
POST /payments/webhook/openpix
```

Mecanismos aceitos:

- `X-OpenPix-Signature` com HMAC-SHA1/base64;
- `x-webhook-signature` com RSA-SHA256 e chave pública PEM em base64.

Sem assinatura válida, a rota retorna `401 invalid_webhook_signature` e não
altera pagamentos.

Em `OPENPIX:CHARGE_EXPIRED`, a cobrança mais recente atualiza também a inscrição:

```text
Payment.status             = expired
Client.payment_status      = expired
Client.registration_status = expired
```

Webhooks fora de ordem não regridem uma cobrança já paga para expirada.

## Configuração OpenPix por ambiente

Use `.env.staging.example` e `.env.production.example`. O startup exige:

- staging com `https://api.woovi-sandbox.com` e AppID do sandbox;
- produção com `https://api.openpix.com.br` e AppID de produção;
- ao menos um mecanismo de assinatura de webhook em ambos;
- AppID e HMAC sem placeholders;
- em produção, `SECRET_KEY` forte, CORS sem `*` e `DEBUG=false`.

Compare os arquivos protegidos antes do deploy:

```bash
python -m scripts.validate_openpix_environment_pair \
  --staging /caminho/.env.staging \
  --production /caminho/.env.production
```

Tempos de sessão:

```env
ACCESS_TOKEN_EXPIRE_MINUTES=60
PARTICIPANT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Validação

```bash
pytest -q
ruff check .
ruff format --check .
python -m compileall -q app migrations scripts tests
alembic heads
alembic current
```

O relatório executado nesta entrega está em:

```text
docs/validation-report-stage-6.md
```

# Etapas 2 e 3 — validação e ciclo de vida dos eventos

Novos eventos usam `start_at` e `end_at` com timezone explícito. Os campos
legados `start_date` e `end_date` continuam disponíveis e são sincronizados.

Rotas de status:

```text
POST /contracts/{id}/publish
POST /contracts/{id}/close
POST /contracts/{id}/cancel
POST /contracts/{id}/reopen
```

Toda alteração envia `version`; versões antigas retornam
`409 event_version_conflict`. Eventos pagos só publicam com perfil de cobrança
e OpenPix ativos. Consulte `docs/event-lifecycle-stages-2-3.md`.

# Etapa 5 — ciclo de vida e testes de pagamento

Cada linha de `payments` agora representa uma tentativa numerada. A correlação
da OpenPix deriva de `registration_id + attempt_number`, permitindo uma nova
cobrança depois de `expired` ou `error` sem duplicar uma cobrança ainda ativa.

Regras centrais:

```text
pending -> paid | expired | error
paid    -> refunded
```

Transições regressivas são bloqueadas e webhooks repetidos são idempotentes. O
banco impede duas tentativas `pending` para a mesma inscrição por meio de índice
único parcial.

Esta etapa altera o banco. Depois de atualizar o código, execute:

```bash
alembic upgrade head
```

Novo head:

```text
e5b7c9d2f4a1
```

Dependências e testes de desenvolvimento:

```bash
python -m pip install -r requirements-dev.txt
docker compose -f docker-compose.test.yml up -d
pytest --cov=app --cov-report=term-missing -m 'not sandbox'
```

Detalhes técnicos e relatório:

```text
docs/payment-lifecycle-stage-5.md
docs/validation-report-stage-5.md
```

# Etapa 6 — contratos de erro e mensagens seguras

Toda falha tratada segue o formato:

```json
{
  "detail": {
    "code": "event_registration_closed",
    "message": "As inscrições para este evento estão encerradas."
  }
}
```

Códigos centrais desta etapa:

```text
event_not_published
event_registration_closed
event_capacity_reached
registration_already_exists
registration_not_found
registration_payment_not_allowed
payment_already_confirmed
payment_provider_unavailable
payment_expired
invalid_webhook_signature
rate_limit_exceeded
request_body_too_large
```

Falhas técnicas como `OPENPIX_APP_ID não configurado`, erros de rede, status HTTP
do provedor e stack traces são registradas internamente. Para o cliente, uma
falha ao criar a cobrança retorna:

```json
{
  "detail": {
    "code": "payment_provider_unavailable",
    "message": "Não foi possível gerar o pagamento agora. Tente novamente em alguns instantes.",
    "retryable": true
  }
}
```

O tratamento global também normaliza erros legados e responde `internal_error`
em falhas não tratadas. Consulte `docs/error-contracts-stage-6.md`.

# Etapa 7 — checklist de liberação

A ordem obrigatória de liberação está documentada em
`docs/release-checklist-stage-7.md`. Resumo:

1. backup validado do PostgreSQL;
2. consulta de duplicados e migrations em staging;
3. deploy do backend e validação de `/ping` e `/db-check`;
4. evento, cobrança sandbox e webhook;
5. deploy do frontend e testes E2E;
6. somente então, troca da URL e das credenciais para produção.

Esta entrega adiciona `f7a1c2d3e4b5_event_lifecycle_and_optimistic_locking.py`.
Bancos no head anterior `e5b7c9d2f4a1` devem executar `alembic upgrade head`
após backup e pré-validação dos dados legados.


# Etapas 7 e 8 — segurança operacional e liberação

A API agora possui:

- pool PostgreSQL configurável por worker;
- `X-Request-ID` em todas as respostas e chamadas OpenPix;
- logs JSON com caminho normalizado, duração e principal seguro;
- sanitização de JWT, e-mail, documento, segredo e credenciais em URL;
- limites de payload para autenticação, inscrições, campos dinâmicos e webhook;
- `GET /ready` para readiness de banco e Redis;
- imagem Docker multi-stage executada como usuário não privilegiado;
- CI com PostgreSQL, Redis, migrations, lint, testes, cobertura e build da imagem.

Variáveis principais:

```env
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
LOG_LEVEL=INFO
REQUEST_BODY_DEFAULT_MAX_BYTES=1048576
AUTH_REQUEST_MAX_BODY_BYTES=16384
REGISTRATION_REQUEST_MAX_BODY_BYTES=262144
FORM_FIELD_REQUEST_MAX_BODY_BYTES=65536
```

Health checks:

```text
GET /ping      liveness, sem dependências
GET /db-check  diagnóstico do banco
GET /ready     readiness do banco e Redis
```

Documentação:

```text
docs/operations.md
docs/production-release-checklist.md
docs/release-checklist-stage-7.md
```

As Etapas 7 e 8 não adicionam migration. O head permanece `f7a1c2d3e4b5`.
