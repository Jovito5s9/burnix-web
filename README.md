# Burnix Web

Frontend Next.js do Burnix, plataforma SaaS multi-organizador para eventos,
inscrições e pagamentos Pix/OpenPix.

Esta versão contém:

```text
Etapa 1 — separação e proteção da sessão do participante
Etapa 2 — área “Minhas inscrições”
```

A implementação está alinhada ao backend Burnix `0.6.0` e às rotas autenticadas
em `/participant/*`.

## Funcionalidades do participante

Rotas de interface:

```text
/participante/entrar
/participante/cadastro
/eventos/{contract_id}
/minhas-inscricoes
/minhas-inscricoes/{registration_id}
```

Fluxo principal:

```text
1. O evento público é consultado sem autenticação.
2. A inscrição exige uma conta de participante.
3. O backend deriva participant_id, e-mail e owner_user_id da sessão.
4. Eventos pagos geram Pix pela rota autenticada do participante.
5. “Minhas inscrições” lista eventos, status, valor e ações de pagamento.
6. O detalhe mostra os dados da própria inscrição e o painel Pix.
```

## Sessões separadas

```text
Organizador  -> cookie burnix.access_token
Participante -> cookie burnix.participant_access_token
```

Os cookies são criados por Route Handlers do Next.js e usam:

```text
HttpOnly
SameSite=Lax
Path=/
Secure em produção
```

O JWT não é salvo em `localStorage`, não é criado por JavaScript e não é
devolvido pelas respostas do BFF ao navegador.

## BFF do Next.js

O navegador chama endpoints do próprio frontend:

```text
POST /api/session/organizer/login
POST /api/session/participant/login
POST /api/session/participant/register
POST /api/session/logout

/api/backend/organizer/*
/api/backend/participant/*
/api/backend/public/*
```

Os Route Handlers leem o cookie HttpOnly correto no servidor e acrescentam o
Bearer token somente na chamada ao backend FastAPI.

O BFF também:

- bloqueia a troca de categoria de sessão;
- não permite obter o token bruto pelas rotas proxy;
- mantém allowlist de paths por categoria;
- rejeita mutações com origem divergente;
- remove o cookie correspondente quando o backend retorna `401`;
- preserva respostas e erros estruturados do backend;
- devolve resposta pública controlada quando o backend está indisponível.

## “Minhas inscrições”

A listagem consome:

```text
GET /participant/registrations
```

Cada cartão mostra:

```text
nome e data do evento
status traduzido da inscrição
status traduzido do pagamento
valor
Ver inscrição
Concluir pagamento
Gerar novo Pix quando expirado
Pagamento confirmado quando pago
```

O detalhe consome:

```text
GET /participant/registrations/{registration_id}
```

O painel de pagamento usa:

```text
POST /participant/registrations/{registration_id}/payments/pix
```

A rota pode reutilizar uma tentativa pendente ou paga e criar nova tentativa
após `expired` ou `error`, conforme decisão final do backend.

## Proteção de páginas

```text
/dashboard/*
/contracts/*
/payments/*
/settings/*
/admin/*
  -> exige burnix.access_token

/minhas-inscricoes/*
  -> exige burnix.participant_access_token
```

Uma sessão de organizador não substitui uma sessão de participante.

## Rotas do backend consumidas

### Públicas

```text
GET /public/contracts/{contract_id}
```

### Participante

```text
POST /participant-auth/register
POST /participant-auth/login
GET  /participant-auth/me

GET  /participant/registrations
GET  /participant/registrations/{registration_id}
POST /participant/contracts/{contract_id}/registrations
POST /participant/registrations/{registration_id}/payments/pix
```

### Organizador

O projeto mantém os serviços de eventos, inscrições, pagamentos, campos
dinâmicos, perfil financeiro, integrações, exportações e administração global.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
API_URL=http://localhost:8000
# APP_ORIGIN=https://app.seudominio.com
```

`API_URL` é usada somente no servidor Next.js para acessar o backend FastAPI.
Em produção, prefira uma URL interna da infraestrutura.

`APP_ORIGIN` é opcional e adiciona a origem pública canônica à validação das
mutações do BFF.

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Validação

```bash
npm run typecheck
npm run lint
npm run build
npm run test:bff
```

Relatórios detalhados:

```text
docs/frontend-stage-1-participant-session.md
docs/validation-stage-1.md
docs/frontend-stage-2-participant-registrations.md
docs/validation-stage-2.md
```
