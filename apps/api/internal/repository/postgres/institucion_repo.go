package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// InstitucionRepo implementa repository.InstitucionRepository sobre PostgreSQL.
type InstitucionRepo struct {
	q *sqlc.Queries
}

// NewInstitucionRepo construye el repositorio envolviendo el código generado por sqlc.
func NewInstitucionRepo(db sqlc.DBTX) *InstitucionRepo {
	return &InstitucionRepo{q: sqlc.New(db)}
}

func (r *InstitucionRepo) Crear(ctx context.Context, nombre string) (domain.Institucion, error) {
	row, err := r.q.CreateInstitucion(ctx, nombre)
	if err != nil {
		return domain.Institucion{}, err
	}
	return aInstitucionDominio(row), nil
}

func (r *InstitucionRepo) GetByID(ctx context.Context, id uuid.UUID) (domain.Institucion, error) {
	row, err := r.q.GetInstitucionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Institucion{}, domain.ErrInstitucionNoEncontrada
		}
		return domain.Institucion{}, err
	}
	return aInstitucionDominio(row), nil
}

func (r *InstitucionRepo) List(ctx context.Context) ([]domain.Institucion, error) {
	rows, err := r.q.ListInstituciones(ctx)
	if err != nil {
		return nil, err
	}
	instituciones := make([]domain.Institucion, 0, len(rows))
	for _, row := range rows {
		instituciones = append(instituciones, aInstitucionDominio(row))
	}
	return instituciones, nil
}

func (r *InstitucionRepo) Actualizar(ctx context.Context, i domain.Institucion) (domain.Institucion, error) {
	row, err := r.q.UpdateInstitucion(ctx, sqlc.UpdateInstitucionParams{
		ID:     i.ID,
		Nombre: i.Nombre,
		Activa: i.Activa,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Institucion{}, domain.ErrInstitucionNoEncontrada
		}
		return domain.Institucion{}, err
	}
	return aInstitucionDominio(row), nil
}

func aInstitucionDominio(row sqlc.Institucione) domain.Institucion {
	return domain.Institucion{
		ID:        row.ID,
		Nombre:    row.Nombre,
		Activa:    row.Activa,
		CreatedAt: row.CreatedAt.Time,
	}
}
