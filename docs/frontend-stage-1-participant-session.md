# Etapa 1 — separação e proteção da sessão do participante

## Objetivo atendido

O frontend diferencia integralmente a identidade do organizador da identidade
do participante.

```text
Organizador  -> burnix.access_token
Participante -> burnix.participant_access_token
```

Os cookies possuem `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` quando
`NODE_ENV=production`.

Não há leitura ou gravação de JWT em `localStorage` ou `document.cookie`.

## Arquivos principais

Criados:

```text
services/participant-api.ts
services/participant-auth.ts
hooks/useParticipantAuth.ts
types/participant.ts
types/participant-auth.ts

app/(participant-auth)/participante/entrar/page.tsx
app/(participant-auth)/participante/cadastro/page.tsx

app/api/session/organizer/login/route.ts
app/api/session/participant/login/route.ts
app/api/session/participant/register/route.ts
app/api/session/logout/route.ts
app/api/backend/[session]/[...path]/route.ts

lib/server/backend.ts
lib/server/session.ts
lib/safe-next-path.ts
scripts/smoke-bff.mjs
```

Alterados:

```text
services/api.ts
services/auth.ts
hooks/useAuth.ts
hooks/usePublicRegistration.ts
hooks/useRegistrations.ts
hooks/usePayments.ts
services/public-contracts.ts
services/registrations.ts
services/payments.ts
types/auth.ts
types/payment.ts
types/registration.ts
proxy.ts
components/layout/navbar.tsx
components/public/registration-form.tsx
components/public/public-event-page.tsx
components/public/pix-payment-box.tsx
components/dashboard/registrations-table.tsx
README.md
structure.txt
```

Removido:

```text
middleware.ts
```

## BFF e limites de sessão

### Login do organizador

```text
Browser
  POST /api/session/organizer/login
Next Route Handler
  POST /auth/login
Backend
  access_token
Next Route Handler
  Set-Cookie: burnix.access_token=<jwt>; HttpOnly; ...
Browser
  recebe somente {"authenticated": true}
```

### Login e cadastro do participante

```text
Browser
  POST /api/session/participant/login
  ou
  POST /api/session/participant/register
Next Route Handler
  POST /participant-auth/login
  ou
  POST /participant-auth/register
Backend
  access_token + participant
Next Route Handler
  Set-Cookie: burnix.participant_access_token=<jwt>; HttpOnly; ...
Browser
  recebe somente participant
```

### Proxy para o backend

```text
/api/backend/public/*
  -> não acrescenta Authorization

/api/backend/organizer/*
  -> usa somente burnix.access_token

/api/backend/participant/*
  -> usa somente burnix.participant_access_token
```

A categoria de sessão também possui allowlist de paths. Por exemplo, a rota
`/api/backend/participant/auth/me` é recusada pelo BFF antes de chegar ao
backend.

Os endpoints de login que devolvem JWT não podem ser acessados pelo proxy
genérico, impedindo que o navegador contorne os Route Handlers de sessão.

## Proteção contra CSRF

Mutações `POST`, `PUT`, `PATCH` e `DELETE` verificam o header `Origin` quando ele
está presente.

Origens aceitas:

```text
request.nextUrl.origin
x-forwarded-proto + x-forwarded-host/host
APP_ORIGIN, quando configurado
```

Uma origem divergente recebe `403 invalid_request_origin`.

`SameSite=Lax` atua como uma camada adicional. As verificações de autorização e
tenancy continuam sendo responsabilidade final do backend.

## Fluxo da página pública do evento

### Sem sessão

O evento e seus detalhes são carregados normalmente. O formulário não é
exibido. O componente mostra o botão `Inscrever-se`.

Ao clicar:

```text
/participante/entrar?next=/eventos/{contract_id}
```

O parâmetro `next` aceita somente caminhos internos. Valores absolutos ou que
comecem com `//` são descartados para evitar open redirect.

### Com sessão

O formulário mostra o e-mail da conta apenas como contexto. Não existe campo de
e-mail editável.

Payload enviado:

```text
name
phone
document
sex
age
extra_fields
```

Payload não enviado:

```text
participant_id
email
owner_user_id
```

### Evento pago

```text
POST /participant/contracts/{contract_id}/registrations
POST /participant/registrations/{registration_id}/payments/pix
```

A resposta do Pix usa `PublicPaymentRead`:

```text
id
registration_id
attempt_number
status
amount
currency
checkout_url
qr_code_base64
copy_and_paste
expires_at
```

### Evento gratuito

Quando o contrato possui preço zero ou a inscrição retorna
`payment_status=not_required`, a interface confirma a inscrição sem chamar a
OpenPix.

## Sessão do organizador preservada

Os serviços existentes continuam usando o export `api`, mas a base agora é:

```text
/api/backend/organizer
```

A geração manual de Pix para uma inscrição no painel foi corrigida para usar a
rota interna vigente:

```text
POST /payments/contracts/{contract_id}/pix
```

com `client_id` no corpo, em vez da rota legada protegida por token opaco.

## Logout

```text
POST /api/session/logout
{"session":"organizer"}

POST /api/session/logout
{"session":"participant"}

POST /api/session/logout
{"session":"all"}
```

O logout seletivo expira somente o cookie solicitado.

## Compatibilidade com o backend

A implementação foi confrontada com os schemas e rotas do backend:

```text
ParticipantRead
ParticipantAuthResponse
ParticipantRegistrationCreate
ParticipantRegistrationDetail
PublicPaymentRead
PublicPaymentNotRequired
```

As rotas legadas abaixo não fazem parte do fluxo novo:

```text
POST /public/contracts/{contract_id}/registrations
POST /payments/registrations/{registration_id}/pix
```
