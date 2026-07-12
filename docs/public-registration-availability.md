# Disponibilidade pública de inscrições

## Visão geral

A página pública do evento não decide sozinha se uma inscrição pode ser criada. O backend calcula a disponibilidade e devolve o estado atual em `GET /public/contracts/{contract_id}`.

Campos usados pelo frontend:

```text
registration_open
registration_state
registration_closed_reason
registration_closed_message
server_time
remaining_capacity
registration_deadline
```

A verificação visual melhora a experiência, mas não substitui as validações transacionais executadas pelo backend no `POST` da inscrição.

## Estados suportados

| Estado | Comportamento da interface |
|---|---|
| `open` | Exibe autenticação ou formulário de inscrição |
| `deadline_passed` | Exibe mensagem de inscrições encerradas |
| `capacity_reached` | Exibe mensagem de vagas preenchidas |
| `event_closed` | Exibe mensagem de evento encerrado |
| `event_cancelled` | Exibe mensagem de cancelamento |
| `event_not_published` | Informa indisponibilidade defensiva |
| `not_started` | Informa que as inscrições ainda não começaram |

Quando `registration_open=false`, `RegistrationForm` não é montado. O componente `RegistrationClosedState` exibe a mensagem devolvida pelo backend, com fallback local estável, e oferece acesso a `/minhas-inscricoes`.

## Sincronização temporal

`useEventAvailabilityTimer` recebe:

```text
server_time
registration_deadline
dataUpdatedAt
```

`dataUpdatedAt` representa o instante local em que a resposta foi armazenada pelo React Query. A diferença entre esse instante e `server_time` é usada como correção do relógio do navegador.

O tempo restante é calculado como:

```text
registration_deadline - (Date.now() + server_clock_offset)
```

Ao atingir zero:

1. a página marca as inscrições como encerradas localmente;
2. o formulário deixa de ser exibido imediatamente;
3. `usePublicContract` executa um novo GET;
4. a mensagem definitiva do backend passa a ser usada quando a resposta chega.

O timer aceita prazos longos dividindo a espera em intervalos compatíveis com o limite de `setTimeout` do navegador.

## Corrida durante o envio

A disponibilidade pode mudar entre o GET público e o POST da inscrição. Quando o backend responde:

```text
409 event_registration_closed
```

ou:

```text
409 event_capacity_reached
```

`RegistrationForm`:

- encerra o estado da mutação;
- limpa feedback e erros do formulário;
- não exibe erro genérico;
- informa `PublicEventPage` sobre o novo estado;
- provoca uma nova consulta pública.

A página então substitui o formulário por `RegistrationClosedState`.

## Participantes já inscritos

O encerramento de novas inscrições não bloqueia o acesso a registros existentes. A tela fechada mantém um link para:

```text
/minhas-inscricoes
```

A consulta da inscrição e a retomada de um pagamento existente seguem as regras de autenticação e autorização do backend.

## Arquivos principais

```text
components/public/public-event-page.tsx
components/public/registration-form.tsx
components/public/registration-closed-state.tsx
hooks/useEventAvailabilityTimer.ts
hooks/usePublicContract.ts
lib/event-availability.ts
services/public-contracts.ts
types/public-contract.ts
```

## Testes

A cobertura automatizada inclui:

- relógio local divergente do servidor;
- mensagens de todos os principais estados fechados;
- capacidade esgotada no primeiro carregamento;
- fechamento automático no prazo;
- nova leitura do evento após o prazo;
- `409 event_registration_closed` durante o envio;
- preservação do acesso a “Minhas inscrições”;
- cenários E2E equivalentes com API simulada.
