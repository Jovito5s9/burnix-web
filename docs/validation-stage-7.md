# Relatório de validação — Etapa 7

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
API_URL=http://127.0.0.1:3000 APP_ORIGIN=https://app.example.com npm run build
npm run test:bff
```

Resultados principais:

- instalação reproduzível pelo `package-lock.json`;
- auditoria das dependências de produção sem vulnerabilidades conhecidas;
- TypeScript e ESLint sem erros;
- 13 arquivos de teste e 48 testes Vitest aprovados;
- build otimizado do Next.js aprovado;
- smoke test do BFF aprovado com o novo envelope de `GET /contracts`;
- contrato legado em array rejeitado de forma controlada;
- total global, página atual e total de páginas calculados pelos metadados da API;
- botão **Próxima** desabilitado quando `skip + items.length >= total`.

## Cobertura adicionada

A suíte `tests/unit/contracts-pagination.test.tsx` valida:

1. `total=20`, `skip=0`, `limit=20` e 20 itens: próxima página desabilitada;
2. `total=21`, `skip=0`, `limit=20` e 20 itens: próxima página habilitada;
3. segundo carregamento com `skip=20`: página 2 de 2 e próxima página desabilitada.

`tests/unit/contracts-service.test.ts` também confirma que respostas legadas em array não são aceitas como se fossem o novo contrato paginado.

## Dependência de backend

A documentação de backend anexada ainda informa que `GET /contracts` retorna `ContractRead[]` e que as listagens não incluem total global. Esta versão do frontend exige o seguinte envelope:

```json
{
  "items": [],
  "total": 143,
  "skip": 20,
  "limit": 20
}
```

O backend precisa disponibilizar esse contrato antes da implantação conjunta desta etapa.

## Testes E2E

A suíte Playwright foi iniciada com o Chromium disponível no sistema, porém o navegador é administrado pelo ambiente e bloqueou a navegação para `http://127.0.0.1:3100` com `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

A falha ocorreu em `page.goto`, antes que qualquer tela ou regra da aplicação fosse exercitada. Os artefatos temporários dessa tentativa não foram incluídos no pacote final. Em CI, a suíte permanece configurada para instalar o Chromium próprio do Playwright e executar normalmente.
