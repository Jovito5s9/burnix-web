# Validação da Etapa 2 — “Minhas inscrições”

Data da validação: 11 de julho de 2026.

## Documentação de backend conferida

Foram usados como fonte de contrato:

```text
docs/participant-identity-my-events.md
docs/api-route-reference.md
docs/error-contracts-stage-6.md
docs/payment-lifecycle-stage-5.md
docs/current-state-audit.md
```

Pontos conferidos:

- listagem agregada em `GET /participant/registrations`;
- detalhe isolado por participante;
- resposta pública reduzida do pagamento;
- nova tentativa para `expired` ou `error` quando permitida;
- reaproveitamento de tentativa `pending` ou `paid` pelo backend;
- status `not_required` para evento gratuito;
- mensagens públicas seguras por `detail.message`.

## Comandos executados

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:bff
npm audit --omit=dev
```

## Resultados

```text
TypeScript: aprovado
ESLint: aprovado
Build de produção: aprovado
Smoke BFF: aprovado
Rotas /minhas-inscricoes e /minhas-inscricoes/[id]: reconhecidas pelo Next.js
```

O smoke test valida:

- cookie HttpOnly separado do participante;
- redirecionamento sem sessão para `/participante/entrar`;
- sessão de organizador insuficiente para abrir “Minhas inscrições”;
- acesso da página com cookie de participante;
- proxy autenticado da listagem;
- proxy autenticado do detalhe;
- criação de inscrição sem `participant_id`, `email` ou `owner_user_id`;
- geração de Pix pela rota atual de participante;
- bloqueio da troca de categoria de sessão no BFF.

## Auditoria de dependências

A auditoria encontrou zero vulnerabilidades críticas ou altas e duas moderadas,
originadas pelo PostCSS empacotado na versão travada do Next.js. O reparo
automático sugerido pelo npm exige uma alteração incompatível de versão; por
isso não foi aplicado `npm audit fix --force`.

Essa observação não impediu compilação, lint, checagem de tipos ou smoke test.
Deve ser reavaliada quando uma atualização compatível do Next.js estiver
disponível para o projeto.
