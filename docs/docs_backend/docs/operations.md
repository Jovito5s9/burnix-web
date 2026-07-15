# Operação do backend Burnix

## Escopo

Este documento descreve a operação da API depois das Etapas 7 e 8: pool de
banco configurável, logs JSON, `X-Request-ID`, limites de corpo, health checks,
rate limit com Redis, container de produção e procedimento de liberação.

## Processo e container

A imagem é construída pelo `Dockerfile` multi-stage e executa como usuário
não privilegiado (`uid=10001`). O diretório da aplicação é `/app` e o processo
não grava arquivos persistentes no filesystem do container.

Build:

```bash
docker build -t burnix-backend:<release> .
```

Execução mínima:

```bash
docker run --rm -p 8000:8000 \
  --env-file .env.production \
  --name burnix-backend \
  burnix-backend:<release>
```

O número de workers é controlado por `WEB_CONCURRENCY`. O pool SQLAlchemy é
criado por processo. A estimativa máxima de conexões é:

```text
réplicas × WEB_CONCURRENCY × (DB_POOL_SIZE + DB_MAX_OVERFLOW)
```

Esse total precisa caber no limite do PostgreSQL, reservando conexões para
migrations, jobs, administração e observabilidade.

## Pool SQLAlchemy

Variáveis:

```env
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
```

- `DB_POOL_SIZE`: conexões persistentes por worker.
- `DB_MAX_OVERFLOW`: conexões temporárias adicionais por worker.
- `DB_POOL_TIMEOUT`: segundos para aguardar uma conexão livre.
- `DB_POOL_RECYCLE`: recicla conexões antigas; `0` desabilita.
- `pool_pre_ping` permanece ativo para descartar conexões mortas.

Os parâmetros de fila não são aplicados ao SQLite, preservando testes locais.

## Request ID

Cada requisição recebe `X-Request-ID`:

- um valor recebido é preservado somente quando tem 1–128 caracteres seguros;
- valores ausentes ou inválidos são substituídos por UUID;
- o mesmo valor aparece na resposta;
- o BFF deve encaminhar o header recebido e registrar o header devolvido;
- chamadas OpenPix incluem `X-Request-ID` para correlação quando houver um
  request HTTP ativo.

Nunca use e-mail, documento, token ou AppID como request ID.

## Logs estruturados

Os logs são JSON, um objeto por linha, com:

```text
timestamp
level
logger
message
request_id
method
path
status
duration_ms
principal_type
principal_id
```

O caminho usa o template da rota, como `/contracts/{contract_id}`, evitando
cardinalidade alta. O principal pode ser `anonymous`, `organizer`, `participant`
ou `admin`. IDs internos podem ser registrados; e-mail, documento e tokens não.

O formatador sanitiza e-mails, JWTs, Bearer tokens e atribuições com nomes
sensíveis. Extras arbitrários não são serializados. O corpo retornado pela
OpenPix não entra em exceções, logs ou `payment.error_message`.

A saída de acesso do Uvicorn fica desabilitada para evitar uma segunda linha sem
as regras de privacidade da aplicação.

## Limites de payload

Limites padrão:

```env
REQUEST_BODY_DEFAULT_MAX_BYTES=1048576
AUTH_REQUEST_MAX_BODY_BYTES=16384
REGISTRATION_REQUEST_MAX_BODY_BYTES=262144
FORM_FIELD_REQUEST_MAX_BODY_BYTES=65536
OPENPIX_WEBHOOK_MAX_BODY_BYTES=1048576
```

O middleware valida `Content-Length` e também conta chunks quando o header não
existe. Ao exceder o limite, retorna:

```http
HTTP/1.1 413 Payload Too Large
X-Request-ID: <id>
```

```json
{
  "detail": {
    "code": "request_body_too_large",
    "message": "O corpo da solicitação excede o tamanho permitido.",
    "max_body_bytes": 16384
  }
}
```

Campos dinâmicos possuem limites adicionais:

```env
REGISTRATION_EXTRA_FIELDS_MAX_ITEMS=100
REGISTRATION_EXTRA_FIELDS_MAX_DEPTH=5
REGISTRATION_EXTRA_FIELDS_MAX_BYTES=131072
FORM_FIELD_OPTIONS_MAX_BYTES=32768
FORM_FIELD_VALIDATION_RULES_MAX_BYTES=16384
```

O webhook mantém validação de assinatura, idempotência e rate limit próprios.

## Health checks

### `GET /ping`

Liveness. Não consulta dependências:

```json
{"status":"alive"}
```

Use para saber se o processo está executando. Não use como readiness.

### `GET /db-check`

Diagnóstico simples do PostgreSQL com `SELECT 1`:

```json
{"status":"ok"}
```

### `GET /ready`

Readiness para receber tráfego. Verifica banco e Redis quando o rate limit está
ativo.

Saudável:

```json
{
  "status": "ready",
  "components": {"database": "ok", "redis": "ok"}
}
```

Redis desligado:

```json
{
  "status": "ready",
  "components": {"database": "ok", "redis": "disabled"}
}
```

Com `RATE_LIMIT_FAIL_OPEN=true`, Redis indisponível gera `200` e estado
`degraded`. Com fail-closed, banco indisponível ou Redis indisponível gera
`503 service_not_ready`.

O `HEALTHCHECK` da imagem usa `/ready`.

## Proxies

O container inicia Uvicorn com `--no-proxy-headers`. Assim, a aplicação recebe o
peer real e decide se pode confiar em `X-Forwarded-For` usando
`RATE_LIMIT_TRUSTED_PROXIES`.

Cadastre apenas redes controladas. Nunca use `0.0.0.0/0` ou `::/0`.

## Migrations e jobs

Migrations não são executadas automaticamente no startup. Execute uma única vez
por release:

```bash
alembic current
alembic heads
alembic upgrade head
```

O job de encerramento continua externo aos workers HTTP:

```bash
python -m app.jobs.close_finished_events
```

Agende a cada 1–5 minutos e monitore status, duração e `closed_count`.

## Sinais para alertas

Crie alertas para:

- `/ready` retornando `503`;
- crescimento de respostas `500`, `502`, `503` ou `429`;
- timeout do pool do banco;
- Redis indisponível em produção;
- falhas repetidas da OpenPix;
- job de encerramento sem execução ou com erro;
- migrations fora do head;
- reinícios frequentes do container.

## Resposta a incidentes

1. obtenha o `X-Request-ID` reportado;
2. pesquise a mesma chave nos logs do BFF e backend;
3. confirme `/ping`, `/ready` e `/db-check`;
4. confirme disponibilidade do Redis e PostgreSQL;
5. não copie payloads, JWTs, AppID ou documentos para tickets;
6. preserve logs e métricas antes de reiniciar;
7. prefira correção forward quando migrations já receberam dados novos.
