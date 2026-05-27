# burnix-web

Base inicial do frontend do SaaS de inscrições e pagamentos.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Axios
- TanStack Query

## Instalação

```bash
pnpm install
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

## Estrutura principal

- `app/` para rotas, layouts e páginas
- `components/ui/` para componentes reutilizáveis
- `components/layout/` para navbar, container e providers
- `services/` para chamadas HTTP com Axios
- `hooks/` para consultas e mutações com React Query
- `lib/` para utilitários e configuração
- `types/` para contratos tipados do backend
- `middleware.ts` para proteção de rotas

## Fluxo integrado ao backend

O protótipo cobre o fluxo principal:

- autenticação
- listagem de contratos
- criação de checkout
- abertura de `checkout_url`
- retornos em `/sucesso`, `/falha` e `/pendente`
- consulta de pagamentos

## Observação

O checkout espera um endpoint configurável via `NEXT_PUBLIC_CHECKOUT_PATH` e usa `NEXT_PUBLIC_API_URL` como base do backend.
