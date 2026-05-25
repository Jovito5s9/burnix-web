# burnix-web

Base inicial do frontend do SaaS de inscrições e pagamentos.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Axios
- TanStack Query

## Bootstrap sugerido

```bash
pnpm create next-app@latest burnix-web --ts --tailwind --app --eslint --import-alias "@/*"
```

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

## Estrutura inicial

- `app/` para rotas, layouts e páginas
- `components/ui/` para componentes reutilizáveis
- `components/layout/` para navbar, container e providers
- `services/` para chamadas HTTP com Axios
- `hooks/` para consultas e mutações com React Query
- `lib/` para utilitários e configuração
- `types/` para contratos tipados do backend
- `middleware.ts` para proteção de rotas

## Observação

O projeto já nasce preparado para evoluir para autenticação, contratos e pagamentos sem refatoração estrutural.
