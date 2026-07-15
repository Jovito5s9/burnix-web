# Referência e consumo da API

## Endereço e formatos

A API não possui prefixo de versão no estado atual. Exemplos usam:

```text
http://localhost:8000
```

Os corpos são JSON, exceto exportações CSV. Datas e horários seguem ISO 8601. Valores monetários são serializados como strings decimais nas respostas para preservar precisão.

Documentação executável:

```text
GET /openapi.json
GET /docs
GET /redoc
```

A versão declarada no OpenAPI é `0.6.0`.

## Autenticação

Rotas protegidas usam:

```http
Authorization: Bearer <access_token>
```

Há dois esquemas independentes:

| Esquema | Login | Claim obrigatório | Rotas |
|---|---|---|---|
| `OrganizerBearer` | `POST /auth/login` | `token_kind=organizer` | gestão, financeiro e administração |
| `ParticipantBearer` | `POST /participant-auth/login` | `token_kind=participant` | inscrições e pagamentos próprios |

## Headers de resposta

Toda resposta inclui:

```http
X-Request-ID: <id>
```

Respostas `429` também incluem:

```http
Retry-After: <segundos>
```

## Convenção de URL

As URLs canônicas de coleção não terminam com barra, e a API não emite redirect
`307` para corrigir a URL. Por compatibilidade com versões anteriores do
frontend, `GET/POST /contracts/` e `GET /payments/` são aliases explícitos,
ocultos do OpenAPI. As demais coleções continuam retornando `404` quando
recebem uma barra final não declarada.

## Endpoints

`?` indica parâmetro opcional. Os nomes de schema correspondem aos componentes do OpenAPI.
### Saúde e readiness

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /db-check | Pública | — | — | 200 — | — |
| GET | /ping | Pública | — | — | 200 — | — |
| GET | /ready | Pública | — | — | 200 — | Verifica banco e Redis quando ativo |

### Autenticação de organizador

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| POST | /auth/login | Pública | — | `UserLogin` | 200 `Token` | — |
| GET | /auth/me | Organizador | — | — | 200 `UserRead` | — |
| POST | /auth/register | Pública | — | `UserCreate` | 201 `UserRead` | — |

### Autenticação de participante

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| POST | /participant-auth/login | Pública | — | `ParticipantLogin` | 200 `ParticipantAuthResponse` | — |
| GET | /participant-auth/me | Participante | — | — | 200 `ParticipantRead` | — |
| POST | /participant-auth/register | Pública | — | `ParticipantRegister` | 201 `ParticipantAuthResponse` | — |

### Eventos

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /contracts | Organizador | `skip?`, `limit?` | — | 200 `ContractRead[]` | — |
| POST | /contracts | Organizador | — | `ContractCreate` | 201 `ContractRead` | — |
| GET | /contracts/{contract_id} | Organizador | `contract_id` | — | 200 `ContractRead` | — |
| PATCH | /contracts/{contract_id} | Organizador | `contract_id` | `ContractUpdate` | 200 `ContractRead` | — |
| DELETE | /contracts/{contract_id} | Organizador | `contract_id` | — | 204 sem corpo | — |
| POST | /contracts/{contract_id}/cancel | Organizador | `contract_id` | `ContractAction` | 200 `ContractRead` | — |
| POST | /contracts/{contract_id}/close | Organizador | `contract_id` | `ContractAction` | 200 `ContractRead` | — |
| GET | /contracts/{contract_id}/payments | Organizador | `contract_id`, `skip?`, `limit?` | — | 200 `PaymentRead[]` | — |
| POST | /contracts/{contract_id}/publish | Organizador | `contract_id` | `ContractAction` | 200 `ContractRead` | — |
| POST | /contracts/{contract_id}/reopen | Organizador | `contract_id` | `ContractAction` | 200 `ContractRead` | — |

