# Rate limit

## Arquitetura

O rate limit usa Redis com contadores de janela fixa e script Lua atômico. Todos os workers e réplicas compartilham o mesmo estado.

Arquivos centrais:

```text
app/core/rate_limit.py
app/core/client_ip.py
```

O backend em memória existe somente para testes determinísticos e nunca é selecionado pela configuração normal da aplicação.

## Modos

### Desligado

```env
RATE_LIMIT_ENABLED=false
```

Nenhum contador é consumido.

### Observação

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=observe
```

Contadores são consumidos e excedentes são registrados, mas a requisição continua.

### Bloqueio

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=enforce
```

Excedentes retornam `429`.

## Chaves e privacidade

A chave Redis possui o formato lógico:

```text
{prefix}:{app_env}:{rule_name}:{digest}
```

O digest é HMAC-SHA256 com `SECRET_KEY` sobre os identificadores normalizados. IP, e-mail, participante e inscrição não são armazenados diretamente na chave.

Ambientes diferentes não compartilham buckets porque `APP_ENV` faz parte do namespace.

## Identificação do IP

O IP direto da conexão é a fonte padrão. Headers encaminhados somente são usados quando o peer pertence a `RATE_LIMIT_TRUSTED_PROXIES`.

A cadeia `X-Forwarded-For` é avaliada da direita para a esquerda. Endereços inválidos fazem a aplicação ignorar a cadeia, impedindo que um cliente escolha livremente o bucket.

## Políticas padrão

### Autenticação

| Regra | Limite | Janela |
|---|---:|---:|
| Login por IP | 10 | 10 min |
| Login por IP + e-mail | 5 | 10 min |
| Cadastro por IP | 5 | 1 h |

Organizador e participante usam namespaces de regra separados.

### Inscrição

| Regra | Limite | Janela |
|---|---:|---:|
| Criação por IP | 20 | 1 h |
| Criação por participante | 10 | 1 h |
| Participante + evento | 3 | 10 min |

A constraint única e os locks transacionais continuam sendo as garantias de integridade. Rate limit não substitui essas regras.

### Pagamento

| Regra | Limite | Janela |
|---|---:|---:|
| Participante + inscrição | 5 | 10 min |
| Criação por IP | 20 | 10 min |
| Criação por organizador | 30 | 10 min |
| Organizador + evento | 5 | 10 min |
| Consulta financeira por organizador | 120 | 1 min |

Idempotência e máquina de estados continuam obrigatórias.

### Leitura pública

| Regra | Limite | Janela |
|---|---:|---:|
| Por IP | 120 | 1 min |
| Global | 10000 | 1 min |

O bucket global atua como proteção de emergência da aplicação. CDN ou proxy de borda pode adicionar uma camada anterior.

### Webhook OpenPix

| Regra | Limite | Janela |
|---|---:|---:|
| Por IP | 600 | 1 min |
| Global | 5000 | 1 min |

O webhook possui limites altos e separados para reduzir risco de bloquear retentativas legítimas do provedor.

## Resposta de bloqueio

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-Request-ID: ...
```

```json
{
  "detail": {
    "code": "rate_limit_exceeded",
    "message": "Muitas tentativas. Aguarde um momento e tente novamente.",
    "retry_after_seconds": 60
  }
}
```

Quando várias regras são excedidas, `Retry-After` usa o maior TTL restante.

## Falha do Redis

### Fail-open

```env
RATE_LIMIT_FAIL_OPEN=true
```

A requisição continua quando Redis falha. O incidente é registrado.

No `/ready`, Redis indisponível resulta em:

```json
{
  "status": "degraded",
  "components": {
    "database": "ok",
    "redis": "unavailable"
  }
}
```

com status HTTP 200.

### Fail-closed

```env
RATE_LIMIT_FAIL_OPEN=false
```

Falha durante uma verificação retorna:

```text
503 rate_limit_backend_unavailable
```

O `/ready` retorna `503 service_not_ready` quando Redis não responde.

## Inicialização

Quando o rate limit está ativo:

- `REDIS_URL` é obrigatória;
- a URL precisa usar `redis://`, `rediss://` ou `unix://`;
- a aplicação testa a conexão no lifespan;
- em fail-closed, falha de conexão impede a aplicação de ficar pronta.

## Operação

Métricas mínimas a acompanhar:

- volume por regra;
- percentual bloqueado;
- `Retry-After` médio e máximo;
- latência do Redis;
- falhas de conexão;
- cardinalidade e uso de memória;
- diferença entre staging e produção.

Ajustes de limite devem ser feitos por variável de ambiente e validados primeiro em `observe`.

## Teste com Redis real

```bash
docker compose -f docker-compose.test.yml up -d redis-test
export TEST_REDIS_URL=redis://127.0.0.1:56379/15
pytest tests/integration/test_rate_limits.py -q
```

O teste integrado confirma que instâncias independentes compartilham o mesmo contador.
