# Relatório de validação — Etapas 5 e 6

Data da validação: 12 de julho de 2026.

## Resultado aprovado

Os comandos abaixo foram executados com sucesso no estado final do projeto:

```text
npm ci --ignore-scripts
npm audit --omit=dev
npm run typecheck
npm run lint
npm test
npm run test:stage4
API_URL=http://127.0.0.1:8000 APP_ORIGIN=https://app.example.com npm run build
npm run test:bff
git diff --check
```

Resultados principais:

- instalação reproduzível pelo `package-lock.json`;
- auditoria das dependências de produção sem vulnerabilidades conhecidas;
- TypeScript e ESLint sem erros;
- 12 arquivos de teste e 45 testes Vitest aprovados;
- build otimizado do Next.js aprovado;
- smoke test do BFF aprovado;
- ausência de erros de whitespace no diff.

Também foram verificados manualmente:

- falha de build de produção sem `API_URL` ou `APP_ORIGIN`;
- presença dos headers CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`;
- resposta `413 request_body_too_large` para payload de autenticação acima do limite;
- propagação de `Retry-After` e contagem regressiva para respostas `429`;
- cookies separados de organizador e participante com `Max-Age`.

## Testes E2E

A suíte Playwright está incluída e pronta para execução com:

```bash
npx playwright install chromium
npm run test:e2e
```

Neste ambiente de validação, o download do navegador foi impedido por indisponibilidade de DNS. O Chromium já instalado pelo sistema possui uma política administrativa que bloqueia navegação para `localhost`, portanto os cenários E2E não puderam ser executados aqui. Essa limitação ocorreu antes da navegação pela aplicação e não representa falha dos testes do projeto.
