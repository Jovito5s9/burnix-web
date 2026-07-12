# Burnix Web

Frontend web da Burnix para organizadores, participantes e administração. O projeto usa Next.js App Router, React, TanStack Query e um BFF interno para manter os tokens de sessão fora do JavaScript do navegador.

## Runtime reproduzível

O projeto fixa as versões usadas no desenvolvimento, CI e produção:

```text
Node.js 22.16.0
npm 10.9.2
Next.js 16.2.10
React 19.2.7
React DOM 19.2.7
```

As versões das dependências estão registradas sem intervalos no `package.json` e resolvidas no `package-lock.json`.

Use o Node definido em `.nvmrc`:

```bash
nvm use
node --version
npm --version
npm list next react react-dom
```

A instalação deve ser feita com o lockfile:

```bash
npm ci
```

Não use `npm install` em pipelines ou imagens de produção para evitar alterações silenciosas de versão.

## Configuração

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Variáveis principais:

```env
API_URL=http://localhost:8000
# APP_ORIGIN=https://app.seudominio.com
```

`API_URL` é usada apenas no servidor pelo BFF. O navegador consome as rotas internas em `/api/backend/*` e não recebe o token JWT.

## Desenvolvimento

```bash
npm ci
npm run dev
```

A aplicação fica disponível, por padrão, em `http://localhost:3000`.

## Eventos

O frontend utiliza o contrato temporal atual do backend:

- `start_at` e `end_at` para data e horário precisos;
- `timezone` com identificador IANA;
- `registration_deadline` para o prazo de inscrição;
- `version` em toda edição e ação de status.

A criação e a edição compartilham `components/forms/event-form.tsx`. As ações de ciclo de vida usam endpoints explícitos:

```text
POST /contracts/{id}/publish
POST /contracts/{id}/close
POST /contracts/{id}/cancel
POST /contracts/{id}/reopen
```

Quando o evento possui inscrições ou pagamentos, preço e moeda são bloqueados na interface. O backend continua sendo a autoridade final para essa regra.

## BFF e sessões

O BFF separa três contextos:

```text
/api/backend/organizer
/api/backend/participant
/api/backend/public
```

Características principais:

- cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção;
- URLs canônicas sem barra final para coleções;
- redirects do backend não são seguidos automaticamente;
- respostas `3xx` inesperadas são convertidas em `502 unexpected_backend_redirect`;
- `X-Request-ID` é propagado ao backend, devolvido ao navegador e incluído nos logs do BFF;
- tokens não são enviados ao código cliente.

## Validação

Sequência equivalente ao CI:

```bash
node --version
npm --version
npm list next react react-dom
npm ci
npm run typecheck
npm run lint
npm run test
npm run test:stage4
npm run build
npm run test:bff
npm run test:e2e
```

`npm run test:bff` executa a aplicação com `next start` e valida sessões, URLs canônicas, coleções do organizador, propagação de request ID e tratamento de redirects.

## Estrutura técnica

- `app/`: páginas, layouts e Route Handlers do BFF;
- `components/`: componentes de interface e formulários reutilizáveis;
- `hooks/`: integração entre React Query e serviços;
- `services/`: clientes HTTP e contrato com o BFF;
- `types/`: tipos retornados e aceitos pelo backend;
- `lib/`: regras utilitárias, sessão e comunicação server-side;
- `tests/unit/`: testes de componentes e utilitários;
- `tests/integration/`: contrato do proxy e helpers de integração;
- `tests/e2e/`: jornadas completas no navegador;
- `scripts/smoke-bff.mjs`: smoke test do build de produção.

## Licença

Consulte `LICENSE.md`.
