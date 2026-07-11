# Relatório de validação — frontend etapa 1

## Resultado

A implementação foi validada localmente com Node.js, Next.js em modo de
produção e backend HTTP simulado.

## Comandos executados

```text
npm ci
npm audit fix
npm run lint
npm run typecheck
npm run build
npm run test:bff
```

## Resultados

```text
ESLint: aprovado, sem warnings
TypeScript strict: aprovado
Next.js production build: aprovado
Rotas geradas: 20 páginas/handlers
Proxy do Next.js: reconhecido no build
Smoke BFF: aprovado
```

Rotas novas confirmadas pelo build:

```text
/api/backend/[session]/[...path]
/api/session/logout
/api/session/organizer/login
/api/session/participant/login
/api/session/participant/register
/participante/entrar
/participante/cadastro
```

## Casos do smoke test

1. Login do participante cria apenas
   `burnix.participant_access_token`.
2. A resposta do login não contém `access_token`.
3. O cookie possui `HttpOnly`, `Secure`, `SameSite=Lax` e `Path=/` em produção.
4. `/participant-auth/me` recebe Bearer somente no servidor.
5. A inscrição autenticada não envia `participant_id` nem `email`.
6. O pagamento usa a rota autenticada da inscrição.
7. O proxy do participante recusa path do organizador.
8. Login do organizador cria apenas `burnix.access_token`.
9. A resposta do login do organizador não contém JWT.
10. `/auth/me` recebe o token do organizador no servidor.
11. A existência apenas da sessão do participante não libera `/dashboard`.
12. O evento público é acessível sem cookie.
13. Uma mutação com origem externa recebe `403`.
14. Logout seletivo do participante não apaga o cookie do organizador.

## Busca por padrões inseguros

Foi verificada a ausência, no código da aplicação, de:

```text
localStorage para JWT
document.cookie para JWT
POST /public/contracts/{id}/registrations
POST /payments/registrations/{id}/pix
participant_id no payload do formulário
```

As menções a `access_token` permanecem exclusivamente nos Route Handlers e nos
tipos usados pelo servidor para consumir a resposta do backend.

## Dependências

Após `npm audit fix`:

```text
critical: 0
high: 0
moderate: 2
low: 0
```

Os dois avisos moderados pertencem à dependência PostCSS interna do Next.js
`16.2.10`, que era a versão estável mais recente instalada durante a validação.
O comando sugerido pelo npm exigiria downgrade incompatível para Next.js 9 e
não foi aplicado.

## Validações externas ainda necessárias

Antes da produção:

1. Configurar `API_URL` para o backend de staging.
2. Servir o frontend por HTTPS.
3. Configurar `APP_ORIGIN` quando houver proxy reverso ou domínio canônico.
4. Testar login real de organizador e participante.
5. Criar inscrição em evento publicado.
6. Validar evento gratuito.
7. Criar cobrança OpenPix sandbox e processar webhook.
8. Confirmar que cookies são enviados apenas ao domínio esperado.
9. Executar testes E2E no navegador alvo.
