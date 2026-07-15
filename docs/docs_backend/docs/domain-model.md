# Modelo de domínio e regras de negócio

## Entidades

### `User` — organizador

Representa a conta que administra eventos e funciona como proprietário do tenant.

Campos principais:

| Campo | Uso |
|---|---|
| `id` | Identificador interno |
| `email` | Login único |
| `hashed_password` | Hash da senha |
| `is_active` | Bloqueio lógico da conta |
| `role` | Perfil de autorização; padrão `contractor` |

Roles com acesso administrativo global:

```text
admin
superuser
super_user
```

### `Participant` — participante

Conta autenticada usada por quem se inscreve em eventos.

| Campo | Uso |
|---|---|
| `email` | Login único, normalizado em minúsculas |
| `hashed_password` | Hash da senha |
| `is_active` | Bloqueio lógico |
| `email_verified_at` | Reserva de estado para confirmação de e-mail |
| `created_at`, `updated_at` | Auditoria básica |

A confirmação de e-mail ainda não é exigida pelo fluxo atual.

### `Contract` — evento

| Grupo | Campos |
|---|---|
| Propriedade | `id`, `owner_user_id`, `client_id` legado |
| Conteúdo | `title`, `description` |
| Estado | `status`, `version`, `published_at`, `closed_at`, `cancelled_at` |
| Financeiro | `price`, `currency`, `payment_config` |
| Capacidade | `capacity` |
| Tempo | `start_at`, `end_at`, `timezone`, `registration_deadline` |
| Compatibilidade | `start_date`, `end_date` |
| Auditoria | `created_at`, `updated_at` |

`start_at` e `end_at` são a fonte temporal precisa. `start_date` e `end_date` permanecem para compatibilidade com consumidores antigos.

Regras estruturais:

```text
price >= 0
currency = BRL
capacity é nula ou >= 0
end_at > start_at
registration_deadline <= start_at
version >= 1
```

Datas sem offset recebidas pela API são interpretadas no `timezone` do evento. O padrão é `America/Belem`. O timezone precisa ser um identificador IANA válido.

### `ContractFormField` — campo do formulário

| Campo | Uso |
|---|---|
| `field_key` | Chave única dentro do evento |
| `label` | Texto apresentado ao participante |
| `type` | Tipo lógico do campo |
| `required` | Obrigatoriedade |
| `order` | Ordem de exibição |
| `options` | Opções de seleção ou configuração |
| `validation_rules` | Regras adicionais |
| `is_system` | Identifica campo reservado pelo sistema |
| `is_active`, `archived_at` | Arquivamento sem perda histórica |

A combinação `(contract_id, field_key)` é única.

Quando um campo já possui respostas:

- `field_key` não pode ser alterado;
- `type` não pode ser alterado;
- exclusão arquiva o campo em vez de removê-lo fisicamente.

### `Client` — inscrição

O nome do model é legado; no produto ele representa uma inscrição.

| Grupo | Campos |
|---|---|
| Escopo | `owner_user_id`, `contract_id`, `participant_id` |
| Pessoa | `name`, `email`, `phone`, `document`, `sex`, `age` |
| Normalização | `phone_normalized`, `document_normalized` |
| Formulário | `extra_fields` |
| Estado | `registration_status`, `payment_status`, `is_active` |
| Operação | `notes`, `created_at`, `updated_at` |
| Compatibilidade | `registration_access_token_hash` |

A combinação `(participant_id, contract_id)` é única para participantes autenticados. Registros legados podem ter `participant_id=null`.

### `Payment` — tentativa de cobrança

Cada linha representa uma tentativa independente de pagamento.

| Grupo | Campos |
|---|---|
| Escopo | `owner_user_id`, `contract_id`, `client_id` |
| Provedor | `provider`, `method`, `payment_method` |
| Estado | `status`, `status_detail`, `paid_at`, `expired_at` |
| Valores | `amount`, `currency`, `platform_fee_percent`, `platform_fee_amount`, `net_amount` |
| Liquidação | `settlement_mode`, `openpix_subaccount_pix_key`, `openpix_split_amount` |
| Pagador | `payer_email`, `payer_name`, `payer_document` |
| Idempotência | `idempotency_key`, `attempt_number`, `correlation_id`, `external_reference` |
| Gateway | IDs OpenPix, checkout, QR Code e copia e cola |
| Auditoria | `raw_payload`, `error_message`, `created_at`, `updated_at` |

Constraints principais:

```text
correlation_id único
external_reference único
(client_id, attempt_number) único
no máximo um payment pending por client_id
```

### `BillingProfile` — perfil financeiro

Existe no máximo um perfil por organizador.

