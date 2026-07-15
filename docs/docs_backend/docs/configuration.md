# Configuração

A configuração é carregada por `pydantic-settings` a partir de variáveis de ambiente e, localmente, do arquivo `.env`.

Regras gerais:

- nomes são case-sensitive;
- variáveis desconhecidas são ignoradas;
- listas usam JSON, por exemplo `BACKEND_CORS_ORIGINS=["https://app.exemplo.com"]`;
- o startup falha quando uma combinação obrigatória é inválida;
- segredos não devem ser versionados nem expostos ao frontend.

Arquivos de referência:

```text
.env.example
.env.staging.example
.env.production.example
```

## Aplicação

| Variável | Padrão | Descrição |
|---|---:|---|
| `APP_NAME` | `Burnix API` | Nome exibido no OpenAPI |
| `APP_ENV` | `development` | `development`, `test`, `staging` ou `production` |
| `DEBUG` | `false` | Modo debug do FastAPI; proibido em produção |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` ou `CRITICAL` |

## Banco de dados

| Variável | Padrão | Descrição |
|---|---:|---|
| `DATABASE_URL` | obrigatório | URL SQLAlchemy do banco |
| `DB_POOL_SIZE` | `5` | Conexões persistentes por processo; intervalo 1–100 |
| `DB_MAX_OVERFLOW` | `10` | Conexões extras por processo; intervalo 0–200 |
| `DB_POOL_TIMEOUT` | `30` | Segundos para aguardar uma conexão; intervalo 1–300 |
| `DB_POOL_RECYCLE` | `1800` | Reciclagem em segundos; 0 desativa, máximo 86400 |

As opções de pool não são aplicadas quando o backend da URL é SQLite.

Estimativa de teto de conexões:

```text
réplicas × workers × (DB_POOL_SIZE + DB_MAX_OVERFLOW)
```

## Autenticação e CORS

| Variável | Padrão | Descrição |
|---|---:|---|
| `SECRET_KEY` | obrigatório | Assina JWTs e chaves HMAC internas do rate limit |
| `ALGORITHM` | `HS256` | Algoritmo JWT aceito e emitido |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Expiração do token de organizador |
| `PARTICIPANT_ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Expiração do token de participante |
| `BACKEND_CORS_ORIGINS` | `[]` | Lista JSON de origins permitidos |

Em produção, `SECRET_KEY` deve ter pelo menos 32 caracteres aleatórios e não pode conter marcador de exemplo. `BACKEND_CORS_ORIGINS` não pode conter `*`.

## Limites de payload

| Variável | Padrão | Uso |
|---|---:|---|
| `REQUEST_BODY_DEFAULT_MAX_BYTES` | `1048576` | Demais POST, PUT e PATCH |
| `AUTH_REQUEST_MAX_BODY_BYTES` | `16384` | Login e cadastro |
| `REGISTRATION_REQUEST_MAX_BODY_BYTES` | `262144` | Criação de inscrição |
| `FORM_FIELD_REQUEST_MAX_BODY_BYTES` | `65536` | Campos de formulário |
| `OPENPIX_WEBHOOK_MAX_BODY_BYTES` | `1048576` | Webhook OpenPix |
| `REGISTRATION_EXTRA_FIELDS_MAX_ITEMS` | `100` | Quantidade máxima de chaves em `extra_fields` |
| `REGISTRATION_EXTRA_FIELDS_MAX_DEPTH` | `5` | Profundidade máxima de `extra_fields` |
| `REGISTRATION_EXTRA_FIELDS_MAX_BYTES` | `131072` | Tamanho JSON máximo de `extra_fields` |
| `FORM_FIELD_OPTIONS_MAX_BYTES` | `32768` | Tamanho máximo de `options` |
| `FORM_FIELD_VALIDATION_RULES_MAX_BYTES` | `16384` | Tamanho máximo de `validation_rules` |

## Redis e modo do rate limit

