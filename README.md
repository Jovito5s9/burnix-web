# Burnix Web

Frontend da Burnix para organizadores, participantes e administração. A aplicação usa Next.js App Router, React, TanStack Query e um BFF interno para manter tokens de sessão fora do JavaScript do navegador.

## Requisitos

- Node.js definido em `.nvmrc`;
- npm compatível com o lockfile;
- backend acessível pelo servidor Next.js.

As dependências diretas estão fixadas no `package.json` e a instalação reproduzível usa `package-lock.json`.

## Configuração local

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev -- --hostname 127.0.0.1 --port 3100
```

O exemplo usa:

```env
API_URL=http://127.0.0.1:3000
APP_ORIGIN=http://127.0.0.1:3100
```

`API_URL` é lida somente no servidor. O navegador chama rotas internas em `/api/backend/*` e não recebe o token de acesso.

Em produção, `API_URL` e `APP_ORIGIN` são obrigatórias e devem ser URLs HTTP(S) absolutas. Os limites opcionais de corpo do BFF estão documentados em `.env.example`.

## Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | inicia o Next.js em desenvolvimento |
| `npm run build` | gera o build de produção |
| `npm run start` | inicia o build já gerado |
| `npm run typecheck` | valida os tipos TypeScript |
| `npm run lint` | executa o ESLint |
| `npm test` | executa testes unitários e de integração com Vitest |
| `npm run test:watch` | executa o Vitest em modo interativo |
| `npm run test:bff` | valida os Route Handlers contra um backend HTTP simulado |
| `npm run test:e2e` | executa jornadas de interface no Chromium |
| `npm run test:e2e:ui` | abre a interface do Playwright |

O smoke test do BFF requer um build existente. A sequência local equivalente ao CI é:

```bash
npm ci
npm ls --depth=0 next react react-dom
npm run typecheck
npm run lint
npm test
API_URL=http://127.0.0.1:3000 APP_ORIGIN=http://127.0.0.1:3100 npm run build
npm run test:bff
npx playwright install chromium
npm run test:e2e
```

## Escopo dos testes

- `tests/unit`: regras de negócio, serviços, hooks e componentes isolados;
- `tests/integration`: helpers e contrato de segurança do proxy BFF;
- `scripts/smoke-bff.mjs`: aplicação em modo de produção e Route Handlers reais, usando um backend local simulado;
- `tests/e2e`: jornadas completas de interface com respostas de API determinísticas interceptadas pelo Playwright.

Os E2E verificam comportamento do navegador e da interface. A comunicação real entre o Next.js e o backend é coberta pelo smoke test do BFF.

## Arquitetura

O BFF separa os contextos:

```text
/api/backend/organizer/*
/api/backend/participant/*
/api/backend/public/*
```

Organizadores e participantes usam cookies de sessão independentes, `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Respostas `401` removem somente a sessão que realizou a chamada.

Detalhes sobre rotas, segurança, eventos, pagamentos e rate limit estão em [`docs/architecture.md`](docs/architecture.md). O contrato de disponibilidade pública está em [`docs/public-registration-availability.md`](docs/public-registration-availability.md).

## Build e container

```bash
docker build \
  --build-arg API_URL=http://backend:3000 \
  --build-arg APP_ORIGIN=https://app.example.com \
  -t burnix-web .

docker run --rm -p 3000:3000 \
  -e API_URL=http://backend:3000 \
  -e APP_ORIGIN=https://app.example.com \
  burnix-web
```

O container usa a saída standalone do Next.js e recusa a inicialização quando as variáveis obrigatórias estão ausentes.

## Estrutura

```text
app/          páginas e Route Handlers
components/   componentes e formulários
hooks/        hooks de interface e React Query
lib/          regras compartilhadas e código server-side
services/     clientes HTTP do frontend
scripts/      smoke test do BFF
tests/        testes automatizados
types/        contratos TypeScript
```

## Licença

Consulte `LICENSE.md`.
