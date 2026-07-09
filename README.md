# Burnix Web

Frontend oficial do Burnix, uma plataforma SaaS para gestão de eventos, inscrições, pagamentos Pix/OpenPix e cobranças.

O sistema foi desenvolvido para fornecer uma interface moderna, responsiva e segura para gerenciamento de eventos, acompanhamento de inscrições e visualização de transações financeiras processadas pelo backend Burnix.

> 🚧 Projeto em desenvolvimento ativo.

---

## Funcionalidades

### Autenticação

- Login de usuários
- Cadastro de usuários
- Persistência de sessão com JWT Bearer
- Proteção de rotas privadas
- Controle de acesso ao sistema

### Gestão de Eventos

- Listagem paginada de eventos usando `skip` e `limit`
- Criação de eventos pelo endpoint `POST /contracts/`
- Visualização de detalhes do evento
- Consulta dos status atuais do backend: `draft`, `published`, `closed` e `cancelled`
- Exibição de capacidade, início, fim, prazo de inscrição, moeda e preço
- Tratamento de `client_id` como campo legado e opcional

### Inscrições / Participantes

- Consulta de inscrições vinculadas ao evento usando `GET /contracts/{contract_id}/registrations`
- Camada interna para clientes/inscrições usando `/clients/`
- Componentes de listagem e detalhe de inscrições no painel do evento
- Exibição de nome, e-mail, telefone, documento, status de inscrição, status de pagamento e campos extras
- Botão para gerar Pix/OpenPix de uma inscrição usando `POST /payments/registrations/{client_id}/pix`
- Página pública de evento em `/eventos/{contract_id}` usando `GET /public/contracts/{contract_id}`
- Criação de inscrição pública usando `POST /public/contracts/{contract_id}/registrations`
- Geração automática de Pix da inscrição pública usando `POST /payments/registrations/{client_id}/pix`
- Exibição pública de QR Code, Pix copia e cola e link de pagamento OpenPix quando retornados pelo backend

### Campos Dinâmicos de Formulário

- Tipos e serviços para `/contracts/{contract_id}/form-fields/`
- Listagem, criação, edição e remoção de campos no detalhe do evento
- Suporte administrativo a `field_key`, `label`, `type`, `required`, `order`, `options` e `validation_rules`
- Renderização pública de campos `text`, `email`, `number`, `date`, `select`, `radio`, `checkbox` e `multiselect`
- Envio dos campos dinâmicos dentro de `extra_fields`
- Exibição de erros `422` por campo quando o backend retorna `detail.errors`

### Perfil de Cobrança

- Página `/settings` com formulário real para perfil de cobrança do organizador
- Consulta de perfil usando `GET /billing-profiles/me`
- Tratamento de `404` como “perfil ainda não criado”
- Criação/atualização usando `PUT /billing-profiles/me`
- Campos de chave Pix, tipo da chave Pix, documento e nome do recebedor
- Exibição do status de cobrança e plano atual no formulário
- Resumo do perfil de cobrança na visão geral do dashboard

### Exportações CSV

- Exportação de inscrições do evento usando `GET /contracts/{contract_id}/export/registrations.csv`
- Exportação de pagamentos do evento usando `GET /contracts/{contract_id}/export/payments.csv
/admin/users
/admin/contracts
/admin/clients
/admin/payments`
- Downloads protegidos com Bearer token pelo interceptor da API
- Uso de `responseType: "blob"` para baixar o arquivo CSV retornado pelo backend

### Pagamentos Pix/OpenPix

- Consulta global de pagamentos usando `GET /payments/`
- Consulta de pagamento por ID usando `GET /payments/{payment_id}`
- Consulta de pagamentos vinculados ao evento usando `GET /contracts/{contract_id}/payments`
- Geração de cobrança Pix/OpenPix para evento usando `POST /payments/contracts/{contract_id}/pix`
- Geração de cobrança Pix/OpenPix para inscrição usando `POST /payments/registrations/{client_id}/pix`
- Compatibilidade técnica com a rota legada `POST /payments/contracts/{contract_id}/checkout`
- Exibição de link de pagamento OpenPix, QR Code, código Pix copia e cola, provider, status detalhado, taxa da plataforma e valor líquido

### Retornos de Pagamento

- Página de sucesso em `/sucesso`
- Página de falha em `/falha`
- Página de pagamento pendente em `/pendente`
- Textos atualizados para pagamento Pix/OpenPix
- Páginas mantidas apenas como compatibilidade com retornos externos/legados

Essas páginas não devem ser usadas como fonte definitiva de confirmação. A confirmação real do pagamento deve vir do webhook OpenPix processado pelo backend e depois ser acompanhada por `GET /payments/`, `GET /payments/{payment_id}` ou `GET /contracts/{contract_id}/payments`.

### Painel Administrativo

- Página `/admin` dentro do dashboard
- Link Admin exibido apenas para usuários com role `admin`, `superuser` ou `super_user` retornada por `auth/me`
- Consulta das rotas administrativas:
  - `GET /admin/users`
  - `GET /admin/contracts`
  - `GET /admin/clients`
  - `GET /admin/payments`
- Tratamento de `403` como “sem permissão”
- Paginação por `skip` e `limit`, com limite máximo de 500 respeitado no serviço

