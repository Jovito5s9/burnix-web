# Pagamentos e integração OpenPix

## Modelo financeiro

A Burnix opera com uma credencial OpenPix da plataforma e uma subconta por organizador.

Modos suportados:

| Modo | Comportamento |
|---|---|
| `split` | A cobrança é criada pela conta principal e envia o valor líquido para a subconta |
| `subaccount` | A cobrança inteira é vinculada à subconta; exige taxa da plataforma igual a zero |

O padrão é:

```env
OPENPIX_SETTLEMENT_MODE=split
PAYMENT_PLATFORM_FEE_PERCENT=0.03
OPENPIX_SPLIT_TYPE=SPLIT_SUB_ACCOUNT
```

Para uma cobrança de R$ 100,00 com taxa de 3%:

```text
amount=100.00
platform_fee_amount=3.00
net_amount=97.00
openpix_split_amount=97.00
```

O pagamento guarda um snapshot do modo, taxa, chave de subconta e valor de split. Mudanças posteriores no perfil não alteram cobranças existentes.

## Ambientes

| `APP_ENV` | `OPENPIX_BASE_URL` obrigatória |
|---|---|
| `staging` | `https://api.woovi-sandbox.com` |
| `production` | `https://api.openpix.com.br` |

Staging e produção exigem:

- `OPENPIX_APP_ID` válido;
- HMAC ou chave pública para webhook;
- URL correspondente ao ambiente;
- ausência de placeholders.

Credenciais de sandbox e produção devem ser diferentes. O script abaixo valida o par de arquivos sem imprimir os segredos:

```bash
python scripts/validate_openpix_environment_pair.py \
  --staging /caminho/.env.staging \
  --production /caminho/.env.production
```

## Perfil financeiro do organizador

Fluxo:

1. `PUT` ou `PATCH /billing-profiles/me` informa chave Pix e recebedor;
2. `POST /integrations/openpix/subaccount` cria ou recupera a subconta;
3. `POST /integrations/openpix/subaccount/sync` sincroniza o estado;
4. `GET /integrations/openpix/status` retorna uma visão segura da integração.

A alteração da chave Pix informada pelo organizador invalida a ativação anterior até nova confirmação do provedor.

Estados internos:

```text
billing_status:
  pending
  active
  suspended
  cancelled

openpix_onboarding_status:
  not_started
  pending
  active
  error
```

Somente o backend define estados ativos depois de validar a resposta da OpenPix.

## Publicação de evento pago

Um evento com `price > 0` somente pode ser publicado quando:

```text
billing_profile existe
billing_status=active
openpix_onboarding_status=active
openpix_subaccount_pix_key está presente
OPENPIX_APP_ID está configurado
ambiente OpenPix é reconhecido
currency=BRL
```

Falha de configuração retorna erro de domínio sem expor AppID, chave Pix completa ou detalhe interno do provedor.

## Criação de cobrança

Rotas atuais:

```text
POST /participant/registrations/{registration_id}/payments/pix
POST /payments/contracts/{contract_id}/pix
POST /payments/contracts/{contract_id}/checkout
```

A primeira é o fluxo recomendado para participante. As duas rotas do organizador permitem criar cobrança diretamente para um evento, com pagador e inscrição opcional.

Rota legada:

```text
POST /payments/registrations/{client_id}/pix
X-Registration-Token: <token>
```

Ela existe somente para inscrições antigas com token opaco e está marcada como depreciada.

## Idempotência e tentativas

Cada pagamento é uma tentativa numerada:

```text
client_id=55, attempt_number=1
client_id=55, attempt_number=2
```

Comportamento:

- tentativa pendente existente: reutilizada;
- pagamento confirmado: confirmação existente devolvida;
- tentativa expirada ou com erro: próxima tentativa criada;
- reembolso: não cria nova tentativa automaticamente;
- `idempotency_key` opcional pode ser enviada pelo cliente;
- `correlation_id` e `external_reference` são únicos.

O banco impede duas tentativas `pending` para a mesma inscrição.

## Máquina de estados

```text
pending -> paid
pending -> expired
pending -> error
paid    -> refunded
```

Repetir o estado atual não produz efeito adicional. Transições fora de ordem são rejeitadas em comandos internos e ignoradas no webhook quando poderiam rebaixar o estado.

A inscrição acompanha o pagamento:

| Pagamento | Efeito esperado na inscrição |
|---|---|
| `paid` | `registration_status=confirmed`, `payment_status=paid` |
| `pending` | mantém `pending_payment` |
| `expired` | pode liberar a reserva de vaga |
| `error` | mantém possibilidade de nova tentativa |
| `refunded` | registra estado financeiro final |
| `not_required` | evento gratuito, inscrição confirmada sem cobrança |

## Concorrência

Durante a criação de cobrança:

1. o evento é bloqueado;
2. a inscrição é bloqueada;
3. capacidade e estado são revalidados;
4. tentativas existentes são selecionadas;
5. a linha de pagamento é criada ou reutilizada;
6. o resultado do provedor é persistido.

Uma inscrição expirada não recupera vaga sem nova validação de capacidade.

## Respostas públicas e internas

`PaymentRead`, usado por organizadores, contém dados completos da cobrança e do snapshot financeiro.

`PublicPaymentRead`, usado por participantes, contém apenas:

```text
id
registration_id
attempt_number
status
amount
currency
checkout_url
qr_code_base64
copy_and_paste
expires_at
```

Não são expostos ao participante:

- PII interna além dos dados da própria inscrição;
- payload bruto do gateway;
- erros técnicos;
- IDs internos desnecessários;
- detalhes de split;
- AppID ou segredos.

## Webhook

Endpoint:

```text
POST /payments/webhook/openpix
```

Mecanismos de assinatura aceitos:

```text
X-OpenPix-Signature
HMAC-SHA1/base64 com OPENPIX_WEBHOOK_HMAC_SECRET

x-webhook-signature
RSA-SHA256 com OPENPIX_WEBHOOK_PUBLIC_KEY_BASE64
```

O webhook possui:

- bucket de rate limit separado;
- limite de corpo separado;
- leitura incremental;
- validação de assinatura antes da alteração;
- lock da linha de pagamento;
- transições idempotentes;
- proteção contra eventos atrasados;
- resposta reduzida `WebhookAck`.

Exemplo de ack:

```json
{
  "received": true,
  "updated": true,
  "payment_id": 98,
  "status": "paid"
}
```

Assinatura inválida:

```http
401 invalid_webhook_signature
```

## Falhas do provedor

Quando a criação da cobrança falha:

- a tentativa pode ser marcada como `error`;
- uma mensagem técnica limitada pode ser persistida em `error_message`;
- o cliente recebe `502 payment_provider_unavailable` ou `503` conforme o caso;
- resposta bruta, URL interna, stack trace e segredo não são enviados ao consumidor;
- a chamada seguinte pode criar nova tentativa numerada.

## Scripts de validação

Validar configuração sem criar cobrança:

```bash
python scripts/openpix_test_checkout.py --validate-only
```

Criar cobrança de teste no ambiente configurado:

```bash
python scripts/openpix_test_checkout.py \
  --amount 10.00 \
  --payer-email teste@example.com \
  --payer-name "Pessoa de Teste"
```

Teste E2E real da sandbox, desativado por padrão:

```bash
export RUN_OPENPIX_SANDBOX_E2E=1
export OPENPIX_APP_ID='<appid-sandbox>'
export OPENPIX_BASE_URL=https://api.woovi-sandbox.com
pytest -m sandbox tests/e2e/test_openpix_sandbox.py -q
```

Nunca use credencial de produção em testes locais ou CI.
