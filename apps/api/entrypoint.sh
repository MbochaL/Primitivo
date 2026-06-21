#!/bin/sh
set -e

# Aplica las migraciones pendientes antes de arrancar la API. Es idempotente:
# si la base ya está al día, no hace nada. golang-migrate usa una tabla de lock,
# así que es seguro ante reinicios.
if [ -n "$DATABASE_URL" ]; then
  echo "Aplicando migraciones..."
  migrate -path /app/db/migrations -database "$DATABASE_URL" up
else
  echo "ADVERTENCIA: DATABASE_URL no está seteada; se omiten las migraciones."
fi

echo "Iniciando API..."
exec /app/api
