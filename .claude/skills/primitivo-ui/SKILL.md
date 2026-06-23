---
name: primitivo-ui
description: Estándares de UI y buenas prácticas de frontend para Primitivo, con su identidad de marca editorial blanco y negro de alto contraste. Úsala SIEMPRE que se construyan o modifiquen pantallas o componentes en Expo (React Native + React Native Web), cuando se elijan colores, tipografía o espaciado, cuando se integren prompts/diseños de Google Stitch, o cuando se decida cómo estructurar un componente. Si vas a escribir cualquier JSX o estilo para Primitivo, consultá esta skill primero para mantener consistencia visual y de código.
---

# UI y frontend — Primitivo

Primitivo es "pan · café · cocina" con una identidad **editorial, blanco y negro, alto contraste**. La UI debe sentirse limpia, tipográfica y deliberada — no genérica. Esta skill cubre tanto la estética como las buenas prácticas de React Native/Expo.

## Identidad visual (no negociable)

- **Paleta:** blanco y negro de alto contraste como base. Grises solo para jerarquía sutil. Evitá introducir colores de acento salvo que se acuerde explícitamente.
- **Tipografía:** protagonista. Estética editorial = la tipografía hace el trabajo visual. Jerarquía clara entre títulos y cuerpo, generoso uso del espacio en blanco.
- **Espaciado:** amplio y consistente. El aire es parte del diseño editorial.
- **Tokens:** colores, tamaños y espaciados viven en `src/theme/`. Ningún valor hardcodeado en componentes — siempre referenciá el token. Esto mantiene la marca consistente y editable en un solo lugar.

## Reglas de componentes (Expo / RN + Web)

1. **Multiplataforma real.** El código corre en nativo y web (React Native Web). Evitá APIs solo-nativas sin fallback. Probá que los componentes se vean bien en ambos.
2. **Presentacional vs contenedor.** Separá componentes que solo reciben props y renderizan (presentacionales, en `components/`) de los que traen datos (contenedores, vía hooks). Esto los hace reutilizables y testeables.
3. **Componentes cortos y compuestos.** Si un componente supera ~150 líneas o tiene JSX muy anidado, extraé sub-componentes y mové la lógica a un custom hook. Una pantalla debe leerse como una composición de piezas con nombre, no como un muro.
4. **Sistema de diseño en `components/ui/`.** Botones, cards, inputs y tipografía base se definen una vez ahí y se reutilizan. No recrees un botón en cada pantalla.

## Estructura de un componente

ALWAYS seguí este orden dentro de un componente para que cualquiera del equipo lo lea igual:

```tsx
// 1. imports
// 2. tipos / props
// 3. el componente
//    - hooks (estado, datos)
//    - handlers
//    - return (JSX limpio, delegando a sub-componentes)
// 4. estilos (StyleSheet, usando tokens del theme)
```

## Integración con Google Stitch

Cuando traigas un diseño desde Stitch:
- Traducí el diseño a la estructura de componentes de arriba, no pegues un bloque monolítico.
- Mapeá los valores visuales a los tokens de `src/theme/` en vez de copiar colores/tamaños crudos.
- Extraé los elementos repetidos del diseño a componentes de `components/ui/`.

## Custom hooks para lógica

Toda lógica de datos o estado complejo va a un hook (`useBeneficios`, `useInfusionesCliente`). El componente queda declarativo. Ejemplo de la frontera correcta:

**Mal:** un componente `PantallaBeneficios` con fetch, estado de loading, manejo de error y 200 líneas de JSX.

**Bien:** `useInfusionesCliente()` devuelve `{ datos, cargando, error }`; `PantallaBeneficios` compone `<EstadoCarga>`, `<ListaBeneficios>` y `<BeneficioCard>`, cada uno en su archivo.

## Consumo de la API

Usá el cliente TypeScript autogenerado desde OpenAPI (ver skill `primitivo-openapi-client`). No escribas fetch a mano ni tipos manuales para las respuestas — vienen del cliente generado, así frontend y backend nunca se desincronizan.
