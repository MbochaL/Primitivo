---
name: primitivo-openapi-client
description: Flujo y convenciones para mantener sincronizados el backend y el frontend de Primitivo. Primitivo usa code-first con swaggo: las anotaciones en los handlers de Gin generan el spec, y de ahí se genera el cliente TypeScript. Úsala SIEMPRE que se agregue o modifique un endpoint, se escriban anotaciones de swag, se regenere el spec o el cliente TS, o el frontend necesite consumir la API. Si vas a tocar el contrato entre frontend y backend de Primitivo, consultá esta skill primero para que ambos lados nunca se desincronicen.
---

# OpenAPI → cliente TypeScript — Primitivo

El contrato entre el backend (Go + Gin) y el frontend (Expo) se define en **OpenAPI**, y de ahí se **autogenera un cliente TypeScript** que el frontend usa para hablar con la API. Esto garantiza que los tipos del frontend siempre coincidan con lo que devuelve el backend.

## Por qué importa

Sin esto, el frontend escribiría tipos a mano y fetch crudos, y cada cambio en el backend rompería el frontend en silencio. Con el cliente generado, un cambio de contrato se refleja en tipos de TypeScript: si el backend cambia un campo, el frontend deja de compilar hasta que se ajusta. Ese es el valor — errores en tiempo de compilación en vez de en producción.

## El spec es la fuente de verdad (generado, no escrito a mano)

- El spec se genera con **swaggo (swag)** a partir de anotaciones en los handlers de Gin.
- Vive en `apps/api/docs/` como `swagger.json` y `swagger.yaml` (los genera `swag init`, no se editan a mano).
- Las anotaciones describen cada endpoint: ruta, método, request body, parámetros, respuestas y sus schemas, y se escriben justo arriba de cada handler.

## Enfoque del proyecto: code-first con swaggo

Primitivo usa **code-first**: escribís los handlers de Gin con anotaciones de swag, y el spec sale como subproducto. El código manda; el spec refleja el código.

> Tradeoff a tener presente: como el spec se deriva de las anotaciones, hay que mantenerlas al día. Una anotación olvidada = spec desactualizado = cliente TS incorrecto. Por eso la regla de oro de más abajo.

### Setup (una vez)

Instalar el CLI de swag y las dependencias del middleware:

```bash
go install github.com/swaggo/swag/cmd/swag@latest
go get -u github.com/swaggo/gin-swagger
go get -u github.com/swaggo/files
```

Info general de la API (en `cmd/api/main.go`, arriba de `main`):

```go
// @title       Primitivo API
// @version     1.0
// @description API de fidelización y beneficios de Primitivo
// @host        localhost:8080
// @BasePath    /api/v1
```

### Anotaciones por endpoint

ALWAYS poné el bloque de anotaciones justo arriba del handler:

```go
// CrearCliente godoc
// @Summary  Crear un cliente
// @Tags     clientes
// @Accept   json
// @Produce  json
// @Param    cliente body     CrearClienteRequest true "Datos del cliente"
// @Success  201     {object} ClienteResponse
// @Failure  400     {object} ErrorResponse
// @Router   /clientes [post]
func (h *ClienteHandler) Crear(c *gin.Context) { ... }
```

Los `{object}` referencian los structs de request/response del handler (ver skill `primitivo-gin-api`) — por eso esos structs son la base del schema.

### Generar el spec

Desde la raíz del backend. Si `main.go` está en `cmd/api/`, indicalo con `-g`:

```bash
swag init -g cmd/api/main.go
```

Esto regenera `docs/swagger.json` y `docs/swagger.yaml`.

## Generación del cliente TS

swaggo emite **Swagger 2.0**, no OpenAPI 3. La mayoría de los generadores de cliente TS modernos esperan OpenAPI 3, así que el flujo tiene un paso de conversión:

```bash
# 1. (en apps/api) generar el spec Swagger 2.0
swag init -g cmd/api/main.go

# 2. convertir Swagger 2.0 -> OpenAPI 3 (ej. con swagger2openapi)
npx swagger2openapi apps/api/docs/swagger.yaml -o packages/api-client/openapi.yaml

# 3. generar el cliente TS desde el OpenAPI 3
npx openapi-typescript-codegen --input packages/api-client/openapi.yaml \
    --output packages/api-client/src/generated
```

Fijá estos pasos en scripts de `package.json` (`"gen:api"`) y/o un Makefile para que vos y tu compañero los corran exactamente igual. El cliente generado vive en `packages/api-client/src/generated/` (se consume como `@primitivo/api-client`) y no se edita a mano.

> Si más adelante el paso de conversión molesta, la alternativa es migrar a oapi-codegen (spec-first, OpenAPI 3 nativo). Por ahora swaggo prioriza arrancar rápido.

## Regla de oro: cambio de endpoint = reanotar y regenerar

ALWAYS que agregues o modifiques un endpoint:
1. Actualizá el handler de Gin **y sus anotaciones de swag**.
2. Corré `swag init` para regenerar el spec.
3. Corré la conversión + generación del cliente TS (`npm run gen:api`).
4. El frontend consume el cliente regenerado — nunca fetch a mano ni tipos manuales.

Si el frontend necesita un dato que la API no expone, el cambio empieza en el handler y sus anotaciones, no parcheando el frontend.

## Uso en el frontend

- Importá los tipos y funciones del cliente generado desde `@primitivo/api-client`.
- Envolvé el cliente en hooks de datos (ver skill `primitivo-ui`): `useInfusionesCliente` usa el cliente generado por dentro y expone `{ datos, cargando, error }` al componente.
- No disperses llamadas crudas a la API por los componentes; centralizá en `apps/web/src/api/` (wrappers + hooks) sobre `@primitivo/api-client`.