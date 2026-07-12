# Validação do runtime, BFF e gerenciamento de eventos

## Escopo

A validação cobre:

- versões reproduzíveis de Node.js, npm, Next.js, React e React DOM;
- instalação por `npm ci`;
- URLs canônicas das coleções do backend;
- redirects manuais e resposta controlada do BFF;
- propagação de `X-Request-ID`;
- formulário reutilizável de criação e edição;
- timestamps precisos, timezone e prazo de inscrição;
- controle de concorrência por `version`;
- publicação, encerramento, cancelamento e reabertura;
- bloqueio preventivo de preço e moeda;
- compatibilidade com os fluxos de inscrição e pagamento já existentes.

## Ambiente

```text
Node.js   22.16.0
npm       10.9.2
Next.js   16.2.10
React     19.2.7
React DOM 19.2.7
TypeScript 5.9.3
Vitest    4.1.10
Playwright 1.61.1
```

As versões acima estão fixadas no `package.json`, `package-lock.json` e `.nvmrc`.

## Comandos aprovados

```text
npm ci
npm run typecheck
npm run lint
npm run test
npm run test:stage4
npm run build
npm run test:bff
```

Resultados:

```text
TypeScript: aprovado
ESLint: aprovado
Vitest: 7 arquivos e 24 testes aprovados
Validador do fluxo Pix: aprovado
Build Next.js de produção: aprovado
Páginas geradas: 21
Smoke BFF com next start: aprovado
```

## Casos automatizados adicionados

### BFF

- construção da URL canônica;
- preservação de request ID válido;
- substituição de request ID inválido;
- cópia segura dos headers de resposta;
- remoção do header `Location`;
- conversão de redirects inesperados em `502`;
- chamadas sem barra final para `/contracts`, `/payments` e `/clients`.

### Eventos

- criação com `start_at`, `end_at`, prazo e timezone;
- edição enviando a versão do evento;
- omissão de preço e moeda quando bloqueados;
- recuperação após `event_version_conflict`;
- PATCH de edição na rota correta;
- ações explícitas `publish`, `close`, `cancel` e `reopen`.

## Smoke do BFF

O smoke test executa a aplicação em modo de produção por meio de `next start` e utiliza um backend HTTP simulado. Foram confirmados:

- sessões separadas de organizador e participante;
- URLs de coleção sem barra final;
- request ID entre navegador, BFF e backend;
- rejeição controlada de `3xx`;
- recuperação do conflito de inscrição;
- preservação da chave de idempotência do Pix.

## Testes E2E no ambiente de empacotamento

O Chromium instalado no ambiente possui uma política administrada global:

```json
{
  "URLBlocklist": ["*"]
}
```

Por essa razão, o Playwright não conseguiu navegar para `http://127.0.0.1:3100` e retornou:

```text
net::ERR_BLOCKED_BY_ADMINISTRATOR
```

A falha ocorreu antes do carregamento da aplicação e não representa uma falha funcional do projeto. Nenhuma política do sistema foi alterada.

O workflow de CI instala o Chromium oficial do Playwright com:

```bash
npx playwright install --with-deps chromium
```

Os testes E2E permanecem obrigatórios no CI.

## Auditoria de dependências

`npm audit` informou duas ocorrências moderadas referentes à mesma versão de PostCSS incluída internamente pelo Next.js 16.2.10.

A correção automática proposta pelo npm exige substituição incompatível por Next.js 9.3.3. Ela não foi aplicada. Não foram reportadas vulnerabilidades altas ou críticas.

## Resultado

O frontend compila em produção, usa o lockfile de forma reproduzível, comunica-se com as rotas canônicas do backend e suporta o ciclo atual de eventos com edição concorrente e ações explícitas de situação.