| Variável | Padrão | Descrição |
|---|---:|---|
| `REDIS_URL` | nulo | Obrigatória quando `RATE_LIMIT_ENABLED=true` |
| `RATE_LIMIT_ENABLED` | `false` | Ativa consumo de contadores |
| `RATE_LIMIT_MODE` | `observe` | `observe` registra excedentes; `enforce` bloqueia |
| `RATE_LIMIT_FAIL_OPEN` | `true` | Permite tráfego quando Redis falha |
| `RATE_LIMIT_KEY_PREFIX` | `burnix:rate-limit:v1` | Namespace das chaves Redis |
| `RATE_LIMIT_TRUSTED_PROXIES` | `[]` | Lista JSON de redes confiáveis |
| `RATE_LIMIT_REDIS_TIMEOUT_SECONDS` | `1.0` | Timeout de conexão e operação, máximo 10 s |

URLs Redis aceitas:

```text
redis://
rediss://
unix://
```

Configuração usual de staging:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=observe
RATE_LIMIT_FAIL_OPEN=true
```

Configuração usual de produção:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=enforce
RATE_LIMIT_FAIL_OPEN=false
```

## Limites de autenticação

| Variável | Padrão | Política |
|---|---:|---|
| `RATE_LIMIT_LOGIN_IP_LIMIT` | `10` | Login por IP |
| `RATE_LIMIT_LOGIN_EMAIL_LIMIT` | `5` | Login por IP + e-mail |
| `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | `600` | Janela de login |
| `RATE_LIMIT_REGISTER_IP_LIMIT` | `5` | Cadastros por IP |
| `RATE_LIMIT_REGISTER_WINDOW_SECONDS` | `3600` | Janela de cadastro |

As políticas são separadas entre organizador e participante pelo nome interno da regra.

## Limites de inscrição

| Variável | Padrão | Política |
|---|---:|---|
| `RATE_LIMIT_REGISTRATION_IP_LIMIT` | `20` | Criações por IP |
| `RATE_LIMIT_REGISTRATION_IP_WINDOW_SECONDS` | `3600` | Janela por IP |
| `RATE_LIMIT_REGISTRATION_PARTICIPANT_LIMIT` | `10` | Criações por participante |
| `RATE_LIMIT_REGISTRATION_PARTICIPANT_WINDOW_SECONDS` | `3600` | Janela por participante |
| `RATE_LIMIT_REGISTRATION_EVENT_LIMIT` | `3` | Tentativas por participante + evento |
| `RATE_LIMIT_REGISTRATION_EVENT_WINDOW_SECONDS` | `600` | Janela por participante + evento |

## Limites de pagamento

| Variável | Padrão | Política |
|---|---:|---|
| `RATE_LIMIT_PAYMENT_ATTEMPT_LIMIT` | `5` | Tentativas por inscrição ou por organizador + evento |
| `RATE_LIMIT_PAYMENT_ATTEMPT_WINDOW_SECONDS` | `600` | Janela de tentativa |
| `RATE_LIMIT_PAYMENT_IP_LIMIT` | `20` | Criações Pix por IP |
| `RATE_LIMIT_ORGANIZER_PAYMENT_CREATE_LIMIT` | `30` | Criações por organizador |
| `RATE_LIMIT_ORGANIZER_PAYMENT_CREATE_WINDOW_SECONDS` | `600` | Janela do organizador |
| `RATE_LIMIT_PAYMENT_QUERY_LIMIT` | `120` | Consultas financeiras por organizador |
| `RATE_LIMIT_PAYMENT_QUERY_WINDOW_SECONDS` | `60` | Janela de consulta |

## Limites de leitura pública e webhook

| Variável | Padrão | Política |
|---|---:|---|
| `RATE_LIMIT_PUBLIC_READ_LIMIT` | `120` | Leituras públicas por IP |
| `RATE_LIMIT_PUBLIC_GLOBAL_LIMIT` | `10000` | Leituras públicas globais |
| `RATE_LIMIT_PUBLIC_READ_WINDOW_SECONDS` | `60` | Janela de leitura pública |
| `RATE_LIMIT_WEBHOOK_IP_LIMIT` | `600` | Webhooks por IP |
| `RATE_LIMIT_WEBHOOK_GLOBAL_LIMIT` | `5000` | Webhooks globais |
| `RATE_LIMIT_WEBHOOK_WINDOW_SECONDS` | `60` | Janela do webhook |

## Job de encerramento

| Variável | Padrão | Descrição |
|---|---:|---|
| `EVENT_CLOSE_JOB_BATCH_SIZE` | `500` | Eventos processados por lote, intervalo 1–10000 |

## Pagamentos e OpenPix

| Variável | Padrão | Descrição |
|---|---:|---|
| `PAYMENT_PROVIDER` | `openpix` | Provedor ativo |
| `PAYMENT_PLATFORM_FEE_PERCENT` | `0.03` | Fração retida pela plataforma; mínimo 0 e menor que 1 |
| `OPENPIX_APP_ID` | nulo | Credencial privada da API OpenPix |
| `OPENPIX_BASE_URL` | sandbox | URL base oficial do ambiente |
| `OPENPIX_WEBHOOK_HMAC_SECRET` | nulo | Segredo do header HMAC legado |
| `OPENPIX_WEBHOOK_PUBLIC_KEY_BASE64` | nulo | Chave pública RSA em PEM ou PEM codificado em base64 |
| `OPENPIX_SETTLEMENT_MODE` | `split` | `split` ou `subaccount` |
| `OPENPIX_SPLIT_TYPE` | `SPLIT_SUB_ACCOUNT` | Tipo enviado na divisão da cobrança |

URLs oficiais reconhecidas:

```text
staging:    https://api.woovi-sandbox.com
production: https://api.openpix.com.br
```

Regras:

- `APP_ENV=staging` exige a URL de sandbox;
- `APP_ENV=production` exige a URL de produção;
- staging e produção exigem `OPENPIX_APP_ID`;
- staging e produção exigem HMAC ou chave pública RSA;
- placeholders são rejeitados;
- HMAC configurado precisa ter pelo menos 16 caracteres;
- a chave RSA precisa ser PEM válida;
- produção exige HTTPS;
- `OPENPIX_SETTLEMENT_MODE=subaccount` exige taxa da plataforma igual a zero.

## Variáveis legadas

Os campos abaixo permanecem no `Settings` por compatibilidade com scripts ou trechos antigos, mas não são centrais no fluxo atual:

```text
PAYMENT_WEBHOOK_URL
PAYMENT_SUCCESS_URL
PAYMENT_FAILURE_URL
PAYMENT_PENDING_URL
```

## Configuração mínima de desenvolvimento

```env
APP_ENV=development
DEBUG=false
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/burnix
SECRET_KEY=chave-local-com-mais-de-32-caracteres
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
RATE_LIMIT_ENABLED=false
OPENPIX_BASE_URL=https://api.woovi-sandbox.com
```

## Configuração mínima de produção

```env
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO
DATABASE_URL=postgresql+psycopg2://usuario:senha@host:5432/burnix
SECRET_KEY=<segredo-aleatorio>
BACKEND_CORS_ORIGINS=["https://app.seudominio.com"]

REDIS_URL=redis://redis:6379/0
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=enforce
RATE_LIMIT_FAIL_OPEN=false
RATE_LIMIT_TRUSTED_PROXIES=["<rede-real-do-proxy>"]

OPENPIX_APP_ID=<appid-de-producao>
OPENPIX_BASE_URL=https://api.openpix.com.br
OPENPIX_WEBHOOK_HMAC_SECRET=<segredo-do-webhook>
OPENPIX_SETTLEMENT_MODE=split
PAYMENT_PLATFORM_FEE_PERCENT=0.03
```

Segredos devem vir de secret manager ou mecanismo equivalente, nunca de arquivos incluídos na imagem.