### Campos de formulário

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /contracts/{contract_id}/form-fields | Organizador | `contract_id`, `include_archived?` | — | 200 `ContractFormFieldRead[]` | — |
| POST | /contracts/{contract_id}/form-fields | Organizador | `contract_id` | `ContractFormFieldCreate` | 201 `ContractFormFieldRead` | — |
| GET | /contracts/{contract_id}/form-fields/{field_id} | Organizador | `contract_id`, `field_id` | — | 200 `ContractFormFieldRead` | — |
| PATCH | /contracts/{contract_id}/form-fields/{field_id} | Organizador | `contract_id`, `field_id` | `ContractFormFieldUpdate` | 200 `ContractFormFieldRead` | — |
| DELETE | /contracts/{contract_id}/form-fields/{field_id} | Organizador | `contract_id`, `field_id` | — | 204 sem corpo | — |

### Eventos públicos e inscrições do organizador

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /contracts/{contract_id}/registrations | Organizador | `contract_id`, `skip?`, `limit?` | — | 200 `ClientRead[]` | — |
| GET | /public/contracts/{contract_id} | Pública | `contract_id` | — | 200 `PublicContractRead` | — |
| POST | /public/contracts/{contract_id}/registrations | Pública | `contract_id` | — | — | Depreciada<br>Sempre responde 401; use a rota autenticada do participante |

### Inscrições do participante

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| POST | /participant/contracts/{contract_id}/registrations | Participante | `contract_id` | `ParticipantRegistrationCreate` | 201 `ParticipantRegistrationDetail` | — |
| GET | /participant/registrations | Participante | `skip?`, `limit?` | — | 200 `ParticipantRegistrationListItem[]` | — |
| GET | /participant/registrations/{registration_id} | Participante | `registration_id` | — | 200 `ParticipantRegistrationDetail` | — |
| POST | /participant/registrations/{registration_id}/payments/pix | Participante | `registration_id` | `PublicRegistrationPaymentCreatePix` | 201 `PublicPaymentRead` ou `PublicPaymentNotRequired` | — |

### Inscrições administradas pelo organizador

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /clients | Organizador | `skip?`, `limit?` | — | 200 `ClientRead[]` | — |
| POST | /clients | Organizador | — | `ClientCreate` | 201 `ClientRead` | — |
| GET | /clients/{client_id} | Organizador | `client_id` | — | 200 `ClientRead` | — |
| PATCH | /clients/{client_id} | Organizador | `client_id` | `ClientUpdate` | 200 `ClientRead` | — |
| DELETE | /clients/{client_id} | Organizador | `client_id` | — | 204 sem corpo | — |

### Pagamentos

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /payments | Organizador | `skip?`, `limit?` | — | 200 `PaymentRead[]` | — |
| POST | /payments/contracts/{contract_id}/checkout | Organizador | `contract_id` | `PaymentCreateCheckout` | 201 `PaymentCreateResponse` | — |
| POST | /payments/contracts/{contract_id}/pix | Organizador | `contract_id` | `PaymentCreatePix` | 201 `PaymentCreateResponse` | — |
| POST | /payments/registrations/{client_id}/pix | Pública | `client_id`, `X-Registration-Token?` | `PublicRegistrationPaymentCreatePix` | 201 `PublicPaymentRead` ou `PublicPaymentNotRequired` | Depreciada<br>Compatibilidade por `X-Registration-Token` |
| POST | /payments/webhook/openpix | Pública | — | — | 200 `WebhookAck` | Assinatura OpenPix obrigatória |
| GET | /payments/{payment_id} | Organizador | `payment_id` | — | 200 `PaymentRead` | — |

### Perfis financeiros

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /billing-profiles | Organizador | `skip?`, `limit?` | — | 200 `BillingProfileRead[]` | — |
| GET | /billing-profiles/me | Organizador | — | — | 200 `BillingProfileRead` | — |
| PUT | /billing-profiles/me | Organizador | — | `BillingProfileUpdate` | 200 `BillingProfileRead` | — |
| PATCH | /billing-profiles/me | Organizador | — | `BillingProfileUpdate` | 200 `BillingProfileRead` | — |
| GET | /billing-profiles/{billing_profile_id} | Organizador | `billing_profile_id` | — | 200 `BillingProfileRead` | — |

