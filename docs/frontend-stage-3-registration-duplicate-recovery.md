# Etapa 3 — recuperação de inscrição duplicada

## Objetivo atendido

O conflito `409 registration_already_exists` deixou de ser exibido como erro
genérico. A página pública agora usa o conflito como ponto de retomada da
inscrição já existente.

Fluxo implementado:

```text
1. O participante envia o formulário autenticado.
2. O backend continua sendo a fonte definitiva da unicidade.
3. Se a inscrição for criada, o frontend passa a operar pelo registration_id.
4. Se o backend retornar registration_already_exists, o frontend usa o
   registration_id seguro retornado no detalhe do erro.
5. A inscrição é consultada por GET /participant/registrations/{id}.
6. O pagamento existente é exibido.
7. Uma tentativa pending pode ser retomada.
8. Uma tentativa expired ou error pode gerar novo Pix quando
   can_resume_payment permitir.
```

A mensagem apresentada ao participante é:

```text
Você já está inscrito neste evento
```

## Contratos do backend usados

```text
POST /participant/contracts/{contract_id}/registrations
GET  /participant/registrations/{registration_id}
POST /participant/registrations/{registration_id}/payments/pix
```

Contrato de conflito:

```json
{
  "detail": {
    "code": "registration_already_exists",
    "message": "Você já possui uma inscrição neste evento.",
    "registration_id": 42,
    "can_resume_payment": true
  }
}
```

O frontend decide pelo `detail.code`, preserva `registration_id` e respeita
`can_resume_payment`. Mensagens técnicas do gateway não são interpretadas nem
mostradas.

## Prevenção de nova inscrição após falha no Pix

Depois que uma inscrição é criada ou recuperada, o formulário deixa de ser a
ação principal. A tela passa a trabalhar somente com a inscrição existente.

Se a geração do Pix falhar:

- a inscrição permanece visível;
- o formulário não é reenviado automaticamente;
- o participante recebe a mensagem de que a inscrição foi preservada;
- o frontend tenta atualizar o detalhe autenticado;
- o pagamento atual, quando existente, é exibido;
- uma nova tentativa é solicitada somente pela rota de pagamento.

Após recarregar a página, um eventual novo envio do formulário encontra a
constraint do backend e recupera o mesmo fluxo pelo `409`.

## Idempotência no navegador

Cada tentativa de pagamento recebe uma chave criada no navegador:

```typescript
crypto.randomUUID()
```

A chave é criada antes da mutation e enviada como:

```json
{
  "idempotency_key": "uuid-da-tentativa"
}
```

Garantias da implementação:

- retries automáticos por falha de rede reutilizam as mesmas variables da
  mutation e, portanto, o mesmo UUID;
- o botão fica bloqueado enquanto a mutation está ativa;
- se nem o POST nem a consulta de recuperação obtêm resposta, um retry manual
  mantém a chave anterior;
- uma resposta HTTP definitiva ou uma recuperação autenticada bem-sucedida
  encerra a tentativa do navegador;
- o próximo pedido real de nova tentativa recebe outro UUID;
- a constraint e a máquina de estados do backend continuam sendo a autoridade
  final.

A mesma proteção foi aplicada às ações Pix de “Minhas inscrições”, para evitar
comportamentos diferentes entre a página pública, a listagem e o detalhe.

## Estados exibidos

```text
pending       -> retomar pelo checkout, QR Code ou Pix copia e cola
paid          -> pagamento confirmado
not_required  -> evento gratuito e inscrição confirmada
expired       -> gerar novo Pix quando permitido
error         -> tentar nova geração quando permitido
refunded      -> informar estorno sem criar cobrança
cancelled     -> informar cancelamento sem criar cobrança
```

A inscrição com `registration_status=expired` também pode solicitar uma nova
tentativa, pois o backend revalida janela, capacidade e autorização antes de
criar a cobrança.

## Arquivos principais ajustados

```text
components/public/registration-form.tsx
components/public/pix-payment-box.tsx
hooks/usePublicRegistration.ts
services/public-contracts.ts
lib/get-error-message.ts
types/registration.ts
```

Arquivos adicionais ajustados para manter o comportamento consistente:

```text
services/http-client.ts
services/participant-registrations.ts
hooks/useParticipantRegistrations.ts
components/participant/payment-status-panel.tsx
components/participant/registration-card.tsx
scripts/smoke-bff.mjs
README.md
structure.txt
```
