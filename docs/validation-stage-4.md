# Validação da Etapa 4 — Pix do participante

## Contrato conferido

A implementação foi confrontada com a documentação do backend `0.6.0`, em
especial:

```text
docs/api-route-reference.md
docs/backend-architecture.md
docs/participant-identity-my-events.md
docs/payment-lifecycle-stage-5.md
docs/error-contracts-stage-6.md
```

Pontos confirmados:

- a cobrança autenticada usa a inscrição pertencente ao participante;
- o payload aceita somente `idempotency_key` opcional;
- `PublicPaymentRead` não expõe PII, correlação ou IDs internos;
- o detalhe da inscrição contém o pagamento mais recente;
- o status real é sincronizado pelo backend após o evento do provedor;
- a rota privada `/payments/{id}` pertence ao organizador.

## Validações automatizadas

```text
npm run typecheck
npm run lint
npm run build
npm run test:bff
npm run test:stage4
```

O teste específico da etapa verifica estaticamente:

- uso da rota Pix autenticada do participante;
- ausência de AppID ou variável pública de credencial;
- intervalo de 4,5 segundos e limite de três minutos;
- suspensão por visibilidade da aba;
- consulta do recurso da inscrição, não de pagamento privado;
- textos obrigatórios dos estados;
- allowlist do BFF;
- páginas de retorno sem identificadores técnicos;
- navegação exclusiva para “Minhas inscrições”.

## Cenários funcionais cobertos pelo código

```text
Inscrição paga
  -> polling encerra
  -> Pagamento confirmado

Pix pendente
  -> QR Code e copia e cola permanecem disponíveis
  -> detalhe da inscrição consultado a cada 4,5 s

Pix expirado
  -> polling encerra
  -> nova cobrança pode ser solicitada quando permitida

Falha de criação
  -> inscrição preservada
  -> mensagem segura
  -> nova tentativa idempotente

Evento gratuito
  -> sem cobrança
  -> inscrição confirmada

Aba inativa
  -> polling suspenso
  -> nenhuma consulta em segundo plano
```

## Segurança da interface

Não são mostrados na interface comum:

```text
correlation_id
checkout_id
payment_id técnico
nomes de endpoints
AppID
payload bruto
erro técnico do provedor
```

As páginas de retorno não apontam mais para `/payments`, `/dashboard` ou
`/contracts`.

## Resultado executado

```text
TypeScript: aprovado
ESLint: aprovado
Build de produção Next.js 16.2.10: aprovado
Smoke BFF: aprovado
Validação específica da Etapa 4: aprovada
```

O build compilou e gerou com sucesso, entre outras, as rotas:

```text
/eventos/[id]
/minhas-inscricoes
/minhas-inscricoes/[id]
/sucesso
/falha
/pendente
/api/backend/[session]/[...path]
```

A auditoria de dependências não encontrou vulnerabilidades altas ou críticas.
Foram reportadas duas ocorrências moderadas no PostCSS transitivo do Next.js; a
correção automática sugerida exigiria alteração incompatível da versão do
framework e, por isso, não foi aplicada com `--force`.
