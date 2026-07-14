# Arquitetura do frontend

## Comunicação com o backend

O navegador não chama o backend diretamente. Os serviços cliente usam Route Handlers do Next.js:

```text
/api/backend/organizer/*
/api/backend/participant/*
/api/backend/public/*
```

O BFF adiciona a credencial da sessão correspondente e encaminha somente rotas permitidas. Tokens não são expostos ao código cliente nem incluídos nas respostas.

Coleções usam URLs sem barra final, por exemplo:

```text
/contracts
/payments
/clients
/billing-profiles
/contracts/{contract_id}/form-fields
```

O proxy não segue redirecionamentos do backend. Uma resposta `3xx` inesperada é convertida em `502 unexpected_backend_redirect`, sem repassar o header `Location` ao navegador.

## Sessões

Organizadores e participantes possuem cookies independentes. Em produção, os cookies usam:

```text
HttpOnly
Secure
SameSite=Lax
Path=/
Max-Age explícito
```

O prazo considera `expires_in` retornado pelo backend e, quando disponível, o claim `exp` do JWT. O menor prazo válido é utilizado. Uma resposta `401` limpa somente o cookie da sessão responsável pela requisição.

## Origem e request ID

Mutações são aceitas somente quando a origem da requisição é confiável. Em produção, a comparação usa `APP_ORIGIN`.

O BFF aceita um `X-Request-ID` válido ou gera um UUID. O identificador é enviado ao backend, devolvido ao navegador e registrado nos logs operacionais.

## Limites de corpo

Os valores padrão são:

| Categoria | Limite |
|---|---:|
| autenticação | 16 KiB |
| inscrição | 256 KiB |
| campos de formulário | 64 KiB |
| demais mutações | 1 MiB |

A leitura é incremental. Quando o limite é excedido, o BFF retorna `413 request_body_too_large` antes de encaminhar a requisição.

## Headers de segurança

O Next.js envia:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Strict-Transport-Security em produção
```

A CSP permite recursos da própria origem e imagens `data:` ou `blob:` necessárias para QR Codes.

## Eventos

O frontend usa os campos temporais:

```text
start_at
end_at
timezone
registration_deadline
version
```

Criação e edição compartilham `components/forms/event-form.tsx`. Toda alteração de um evento existente envia `version` para controle de concorrência. Em `409 event_version_conflict`, a interface recarrega os dados antes de uma nova tentativa.

Mudanças de situação usam endpoints explícitos:

```text
POST /contracts/{id}/publish
POST /contracts/{id}/close
POST /contracts/{id}/cancel
POST /contracts/{id}/reopen
```

Preço e moeda são bloqueados na interface quando o evento já possui inscrições ou pagamentos. O backend continua sendo a autoridade final para essa regra.

A listagem de eventos espera um envelope paginado:

```json
{
  "items": [],
  "total": 0,
  "skip": 0,
  "limit": 20
}
```

Respostas em array são rejeitadas para evitar a apresentação de um total incorreto.

## Inscrição e pagamento do participante

A inscrição é criada pela sessão do participante. Cliques repetidos são bloqueados enquanto a mutação está em andamento.

Quando o backend retorna `409 registration_already_exists`, a interface consulta a inscrição existente e reaproveita o pagamento pendente sem criar uma nova cobrança.

A geração de Pix usa:

```text
POST /participant/registrations/{registration_id}/payments/pix
```

Credenciais do provedor de pagamento permanecem no backend. A resposta pública contém somente dados necessários à interface.

Enquanto o pagamento está pendente, o detalhe da inscrição é consultado periodicamente. O polling para em estados finais, ao atingir o limite de duração ou quando a página não está visível.

## Rate limit e retries

Respostas `429` preservam `Retry-After`. Formulários mantêm os valores digitados, desabilitam uma nova tentativa durante a espera e exibem uma mensagem amigável.

Consultas e mutações só repetem automaticamente erros de rede e os status `500`, `502`, `503` e `504`. Erros `4xx` não são repetidos.

## Responsabilidade dos testes

- Vitest verifica regras, hooks, serviços, componentes e helpers do proxy;
- o smoke test inicia o build com `next start` e exercita os Route Handlers contra um backend HTTP simulado;
- Playwright verifica jornadas de interface com uma API determinística interceptada no navegador.

Essa divisão evita depender de serviços externos durante o CI sem confundir testes de interface com integração real do BFF.
