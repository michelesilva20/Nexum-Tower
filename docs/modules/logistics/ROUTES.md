# Rotas Operacionais (Route)

Template operacional de rota por tenant, com pontos ordenados (`RoutePoint`) e escopo por filial via `RouteBranch`.

## Decisão arquitetural

```txt
Route = entidade global do tenant
RouteBranch = vínculo operacional rota ↔ filial
RoutePoint = sequência ordenada de locais
```

`originLocationId` e `destinationLocationId` são campos de conveniência sincronizados do 1º ponto ORIGIN e último DESTINATION.

## Coerência LocationBranch

Cada `RoutePoint.locationId` deve ter **interseção** com as filiais da rota: o local precisa ter `LocationBranch` ativa em ao menos uma filial vinculada à rota.

## Coerência CustomerBranch

Se `customerId` informado, todas as filiais em `RouteBranch` devem existir como `CustomerBranch` ativa desse cliente.

## RoutePoint

- Mínimo 2 pontos
- Sequência única começando em 1
- Primeiro ponto: `ORIGIN`
- Último ponto: `DESTINATION`
- Substituição transacional via `PUT /logistics/routes/:id/points`

## Limitações desta fase

Sem viagens, mapa, cálculo automático de distância/tempo/pedágio ou tracking real.

## RLS

`11-routes-hardening.sql` — produção **NO-GO** até `nexum_app` + FORCE RLS.
