# Deploy — Primitivo (Vercel + Render + Neon)

Tres piezas: **Neon** (PostgreSQL), **Render** (API Go) y **Vercel** (PWA). Deployá en
ese orden: la API necesita la BD, y el front necesita la URL de la API.

Archivos que ya quedaron en el repo:

- `apps/api/Dockerfile` + `apps/api/entrypoint.sh` — imagen de la API; corre las
  migraciones (`migrate up`) al arrancar y luego levanta el servidor.
- `render.yaml` — Blueprint de Render (servicio web Docker).
- `apps/web/vercel.json` — build estático de Expo (`expo export` → `dist/`).

---

## 1. Neon (base de datos)

1. Crear cuenta en https://neon.tech y un **Project** (región más cercana, ej. `sa-east-1` / São Paulo).
2. Dentro del proyecto, la base por defecto sirve; opcionalmente creá una llamada `primitivo`.
3. Copiar la **connection string**. Importante: usar la **directa** (la que **no** dice
   `-pooler`), porque las migraciones de golang-migrate usan advisory locks que el pooler
   (PgBouncer en modo transacción) no soporta. Debe incluir `?sslmode=require`:
   ```
   postgresql://USER:PASS@ep-xxxx.sa-east-1.aws.neon.tech/primitivo?sslmode=require
   ```
4. Guardá esa URL: es el `DATABASE_URL` que vas a poner en Render.

> Las migraciones se aplican solas en el primer deploy de la API (ver entrypoint).

---

## 2. Render (API Go)

1. Subí el repo a GitHub (si no está).
2. En https://render.com → **New → Blueprint**, conectá el repo. Render detecta
   `render.yaml` y propone el servicio `primitivo-api`.
3. Antes de crear, completá las variables marcadas como "manual":
   - `DATABASE_URL` → la connection string **directa** de Neon (paso 1).
   - `CORS_ALLOWED_ORIGINS` → por ahora dejá `http://localhost:8081` (se actualiza en el paso 4).
   - `JWT_SECRET` → lo genera Render solo. `APP_ENV=production` ya viene fijo.
4. Crear. Render buildea la imagen Docker, corre las migraciones y levanta la API.
5. Verificá: `https://primitivo-api.onrender.com/health` → `{"status":"ok","db":"up"}`.
   Anotá esa URL base de la API: el front la usa como `.../api/v1`.

> Nota plan free: el servicio se **duerme** tras ~15 min sin tráfico; la primera request
> lo despierta (~30 s de cold start). Para que esté siempre activo, subí a Starter (US$7).

---

## 3. Vercel (frontend PWA)

1. En https://vercel.com → **Add New → Project**, importá el repo.
2. **Root Directory**: `apps/web` (Vercel detecta el monorepo pnpm y `vercel.json`).
3. **Environment Variables** (Production y Preview):
   - `EXPO_PUBLIC_API_URL` → `https://primitivo-api.onrender.com/api/v1` (la URL del paso 2 + `/api/v1`).
4. Deploy. El build corre `expo export --platform web` y publica `dist/`.
5. Anotá el dominio que te da Vercel, ej. `https://primitivo.vercel.app`.

> `EXPO_PUBLIC_API_URL` se embebe en build: si la cambiás, hay que **redeployar** el front.

---

## 4. Cerrar el círculo (CORS)

1. Volvé a Render → servicio `primitivo-api` → **Environment**.
2. Actualizá `CORS_ALLOWED_ORIGINS` con el dominio de Vercel (coma-separado si hay varios):
   ```
   https://primitivo.vercel.app
   ```
3. Guardar → Render redeploya. Listo: el front ya puede hablar con la API.

---

## 5. Usuario administrador inicial

No hay registro público: los usuarios los crea un admin. Para el **primer** admin,
insertalo una vez a mano (la contraseña va hasheada con bcrypt). Lo más simple:
ejecutar un comando de seed local apuntando a Neon (a definir), o insertar por SQL con
un hash bcrypt ya generado.

> Si querés, agrego un comando `cmd/seed` que cree el admin desde `ADMIN_EMAIL` /
> `ADMIN_PASSWORD` y lo corrés una vez (local contra Neon, o como Job en Render).

---

## Redeploys

- **API**: push a la branch conectada → Render rebuildea (autoDeploy) y re-corre migraciones.
- **Front**: push → Vercel rebuildea. Si cambió el contrato de la API, regenerá el cliente
  (`pnpm generate:client`) y commiteá antes de pushear.
