# Burnix Web

Frontend Next.js do Burnix, plataforma SaaS multi-organizador para eventos,
inscrições e pagamentos Pix/OpenPix.

Esta versão implementa a **Etapa 1 do frontend: separação e proteção da sessão
do participante**, alinhada ao backend Burnix `0.6.0` e às rotas autenticadas em
`/participant/*`.

## Estado atual

### Sessões separadas

O frontend mantém duas sessões independentes:

```text
Organizador  -> cookie burnix.access_token
Participante -> cookie burnix.participant_access_token
```

Os dois cookies são criados por Route Handlers do Next.js e usam:

```text
HttpOnly
SameSite=Lax
Path=/
Secure em produção
```

O JWT não é salvo em `localStorage`, não é criado por JavaScript e não é
devolvido pelas respostas do BFF ao navegador.

### BFF do Next.js

O navegador chama somente endpoints do próprio frontend:

```text
POST /api/session/organizer/login
POST /api/session/participant/login
POST /api/session/participant/register
POST /api/session/logout

/api/backend/organizer/*
/api/backend/participant/*
/api/backend/public/*
```

Os Route Handlers leem o cookie `HttpOnly` correto no servidor e acrescentam o
header `Authorization: Bearer ...` somente na chamada ao backend FastAPI.

O BFF também:

- bloqueia a troca de categoria de sessão;
- não permite obter o token bruto pelas rotas proxy;
- restringe os paths disponíveis para cada categoria;
- rejeita mutações com origem diferente da aplicação;
- remove o cookie correspondente quando o backend retorna `401`;
- preserva respostas JSON, CSV e erros estruturados do backend;
- devolve erro público controlado quando o backend está indisponível.

### Fluxo do participante

Rotas de interface:

```text
/participante/entrar
/participante/cadastro
/eventos/{contract_id}
```

Fluxo de inscrição:

```text
1. GET /public/contracts/{contract_id}
2. Evento continua visível sem autenticação.
3. Ao clicar em “Inscrever-se”, o frontend verifica a sessão do participante.
4. Sem sessão, redireciona para:
   /participante/entrar?next=/eventos/{contract_id}
5. Após login ou cadastro, retorna ao evento.
6. POST /participant/contracts/{contract_id}/registrations
7. Para evento pago:
   POST /participant/registrations/{registration_id}/payments/pix
```

O payload da inscrição contém somente dados permitidos pelo backend:

```json
{
  "name": "Pessoa Participante",
  "phone": "+5591999999999",
  "document": "00000000000",
  "sex": null,
  "age": null,
  "extra_fields": {}
}
```

O frontend **não envia**:

```text
participant_id
email
owner_user_id
```

Esses valores são derivados pelo backend a partir do JWT do participante e do
evento solicitado.

Eventos gratuitos são confirmados sem tentativa de cobrança. Eventos pagos
recebem a resposta pública reduzida, sem PII ou payload interno da OpenPix.

### Sessão do organizador

O login do organizador também foi migrado para o BFF:

```text
POST /api/session/organizer/login
  -> backend POST /auth/login
  -> cookie HttpOnly burnix.access_token
```

As chamadas do painel continuam usando as mesmas funções de serviço, mas agora
passam por `/api/backend/organizer/*`. O navegador não lê nem monta o Bearer
token.

### Proteção de páginas

O arquivo depreciado `middleware.ts` foi substituído por `proxy.ts`.

Proteção atual:

```text
/dashboard/*
/contracts/*
/payments/*
/settings/*
/admin/*
  -> exige burnix.access_token

/participante/minhas-inscricoes/*
  -> reservado para a sessão burnix.participant_access_token
```

A página pública `/eventos/*` permanece sem bloqueio de navegação.

## Rotas do backend consumidas

### Públicas

```text
GET /public/contracts/{contract_id}
```

### Autenticação do organizador

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Autenticação do participante

