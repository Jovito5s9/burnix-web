# Burnix Web

Frontend oficial do Burnix, uma plataforma SaaS para gestão de eventos, inscrições, pagamentos Pix e cobranças.

O sistema foi desenvolvido para fornecer uma interface moderna, responsiva e segura para gerenciamento de eventos, acompanhamento de inscrições e visualização de transações financeiras processadas pelo backend Burnix.

> 🚧 Projeto em desenvolvimento ativo.

---

## Funcionalidades

### Autenticação

Login de usuários

Cadastro de usuários

Persistência de sessão com JWT Bearer

Proteção de rotas privadas

Controle de acesso ao sistema


### Gestão de Eventos

Listagem paginada de eventos usando `skip` e `limit`

Criação de eventos pelo endpoint `POST /contracts/`

Visualização de detalhes do evento

Consulta dos status atuais do backend: `draft`, `published`, `closed` e `cancelled`

Exibição de capacidade, início, fim, prazo de inscrição, moeda e preço

Tratamento de `client_id` como campo legado e opcional


### Inscrições por Evento

Consulta de inscrições vinculadas ao evento usando:

```txt
GET /contracts/{contract_id}/registrations
```

As páginas públicas de inscrição ainda serão implementadas nas próximas etapas.


### Pagamentos por Evento

Consulta de pagamentos vinculados ao evento usando:

```txt
GET /contracts/{contract_id}/payments
```

Geração de cobranças Pix/OpenPix

Compatibilidade com rota legada de checkout do backend


### Retornos de Pagamento

Página de sucesso

Página de falha

Página de pagamento pendente


### Integração com API

Comunicação com backend próprio

Consumo de endpoints REST sem prefixo global `/api/v1`

Tratamento de erros centralizado, incluindo erros `422` do FastAPI/Pydantic e validações de formulário dinâmico

Gerenciamento de cache com React Query

Mutations para criar, atualizar e excluir eventos


---

## Stack Tecnológica

### Frontend

Next.js (App Router)

TypeScript

Tailwind CSS


### Gerenciamento de Estado e Dados

TanStack Query

Axios


### Infraestrutura

Vercel


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
/payments/
/public/contracts/{contract_id}
```

> Observação: o backend ainda usa o recurso técnico `Contract`, mas o frontend apresenta esse recurso como **Evento** para o usuário final. Por isso a rota continua `/contracts`, enquanto os textos da interface usam “Eventos”.

---

## Estrutura do Projeto

app/<br>
├── (auth)<br>
├── dashboard<br>
├── contracts<br>
├── payments<br>
├── sucesso<br>
├── falha<br>
└── pendente<br>
<br>
components/<br>
├── dashboard<br>
├── feedback<br>
├── forms<br>
├── layout<br>
└── ui<br>

hooks/<br>

lib/<br>

services/<br>

types/<br>

middleware.ts<br>

## Diretórios Principais

### Diretório / Responsabilidade

app — Rotas, layouts e páginas

components/ui — Componentes reutilizáveis

components/layout — Estrutura da aplicação

components/forms — Formulários de autenticação e entrada de dados

services — Comunicação HTTP com a API

hooks — React Query e lógica de consumo

lib — Utilitários e configurações

types — Tipagens compartilhadas

middleware.ts — Proteção de rotas


---

## Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_CHECKOUT_PATH=/checkout` fazia parte do fluxo antigo de checkout e deve ser tratado como legado. O fluxo atual de pagamento usa Pix/OpenPix pelo backend.

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
Inscrições e pagamentos vinculados ao evento
  ↓
Geração de cobrança Pix/OpenPix ou checkout legado
