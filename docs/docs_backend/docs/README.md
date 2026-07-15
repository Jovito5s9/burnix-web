# Documentação do Burnix Backend

Este diretório descreve o funcionamento atual do backend. Os documentos são organizados por responsabilidade técnica e devem permanecer válidos independentemente do histórico de implementação.

## Ordem de leitura

1. [Arquitetura](architecture.md) — componentes, fronteiras e fluxos internos.
2. [Modelo de domínio](domain-model.md) — entidades, estados e regras de negócio.
3. [Referência da API](api-reference.md) — autenticação, endpoints, exemplos e erros.
4. [Configuração](configuration.md) — variáveis de ambiente e validações de startup.
5. [Banco de dados](database.md) — tabelas, constraints, migrations e backups.
6. [Segurança](security.md) — JWT, multi-tenancy, proxies, logs e payloads.
7. [Pagamentos e OpenPix](payments-openpix.md) — subcontas, split, tentativas e webhooks.
8. [Rate limit](rate-limiting.md) — políticas, Redis e comportamento de falha.
9. [Operação](operations.md) — health checks, jobs, observabilidade e incidentes.
10. [Deploy](deployment.md) — execução local, Docker, staging e produção.
11. [Testes e CI](testing.md) — comandos, serviços externos e cobertura.
12. [Checklist de produção](production-checklist.md) — verificação objetiva antes da liberação.

## Fontes de verdade

| Assunto | Fonte principal |
|---|---|
| Rotas e schemas HTTP | `app/api/routes`, `app/schemas` e OpenAPI em `/openapi.json` |
| Regras de negócio | `app/services` e `app/core/enums.py` |
| Persistência | `app/models` e `migrations/versions` |
| Configuração | `app/core/config.py` e arquivos `.env.*.example` |
| Segurança operacional | `app/core`, `app/middleware` e `Dockerfile` |
| Testes automatizados | `tests` e `.github/workflows/backend-tests.yml` |

Quando houver divergência entre documentação e código, o código e o OpenAPI são a referência executável. A documentação deve ser atualizada na mesma alteração que modificar um contrato público, uma regra de negócio, uma migration ou uma exigência operacional.

## Política de versionamento documental

A API atual não possui prefixo público de versão. A documentação descreve somente o contrato vigente.

Quando versões como `/api/v1` e `/api/v2` forem introduzidas:

- cada versão deve ter sua própria referência de endpoints e schemas;
- mudanças incompatíveis devem ser registradas em um changelog por versão;
- rotas depreciadas devem informar data e condição de remoção;
- a documentação do estado atual não deve ser convertida em relatório cronológico.