| Campo | Uso |
|---|---|
| `pix_key`, `pix_key_type` | Chave informada pelo organizador |
| `recipient_document`, `recipient_name` | Dados do recebedor |
| `billing_status` | Estado financeiro interno |
| `current_plan`, `metadata` | Configuração comercial |
| `openpix_subaccount_id` | Identificador da subconta |
| `openpix_subaccount_pix_key` | Chave confirmada pelo provedor |
| `openpix_onboarding_status` | Estado do onboarding |
| `openpix_account_type` | Tipo de conta retornado pelo provedor |
| `openpix_onboarding_error` | Diagnóstico interno limitado |
| `openpix_last_sync_at` | Última sincronização |

Os estados financeiros e de onboarding não podem ser ativados diretamente pelo cliente HTTP. A ativação depende de confirmação da OpenPix.

## Estados do evento

```text
draft
published
closed
cancelled
```

Transições válidas:

```text
draft     -> published
draft     -> cancelled
published -> closed
published -> cancelled
closed    -> published somente por /reopen
cancelled -> sem saída
```

A reabertura exige:

- `start_at` futuro;
- `registration_deadline` futuro, quando definido;
- regras de publicação satisfeitas;
- chamada explícita de `/contracts/{id}/reopen`.

### Publicação

Um evento publicado precisa ter:

- `start_at` e `end_at` válidos;
- término posterior ao início;
- prazo não posterior ao início;
- capacidade compatível com inscrições ativas;
- moeda BRL;
- preço não negativo.

Para evento pago, também são exigidos:

- perfil de cobrança existente;
- `billing_status=active`;
- `openpix_onboarding_status=active`;
- chave de subconta OpenPix disponível;
- integração OpenPix configurada.

### Edição concorrente

Toda alteração de evento exige `version`:

```json
{
  "version": 4,
  "title": "Título atualizado"
}
```

O SQL `UPDATE` inclui a versão anterior. Quando outro processo já atualizou o evento, a API retorna:

```http
409 Conflict
```

```json
{
  "detail": {
    "code": "event_version_conflict",
    "message": "O evento foi alterado por outra operação. Recarregue os dados e tente novamente.",
    "expected_version": 4,
    "current_version": 5
  }
}
```

### Alterações financeiras após uso

Depois da primeira inscrição ou pagamento, mudanças efetivas em `price`, `currency` e `payment_config` são bloqueadas. O objetivo é preservar coerência entre o evento e cobranças já geradas.

### Capacidade

`capacity=null` representa capacidade ilimitada.

Quando definida, a capacidade não pode ficar abaixo da quantidade de inscrições ativas. Para ocupação de vaga, o backend considera inscrições ativas com status:

```text
pending_payment
confirmed
```

Inscrições `expired`, `cancelled` ou inativas não ocupam vaga.

## Disponibilidade pública de inscrição

A disponibilidade é calculada pelo backend e retornada em `GET /public/contracts/{contract_id}`.

Campos:

```text
registration_open
registration_state
registration_closed_reason
registration_closed_message
server_time
remaining_capacity
```

Estados possíveis:

| Estado | Significado |
|---|---|
| `open` | Inscrição permitida |
| `deadline_passed` | Prazo atingido |
| `event_closed` | Evento encerrado ou `end_at` atingido |
| `event_cancelled` | Evento cancelado e publicamente visível |
| `event_not_published` | Estado defensivo para evento não publicável |
| `capacity_reached` | Capacidade ocupada |
| `not_started` | Publicação futura defensiva |

A resposta pública é informativa. A criação repete as verificações dentro da transação e sob lock do evento.

## Estados da inscrição

```text
pending_payment
confirmed
cancelled
expired
```

Estados de pagamento associados:

```text
pending
paid
expired
error
refunded
not_required
```

Evento gratuito:

```text
registration_status=confirmed
payment_status=not_required
```

Nenhuma cobrança é criada.

Evento pago:

```text
registration_status=pending_payment
payment_status=pending
```

A confirmação depende da transição do pagamento para `paid`.

## Estados do pagamento

Transições permitidas:

```text
pending -> paid
pending -> expired
pending -> error
paid    -> refunded
```

Estados terminais:

```text
expired
error
refunded
not_required
```

Repetir o mesmo estado é idempotente. Webhooks fora de ordem não rebaixam estados finais.

## Tentativas de pagamento

Regras por inscrição:

- tentativa `pending`: reutilizada;
- tentativa `paid`: confirmação existente é devolvida;
- tentativa `expired` ou `error`: nova tentativa numerada pode ser criada;
- tentativa `refunded`: não reabre automaticamente;
- somente uma tentativa `pending` pode existir.

## Encerramento automático

O job seleciona eventos com:

```text
status=published
end_at <= now
```

Para cada evento:

- muda `status` para `closed`;
- define `closed_at`;
- atualiza `updated_at`;
- incrementa `version`;
- preserva inscrições e pagamentos.

O job é idempotente porque somente eventos ainda publicados são atualizados.
