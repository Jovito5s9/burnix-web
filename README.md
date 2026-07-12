# Burnix Web

Frontend web da Burnix para organizadores, participantes e administração. O projeto usa Next.js App Router, React, TanStack Query e um BFF interno para manter os tokens de sessão fora do JavaScript do navegador.

## Runtime reproduzível

O projeto fixa as versões usadas no desenvolvimento, CI e produção:

```text
Node.js 22.16.0
npm 10.9.2
Next.js 16.2.10
React 19.2.7
React DOM 19.2.7
```

As versões das dependências estão registradas sem intervalos no `package.json` e resolvidas no `package-lock.json`.

Use o Node definido em `.nvmrc`:

```bash
nvm use
node --version
npm --version
npm list next react react-dom
```

A instalação deve ser feita com o lockfile:

```bash
npm ci
```

Não use `npm install` em pipelines ou imagens de produção para evitar alterações silenciosas de versão.

## Configuração

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Variáveis principais:

```env
API_URL=http://localhost:3000
APP_ORIGIN=http://localhost:3000
```

`API_URL` é usada apenas no servidor pelo BFF. O navegador consome as rotas internas em `/api/backend/*` e não recebe o token JWT. Em produção, `API_URL` e `APP_ORIGIN` são obrigatórias e o build falha quando qualquer uma delas está ausente ou não é uma URL HTTP(S) absoluta. Não existe fallback de produção para variável `NEXT_PUBLIC_*`.

Os limites de corpo do BFF podem ser ajustados por:

```env
BFF_AUTH_REQUEST_MAX_BODY_BYTES=16384
BFF_REGISTRATION_REQUEST_MAX_BODY_BYTES=262144
BFF_FORM_FIELD_REQUEST_MAX_BODY_BYTES=65536
BFF_REQUEST_BODY_DEFAULT_MAX_BYTES=1048576
```

## Desenvolvimento

```bash
npm ci
npm run dev
```

A aplicação fica disponível, por padrão, em `http://localhost:3000`.

## Eventos

O frontend utiliza o contrato temporal atual do backend:

- `start_at` e `end_at` para data e horário precisos;
- `timezone` com identificador IANA;
- `registration_deadline` para o prazo de inscrição;
- `version` em toda edição e ação de status.

A criação e a edição compartilham `components/forms/event-form.tsx`. As ações de ciclo de vida usam endpoints explícitos:

```text
POST /contracts/{id}/publish
POST /contracts/{id}/close
POST /contracts/{id}/cancel
POST /contracts/{id}/reopen
```

Quando o evento possui inscrições ou pagamentos, preço e moeda são bloqueados na interface. O backend continua sendo a autoridade final para essa regra.

### Paginação da lista de eventos

`GET /contracts` deve responder com metadados de paginação:

```json
{
  "items": [],
  "total": 143,
  "skip": 20,
  "limit": 20
}
```

A interface usa `total` como quantidade global e habilita a próxima página somente quando `skip + items.length < total`. Respostas legadas em array são rejeitadas para impedir que o tamanho da página seja exibido como total geral.

## Disponibilidade pública de inscrições

A página pública usa a disponibilidade calculada pelo backend:

```text
registration_open
registration_state
registration_closed_message
server_time
remaining_capacity
```

O formulário é montado somente quando `registration_open=true`. Estados como prazo encerrado, capacidade atingida, evento encerrado ou cancelado exibem uma mensagem específica e mantêm o acesso a **Minhas inscrições** para participantes que já concluíram o cadastro.

O prazo é acompanhado por `hooks/useEventAvailabilityTimer.ts`. O hook calcula a diferença entre `server_time` e o relógio do navegador, fecha a interface no instante correto e solicita uma nova leitura do evento. O backend permanece como autoridade final: um `409 event_registration_closed` ou `409 event_capacity_reached` durante o envio substitui o formulário pelo estado de encerramento, sem apresentar erro técnico genérico.

A implementação e o contrato de interface estão documentados em `docs/public-registration-availability.md`.

## BFF e sessões

O BFF separa três contextos:

```text
/api/backend/organizer
/api/backend/participant
/api/backend/public
```

Características principais:

- cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção;
- URLs canônicas sem barra final para coleções;
- redirects do backend não são seguidos automaticamente;
- respostas `3xx` inesperadas são convertidas em `502 unexpected_backend_redirect`;
- `X-Request-ID` é propagado ao backend, devolvido ao navegador e incluído nos logs do BFF;
- tokens não são enviados ao código cliente.


## Rate limit

Respostas `429` preservam o header `Retry-After` ao atravessar o BFF. Login, cadastro, inscrição e geração de Pix:

- não repetem automaticamente a mutação enquanto o servidor solicita espera;
- mantêm os valores digitados, inclusive senha;
- desabilitam o botão durante a janela;
- exibem uma contagem regressiva sem detalhes técnicos.

O React Query repete somente erros de rede e os status `500`, `502`, `503` e `504`, com no máximo duas novas tentativas para consultas e uma para mutações. Status `4xx`, incluindo `429`, não são repetidos.

## Segurança de produção

O Next.js envia CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e, em produção, HSTS. A CSP permite apenas recursos locais, imagens `data:`/`blob:` usadas pelo QR Code e conexões para a própria origem.

Cookies de organizador e participante são separados, `HttpOnly`, `Secure` em produção, `SameSite=Lax`, `Path=/` e possuem `Max-Age` alinhado a `expires_in` ou ao claim `exp` do JWT. Uma resposta `401` remove somente o cookie da sessão que realizou a chamada.

Payloads são lidos em streaming e rejeitados com `413 request_body_too_large` antes de serem encaminhados quando excedem os limites configurados.

## Container de produção

O `Dockerfile` usa build multi-stage e a saída standalone do Next.js:

```bash
docker build \
  --build-arg API_URL=http://backend:3000 \
  --build-arg APP_ORIGIN=https://app.seudominio.com \
  -t burnix-web .

docker run --rm -p 3000:3000 \
  -e API_URL=http://backend:3000 \
  -e APP_ORIGIN=https://app.seudominio.com \
  burnix-web
```

O container também valida as duas variáveis antes de iniciar o servidor.

## Validação

Sequência equivalente ao CI:

```bash
node --version
npm --version
npm list next react react-dom
npm ci
npm run typecheck
npm run lint
npm run test
npm run test:stage4
API_URL=http://127.0.0.1:3000 APP_ORIGIN=https://app.example.com npm run build
npm run test:bff
npm run test:e2e
```

`npm run test:bff` executa a aplicação com `next start` e valida sessões separadas, cookies com `Max-Age`, URLs canônicas, coleções do organizador, propagação de request ID e tratamento de redirects.

## Estrutura técnica

- `app/`: páginas, layouts e Route Handlers do BFF;
- `components/`: componentes de interface e formulários reutilizáveis;
- `hooks/`: integração entre React Query e serviços;
- `services/`: clientes HTTP e contrato com o BFF;
- `types/`: tipos retornados e aceitos pelo backend;
- `lib/`: regras utilitárias, sessão e comunicação server-side;
- `tests/unit/`: testes de componentes e utilitários;
- `tests/integration/`: contrato do proxy e helpers de integração;
- `tests/e2e/`: jornadas completas no navegador;
- `scripts/smoke-bff.mjs`: smoke test do build de produção.

## Licença

Consulte `LICENSE.md`.
