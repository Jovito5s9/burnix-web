# Burnix Web

Aplicação web para criar eventos, receber inscrições e acompanhar pagamentos por Pix. A experiência é separada entre organizadores, participantes e administração, com textos preparados para uso em produção.

## Principais recursos

### Para participantes

- Consultar a página pública de um evento.
- Criar uma conta ou entrar com segurança.
- Enviar a inscrição com os dados solicitados pelo organizador.
- Pagar por Pix usando QR Code ou código copia e cola.
- Acompanhar inscrições e pagamentos em **Minhas inscrições**.
- Gerar um novo Pix quando o anterior expirar.

### Para organizadores

- Criar, publicar e acompanhar eventos.
- Personalizar as perguntas do formulário de inscrição.
- Consultar participantes e pagamentos.
- Gerar Pix para uma inscrição quando necessário.
- Exportar relatórios em CSV.
- Configurar a chave Pix e os dados de recebimento.

### Para administração

- Consultar contas de organizadores, eventos, participantes e pagamentos.
- Acompanhar os principais dados da plataforma com paginação e status traduzidos.

## Experiência de produção

A Etapa 6 revisa os textos apresentados na interface para:

- remover referências técnicas e termos internos;
- usar mensagens claras em erros, carregamentos e estados vazios;
- traduzir status antes de exibi-los;
- padronizar **E-mail**, **Pix**, **QR Code**, **Inscrição**, **Participante**, **Evento** e **Pagamento**;
- usar somente **participante** e **evento** na comunicação com usuários;
- ocultar detalhes técnicos de falhas e mostrar orientações seguras.

## Requisitos

- Node.js 20 ou superior.
- npm 10 ou superior.
- Serviço da aplicação disponível para uso local ou em ambiente publicado.

## Configuração

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Variáveis disponíveis:

```env
API_URL=http://localhost:8000
# APP_ORIGIN=https://app.seudominio.com
```

## Desenvolvimento

```bash
npm ci
npm run dev
```

A aplicação ficará disponível, por padrão, em `http://localhost:3000`.

## Validação

Execute a mesma sequência usada na integração contínua:

```bash
npm run typecheck
npm run lint
npm run build
npm run test
npm run test:e2e
```

Comandos adicionais:

```bash
npm run test:watch
npm run test:e2e:ui
npm run test:bff
npm run test:stage4
```

## Arquitetura técnica

Esta seção mantém os termos técnicos necessários à manutenção do projeto.

- Next.js 16 com App Router e Route Handlers.
- React 19 e TanStack Query.
- BFF no Next.js para separar as sessões de organizador e participante.
- Cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Integração do backend FastAPI com pagamentos Pix/OpenPix.
- Vitest, React Testing Library e MSW para testes de componentes e contratos HTTP.
- Playwright para jornadas completas no navegador.
- Workflow de CI em `.github/workflows/frontend-ci.yml`.

As rotas internas, regras de sessão, idempotência, tratamento de duplicidade e ciclo de pagamentos continuam documentados nos arquivos técnicos em `docs/`.

## Documentação

- `docs/frontend-stage-1-participant-session.md`
- `docs/frontend-stage-2-participant-registrations.md`
- `docs/frontend-stage-3-registration-duplicate-recovery.md`
- `docs/frontend-stage-4-openpix-participant-flow.md`
- `docs/frontend-stage-5-tests.md`
- `docs/frontend-stage-6-production-copy.md`
- `docs/validation-stage-6.md`

## Licença

Consulte `LICENSE.md`.
