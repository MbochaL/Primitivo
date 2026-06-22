package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// BeneficioRepo implementa repository.BeneficioRepository sobre PostgreSQL.
type BeneficioRepo struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

// NewBeneficioRepo construye el repositorio de beneficios.
func NewBeneficioRepo(pool *pgxpool.Pool) *BeneficioRepo {
	return &BeneficioRepo{pool: pool, q: sqlc.New(pool)}
}

// ── helpers ──────────────────────────────────────────────────────────────────

func toBeneficio(row sqlc.Beneficio) domain.Beneficio {
	return domain.Beneficio{
		ID:            row.ID,
		InstitucionID: row.InstitucionID,
		Nombre:        row.Nombre,
		Activo:        row.Activo,
	}
}

func toCondicion(row sqlc.Condicione) domain.Condicion {
	return domain.Condicion{
		ID:               row.ID,
		BeneficioID:      row.BeneficioID,
		UmbralInfusiones: int(row.UmbralInfusiones),
		TipoDescuento:    row.TipoDescuento,
		ValorDescuento:   int(row.ValorDescuento),
		ReiniciaContador: row.ReiniciaContador,
		Vigente:          row.Vigente,
	}
}

// ── BeneficioRepository ───────────────────────────────────────────────────────

func (r *BeneficioRepo) ListBeneficios(ctx context.Context) ([]domain.BeneficioConDetalle, error) {
	rows, err := r.q.ListBeneficios(ctx)
	if err != nil {
		return nil, err
	}
	// Cargamos todas las condiciones de una vez y las agrupamos en Go.
	allConds, err := r.q.ListTodasCondiciones(ctx)
	if err != nil {
		return nil, err
	}
	condsByBeneficio := make(map[uuid.UUID][]domain.Condicion, len(rows))
	for _, c := range allConds {
		condsByBeneficio[c.BeneficioID] = append(condsByBeneficio[c.BeneficioID], toCondicion(c))
	}

	out := make([]domain.BeneficioConDetalle, 0, len(rows))
	for _, row := range rows {
		conds := condsByBeneficio[row.ID]
		if conds == nil {
			conds = []domain.Condicion{}
		}
		out = append(out, domain.BeneficioConDetalle{
			Beneficio: domain.Beneficio{
				ID:            row.ID,
				InstitucionID: row.InstitucionID,
				Nombre:        row.Nombre,
				Activo:        row.Activo,
			},
			InstitucionNombre: row.InstitucionNombre,
			Condiciones:       conds,
		})
	}
	return out, nil
}

func (r *BeneficioRepo) GetBeneficio(ctx context.Context, id uuid.UUID) (domain.BeneficioConDetalle, error) {
	row, err := r.q.GetBeneficioPorID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.BeneficioConDetalle{}, domain.ErrBeneficioNoEncontrado
	}
	if err != nil {
		return domain.BeneficioConDetalle{}, err
	}
	condRows, err := r.q.ListCondicionesPorBeneficio(ctx, id)
	if err != nil {
		return domain.BeneficioConDetalle{}, err
	}
	conds := make([]domain.Condicion, 0, len(condRows))
	for _, c := range condRows {
		conds = append(conds, toCondicion(c))
	}
	return domain.BeneficioConDetalle{
		Beneficio: domain.Beneficio{
			ID:            row.ID,
			InstitucionID: row.InstitucionID,
			Nombre:        row.Nombre,
			Activo:        row.Activo,
		},
		InstitucionNombre: row.InstitucionNombre,
		Condiciones:       conds,
	}, nil
}

func (r *BeneficioRepo) CrearBeneficio(ctx context.Context, n domain.NuevoBeneficio) (domain.Beneficio, error) {
	row, err := r.q.CreateBeneficio(ctx, sqlc.CreateBeneficioParams{
		InstitucionID: n.InstitucionID,
		Nombre:        n.Nombre,
	})
	if err != nil {
		return domain.Beneficio{}, err
	}
	return toBeneficio(row), nil
}

func (r *BeneficioRepo) ActualizarBeneficio(ctx context.Context, u domain.ActualizarBeneficioInput) (domain.Beneficio, error) {
	row, err := r.q.UpdateBeneficio(ctx, sqlc.UpdateBeneficioParams{
		ID:            u.ID,
		Nombre:        u.Nombre,
		Activo:        u.Activo,
		InstitucionID: u.InstitucionID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Beneficio{}, domain.ErrBeneficioNoEncontrado
	}
	if err != nil {
		return domain.Beneficio{}, err
	}
	return toBeneficio(row), nil
}

func (r *BeneficioRepo) DesactivarBeneficio(ctx context.Context, id uuid.UUID) (domain.Beneficio, error) {
	row, err := r.q.ToggleBeneficioActivo(ctx, sqlc.ToggleBeneficioActivoParams{
		ID:     id,
		Activo: false,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Beneficio{}, domain.ErrBeneficioNoEncontrado
	}
	if err != nil {
		return domain.Beneficio{}, err
	}
	return toBeneficio(row), nil
}

// ── Condiciones ───────────────────────────────────────────────────────────────

func (r *BeneficioRepo) CrearCondicion(ctx context.Context, n domain.NuevaCondicion) (domain.Condicion, error) {
	row, err := r.q.CreateCondicion(ctx, sqlc.CreateCondicionParams{
		BeneficioID:      n.BeneficioID,
		UmbralInfusiones: int32(n.UmbralInfusiones),
		TipoDescuento:    n.TipoDescuento,
		ValorDescuento:   int32(n.ValorDescuento),
		ReiniciaContador: n.ReiniciaContador,
		Vigente:          n.Vigente,
	})
	if err != nil {
		return domain.Condicion{}, err
	}
	return toCondicion(row), nil
}

func (r *BeneficioRepo) ActualizarCondicion(ctx context.Context, u domain.ActualizarCondicionInput) (domain.Condicion, error) {
	row, err := r.q.UpdateCondicion(ctx, sqlc.UpdateCondicionParams{
		ID:               u.ID,
		UmbralInfusiones: int32(u.UmbralInfusiones),
		TipoDescuento:    u.TipoDescuento,
		ValorDescuento:   int32(u.ValorDescuento),
		ReiniciaContador: u.ReiniciaContador,
		Vigente:          u.Vigente,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Condicion{}, domain.ErrCondicionNoEncontrada
	}
	if err != nil {
		return domain.Condicion{}, err
	}
	return toCondicion(row), nil
}
