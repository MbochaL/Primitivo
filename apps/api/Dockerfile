# ── Build ────────────────────────────────────────────────────────────────────
FROM golang:1.26-alpine AS build

WORKDIR /src

# Dependencias (capa cacheable).
COPY go.mod go.sum ./
RUN go mod download

# Código y build estático (binarios sin CGO).
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/api ./cmd/api

# CLI de golang-migrate para correr las migraciones al arrancar.
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.1 \
    && cp "$(go env GOPATH)/bin/migrate" /out/migrate

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/api /app/api
COPY --from=build /out/migrate /usr/local/bin/migrate
COPY --from=build /src/db/migrations /app/db/migrations
COPY --from=build /src/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Render inyecta PORT; lo exponemos a modo informativo.
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
