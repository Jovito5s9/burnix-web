# Burnix Web

Frontend oficial do Burnix, uma plataforma SaaS para gestão de pagamentos, contratos e cobranças.

O sistema foi desenvolvido para fornecer uma interface moderna, responsiva e segura para gerenciamento de contratos, criação de pagamentos e acompanhamento de transações financeiras.

> 🚧 Projeto em desenvolvimento ativo.




---

## Funcionalidades

### Autenticação

Login de usuários

Persistência de sessão

Proteção de rotas privadas

Controle de acesso ao sistema


### Gestão de Contratos

Listagem de contratos

Visualização de detalhes

Consulta de status


### Pagamentos

Criação de checkouts

Integração com Mercado Pago

Acompanhamento de pagamentos

Fluxo de pagamento via PIX


### Retornos de Pagamento

Página de sucesso

Página de falha

Página de pagamento pendente


### Integração com API

Comunicação com backend próprio

Consumo de endpoints REST

Tratamento de erros centralizado

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
   ├── Mercado Pago<br>
   └── Serviços Internos<br>

O frontend é responsável pela experiência do usuário e comunicação com a API do Burnix, enquanto toda lógica de negócio, processamento financeiro e integração com serviços externos permanece no backend.


---

## Estrutura do Projeto

app/<br>
├── (auth)<br>
├── dashboard<br>
├── contratos<br>
├── pagamentos<br>
├── sucesso<br>
├── falha<br>
└── pendente<br>
<br>
components/<br>
├── layout<br>
└── ui<br>

hooks/<br>

lib/<br>

services/<br>

types/<br>

middleware.ts<br>

## Diretórios Principais

### Diretório	Responsabilidade

app	Rotas, layouts e páginas
components/ui	Componentes reutilizáveis
components/layout	Estrutura da aplicação
services	Comunicação HTTP
hooks	React Query e lógica de consumo
lib	Utilitários e configurações
types	Tipagens compartilhadas
middleware.ts	Proteção de rotas



---

## Variáveis de Ambiente

Crie um arquivo .env.local:

NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_CHECKOUT_PATH=/checkout


---

## Instalação

### Clonar o projeto

git clone https://github.com/jovito5s9/burnix-web.git

### Instalar dependências

pnpm install

### Executar em desenvolvimento

pnpm dev

### A aplicação estará disponível em:

http://localhost:3000


---

## Scripts

### Desenvolvimento

pnpm dev

### Build de Produção

pnpm build

### Executar Build

pnpm start

### Lint

pnpm lint

### Verificação de Tipagem

pnpm typecheck


---

## Fluxo Principal

Login
  ↓
Dashboard
  ↓
Contratos
  ↓
Criar Checkout
  ↓
Mercado Pago
  ↓
Retorno
  ├── Sucesso
  ├── Falha
  └── Pendente


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