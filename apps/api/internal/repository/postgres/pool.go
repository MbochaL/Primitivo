// Package postgres contiene la implementación de los repositorios sobre PostgreSQL (pgx)
// y la construcción del pool de conexiones.
package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	pgxuuid "github.com/vgarvardt/pgx-google-uuid/v5"
)

// NewPool crea un pool de conexiones pgx a partir del DSN de PostgreSQL.
// Registra el codec de google/uuid en cada conexión para que pgx pueda mapear las
// columnas uuid directamente a uuid.UUID (acorde al override de sqlc.yaml).
// No abre conexiones hasta que se usan; hacé Ping para verificar disponibilidad.
func NewPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	cfg.AfterConnect = func(_ context.Context, conn *pgx.Conn) error {
		pgxuuid.Register(conn.TypeMap())
		return nil
	}

	return pgxpool.NewWithConfig(ctx, cfg)
}
