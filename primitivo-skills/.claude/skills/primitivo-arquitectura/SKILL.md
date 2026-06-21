---
name: primitivo-arquitectura
description: Estándares de arquitectura de carpetas y modularización de código para el proyecto Primitivo (sistema de fidelización y beneficios para la panadería-café Primitivo). Úsala SIEMPRE que se cree, mueva o reorganice archivos y carpetas, cuando un archivo se esté volviendo largo, cuando se decida dónde ubicar nuevo código (handlers, services, componentes, hooks), o cuando se evalúe si algo debe extraerse a una función/componente reutilizable. Aplica tanto a frontend (Expo) como a backend (Go). Si dudás de dónde va un archivo o si algo debe modularizarse, consultá esta skill antes de escribir.
---

# Arquitectura y modularización — Primitivo

Esta skill define cómo se organiza el código en Primitivo para que dos personas (Bocha y su compañero) trabajen sobre la misma base sin pisarse y manteniendo archivos legibles. El objetivo central: **archivos cortos, responsabilidades únicas, y código reutilizable en vez de repetido o monolítico.**

## Principios que mandan

1. **Una responsabilidad por archivo.** Un handler no abre conexiones a la base ni arma SQL. Un componente de UI no contiene lógica de negocio. Si un archivo hace dos cosas grandes, son dos archivos.
2. **Archivos cortos.** Si un archivo supera ~200 líneas, es señal de que algo debe extraerse. No es una regla rígida, es un disparador para preguntarte "¿qué parte de esto es reutilizable o separable?".
3. **Extraer antes que repetir.** Si un bloque de lógica o de UI aparece dos veces, se extrae a una función, hook o componente compartido. La segunda repetición es la señal.
4. **Importar, no inflar.** El código vive en su carpeta por capa (handlers, services, repos, componentes) y se importa donde se usa. No se amontona todo en un archivo "porque es más rápido".

## Estructura del backend (Go + Gin)

Organización por capas. Cada capa tiene su carpeta y se importa hacia arriba (handler → service → repo). La dependencia siempre apunta hacia adentro: el handler conoce al service, el service conoce al repo, nunca al revés.

```
apps/api/
├── cmd/
│   └── api/
│       └── main.go            # arranque, wiring de dependencias, server Gin
├── internal/
│   ├── config/                # carga de variables de entorno
│   ├── domain/                # entidades y reglas puras (cliente, beneficio, condicion…)
│   ├── handler/               # capa HTTP: reciben request, validan, responden
│   │   ├── cliente_handler.go
│   │   ├── beneficio_handler.go
│   │   └── dto/               # structs request/response (no son el dominio)
│   ├── service/               # lógica de negocio (contador de infusiones, beneficios)
│   │   ├── cliente_service.go
│   │   └── beneficio_service.go
│   ├── repository/            # acceso a datos
│   │   ├── interfaces.go      # interfaces que consumen los services
│   │   └── postgres/          # impl. Postgres que envuelve sqlc
│   ├── db/
│   │   └── sqlc/              # código generado por sqlc — no se edita a mano
│   ├── middleware/            # auth, rbac, logging, recovery de Gin
│   └── router/               # mapea rutas → middlewares → handlers
├── pkg/                       # reutilizable (jwt, hash/bcrypt, response)
├── db/
│   ├── migrations/            # golang-migrate
│   └── queries/              # SQL fuente de sqlc (.sql)
└── docs/                      # OpenAPI/Swagger generado por swaggo
```

**Regla de oro del backend:** el handler es delgado. Su trabajo es traducir HTTP ↔ dominio: parsear el request, llamar al service, mapear el resultado a la respuesta. Toda la lógica de negocio vive en `service/`. Todo el SQL fuente vive en `db/queries/` y se accede vía `repository/` (que envuelve el código generado en `internal/db/sqlc/`). Si un handler tiene más de ~50 líneas o contiene un `if` de regla de negocio, esa lógica va al service.

## Estructura del frontend (Expo / React Native + Web)

Organización por feature + carpetas compartidas. Lo que pertenece a una pantalla vive con esa pantalla; lo reutilizable sube a `components/` o `hooks/`.

```
apps/web/
├── app/                       # rutas (Expo Router)
├── src/
│   ├── components/            # componentes reutilizables y "tontos" (presentacionales)
│   │   ├── ui/                # botones, cards, inputs base (sistema de diseño)
│   │   └── ...
│   ├── features/              # cada feature con su lógica y componentes propios
│   │   ├── beneficios/
│   │   │   ├── components/    # componentes solo de esta feature
│   │   │   ├── hooks/
│   │   │   └── screens/
│   │   └── fidelizacion/
│   ├── hooks/                 # hooks reutilizables entre features
│   ├── api/                   # wrappers + hooks de datos sobre @primitivo/api-client
│   ├── lib/                   # utilidades puras (formato, validación)
│   └── theme/                 # tokens de la marca editorial blanco/negro
```

> El cliente TS tipado **no** se genera dentro de `apps/web`: vive en el paquete compartido `packages/api-client` (ver skill `primitivo-openapi-client`). En `apps/web/src/api/` solo van los wrappers y hooks que lo consumen.

**Regla de oro del frontend:** un componente que crece se divide. Cuando un componente de pantalla supera ~150 líneas o tiene JSX muy anidado, extraé sub-componentes a su carpeta `components/` y la lógica a un custom hook (`useBeneficios`, `useInfusionesCliente`). El componente de pantalla queda como un orquestador legible que compone piezas, no como un muro de JSX.

## Cuándo extraer (señales concretas)

Extraé a algo reutilizable cuando:
- El mismo bloque de UI o lógica aparece por segunda vez → componente/función compartida.
- Un componente mezcla "cómo se ve" con "de dónde vienen los datos" → separá presentacional (recibe props) de contenedor (trae datos vía hook).
- Una función tiene más de una razón para cambiar → partila.
- Un `useEffect` o handler tiene lógica que podrías testear sola → llevala a `lib/` o a un hook.

## Cuándo NO sobre-modularizar

No partas por partir. Un componente de 40 líneas claro y usado en un solo lugar está bien como está. La modularización es para legibilidad y reutilización reales, no para multiplicar archivos diminutos que obligan a saltar entre diez ficheros para entender una pantalla. El criterio es: **¿esto mejora la legibilidad o evita repetición real?** Si la respuesta es no, dejalo.

## Convención de nombres (acordada entre el equipo)

- Carpetas en minúscula, kebab-case si hace falta (`features/fidelizacion`).
- Archivos Go: `snake_case.go` con sufijo de capa (`cliente_handler.go`, `cliente_service.go`).
- Componentes React: `PascalCase.tsx` (`BeneficioCard.tsx`).
- Hooks: `useAlgo.ts` en camelCase con prefijo `use`.
- Un componente por archivo; el nombre del archivo == nombre del componente.
