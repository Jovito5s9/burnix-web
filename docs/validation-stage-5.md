# Validação da Etapa 5

Data: **11 de julho de 2026**

## Ambiente validado

```text
Node.js    22.16.0
npm        10.9.2
Next.js    16.2.10
React      19.1.0
TypeScript 5.9.2
Vitest     4.1.10
Playwright 1.61.1
Chromium   144.0.7559.96 (validação local)
```

## Resultados

| Comando | Resultado |
|---|---|
| `npm ci` | aprovado |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado |
| `npm run build` | aprovado |
| `npm run test` | 3 arquivos, 8 testes aprovados |
| `npm run test:e2e` | 3 arquivos, 8 testes aprovados |

Total desta etapa: **16 testes aprovados**.

## Build de produção

O `next build` compilou todas as páginas, Route Handlers e o Proxy sem erros.
Foram geradas, entre outras, as rotas:

```text
/eventos/[id]
/participante/entrar
/participante/cadastro
/minhas-inscricoes
/minhas-inscricoes/[id]
/api/backend/[session]/[...path]
/api/session/participant/login
/api/session/participant/register
```

## Evidências dos fluxos

Os testes E2E validaram em navegador:

1. evento público acessível sem login;
2. redirecionamento para autenticação antes da inscrição;
3. cadastro da conta e retorno ao evento original;
4. criação de uma única inscrição;
5. geração e exibição do Pix;
6. proteção contra submits simultâneos;
7. recuperação de `409 registration_already_exists`;
8. atualização para pagamento pago;
9. nova cobrança após expiração;
10. isolamento entre participantes;
11. evento gratuito sem QR Code;
12. evento não publicado como “Evento não encontrado”.

## Observação do ambiente local

O download do navegador gerenciado pelo Playwright não pôde ser concluído neste
sandbox por falha de DNS (`EAI_AGAIN` em `cdn.playwright.dev`). A validação local
foi realizada com o Chromium já instalado no sistema, configurado por
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

O projeto não depende desse fallback. No CI, o workflow instala o navegador
oficial com:

```bash
npx playwright install --with-deps chromium
```

## Auditoria de dependências

O `npm audit` reportou duas ocorrências moderadas da mesma vulnerabilidade em
uma versão de PostCSS empacotada internamente pelo Next.js. A correção automática
sugerida pelo npm exige `--force` e propõe o downgrade incompatível para Next.js
9.3.3; por isso, ela não foi aplicada. O projeto permanece em Next.js 16.2.10,
com instalação, compilação e testes aprovados, e a dependência deve ser atualizada
quando o Next.js publicar uma resolução compatível.

## Resultado final

A Etapa 5 foi concluída com infraestrutura de testes, cobertura dos cenários
obrigatórios, melhoria preventiva contra duplicidade no frontend, tratamento de
evento não publicado e workflow de CI reproduzível.
