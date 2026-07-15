# Checklist de produção

## Artefato

- [ ] Commit e digest da imagem identificados.
- [ ] Build executado com Python 3.13.14.
- [ ] Dependências instaladas a partir de `requirements.txt` fixado.
- [ ] `pip check` sem inconsistências.
- [ ] Imagem executa como usuário não privilegiado.
- [ ] Nenhum arquivo `.env`, dump, cache ou credencial está na imagem.

## Qualidade e testes

- [ ] `compileall` aprovado.
- [ ] `ruff check` aprovado.
- [ ] `ruff format --check` aprovado.
- [ ] suíte `not sandbox` aprovada com PostgreSQL e Redis reais.
- [ ] um único head Alembic.
- [ ] migrations aplicadas em banco limpo e em cópia representativa de produção.
- [ ] imagem Docker construída no CI.
- [ ] smoke test do container aprovado.

## Regressões obrigatórias

- [ ] coleções canônicas não retornam `307`.
- [ ] aliases `/contracts/` e `/payments/` respondem sem redirect e não aparecem no OpenAPI.
- [ ] demais variantes com barra final retornam `404` sem `Location`.
- [ ] token de participante não acessa rota de organizador.
- [ ] token de organizador não acessa rota de participante.
- [ ] ownership bloqueia acesso entre organizadores.
- [ ] transições válidas e inválidas de evento estão cobertas.
- [ ] publicação incompleta é rejeitada.
- [ ] conflito de `version` retorna `409 event_version_conflict`.
- [ ] capacidade abaixo das inscrições é rejeitada.
- [ ] prazo e capacidade fecham inscrições.
- [ ] criação concorrente não excede a capacidade.
- [ ] job de encerramento é idempotente.
- [ ] pagamentos reutilizam tentativa pendente.
- [ ] webhook repetido não duplica efeitos.
- [ ] evento gratuito não cria pagamento.
- [ ] `429` contém `Retry-After`.
- [ ] proxy header falsificado não altera a identidade do IP.
- [ ] payload excessivo retorna `413`.
- [ ] logs não expõem JWT, senha, documento, AppID ou segredo.
- [ ] `X-Request-ID` é preservado ou gerado.
- [ ] `/ready` verifica banco e Redis.

## Banco de dados

- [ ] backup criado e listado com `pg_restore --list`.
- [ ] restauração foi testada dentro da política operacional.
- [ ] scripts de pré-validação executados quando aplicáveis.
- [ ] `alembic heads` mostra apenas `f7a1c2d3e4b5`.
- [ ] `alembic current` mostra o head após upgrade.
- [ ] número máximo de conexões foi calculado.
- [ ] usuário da aplicação possui somente privilégios necessários.
- [ ] TLS e criptografia de armazenamento estão ativos.
- [ ] retenção de backups está definida.

## Configuração da aplicação

- [ ] `APP_ENV=production`.
- [ ] `DEBUG=false`.
- [ ] `LOG_LEVEL` aprovado.
- [ ] `SECRET_KEY` aleatória e armazenada em secret manager.
- [ ] `BACKEND_CORS_ORIGINS` contém somente origins reais.
- [ ] `DATABASE_URL` e `REDIS_URL` estão em secret manager.
- [ ] `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` e workers são compatíveis com PostgreSQL.
- [ ] limites de payload foram revisados.
- [ ] `WEB_CONCURRENCY` está definido.

## Rate limit e proxy

- [ ] `RATE_LIMIT_ENABLED=true`.
- [ ] `RATE_LIMIT_MODE=enforce`.
- [ ] decisão de `RATE_LIMIT_FAIL_OPEN` está registrada.
- [ ] `RATE_LIMIT_TRUSTED_PROXIES` contém somente redes controladas.
- [ ] Redis responde ao health check.
- [ ] limites foram observados em staging.
- [ ] proxy preserva `X-Request-ID`.
- [ ] proxy adiciona `X-Forwarded-For` de forma controlada.
- [ ] Uvicorn permanece com `--no-proxy-headers` enquanto a aplicação validar a cadeia.

## OpenPix

- [ ] `OPENPIX_BASE_URL=https://api.openpix.com.br`.
- [ ] AppID de produção é diferente do sandbox.
- [ ] HMAC ou chave pública RSA está configurada.
- [ ] segredo não está exposto ao frontend.
- [ ] subconta de um organizador de teste está ativa.
- [ ] cobrança controlada foi criada.
- [ ] webhook assinado foi processado.
- [ ] reenvio do mesmo webhook foi idempotente.
- [ ] resposta pública não expõe dados internos.

## Infraestrutura

- [ ] HTTPS ativo.
- [ ] balanceador consulta `/ready`.
- [ ] liveness consulta `/ping`.
- [ ] logs JSON estão centralizados.
- [ ] alertas de `5xx`, readiness, banco, Redis e OpenPix estão ativos.
- [ ] métricas de latência p50/p95/p99 estão disponíveis.
- [ ] limites de CPU e memória estão definidos.
- [ ] política de reinício está configurada.
- [ ] scheduler externo do encerramento está ativo.
- [ ] scheduler impede concorrência desnecessária.

## Staging

- [ ] usa a mesma imagem de produção.
- [ ] usa PostgreSQL e Redis reais.
- [ ] usa OpenPix sandbox com credenciais exclusivas.
- [ ] migrations aplicadas.
- [ ] `/ping`, `/db-check` e `/ready` aprovados.
- [ ] fluxo completo de organizador aprovado.
- [ ] fluxo completo de participante aprovado.
- [ ] publicação, fechamento, cancelamento e reabertura validados.
- [ ] prazo, capacidade e encerramento automático validados.
- [ ] respostas `413` e `429` validadas.

## Deploy

- [ ] backup concluído.
- [ ] migration aplicada uma única vez.
- [ ] canário ficou ready.
- [ ] smoke autenticado aprovado.
- [ ] tráfego liberado progressivamente.
- [ ] frontend/BFF compatível foi promovido.
- [ ] scheduler confirmado.
- [ ] janela de observação pós-deploy iniciada.

## Pós-deploy

- [ ] taxa de `2xx`, `4xx`, `429` e `5xx` dentro do esperado.
- [ ] latência sem regressão relevante.
- [ ] pool PostgreSQL sem espera excessiva.
- [ ] Redis sem falhas ou eviction anormal.
- [ ] OpenPix sem aumento de erros.
- [ ] job de encerramento executando e retornando contagens coerentes.
- [ ] logs sem PII ou segredos.
- [ ] nenhum evento pago foi confirmado sem inscrição correspondente.

## Bloqueadores de liberação

Interrompa a promoção quando houver:

```text
backup inválido
mais de um head Alembic
migration incompleta
/ready em 503
pool esgotado
Redis indisponível em fail-closed
webhook sem assinatura
idempotência quebrada
ownership quebrado
logs com segredo ou PII
coleções retornando 3xx
pagamento paid sem inscrição confirmada
evento excedendo capacidade
```
