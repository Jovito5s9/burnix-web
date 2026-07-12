# Etapa 6 — Textos de produção

## Objetivo

Preparar toda a comunicação visível do frontend para uso em produção, removendo referências à implementação, traduzindo estados internos e mantendo uma linguagem consistente para participantes, organizadores e administradores.

## Diretrizes aplicadas

- “E-mail”, “Pix”, “QR Code”, “Inscrição”, “Participante”, “Evento” e “Pagamento” são usados de forma consistente.
- A interface pública usa apenas “participante” e “evento” para representar as entidades de negócio.
- Termos como backend, endpoint, webhook, OpenPix, client, contract, correlation ID e referências a rotas não são apresentados ao usuário.
- Status recebidos pela aplicação são convertidos para rótulos em português antes da renderização.
- Planos, meios de pagamento e situações de recebimento possuem valores de apresentação controlados; valores desconhecidos não são exibidos diretamente.
- Mensagens de erro conhecidas são traduzidas por código. Mensagens técnicas inesperadas são substituídas por orientações seguras.
- Estados de carregamento, vazio, sucesso, pagamento pendente, Pix expirado e evento não encontrado foram revisados.

## Áreas revisadas

- Página inicial e navegação.
- Autenticação de organizadores e participantes.
- Página pública do evento e formulário de inscrição.
- Pagamento por Pix e acompanhamento da inscrição.
- Visão geral, eventos, participantes, pagamentos e configurações do organizador.
- Área administrativa.
- Páginas de sucesso, falha e pagamento pendente.
- Formatadores, tradução de status e tratamento de erros.
- README e testes automatizados afetados pela nova comunicação.

## Segurança das mensagens

O tratamento de erros prioriza o código estruturado documentado pelo backend. Detalhes de infraestrutura, autenticação interna, rotas, rastreamento e provedores não são encaminhados para a interface. Quando não há uma mensagem segura conhecida, a aplicação apresenta uma orientação genérica para tentar novamente.

## Compatibilidade funcional

A revisão textual preserva os fluxos implementados nas etapas anteriores: autenticação separada, inscrição, recuperação de duplicidade, Pix, atualização do pagamento, nova tentativa após expiração, evento gratuito e isolamento entre participantes.
