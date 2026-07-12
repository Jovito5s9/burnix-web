# Rate limit e segurança de produção

## Escopo

Esta implementação cobre o tratamento de `429` no navegador e o endurecimento do BFF/Next.js para produção.

## Rate limit

O interceptor Axios converte `Retry-After` e `detail.retry_after_seconds` para `ApiClientError.retryAfterSeconds`. O valor aceita segundos inteiros ou uma data HTTP.

O hook `hooks/useRateLimitCountdown.ts` mantém o bloqueio por tempo absoluto, evitando que atraso de renderização reduza a espera solicitada pelo backend.

Fluxos cobertos:

```text
components/forms/login-form.tsx
components/forms/participant-login-form.tsx
components/forms/register-form.tsx
components/forms/participant-register-form.tsx
components/public/registration-form.tsx
components/public/pix-payment-box.tsx
```

Todos preservam o estado digitado e substituem detalhes técnicos por:

```text
Muitas tentativas foram realizadas. Aguarde N segundos e tente novamente.
```

## Retry do React Query

Consultas:

- até duas novas tentativas;
- somente erro de rede ou `500`, `502`, `503`, `504`.

Mutações:

- até uma nova tentativa;
- somente erro de rede ou `500`, `502`, `503`, `504`.

Nenhum `4xx` é repetido automaticamente. Isso inclui `400`, `401`, `403`, `404`, `409`, `413`, `422` e `429`.

## Variáveis obrigatórias

Em produção:

```env
API_URL=http://backend:8000
APP_ORIGIN=https://app.seudominio.com
```

A validação ocorre no `next.config.ts` durante o build e novamente nos helpers server-side. O container também recusa o startup sem essas variáveis.

## Sessões

O BFF aceita `expires_in` quando o backend o fornece. Para compatibilidade com respostas anteriores, também deriva o tempo restante do claim `exp` do JWT e usa o menor prazo quando ambos existem.

Cookies:

```text
Secure em produção
HttpOnly
SameSite=Lax
Path=/
Max-Age explícito
```

Organizador e participante têm cookies independentes. Em `401`, somente a sessão correspondente é apagada.

## Limites de corpo

Padrões:

```text
Autenticação: 16 KiB
Inscrição: 256 KiB
Campos de formulário: 64 KiB
Demais mutações: 1 MiB
```

A leitura é incremental. O BFF interrompe o stream quando o limite é ultrapassado e retorna `413 request_body_too_large` sem encaminhar o corpo ao backend.

## Headers

Configurados globalmente:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Strict-Transport-Security (produção)
```

A CSP não libera domínios externos genéricos. QR Codes em base64 continuam permitidos por `img-src data:`.

## Validação executada

```text
npm run typecheck
npm run lint
npm test
npm run test:stage4
API_URL=http://127.0.0.1:8000 APP_ORIGIN=https://app.example.com npm run build
npm run test:bff
npm audit --omit=dev
```

A suíte inclui cenários de `429` para login, inscrição e Pix, preservação de campos, bloqueio do botão, política de retry, limite de corpo e expiração de cookies. O relatório detalhado está em `docs/validation-stage-5-6.md`.
