# Arquitetura

## Escopo do sistema

O Burnix Backend é uma API síncrona FastAPI responsável por:

- autenticar organizadores e participantes;
- aplicar isolamento multi-tenant;
- manter eventos e formulários de inscrição;
- criar e consultar inscrições;
- gerar cobranças Pix e processar webhooks OpenPix;
- expor dados administrativos e exportações CSV;
- executar tarefas operacionais de encerramento de eventos;
- aplicar controles de segurança, rate limit e observabilidade.

## Componentes

```text
Cliente web ou BFF
        |
        | HTTPS + JSON + Bearer JWT
        v
FastAPI / Uvicorn
  |-- middleware de request ID e log de acesso
  |-- middleware de limite de payload
  |-- CORS
  |-- dependências de autenticação e autorização
  |-- dependências de rate limit
  |-- routers HTTP
  |-- serviços de domínio
        |
        +---- PostgreSQL
        |
        +---- Redis
        |
        +---- OpenPix/Woovi
```

### Camada HTTP

Arquivos principais:

```text
app/main.py
app/api/router.py
app/api/routes/*.py
app/api/deps.py
app/schemas/*.py
```

Responsabilidades:

- validar parâmetros, headers e corpos com Pydantic;
- resolver identidade autenticada;
- aplicar rate limit por contexto;
- transformar falhas em contratos HTTP estáveis;
- delegar regras de negócio aos serviços;
- serializar respostas públicas, de organizador e administrativas.

### Camada de domínio

Arquivos principais:

```text
app/services/contracts.py
app/services/registrations.py
app/services/participant_registrations.py
app/services/payments.py
app/services/payment_state_machine.py
app/services/openpix.py
app/services/openpix_billing.py
app/services/form_validation.py
```

Responsabilidades:

- validar estado e transições dos eventos;
- normalizar datas e timezones;
- controlar concorrência de edição e capacidade;
- criar inscrições de forma transacional;
- gerenciar tentativas e transições de pagamento;
- encapsular a comunicação com OpenPix;
- validar respostas de formulários configuráveis.

### Persistência

Arquivos principais:

```text
app/models/*.py
app/db/session.py
app/db/base.py
migrations/versions/*.py
```

A persistência usa SQLAlchemy ORM com sessões síncronas e PostgreSQL em produção. O pool é configurado por processo. Migrations são aplicadas com Alembic antes da promoção do código.

### Redis e rate limit

Arquivos principais:

```text
app/core/rate_limit.py
app/core/client_ip.py
```

O Redis armazena contadores de janela fixa compartilhados por todos os workers e réplicas. As chaves usam HMAC-SHA256 e não armazenam diretamente e-mail, IP ou identificadores de usuário.

### Observabilidade e proteção de entrada

Arquivos principais:

```text
app/middleware/request_context.py
app/core/logging.py
app/core/payload_limits.py
```

A aplicação:

- aceita ou gera `X-Request-ID`;
- registra um log JSON por requisição;
- normaliza paths dinâmicos;
- associa principal autenticado ao contexto;
- limita o corpo antes da desserialização;
- remove tokens, e-mails e outros valores sensíveis dos logs.

### Jobs externos

```text
app/jobs/close_finished_events.py
scripts/run_scheduled_jobs.py
```

O encerramento automático não roda dentro dos workers HTTP. Um scheduler externo executa o job, evitando múltiplos schedulers concorrentes por réplica.

## Modelo multi-tenant

`User` representa o organizador e também a fronteira do tenant.

Recursos de organizador possuem `owner_user_id`:

```text
BillingProfile
Contract
Client
Payment
```

Consultas comuns passam por helpers de `app/core/permissions.py`:

- usuários comuns recebem filtro por `owner_user_id`;
- roles `admin`, `superuser` e `super_user` podem consultar escopo global;
- recursos de outro organizador normalmente aparecem como `404`, reduzindo enumeração de IDs.

`Participant` não é tenant. Ele representa a pessoa que pode acessar suas próprias inscrições em eventos de diferentes organizadores.

## Fronteiras de identidade

Existem dois tipos de JWT:

```text
token_kind=organizer
token_kind=participant
```

Dependências distintas validam cada tipo:

```text
get_current_active_user
authenticação de organizador

get_current_active_participant
autenticação de participante
```

Um token de participante não é aceito em rotas de organizador, mesmo quando os IDs numéricos coincidirem. Tokens sem `token_kind` também são rejeitados.

## Fluxos principais

### Gestão de evento

```text
Organizador autentica
  -> cria evento em draft
  -> configura formulário
  -> configura perfil financeiro/subconta, quando o evento é pago
  -> publica com version atual
  -> acompanha inscrições e pagamentos
  -> encerra, cancela ou permite encerramento automático
```

### Inscrição

```text
Visitante consulta evento público
  -> backend calcula disponibilidade com server_time
  -> participante autentica
  -> cria inscrição
  -> transação bloqueia evento
  -> verifica status, prazo, capacidade e duplicidade
  -> evento gratuito confirma imediatamente
  -> evento pago mantém pending_payment
```

### Pagamento

```text
Participante solicita Pix da própria inscrição
  -> backend bloqueia evento e inscrição
  -> reutiliza tentativa pending ou cria nova tentativa
  -> calcula taxa e split
  -> cria cobrança OpenPix
  -> persiste snapshot financeiro
  -> webhook assinado atualiza pagamento e inscrição de forma idempotente
```

## Concorrência

### Eventos

`Contract.version` é usado pelo SQLAlchemy como coluna de optimistic locking. Toda alteração exige a versão conhecida pelo cliente. Atualizações concorrentes retornam `409 event_version_conflict`.

### Inscrições

A criação bloqueia a linha do evento com `SELECT ... FOR UPDATE`. Na mesma transação são verificadas:

- disponibilidade;
- capacidade;
- duplicidade por participante e evento;
- inserção da inscrição.

O banco também possui constraint única em `(participant_id, contract_id)`.

### Pagamentos

A criação de cobrança bloqueia evento e inscrição. O banco garante:

- `correlation_id` único;
- `external_reference` único;
- `attempt_number` único por inscrição;
- no máximo uma tentativa `pending` por inscrição.

## Contratos públicos e internos

A API possui três visões de dados:

- **organizador:** dados completos do próprio tenant;
- **participante:** somente suas inscrições e uma visão reduzida dos pagamentos;
- **pública:** evento, disponibilidade e campos ativos do formulário, sem dados financeiros internos ou PII de outras pessoas.

A resposta pública de pagamento omite payload bruto do gateway, documentos internos, split detalhado e mensagens técnicas.

## Integrações externas

### PostgreSQL

Fonte de verdade transacional para identidade, eventos, inscrições, perfis de cobrança e pagamentos.

### Redis

Dependência operacional do rate limit quando `RATE_LIMIT_ENABLED=true`. Em `enforce` com `RATE_LIMIT_FAIL_OPEN=false`, indisponibilidade do Redis impede readiness e pode retornar `503`.

### OpenPix/Woovi

Usada para:

- criar ou sincronizar subconta do organizador;
- criar cobrança Pix;
- obter QR Code e código copia e cola;
- receber eventos por webhook assinado.

Credenciais OpenPix permanecem exclusivamente no backend.

## API e versionamento

As rotas são atualmente publicadas sem prefixo de versão. A aplicação declara `0.6.0` no OpenAPI. O versionamento futuro deve usar prefixos explícitos e coexistentes, como `/api/v1` e `/api/v2`, quando houver mudanças incompatíveis.
