---
name: primitivo-gin-api
description: Buenas prácticas y convenciones para la API HTTP del backend de Primitivo construida con Go y Gin. Úsala SIEMPRE que se creen o modifiquen handlers, rutas, middleware, validación de requests, manejo de errores o respuestas HTTP en el backend. Si vas a escribir cualquier endpoint, router o middleware de Gin para Primitivo, consultá esta skill primero para mantener handlers delgados y respuestas consistentes.
---

# API con Gin — Primitivo

El backend de Primitivo usa **Go + Gin**. Esta skill define cómo se escriben los endpoints para que sean consistentes, delgados y fáciles de mantener entre dos personas.

## Principio central: handlers delgados

El handler traduce HTTP ↔ dominio y nada más:
1. Parsea y valida el request.
2. Llama al `service` correspondiente.
3. Mapea el resultado (o el error) a una respuesta HTTP.

Toda regla de negocio vive en `service/`. Todo el SQL vive en `db/queries`. Si un handler tiene un `if` de lógica de negocio o supera ~50 líneas, esa lógica está en el lugar equivocado.

## Estructura de un handler

ALWAYS seguí esta forma:

```go
func (h *ClienteHandler) Crear(c *gin.Context) {
    var req CrearClienteRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        respondError(c, http.StatusBadRequest, err)
        return
    }

    cliente, err := h.service.Crear(c.Request.Context(), req.ToInput())
    if err != nil {
        respondError(c, statusFor(err), err)
        return
    }

    c.JSON(http.StatusCreated, toClienteResponse(cliente))
}
```

## Reglas de rutas

- Agrupá rutas por recurso con `router.Group`. Versioná bajo `/api/v1`.
- Registrá las rutas en un solo lugar (`router.go` o en `main.go` al hacer el wiring), no esparcidas.
- Nombres de recursos en plural y kebab-case si hace falta: `/api/v1/clientes`, `/api/v1/beneficios`.
- Usá los verbos HTTP correctos: GET (leer), POST (crear), PUT/PATCH (actualizar), DELETE (borrar).

## Validación

- Validá en el borde con los binding tags de Gin (`binding:"required,email"`) sobre los structs de request.
- Los structs de request (`CrearClienteRequest`) viven junto al handler y NO son los modelos de dominio. Se mapean explícitamente. Esto evita exponer o aceptar campos internos sin querer.

## Manejo de errores consistente

ALWAYS usá un helper central para responder errores, con una forma única de respuesta:

```json
{ "error": { "codigo": "cliente_no_encontrado", "mensaje": "..." } }
```

- Definí errores de dominio en el `service` (ej. `ErrClienteNoEncontrado`).
- Una función `statusFor(err)` mapea el error de dominio al status HTTP. El handler no decide el status con `if` ad-hoc dispersos.
- Nunca devuelvas el error crudo de la base ni stack traces al cliente. Logueá el detalle, respondé un mensaje limpio.

## Middleware

- Recovery, logging y CORS como middleware global en el setup del router.
- Auth como middleware aplicado a los grupos que lo requieren.
- Un middleware por archivo en `internal/middleware/`.

## Contexto

Pasá siempre `c.Request.Context()` hacia el service y el repo, para que cancelaciones y timeouts se propaguen hasta la query de PostgreSQL.

## Relación con OpenAPI (swaggo)

Primitivo usa code-first con swaggo: el spec se genera desde anotaciones de swag escritas arriba de cada handler. Cuando agregás o cambiás un endpoint, actualizá también sus anotaciones (`@Summary`, `@Param`, `@Success`, `@Router`, etc.) y regenerá con `swag init`. De ahí sale el spec y luego el cliente TypeScript del frontend (ver skill `primitivo-openapi-client`). Los structs de request/response que definís en el handler son la base de los schemas, así que mantenelos limpios.