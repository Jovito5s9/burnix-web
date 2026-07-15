# Banco de dados e migrations

## Banco suportado

O alvo de produção e CI é PostgreSQL 16.14. O projeto utiliza o driver `psycopg2` para o runtime síncrono.

SQLite é usado em parte dos testes unitários, mas não substitui PostgreSQL para validar:

- locks `SELECT ... FOR UPDATE`;
- índices parciais;
- inspeção de constraints;
- migrations que usam operações específicas de PostgreSQL.

## Sessões e pool

A engine é criada em `app/db/session.py` com:

```text
pool_pre_ping=true
future=true
expire_on_commit=false
```

Para bancos não SQLite também são aplicados:

```text
pool_size
max_overflow
pool_timeout
pool_recycle
```

Cada request recebe uma sessão SQLAlchemy e a fecha ao final da dependência.

## Tabelas

### `users`

Conta do organizador.

```text
id
email unique
hashed_password
is_active
role
```

### `participants`

Conta autenticada do participante.

```text
id
email unique
hashed_password
is_active
email_verified_at
created_at
updated_at
```

### `billing_profiles`

Perfil financeiro 1:1 com o organizador.

```text
id
owner_user_id unique -> users.id
pix_key
pix_key_type
recipient_document
recipient_name
billing_status
current_plan
metadata
openpix_subaccount_id
openpix_subaccount_pix_key
openpix_onboarding_status
openpix_account_type
openpix_onboarding_error
openpix_last_sync_at
created_at
updated_at
```

A exclusão do organizador remove o perfil por cascade.

### `contracts`

Evento.

```text
id
owner_user_id -> users.id
client_id -> clients.id, legado e nullable
title
description
status
price
currency
capacity
start_date
end_date
start_at
end_at
timezone
registration_deadline
published_at
closed_at
cancelled_at
version
payment_config
created_at
updated_at
```

Constraints:

```text
price >= 0
currency = 'BRL'
status IN ('draft','published','closed','cancelled')
capacity IS NULL OR capacity >= 0
end_at IS NULL OR start_at IS NULL OR end_at > start_at
registration_deadline IS NULL OR start_at IS NULL OR registration_deadline <= start_at
version >= 1
```

`start_at` e `end_at` possuem índices para consultas temporais e para o job de encerramento.

### `contract_form_fields`

Definição de campos extras do formulário.

```text
id
contract_id -> contracts.id
field_key
label
type
required
order
options
validation_rules
is_system
is_active
archived_at
created_at
updated_at
```

Constraint única:

```text
(contract_id, field_key)
```

A exclusão do evento remove os campos por cascade.

### `clients`

Inscrição.

```text
id
owner_user_id -> users.id
contract_id -> contracts.id
participant_id -> participants.id
name
email
phone
phone_normalized
document
document_normalized
sex
age
extra_fields
registration_status
payment_status
notes
is_active
registration_access_token_hash
created_at
updated_at
```

Constraint única:

```text
(participant_id, contract_id)
```

Como `participant_id` é nullable, inscrições legadas sem participante autenticado podem coexistir.

`contract_id` e `participant_id` usam `SET NULL` na exclusão do recurso relacionado, preservando histórico.

### `payments`

Tentativa de cobrança.

```text
id
owner_user_id -> users.id
contract_id -> contracts.id
client_id -> clients.id
provider
method
status
status_detail
amount
currency
platform_fee_percent
platform_fee_amount
net_amount
settlement_mode
openpix_subaccount_pix_key
openpix_split_amount
payer_email
payer_name
payer_document
idempotency_key
attempt_number
correlation_id
external_reference
openpix_charge_id
gateway_payment_id
gateway_checkout_id
payment_method
checkout_url
qr_code
qr_code_base64
copy_and_paste
raw_payload
error_message
paid_at
expired_at
created_at
updated_at
```

Garantias:

```text
correlation_id unique
external_reference unique
(client_id, attempt_number) unique
índice único parcial em client_id quando status='pending'
```

A exclusão do evento remove pagamentos por cascade. A exclusão da inscrição define `client_id=null`, preservando a cobrança.

## Relações

```text
User 1 --- 1 BillingProfile
User 1 --- N Contract
User 1 --- N Client
User 1 --- N Payment
Participant 1 --- N Client
Contract 1 --- N ContractFormField
Contract 1 --- N Client
Contract 1 --- N Payment
Client 1 --- N Payment
```

## Migrations

As migrations ficam em `migrations/versions`.

Head atual:

```text
f7a1c2d3e4b5
```

Verificação:

```bash
alembic heads
alembic current
```

Aplicação:

```bash
alembic upgrade head
```

A aplicação não executa migration automaticamente no startup. O deploy precisa aplicar migrations em uma etapa controlada antes de liberar o novo código.

## Pré-validações de bases antigas

### Duplicidade de inscrição

Antes de aplicar a constraint única em uma base antiga:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/check_registration_duplicates.sql
```

O script lista grupos duplicados por `participant_id + contract_id`. Os registros precisam ser consolidados antes da migration correspondente.

### Ciclo temporal do evento

Antes da migration de lifecycle:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/check_event_lifecycle_migration.sql
```

O script detecta:

- preço ou capacidade negativos;
- término anterior ao início;
- prazo posterior ao início;
- capacidade abaixo de inscrições ativas;
- moeda diferente de BRL;
- status legado normalizável;
- status desconhecido;
- evento publicado sem datas suficientes.

## Backup antes de migration

Exemplo de backup lógico:

```bash
export RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="burnix-${RELEASE_ID}.dump"
pg_restore --list "burnix-${RELEASE_ID}.dump" >/dev/null
```

O backup precisa ser armazenado fora do host da aplicação e ter restauração testada periodicamente.

## Política de deploy de migrations

Ordem segura:

1. gerar backup verificável;
2. executar scripts de pré-validação aplicáveis;
3. confirmar um único head Alembic;
4. aplicar `alembic upgrade head` em staging;
5. executar smoke tests e fluxos críticos;
6. aplicar em produção em janela controlada;
7. confirmar `alembic current`;
8. liberar os novos processos.

Migrations destrutivas ou incompatíveis devem seguir estratégia expand/contract em releases separados.

## Rollback

Downgrade automático não é o caminho padrão depois que o schema novo recebeu gravações.

Prioridade operacional:

1. interromper novas gravações quando necessário;
2. aplicar correção forward;
3. restaurar backup somente com decisão explícita e validação do impacto;
4. reconciliar eventos recebidos externamente, especialmente webhooks de pagamento.

## Integridade e retenção

O banco contém PII e dados financeiros operacionais. A infraestrutura precisa fornecer:

- criptografia em trânsito;
- criptografia de volume ou serviço gerenciado equivalente;
- backups protegidos;
- acesso restrito por função;
- auditoria de acesso administrativo;
- política de retenção e descarte.