### Integrações

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /integrations/openpix/status | Organizador | — | — | 200 `OpenPixIntegrationStatus` | — |
| POST | /integrations/openpix/subaccount | Organizador | — | — | 200 `OpenPixSubaccountResult` | — |
| POST | /integrations/openpix/subaccount/sync | Organizador | — | — | 200 `OpenPixSubaccountResult` | — |

### Exportações

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /contracts/{contract_id}/export/payments.csv | Organizador | `contract_id` | — | `text/csv` | — |
| GET | /contracts/{contract_id}/export/registrations.csv | Organizador | `contract_id` | — | `text/csv` | — |

### Administração

| Método | Caminho | Acesso | Parâmetros | Corpo | Sucesso | Observações |
|---|---|---|---|---|---|---|
| GET | /admin/clients | Administrador | `skip?`, `limit?` | — | 200 `ClientRead[]` | — |
| GET | /admin/contracts | Administrador | `skip?`, `limit?` | — | 200 `ContractRead[]` | — |
| GET | /admin/payments | Administrador | `skip?`, `limit?` | — | 200 `PaymentRead[]` | — |
| GET | /admin/users | Administrador | `skip?`, `limit?` | — | 200 `UserRead[]` | — |

## Paginação

Listagens usam `skip` e `limit`. O padrão mais comum é `skip=0` e `limit=100`. Algumas rotas limitam `limit` a 100 por validação do schema; outras apenas aplicam o valor recebido. As respostas atuais são arrays e não incluem total global.

## Fluxo de organizador

### Cadastro e login

```bash
curl -X POST http://localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"organizador@example.com","password":"senha-segura"}'
```

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"organizador@example.com","password":"senha-segura"}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')
```

### Criar evento em rascunho

Use timestamps com offset explícito. Quando o offset for omitido, o backend interpreta o valor no `timezone` do evento.

```bash
curl -X POST http://localhost:8000/contracts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Corrida Burnix",
    "description":"Evento esportivo",
    "status":"draft",
    "price":"50.00",
    "currency":"BRL",
    "capacity":300,
    "start_at":"2026-10-10T07:00:00-03:00",
    "end_at":"2026-10-10T12:00:00-03:00",
    "registration_deadline":"2026-10-09T23:59:59-03:00",
    "timezone":"America/Belem"
  }'
```

A resposta contém `version`. Esse valor é obrigatório nas edições e ações de status.

### Atualizar evento

```bash
curl -X PATCH http://localhost:8000/contracts/10 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"title":"Corrida Burnix 2026"}'
```

### Publicar

```bash
curl -X POST http://localhost:8000/contracts/10/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"version":2}'
```

Eventos pagos somente são publicados quando o perfil financeiro e a subconta OpenPix estão ativos.

### Configurar campo do formulário

```bash
curl -X POST http://localhost:8000/contracts/10/form-fields \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "field_key":"shirt_size",
    "label":"Tamanho da camiseta",
    "type":"select",
    "required":true,
    "order":10,
    "options":["P","M","G","GG"]
  }'
```

## Fluxo público e do participante

### Consultar evento público

```bash
curl http://localhost:8000/public/contracts/10
```

Campos de decisão do frontend:

```json
{
  "registration_open": true,
  "registration_state": "open",
  "registration_closed_reason": null,
  "registration_closed_message": null,
  "server_time": "2026-07-12T18:00:00Z",
  "remaining_capacity": 42
}
```

O formulário deve ser exibido somente quando `registration_open=true`. A criação ainda pode falhar por concorrência caso a última vaga seja ocupada após a consulta.

### Criar conta de participante

```bash
curl -X POST http://localhost:8000/participant-auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"participante@example.com","password":"senha-segura"}'
```

A resposta já contém `access_token` e `participant`.

### Criar inscrição

```bash
curl -X POST http://localhost:8000/participant/contracts/10/registrations \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Pessoa Participante",
    "phone":"+55 91 99999-9999",
    "document":"000.000.000-00",
    "age":30,
    "extra_fields":{"shirt_size":"M"}
  }'
