# Autenticação, autorização e segurança

## Autenticação JWT

O backend usa JWT assinado com `SECRET_KEY` e o algoritmo configurado em `ALGORITHM`, cujo padrão é `HS256`.

Claims emitidos:

```json
{
  "sub": "123",
  "token_kind": "organizer",
  "iat": "...",
  "exp": "...",
  "role": "contractor"
}
```

Tokens de participante usam `token_kind=participant` e não incluem role administrativa.

Tempos padrão:

| Token | Variável | Padrão |
|---|---|---:|
| Organizador | `ACCESS_TOKEN_EXPIRE_MINUTES` | 60 minutos |
| Participante | `PARTICIPANT_ACCESS_TOKEN_EXPIRE_MINUTES` | 60 minutos |

A API não implementa refresh token, revogação centralizada ou rotação automática de JWT.

## Armazenamento de senhas

Senhas são processadas por `pwdlib.PasswordHash.recommended()`. O valor persistido é somente o hash.

Requisitos mínimos expostos pelos schemas:

- cadastro de organizador: 8 a 256 caracteres;
- cadastro de participante: 8 a 256 caracteres.

## Separação de identidades

Organizadores e participantes usam tabelas, endpoints e dependências diferentes.

| Identidade | Cadastro/login | Dependência protegida |
|---|---|---|
| Organizador | `/auth/register`, `/auth/login` | `get_current_active_user` |
| Participante | `/participant-auth/register`, `/participant-auth/login` | `get_current_active_participant` |

Um token com tipo incorreto retorna `401`, mesmo quando o `sub` aponta para um ID existente na outra tabela.

## Autorização multi-tenant

Recursos de organizador são isolados por `owner_user_id`.

Regras:

- organizador comum consulta somente seus dados;
- roles administrativas podem consultar escopo global;
- busca de recurso fora do escopo normalmente retorna `404`;
- inscrições de participante são consultadas por `participant_id` e nunca somente pelo ID da inscrição;
- pagamento de participante exige que a inscrição pertença ao participante autenticado.

Arquivos centrais:

```text
app/core/permissions.py
app/api/deps.py
```

## CORS

`BACKEND_CORS_ORIGINS` recebe uma lista JSON de origins permitidos.

Exemplo:

```env
BACKEND_CORS_ORIGINS=["https://app.exemplo.com"]
```

Em produção:

- `*` é rejeitado no startup;
- credenciais são permitidas;
- todos os métodos e headers são aceitos para origins autorizados;
- `X-Request-ID` e `Retry-After` são expostos ao navegador.

## Request ID

O middleware aceita `X-Request-ID` quando o valor:

- começa com caractere alfanumérico;
- contém apenas letras, números, `.`, `_`, `:`, `-`;
- possui no máximo 128 caracteres.

Valores ausentes ou inválidos são substituídos por UUID.

O mesmo ID aparece:

- na resposta HTTP;
- no log de acesso;
- no contexto dos logs internos;
- nas chamadas OpenPix feitas durante a requisição.

O BFF deve encaminhar o header ao backend e registrar o valor retornado.

## Logs estruturados

O formatter emite JSON para stdout.

Campos básicos:

```text
timestamp
level
logger
message
request_id
method
path
principal_type
principal_id
status
duration_ms
```

Campos extras aceitos são limitados por allowlist, por exemplo:

```text
payment_id
registration_id
event_id
contract_id
owner_user_id
billing_profile_id
attempt_number
correlation_id
provider_status
retryable
retry_after_seconds
closed_count
```

### Sanitização

O log remove ou mascara:

- e-mails;
- JWTs;
- headers Bearer;
- senhas em URLs;
- atribuições contendo `password`, `authorization`, `app_id`, `secret`, `token`, `document`, `cpf`, `cnpj` ou `pix_key`.

O backend não registra deliberadamente:

- corpo bruto de login ou cadastro;
- AppID OpenPix;
- segredo HMAC;
- chave privada;
- payload bruto de pagamento em logs;
- resposta bruta do provedor em erros 5xx.

`payments.raw_payload` existe para auditoria de domínio no banco e deve ser protegido por controle de acesso e política de retenção.

## Proxies e IP do cliente

A aplicação não confia cegamente em `X-Forwarded-For`.

Fluxo:

1. usa o IP da conexão direta;
2. verifica se esse peer pertence a `RATE_LIMIT_TRUSTED_PROXIES`;
3. somente então interpreta `X-Forwarded-For` ou `X-Real-IP`;
4. percorre a cadeia de proxies confiáveis da direita para a esquerda;
5. normaliza IPv4, IPv6 e IPv4 mapeado em IPv6;
6. ignora a cadeia se houver endereço inválido.

A lista de proxies precisa conter apenas redes realmente controladas. Redes universais como `0.0.0.0/0` e `::/0` são rejeitadas.

O Dockerfile inicia Uvicorn com `--no-proxy-headers`. A validação dos headers encaminhados permanece sob controle da aplicação.

## Limites de payload

O middleware limita o corpo antes da desserialização, incluindo requests transferidos em chunks.

Categorias:

| Categoria | Rotas | Variável |
|---|---|---|
| Autenticação | logins e cadastros | `AUTH_REQUEST_MAX_BODY_BYTES` |
| Inscrição | criação autenticada | `REGISTRATION_REQUEST_MAX_BODY_BYTES` |
| Campo de formulário | criação e edição | `FORM_FIELD_REQUEST_MAX_BODY_BYTES` |
| Webhook | OpenPix | `OPENPIX_WEBHOOK_MAX_BODY_BYTES` |
| Demais mutações | padrão | `REQUEST_BODY_DEFAULT_MAX_BYTES` |

Estruturas dinâmicas também possuem limites de quantidade, profundidade e tamanho serializado.

Corpo excessivo retorna `413 request_body_too_large`.

## Segurança do webhook OpenPix

São aceitos mecanismos independentes:

- HMAC-SHA1/base64 pelo header `X-OpenPix-Signature`;
- RSA-SHA256 pelo header `x-webhook-signature`.

Em staging e produção, ao menos um mecanismo precisa estar configurado para a aplicação iniciar.

O processamento segue esta ordem:

1. rate limit próprio do webhook;
2. validação do tamanho declarado;
3. confirmação de configuração de segurança;
4. leitura incremental do corpo;
5. verificação da assinatura;
6. desserialização e resolução da cobrança;
7. transição idempotente do pagamento.

Assinatura ausente ou inválida retorna `401 invalid_webhook_signature`.

## Configuração obrigatória de produção

O validator de startup exige:

- `APP_ENV=production`;
- `DEBUG=false`;
- `SECRET_KEY` aleatória com pelo menos 32 caracteres;
- CORS sem `*`;
- `OPENPIX_BASE_URL=https://api.openpix.com.br`;
- `OPENPIX_APP_ID` sem placeholder;
- HMAC ou chave pública de webhook;
- HTTPS na URL OpenPix;
- Redis configurado quando o rate limit está ativo.

## Dados pessoais e retenção

O banco armazena e-mail, telefone, documento, nome e dados de pagamento. O código aplica isolamento de acesso, mas não implementa automaticamente:

- política de retenção;
- anonimização por prazo;
- exclusão vinculada a solicitação do titular;
- trilha de consentimento;
- classificação de finalidade de tratamento.

Essas políticas precisam ser definidas na operação e refletidas em rotinas futuras de dados.
