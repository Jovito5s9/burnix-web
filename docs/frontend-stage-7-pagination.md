# Etapa 7 — paginação e contratos de listagem

## Escopo

A listagem de eventos do organizador deixou de interpretar o tamanho da página atual como total global.

O contrato esperado para `GET /contracts` é:

```json
{
  "items": [],
  "total": 143,
  "skip": 20,
  "limit": 20
}
```

Tipo correspondente:

```ts
type ContractListResponse = {
  items: Contract[];
  total: number;
  skip: number;
  limit: number;
};
```

## Implementação

Arquivos principais:

```text
types/contract.ts
services/contracts.ts
hooks/useContracts.ts
components/dashboard/contracts-page.tsx
```

O serviço valida o envelope em tempo de execução. Uma resposta legada em array é rejeitada com erro não retentável, em vez de produzir silenciosamente uma lista vazia ou um total incorreto.

O hook expõe separadamente:

```text
contracts = response.items
total = response.total
skip = response.skip
limit = response.limit
```

A tela calcula:

```text
página atual = floor(skip / limit) + 1
total de páginas = ceil(total / limit)
hasNextPage = skip + items.length < total
```

Com isso, uma última página contendo exatamente 20 itens não libera navegação para uma página vazia quando `total=20`.

## Dependência do backend

A documentação de backend anexada nesta etapa ainda descreve as listagens como arrays sem total global. Portanto, a implantação desta versão do frontend requer que `GET /contracts` seja atualizado para o envelope acima.

Essa exigência é intencional: sem `total`, o frontend não consegue distinguir com precisão uma página final cheia de uma página intermediária.

Pagamentos, clientes e administração permanecem com os contratos atuais e devem adotar o mesmo padrão em etapas futuras.
