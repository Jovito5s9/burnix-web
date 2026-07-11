# Etapa 5 — testes do frontend

## Objetivo

Cobrir os fluxos que podem impedir uma inscrição ou um pagamento e manter a
interface alinhada aos contratos atuais do backend Burnix `0.6.0`.

A suíte não depende de banco, backend em execução ou credenciais OpenPix. Os
retornos HTTP simulados seguem a documentação entregue junto ao projeto:

```text
participant-identity-my-events.md
registration-uniqueness-concurrency.md
payment-lifecycle-stage-5.md
error-contracts-stage-6.md
api-route-reference.md
```

## Ferramentas

```text
Vitest
React Testing Library
@testing-library/user-event
MSW
Playwright
```

## Estrutura criada

```text
vitest.config.ts
playwright.config.ts

tests/setup/vitest.setup.ts
tests/setup/render.tsx
tests/setup/navigation-mock.ts

tests/mocks/server.ts
tests/fixtures/participant.ts

tests/unit/registration-form.test.tsx
tests/unit/pix-payment-box.test.tsx
tests/unit/my-registrations-page.test.tsx

tests/e2e/support/mock-api.ts
tests/e2e/participant-registration.spec.ts
tests/e2e/duplicate-registration.spec.ts
tests/e2e/payment-confirmation.spec.ts
```

## Contratos simulados

### Sessão do participante

```text
POST /api/session/participant/register
POST /api/session/participant/login
GET  /api/backend/participant/participant-auth/me
```

### Evento público e inscrição

```text
GET  /api/backend/public/public/contracts/{contract_id}
POST /api/backend/participant/participant/contracts/{contract_id}/registrations
GET  /api/backend/participant/participant/registrations/{registration_id}
GET  /api/backend/participant/participant/registrations
```

### Pagamento

```text
POST /api/backend/participant/participant/registrations/{registration_id}/payments/pix
```

Os testes decidem comportamentos por `detail.code`, incluindo:

```text
registration_already_exists
event_not_published
registration_not_found
participant_authentication_required
```

## Cenários cobertos

| Cenário obrigatório | Cobertura principal |
|---|---|
| Visitante vê o evento, mas precisa entrar para se inscrever | unitário + E2E |
| Participante cadastra conta e retorna ao evento | E2E |
| Inscrição é criada | unitário + E2E |
| Pix é exibido | unitário + E2E |
| Novo clique não cria duplicidade | unitário + E2E |
| `409` abre a inscrição existente | unitário + E2E |
| Pagamento confirmado atualiza a tela | unitário + E2E |
| Pagamento expirado oferece nova tentativa | unitário + E2E |
| Participante A não vê dados do participante B | unitário + E2E |
| Evento gratuito não apresenta QR Code | unitário + E2E |
| Evento em rascunho mostra “não encontrado” | E2E |

## Melhorias funcionais aplicadas durante a etapa

### Trava contra envio simultâneo

`components/public/registration-form.tsx` passou a usar uma trava por `ref`
durante todo o processamento da inscrição. Dois eventos de submit disparados no
mesmo instante não geram dois `POST`s. O backend continua sendo a barreira final
por meio de `participant_id + contract_id` e do erro
`registration_already_exists`.

### Evento público não publicado

`components/public/public-event-page.tsx` agora trata `404`,
`event_not_published` e `event_not_found` como estado de produto e mostra:

```text
Evento não encontrado
```

Erros de rede ou falhas inesperadas continuam usando o alerta de erro técnico
seguro.

## Estratégia dos testes unitários

Cada teste cria um `QueryClient` isolado, sem retries automáticos. O MSW
intercepta as chamadas Axios do navegador e devolve respostas compatíveis com o
backend. O mock de `next/navigation` permite validar redirecionamentos sem
acoplar os componentes ao roteador real.

## Estratégia dos testes E2E

O Playwright inicia o Next.js em `127.0.0.1:3100`. Cada teste instala uma única
rota para `/api/**` e mantém um estado independente de participante, inscrição e
pagamento.

Essa abordagem valida:

- renderização e hidratação reais do Next.js;
- navegação entre páginas públicas e autenticação;
- cookies necessários às páginas protegidas;
- chamadas reais do frontend ao BFF;
- invalidação do React Query e atualização de status;
- ausência de dependências externas no CI.

## CI

O workflow criado em `.github/workflows/frontend-ci.yml` executa:

```bash
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm run lint
npm run build
npm run test
npm run test:e2e
```
