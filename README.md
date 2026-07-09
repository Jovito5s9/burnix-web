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

Listagem de eventos

Visualização de detalhes

Consulta de status


### Pagamentos

Geração de cobranças Pix/OpenPix

Acompanhamento de pagamentos

Fluxo de pagamento via Pix

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
/payments/
/public/contracts/{contract_id}
```

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
Eventos / Contracts
  ↓
Gerar cobrança Pix/OpenPix
  ↓
Acompanhar pagamento
  ↓
Retorno ou confirmação via backend/webhook

---

## Segurança

O frontend não armazena credenciais sensíveis nem executa regras críticas de negócio.

Toda lógica financeira, validações de pagamento, webhooks e processamento de transações são tratados exclusivamente pelo backend da plataforma.

---

## Status do Projeto

Atualmente o projeto encontra-se em desenvolvimento ativo, recebendo melhorias contínuas de arquitetura, experiência do usuário e integração com os serviços da plataforma Burnix.

---

## Licença

Projeto proprietário.

O código-fonte é disponibilizado apenas para fins de demonstração técnica e portfólio.

Todos os direitos reservados.
