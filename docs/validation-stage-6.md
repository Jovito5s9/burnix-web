# Validação da Etapa 6

Data da validação: 11 de julho de 2026.

## Escopo validado

- Revisão dos textos públicos, de autenticação, participante, organizador e administração.
- Padronização de E-mail, Pix, QR Code, Inscrição, Participante, Evento e Pagamento.
- Tradução dos estados de evento, inscrição e pagamento.
- Ocultação de mensagens técnicas inesperadas.
- Preservação dos fluxos de inscrição, duplicidade e pagamento implementados nas etapas anteriores.

## Resultado dos comandos

```text
npm ci             aprovado
npm run typecheck  aprovado
npm run lint       aprovado
npm run build      aprovado
npm run test       11 testes aprovados
npm run test:e2e   8 testes aprovados
```

A compilação de produção gerou 21 rotas da aplicação sem erros.

## Cobertura automatizada

Os testes unitários validam:

- exigência de conta para iniciar a inscrição;
- proteção contra cliques repetidos;
- recuperação da inscrição existente em conflito;
- apresentação do QR Code e do código Pix;
- pagamento confirmado, Pix expirado e evento gratuito;
- listagem das próprias inscrições;
- tradução de status e meios de pagamento;
- substituição de detalhes técnicos por mensagens seguras.

Os testes E2E validam:

- cadastro do participante e retorno ao evento;
- criação da inscrição e apresentação do Pix;
- prevenção de duplicidade e recuperação após resposta 409;
- atualização da tela após confirmação do pagamento;
- nova tentativa após expiração do Pix;
- isolamento de dados entre participantes;
- evento gratuito sem QR Code;
- evento em rascunho apresentado como não encontrado.

## Auditoria textual

Foi realizada uma busca nos arquivos de interface por referências a backend, endpoint, OpenPix, webhook, client, contract, correlation ID, referência legada e status internos. As ocorrências restantes estão limitadas a código, rotas, tipos, comentários ou documentação técnica e não são apresentadas ao usuário.

## Dependências

O `npm audit` informou duas ocorrências moderadas relacionadas ao PostCSS incluído internamente pelo Next.js. A correção automática oferecida pelo npm exige a substituição por Next.js 9.3.3, incompatível com o projeto atual, e por isso não foi aplicada. Não foram encontradas vulnerabilidades altas ou críticas.

## Observação sobre o ambiente local

A execução E2E foi validada com o Chromium disponível no ambiente. Uma política externa de bloqueio de URLs precisou ser desativada temporariamente apenas durante a navegação em `127.0.0.1`; a política foi restaurada após os testes. Nenhuma alteração desse ambiente foi incorporada ao projeto ou à configuração de CI.
