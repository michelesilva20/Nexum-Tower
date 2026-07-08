# RoutePoints

Pontos ordenados que compõem a sequência operacional de uma rota.

## Campos principais

| Campo | Descrição |
|-------|-----------|
| `sequence` | Ordem (única por rota, inicia em 1) |
| `locationId` | Local operacional |
| `pointType` | ORIGIN, DESTINATION, STOP, etc. |
| `operationRole` | LOAD, UNLOAD, PASS_THROUGH, etc. |
| `distanceFromPreviousKm` | Distância manual desde ponto anterior |
| `durationFromPreviousMinutes` | Duração manual desde ponto anterior |

## API

```txt
GET /logistics/routes/:id/points
PUT /logistics/routes/:id/points   ← substitui sequência completa (transacional)
```

Permissão PUT: `routes.manage_points` + escopo global.

## AuditLog

`ROUTE_POINTS_UPDATED` registra apenas `previousPointCount` e `newPointCount` — **não** o payload completo dos pontos.
