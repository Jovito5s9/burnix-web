# Etapa 4 — fluxo Pix seguro do participante

## Objetivo atendido

O frontend exibe a cobrança Pix e acompanha o status real da inscrição sem
receber credenciais da OpenPix e sem consultar recursos internos do organizador.

O fluxo do participante usa somente:

```text
POST /participant/registrations/{registration_id}/payments/pix
GET  /participant/registrations/{registration_id}
```

O AppID, a chave da subconta, a correlação e os identificadores internos do
gateway permanecem exclusivamente no backend.

## Geração da cobrança

A criação do Pix foi centralizada em `services/payments.ts` com o cliente de
sessão do participante. O payload público contém apenas:

```json
{
  "idempotency_key": "uuid-opcional"
}
```

A resposta aceita os contratos públicos documentados pelo backend:

```text
PublicPaymentRead
PublicPaymentNotRequired
```

A interface utiliza somente valor, moeda, tentativa, link de pagamento, QR Code,
código Pix e expiração. Campos internos do tipo `PaymentRead` continuam
restritos às telas autenticadas do organizador.

## Polling moderado

Após uma cobrança pendente, o frontend consulta o detalhe agregado da inscrição:

```text
intervalo: 4,5 segundos
duração máxima: 3 minutos
fonte: GET /participant/registrations/{registration_id}
```

O polling:

- não usa `/payments/{id}`;
- é suspenso quando a aba deixa de estar visível;
- não executa em segundo plano;
- volta a consultar quando a aba recebe foco, dentro da janela permitida;
- encerra em `paid`, `expired`, `error`, `refunded` ou `not_required`;
- usa o pagamento mais recente retornado junto da inscrição.

A mesma regra atende a página pública após a geração do Pix e o detalhe em
“Minhas inscrições”.

## Estados exibidos

```text
pending      -> Aguardando pagamento
paid         -> Pagamento confirmado
expired      -> Este Pix expirou. Gere uma nova cobrança
error        -> Não foi possível gerar o Pix
not_required -> Este evento é gratuito
```

A confirmação exibida sempre deriva do recurso da inscrição. A interface não
considera um retorno externo suficiente para confirmar o pagamento.

## Páginas de retorno

As páginas:

```text
/sucesso
/falha
/pendente
```

agora direcionam somente para:

```text
/minhas-inscricoes
/minhas-inscricoes/{registration_id}
```

Elas aceitam `registration_id` apenas para montar a navegação. Não exibem
`correlation_id`, `checkout_id`, `payment_id`, nomes de endpoints, rotas do
organizador ou detalhes técnicos do provedor.

## Proteção do BFF

A allowlist da sessão de participante permite:

```text
GET  /participant/registrations
GET  /participant/registrations/{registration_id}
POST /participant/contracts/{contract_id}/registrations
POST /participant/registrations/{registration_id}/payments/pix
```

A sessão do participante não pode acessar `/payments/{id}` nem as áreas privadas
do organizador. O proxy encaminha apenas cabeçalhos HTTP necessários e o Bearer
da sessão HttpOnly; nenhuma credencial OpenPix é aceita ou criada no navegador.

## Arquivos principais

```text
components/public/pix-payment-box.tsx
components/public/registration-form.tsx
components/participant/payment-status-panel.tsx
components/participant/participant-registration-detail.tsx
services/payments.ts
services/participant-registrations.ts
services/public-contracts.ts
hooks/usePayments.ts
hooks/usePublicRegistration.ts
hooks/useParticipantRegistrations.ts
hooks/useParticipantPaymentPolling.ts
lib/participant-registration-query.ts
lib/format.ts
types/payment.ts
app/sucesso/page.tsx
app/falha/page.tsx
app/pendente/page.tsx
```
