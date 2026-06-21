# Makefile del backend (opcional; en Windows se pueden usar los scripts de package.json).
# Requiere make, y en el PATH: go, swag, sqlc, migrate.

GO      ?= go
SWAG    ?= swag
SQLC    ?= sqlc
MIGRATE ?= migrate

# Carga DATABASE_URL (y demás) desde el .env de la raíz si existe.
-include ../../.env
export

.PHONY: run build tidy vet sqlc swag migrate-up migrate-down migrate-create clean

run:
	$(GO) run ./cmd/api

build:
	$(GO) build -o bin/api ./cmd/api

tidy:
	$(GO) mod tidy

vet:
	$(GO) vet ./...

sqlc:
	$(SQLC) generate

swag:
	$(SWAG) init -g cmd/api/main.go -o docs

migrate-up:
	$(MIGRATE) -path db/migrations -database "$(DATABASE_URL)" up

migrate-down:
	$(MIGRATE) -path db/migrations -database "$(DATABASE_URL)" down 1

# Uso: make migrate-create name=crear_tabla_clientes
migrate-create:
	$(MIGRATE) create -ext sql -dir db/migrations -seq $(name)

clean:
	$(GO) clean
	rm -rf bin docs
