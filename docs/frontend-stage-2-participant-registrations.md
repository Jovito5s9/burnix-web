# Etapa 2 — área “Minhas inscrições”

## Objetivo atendido

O participante autenticado agora possui uma área própria para consultar todos os
eventos em que está inscrito e acompanhar o pagamento.

Rotas de interface:

```text
/minhas-inscricoes
/minhas-inscricoes/{registration_id}
```

As duas rotas exigem o cookie de participante:

```text
burnix.participant_access_token
```

Uma sessão de organizador não libera essas páginas.

## Contratos do backend usados

A implementação foi baseada na documentação do backend Burnix `0.6.0`:

```text
GET  /participant/registrations
GET  /participant/registrations/{registration_id}
POST /participant/registrations/{registration_id}/payments/pix
```

As requisições passam pelo BFF do Next.js:

```text
/api/backend/participant/*
```

O JWT permanece no cookie HttpOnly e não é exposto ao JavaScript.

## Listagem

Cada cartão apresenta:

- nome do evento;
- intervalo de datas;
- status traduzido da inscrição;
- status traduzido do pagamento;
- valor formatado na moeda retornada pelo backend;
- ação para abrir o detalhe;
- ação para concluir pagamento pendente;
- ação para gerar novo Pix quando a tentativa expirou;
- nova tentativa após erro de geração, conforme o ciclo de vida documentado;
- confirmação visual quando o pagamento está pago;
- confirmação visual quando o evento não exige pagamento.

O estado vazio usa linguagem de produto:

```text
Você ainda não se inscreveu em nenhum evento.
```

## Detalhe da inscrição

O detalhe exibe somente os dados da própria conta autenticada:

```text
nome
e-mail
telefone
documento
sexo
idade
campos extras
criação e atualização
```

O backend continua responsável pelo isolamento por
`registration_id + participant_id`; uma inscrição de outra conta recebe `404`.

## Pagamento

O painel de pagamento cobre os estados:

```text
pending
paid
expired
error
refunded
not_required
```

Para uma cobrança pendente, são mostrados quando disponíveis:

```text
checkout_url
qr_code_base64
copy_and_paste
expires_at
attempt_number
```

Uma cobrança `expired` ou `error` pode solicitar nova tentativa. O frontend não
presume autorização final: ele chama a rota autenticada e respeita a resposta do
backend, incluindo `registration_payment_not_allowed`,
`payment_already_confirmed` e `payment_provider_unavailable`.

Mensagens técnicas, payload bruto, IDs internos do gateway e PII operacional não
fazem parte dos tipos ou da interface do participante.

## Arquivos criados

```text
app/(participant)/minhas-inscricoes/page.tsx
app/(participant)/minhas-inscricoes/loading.tsx
app/(participant)/minhas-inscricoes/error.tsx
app/(participant)/minhas-inscricoes/[id]/page.tsx

components/participant/my-registrations-page.tsx
components/participant/registration-card.tsx
components/participant/participant-registration-detail.tsx
components/participant/payment-status-panel.tsx

services/participant-registrations.ts
hooks/useParticipantRegistrations.ts
types/participant-registration.ts
```

## Arquivos ajustados

```text
components/layout/navbar.tsx
components/public/registration-form.tsx
hooks/usePublicRegistration.ts
services/participant-api.ts
types/participant.ts
lib/format.ts
proxy.ts
scripts/smoke-bff.mjs
README.md
structure.txt
```

## Cache e atualização

As consultas usam React Query com as chaves:

```text
["participant-registrations"]
["participant-registrations", "detail", registration_id]
```

Após gerar ou reutilizar um Pix, listagem e detalhe são atualizados no cache e
revalidados contra o backend.
