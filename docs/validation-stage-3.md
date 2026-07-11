# Validação da Etapa 3 — duplicidade e retomada de pagamento

Data da validação: 11 de julho de 2026.

## Documentação de backend conferida

```text
docs/registration-uniqueness-concurrency.md
docs/error-contracts-stage-6.md
docs/participant-identity-my-events.md
docs/payment-lifecycle-stage-5.md
docs/api-route-reference.md
docs/current-state-audit.md
```

Pontos validados contra a documentação:

- unicidade definitiva por `participant_id + contract_id`;
- conflito `409 registration_already_exists` com `registration_id` e
  `can_resume_payment`;
- recuperação autenticada por `GET /participant/registrations/{id}`;
- pagamento pela rota autenticada do participante;
- reutilização de tentativa `pending` e confirmação `paid` pelo backend;
- nova tentativa após `expired` ou `error` quando permitida;
- `idempotency_key` opcional, mas enviado pelo navegador por tentativa;
- mensagens seguras orientadas por `detail.code` e `detail.message`.

## Comandos executados

```text
npm ci --no-audit --no-fund
npm run typecheck
npm run lint
npm run build
npm run test:bff
npm audit --omit=dev --audit-level=high
```

## Resultados

```text
TypeScript: aprovado
ESLint: aprovado
Build de produção: aprovado
Smoke BFF: aprovado
Rotas públicas e de “Minhas inscrições”: compiladas pelo Next.js
```

O build de produção reconheceu, entre outras:

```text
/eventos/[id]
/minhas-inscricoes
/minhas-inscricoes/[id]
/api/backend/[session]/[...path]
```

## Cenários cobertos pelo smoke test

- sessão do participante armazenada em cookie HttpOnly separado;
- criação autenticada sem `participant_id`, e-mail ou owner enviados pelo
  navegador;
- preservação integral do `409` e de seus metadados seguros pelo BFF;
- retorno de `registration_already_exists` com `registration_id=44`;
- consulta autenticada do detalhe da inscrição existente;
- geração Pix somente pela rota autenticada do participante;
- envio de `idempotency_key` em formato UUID;
- repetição da chamada Pix com exatamente a mesma chave;
- bloqueio de troca de categoria de sessão;
- proteção da área “Minhas inscrições”.

## Validações de código do fluxo

A checagem de tipos e o build confirmaram:

- leitura tipada do código e dos metadados do erro;
- interrupção do submit em caso de duplicidade;
- ocultação do formulário depois que existe um `registration_id` ativo;
- carregamento do pagamento mais recente;
- ações distintas para `pending`, `paid`, `not_required`, `expired`, `error`,
  `refunded` e inscrição cancelada;
- retries de rede configurados para reutilizar as variables da mutation;
- criação do UUID antes da mutation, e não dentro da função repetida pelo retry.

## Auditoria de dependências

A auditoria encontrou zero vulnerabilidades críticas ou altas e duas moderadas
no PostCSS empacotado pela versão travada do Next.js. O comando sugerido pelo
npm exige downgrade incompatível do Next.js, portanto não foi executado com
`--force`.

A observação não impediu typecheck, lint, build ou smoke test.
