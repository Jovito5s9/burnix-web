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

As páginas públicas de inscrição ainda serão implementadas nas próximas etapas.

### Pagamentos Pix/OpenPix

- Consulta global de pagamentos usando `GET /payments/`
- Consulta de pagamento por ID usando `GET /payments/{payment_id}`
- Consulta de pagamentos vinculados ao evento usando `GET /contracts/{contract_id}/payments`
- Geração de cobrança Pix/OpenPix para evento usando `POST /payments/contracts/{contract_id}/pix`
- Geração de cobrança Pix/OpenPix para inscrição usando `POST /payments/registrations/{client_id}/pix`
- Compatibilidade técnica com a rota legada `POST /payments/contracts/{contract_id}/checkout`
- Exibição de checkout URL, QR Code, código Pix copia e cola, provider, status detalhado, taxa da plataforma e valor líquido

### Retornos de Pagamento

- Página de sucesso
- Página de falha
- Página de pagamento pendente

Essas páginas continuam disponíveis para compatibilidade, mas a confirmação real do pagamento deve ser acompanhada pelos endpoints de pagamentos do backend e pelos webhooks OpenPix.

### Integração com API

- Comunicação com backend próprio
- Consumo de endpoints REST sem prefixo global `/api/v1`
- Tratamento de erros centralizado, incluindo erros `422` do FastAPI/Pydantic e validações de formulário dinâmico
- Gerenciamento de cache com React Query
- Mutations para criar, atualizar e excluir eventos
- Mutations específicas para Pix/OpenPix de evento e de inscrição

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
```

> Observação: o backend ainda usa o recurso técnico `Contract`, mas o frontend apresenta esse recurso como **Evento** para o usuário final. Por isso a rota continua `/contracts`, enquanto os textos da interface usam “Eventos”.

---

## Estrutura do Projeto

```txt
app/
├── (auth)/
├── (dashboard)/
├── sucesso/
├── falha/
└── pendente/

components/
├── dashboard/
├── feedback/
├── forms/
├── layout/
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
- `components/dashboard` — telas e blocos do painel
- `components/layout` — estrutura da aplicação
- `components/forms` — formulários de autenticação e entrada de dados
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
Inscrições e pagamentos vinculados ao evento
  ↓
Geração de cobrança Pix/OpenPix para evento ou inscrição
```