```

O e-mail e o `participant_id` são derivados do token, não do corpo.

Quando já existe inscrição, a API pode responder `409 registration_already_exists` com `registration_id` e `can_resume_payment`.

### Gerar Pix da própria inscrição

```bash
curl -X POST http://localhost:8000/participant/registrations/55/payments/pix \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"idempotency_key":"checkout-55-1"}'
```

Evento gratuito retorna:

```json
{
  "registration_id": 55,
  "status": "not_required",
  "message": "Este evento é gratuito e não exige pagamento."
}
```

## Perfil financeiro e OpenPix

### Atualizar perfil

```bash
curl -X PUT http://localhost:8000/billing-profiles/me \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "pix_key":"financeiro@example.com",
    "pix_key_type":"email",
    "recipient_document":"00000000000",
    "recipient_name":"Organizador Burnix"
  }'
```

### Criar ou recuperar subconta

```bash
curl -X POST http://localhost:8000/integrations/openpix/subaccount \
  -H "Authorization: Bearer $TOKEN"
```

### Consultar estado seguro da integração

```bash
curl http://localhost:8000/integrations/openpix/status \
  -H "Authorization: Bearer $TOKEN"
```

A resposta não contém AppID nem segredos do webhook.

## Contrato de erros

Formato geral:

```json
{
  "detail": {
    "code": "request_validation_error",
    "message": "Os dados enviados são inválidos.",
    "errors": [
      {
        "field": "body.email",
        "message": "Informe um valor válido.",
        "type": "value_error"
      }
    ]
  }
}
```

Códigos de erro estáveis:

### Eventos

```text
event_not_found
event_not_published
event_registration_closed
event_capacity_reached
event_invalid_timezone
event_invalid_temporal_range
event_invalid_price
event_invalid_capacity
event_capacity_below_registrations
event_publish_requirements_not_met
event_billing_profile_required
event_openpix_not_active
event_invalid_status_transition
event_reopen_not_allowed
event_version_conflict
event_financial_fields_locked
event_published_date_must_be_future
event_form_field_in_use
```

### Inscrições e pagamentos

```text
registration_already_exists
registration_not_found
registration_payment_not_allowed
payment_already_confirmed
payment_provider_unavailable
payment_expired
invalid_webhook_signature
unsupported_payment_currency
```

### Autenticação, autorização e operação

```text
email_already_registered
participant_email_already_registered
invalid_credentials
account_inactive
participant_authentication_required
authentication_required
permission_denied
rate_limit_exceeded
rate_limit_backend_unavailable
request_body_too_large
service_not_ready
request_validation_error
resource_not_found
bad_request
conflict
internal_error
```

O consumidor deve usar `detail.code` para lógica e `detail.message` para exibição.

## Rate limit

Exemplo:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

```json
{
  "detail": {
    "code": "rate_limit_exceeded",
    "message": "Muitas tentativas. Aguarde um momento e tente novamente.",
    "retry_after_seconds": 45
  }
}
```

O cliente não deve repetir automaticamente mutações em `400`, `401`, `403`, `404`, `409`, `413`, `422` ou `429`.

## Payload excessivo

```http
HTTP/1.1 413 Payload Too Large
```

```json
{
  "detail": {
    "code": "request_body_too_large",
    "message": "O corpo da solicitação excede o tamanho permitido.",
    "max_body_bytes": 16384
  }
}
```

## Rotas depreciadas

| Rota | Estado | Substituição |
|---|---|---|
| `POST /public/contracts/{contract_id}/registrations` | bloqueada com `401` | `POST /participant/contracts/{contract_id}/registrations` |
| `POST /payments/registrations/{client_id}/pix` | compatibilidade por token opaco | `POST /participant/registrations/{registration_id}/payments/pix` |

Novos consumidores não devem usar as rotas depreciadas.