```text
POST /participant-auth/register
POST /participant-auth/login
GET  /participant-auth/me
```

### Área do participante

```text
GET  /participant/registrations
GET  /participant/registrations/{registration_id}
POST /participant/contracts/{contract_id}/registrations
POST /participant/registrations/{registration_id}/payments/pix
```

### Painel do organizador

O projeto também mantém os serviços existentes para eventos, inscrições,
pagamentos, campos dinâmicos, perfil financeiro, integrações, exportações e
administração global.

A geração manual de Pix pelo organizador usa:

```text
POST /payments/contracts/{contract_id}/pix
```

com `client_id` no corpo. O frontend vigente não usa mais as rotas públicas
legadas de inscrição e pagamento por `client_id`.

## Estrutura relevante

```text
app/
├── (auth)/
├── (dashboard)/
├── (participant-auth)/participante/
│   ├── entrar/page.tsx
│   └── cadastro/page.tsx
├── api/
│   ├── backend/[session]/[...path]/route.ts
│   └── session/
│       ├── organizer/login/route.ts
│       ├── participant/login/route.ts
│       ├── participant/register/route.ts
│       └── logout/route.ts
└── eventos/[id]/

hooks/
├── useAuth.ts
└── useParticipantAuth.ts

services/
├── api.ts
├── auth.ts
├── participant-api.ts
└── participant-auth.ts

types/
├── participant.ts
└── participant-auth.ts

lib/server/
├── backend.ts
└── session.ts

proxy.ts
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
API_URL=http://localhost:8000
# APP_ORIGIN=https://app.seudominio.com
```

### `API_URL`

URL privada usada pelo servidor Next.js para acessar o backend FastAPI.

Em produção, prefira uma URL interna da infraestrutura. Não é necessário expor
a URL do backend ao bundle do navegador.

### `APP_ORIGIN`

Opcional. Origem pública canônica usada como origem confiável adicional nas
mutações do BFF, especialmente em ambientes com proxy reverso.

Exemplo:

```env
APP_ORIGIN=https://app.seudominio.com
```

Em produção, a aplicação deve ser servida por HTTPS para que cookies com
`Secure` sejam enviados pelo navegador.

## Instalação

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Aplicação local:

```text
http://localhost:3000
```

## Validações

```bash
npm run lint
npm run typecheck
npm run build
npm run test:bff
```

`test:bff` deve ser executado depois do build. Ele inicia um backend simulado e
uma instância de produção do Next.js para verificar:

- cookie separado de participante;
- cookie separado de organizador;
- atributos `HttpOnly`, `Secure`, `SameSite=Lax` e `Path=/`;
- ausência do JWT nas respostas ao navegador;
- Bearer aplicado somente no servidor;
- bloqueio de rota de outra categoria de sessão;
- redirecionamento do dashboard quando existe apenas sessão de participante;
- inscrição sem `participant_id` e sem `email` no payload;
- criação de Pix pela rota autenticada do participante;
- acesso público ao evento;
- rejeição de origem cruzada em mutações;
- logout seletivo por categoria de sessão.

Relatórios detalhados:

```text
docs/frontend-stage-1-participant-session.md
docs/validation-stage-1.md
```

## Auditoria de dependências

Foi executado `npm audit fix` sem alterações incompatíveis. O audit final não
aponta vulnerabilidades altas ou críticas. Permanecem dois avisos moderados
associados ao PostCSS empacotado pelo Next.js estável `16.2.10`; o próprio npm
oferece apenas um downgrade incompatível para Next.js 9 como correção automática,
portanto essa opção não foi aplicada.

## Observação sobre datas de eventos

Os campos `start_date`, `end_date` e `registration_deadline` continuam sendo
enviados como data/hora local no formato `YYYY-MM-DDTHH:mm:ss`, sem conversão
para UTC e sem sufixo `Z`. Isso evita deslocamento automático de fuso em campos
`datetime-local`.