### Integração com API

- Comunicação com backend próprio
- Consumo de endpoints REST sem prefixo global `/api/v1`
- Tratamento de erros centralizado, incluindo erros `422` do FastAPI/Pydantic e validações de formulário dinâmico
- Gerenciamento de cache com React Query
- Mutations para criar, atualizar e excluir eventos
- Mutations específicas para Pix/OpenPix de evento e de inscrição
- Mutations para criar, atualizar e remover campos dinâmicos de formulário
- Hooks e serviços para perfil de cobrança do organizador
- Serviços de exportação CSV com download via Blob
- Serviços e hooks administrativos para `/admin/users`, `/admin/contracts`, `/admin/clients` e `/admin/payments`
- Fluxo público sem autenticação para evento, inscrição e Pix da inscrição

---

## Stack Tecnológica

### Frontend

- Next.js com App Router
- TypeScript
- Tailwind CSS

### Gerenciamento de Estado e Dados

- TanStack Query
- Axios

### Infraestrutura

- Vercel

---

## Arquitetura

Usuário <br>
   │<br>
   ▼<br>
Next.js Frontend<br>
   │<br>
   ▼<br>
Burnix API<br>
   │<br>
   ├── PostgreSQL<br>
   ├── OpenPix / Pix<br>
   └── Serviços Internos<br>

O frontend é responsável pela experiência do usuário e comunicação com a API do Burnix, enquanto toda lógica de negócio, processamento financeiro, webhooks e integração com serviços externos permanece no backend.

A API atual expõe as rotas diretamente na raiz do host, por exemplo:

```txt
/auth/login
/auth/register
/contracts/
/contracts/{contract_id}/registrations
/contracts/{contract_id}/payments
/clients/
/payments/
/payments/contracts/{contract_id}/pix
/payments/registrations/{client_id}/pix
/public/contracts/{contract_id}
/public/contracts/{contract_id}/registrations
/contracts/{contract_id}/form-fields/
/billing-profiles/me
/contracts/{contract_id}/export/registrations.csv
/contracts/{contract_id}/export/payments.csv
/admin/users
/admin/contracts
/admin/clients
/admin/payments
```

> Observação: o backend ainda usa o recurso técnico `Contract`, mas o frontend apresenta esse recurso como **Evento** para o usuário final. Por isso a rota continua `/contracts`, enquanto os textos da interface usam “Eventos”.

---

## Estrutura do Projeto

```txt
app/
├── (auth)/
├── (dashboard)/
├── eventos/[id]/
├── sucesso/
├── falha/
└── pendente/

components/
├── admin/
├── dashboard/
├── feedback/
├── forms/
├── layout/
├── public/
└── ui/

hooks/
lib/
services/
types/
middleware.ts
```

## Diretórios Principais

- `app` — rotas, layouts e páginas
- `components/ui` — componentes reutilizáveis
- `components/admin` — visão administrativa para usuários, eventos, participantes e pagamentos
- `components/dashboard` — telas e blocos do painel
- `components/layout` — estrutura da aplicação
- `components/forms` — formulários de autenticação e entrada de dados
- `components/public` — página pública de evento, inscrição e pagamento Pix
- `services` — comunicação HTTP com a API
- `hooks` — React Query e lógica de consumo
- `lib` — utilitários e configurações
- `types` — tipagens compartilhadas
- `middleware.ts` — proteção de rotas

---

## Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_CHECKOUT_PATH=/checkout` fazia parte do fluxo antigo de checkout externo e deve ser tratado como legado. O fluxo atual de pagamento usa Pix/OpenPix pelo backend.

---

## Instalação

### Clonar o projeto

```bash
git clone https://github.com/jovito5s9/burnix-web.git
```

### Instalar dependências

```bash
npm install
```

### Executar em desenvolvimento

```bash
npm run dev
```

### A aplicação estará disponível em:

```txt
http://localhost:3000
```

---

## Scripts

### Desenvolvimento

```bash
npm run dev
```

### Build de Produção

```bash
npm run build
```

### Executar Build

```bash
npm run start
```

### Lint

```bash
npm run lint
```

### Verificação de Tipagem

```bash
npm run typecheck
```

---

## Fluxo Principal Atual

```txt
Cadastro
  ↓
Login
  ↓
Dashboard
  ↓
Eventos (`/contracts`)
  ↓
Detalhe do evento
  ↓
Campos dinâmicos, inscrições, pagamentos vinculados e exportações CSV
  ↓
Configurações (`/settings`) para perfil de cobrança Pix
  ↓
Página pública (`/eventos/{contract_id}`)
  ↓
Inscrição pública
  ↓
Geração de cobrança Pix/OpenPix da inscrição
```

## Observação sobre datas de eventos

Os campos `start_date`, `end_date` e `registration_deadline` do formulário de criação de eventos são enviados como data/hora local no formato `YYYY-MM-DDTHH:mm:ss`, sem conversão para UTC e sem sufixo `Z`. Isso evita o deslocamento automático de fuso horário causado por `Date.prototype.toISOString()` em campos `datetime-local`.

O frontend também valida antes do envio que a data final seja posterior ao início e que o prazo de inscrição não seja posterior ao início do evento, evitando respostas `422` previsíveis do backend.
