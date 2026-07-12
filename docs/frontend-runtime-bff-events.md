# Runtime, BFF e gerenciamento de eventos

Este documento descreve a base reproduzível do frontend, o contrato de comunicação com o backend e o fluxo de criação, edição e mudança de situação dos eventos.

## Runtime fixado

O projeto utiliza as seguintes versões:

```text
Node.js   22.16.0
npm       10.9.2
Next.js   16.2.10
React     19.2.7
React DOM 19.2.7
```

O Node.js está registrado em `.nvmrc`. As dependências diretas não usam intervalos semânticos e o `package-lock.json` deve ser respeitado em todos os ambientes.

Instalação reproduzível:

```bash
nvm use
npm ci
node --version
npm --version
npm list next react react-dom
```

Pipelines de CI, imagens de produção e processos de deploy devem usar `npm ci`, e não `npm install`.

## URLs canônicas e BFF

O navegador consome somente as rotas internas do Next.js:

```text
/api/backend/organizer/*
/api/backend/participant/*
/api/backend/public/*
```

Os serviços usam URLs de coleção sem barra final:

```text
/contracts
/payments
/clients
/billing-profiles
/contracts/{contract_id}/form-fields
```

O BFF mantém `redirect: "manual"`. Uma resposta `3xx` inesperada do backend é convertida em:

```http
HTTP/1.1 502 Bad Gateway
```

```json
{
  "detail": {
    "code": "unexpected_backend_redirect",
    "message": "O serviço respondeu com um redirecionamento inesperado."
  }
}
```

O header `Location` não é encaminhado ao navegador nesse caso.

## Request ID

O BFF aceita um `X-Request-ID` válido ou gera um UUID. O identificador é:

1. enviado ao backend;
2. devolvido ao navegador;
3. incluído nos logs do BFF;
4. preservado nas respostas de erro controladas.

Tokens de sessão continuam restritos a cookies `HttpOnly` e não são incluídos nos logs.

## Contrato temporal do evento

O frontend usa os campos atuais do backend:

```text
start_at
end_at
timezone
registration_deadline
version
```

`start_at`, `end_at` e `registration_deadline` são enviados no formato local aceito pelo backend, junto com um timezone IANA, por exemplo:

```json
{
  "start_at": "2026-08-20T19:00:00",
  "end_at": "2026-08-20T22:00:00",
  "registration_deadline": "2026-08-20T18:00:00",
  "timezone": "America/Belem"
}
```

Os campos legados `start_date` e `end_date` são lidos apenas como fallback de apresentação para registros antigos.

## Formulário reutilizável

`components/forms/event-form.tsx` atende criação e edição.

Ele permite configurar:

- título;
- descrição;
- capacidade;
- preço em BRL;
- início e término com horário;
- prazo de inscrição;
- timezone;
- criação como rascunho ou publicação imediata.

As validações locais cobrem preço e capacidade não negativos, término posterior ao início e prazo de inscrição não posterior ao início. O backend permanece como autoridade definitiva.

## Edição concorrente

Toda edição envia a versão atual do evento:

```json
{
  "version": 4,
  "title": "Novo título"
}
```

Quando o backend responde `409 event_version_conflict`, o frontend recarrega o evento, encerra a edição atual e orienta o organizador a revisar os dados mais recentes.

## Ciclo de situação

A tela de detalhe usa as ações explícitas do backend:

```text
POST /contracts/{id}/publish
POST /contracts/{id}/close
POST /contracts/{id}/cancel
POST /contracts/{id}/reopen
```

Cada ação envia:

```json
{
  "version": 4
}
```

A interface apresenta as ações conforme a situação:

| Situação | Ações disponíveis |
|---|---|
| `draft` | editar, publicar, cancelar |
| `published` | editar, encerrar, cancelar |
| `closed` | visualizar, reabrir |
| `cancelled` | visualizar |

Publicação, encerramento, cancelamento e reabertura exigem confirmação explícita.

## Proteção dos campos financeiros

Quando o evento possui inscrições ou pagamentos, preço e moeda são desabilitados na edição. Se a consulta desses dados relacionados falhar, os campos também permanecem bloqueados por segurança.

Essa proteção é apenas uma antecipação de interface. O backend continua rejeitando alterações financeiras incompatíveis.

## Validação automatizada

A sequência principal é:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run test:stage4
npm run build
npm run test:bff
npm run test:e2e
```

Os testes unitários e de integração verificam o formulário, timestamps, timezone, `version`, URLs canônicas, ações de situação, request ID e redirects controlados.

O smoke test do BFF executa o build com `next start` e valida as coleções `/contracts`, `/payments` e `/clients` contra um backend HTTP simulado.

O workflow instala o Chromium oficial do Playwright antes de executar os testes E2E.
