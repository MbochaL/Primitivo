package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

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
	b := domain.Beneficio{
		ID:     row.ID,
		Nombre: row.Nombre,
		Activo: row.Activo,
	}
	if row.InstitucionID.Valid {
		uid := uuid.UUID(row.InstitucionID.Bytes)
		b.InstitucionID = &uid
	}
	return b
}

func toCondicion(row sqlc.Condicione) domain.Condicion {
	c := domain.Condicion{
		ID:               row.ID,
		BeneficioID:      row.BeneficioID,
		UmbralInfusiones: int(row.UmbralInfusiones),
		TipoDescuento:    row.TipoDescuento,
		ValorDescuento:   int(row.ValorDescuento),
		ReiniciaContador: row.ReiniciaContador,
		Vigente:          row.Vigente,
		TipoTrigger:      row.TipoTrigger,
		ScopeTrigger:     row.ScopeTrigger,
		ScopeDescuento:   row.ScopeDescuento,
	}
	for _, d := range row.DiasSemana {
		c.DiasSemana = append(c.DiasSemana, int(d))
	}
	if row.ScopeTriggerCategoriaID.Valid {
		id := row.ScopeTriggerCategoriaID.Bytes
		uid := uuid.UUID(id)
		c.ScopeTriggerCategoriaID = &uid
	}
	if row.ScopeTriggerProductoID.Valid {
		id := row.ScopeTriggerProductoID.Bytes
		uid := uuid.UUID(id)
		c.ScopeTriggerProductoID = &uid
	}
	if row.ScopeDescuentoCategoriaID.Valid {
		id := row.ScopeDescuentoCategoriaID.Bytes
		uid := uuid.UUID(id)
		c.ScopeDescuentoCategoriaID = &uid
	}
	return c
}

func uuidPtrToPgtype(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: *id, Valid: true}
}

func intSliceToInt32(s []int) []int32 {
	if s == nil {
		return nil
	}
	out := make([]int32, len(s))
	for i, v := range s {
		out[i] = int32(v)
	}
	return out
}

// ── BeneficioRepository ───────────────────────────────────────────────────────

func (r *BeneficioRepo) ListBeneficios(ctx context.Context) ([]domain.BeneficioConDetalle, error) {
	rows, err := r.q.ListBeneficios(ctx)
	if err != nil {
		return nil, err
	}
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
		b := domain.Beneficio{ID: row.ID, Nombre: row.Nombre, Activo: row.Activo}
		if row.InstitucionID.Valid {
			uid := uuid.UUID(row.InstitucionID.Bytes)
			b.InstitucionID = &uid
		}
		var instNombre *string
		if row.InstitucionNombre.Valid {
			instNombre = &row.InstitucionNombre.String
		}
		out = append(out, domain.BeneficioConDetalle{
			Beneficio:         b,
			InstitucionNombre: instNombre,
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
	b := domain.Beneficio{ID: row.ID, Nombre: row.Nombre, Activo: row.Activo}
	if row.InstitucionID.Valid {
		uid := uuid.UUID(row.InstitucionID.Bytes)
		b.InstitucionID = &uid
	}
	var instNombre *string
	if row.InstitucionNombre.Valid {
		instNombre = &row.InstitucionNombre.String
	}
	return domain.BeneficioConDetalle{
		Beneficio:         b,
		InstitucionNombre: instNombre,
		Condiciones:       conds,
	}, nil
}

func (r *BeneficioRepo) CrearBeneficio(ctx context.Context, n domain.NuevoBeneficio) (domain.Beneficio, error) {
	row, err := r.q.CreateBeneficio(ctx, sqlc.CreateBeneficioParams{
		InstitucionID: uuidPtrToPgtype(n.InstitucionID),
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
		InstitucionID: uuidPtrToPgtype(u.InstitucionID),
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
		BeneficioID:               n.BeneficioID,
		UmbralInfusiones:          int32(n.UmbralInfusiones),
		TipoDescuento:             n.TipoDescuento,
		ValorDescuento:            int32(n.ValorDescuento),
		ReiniciaContador:          n.ReiniciaContador,
		Vigente:                   n.Vigente,
		TipoTrigger:               n.TipoTrigger,
		DiasSemana:                intSliceToInt32(n.DiasSemana),
		ScopeTrigger:              n.ScopeTrigger,
		ScopeTriggerCategoriaID:   uuidPtrToPgtype(n.ScopeTriggerCategoriaID),
		ScopeTriggerProductoID:    uuidPtrToPgtype(n.ScopeTriggerProductoID),
		ScopeDescuento:            n.ScopeDescuento,
		ScopeDescuentoCategoriaID: uuidPtrToPgtype(n.ScopeDescuentoCategoriaID),
	})
	if err != nil {
		return domain.Condicion{}, err
	}
	return toCondicion(row), nil
}

func (r *BeneficioRepo) ActualizarCondicion(ctx context.Context, u domain.ActualizarCondicionInput) (domain.Condicion, error) {
	row, err := r.q.UpdateCondicion(ctx, sqlc.UpdateCondicionParams{
		ID:                        u.ID,
		UmbralInfusiones:          int32(u.UmbralInfusiones),
		TipoDescuento:             u.TipoDescuento,
		ValorDescuento:            int32(u.ValorDescuento),
		ReiniciaContador:          u.ReiniciaContador,
		Vigente:                   u.Vigente,
		TipoTrigger:               u.TipoTrigger,
		DiasSemana:                intSliceToInt32(u.DiasSemana),
		ScopeTrigger:              u.ScopeTrigger,
		ScopeTriggerCategoriaID:   uuidPtrToPgtype(u.ScopeTriggerCategoriaID),
		ScopeTriggerProductoID:    uuidPtrToPgtype(u.ScopeTriggerProductoID),
		ScopeDescuento:            u.ScopeDescuento,
		ScopeDescuentoCategoriaID: uuidPtrToPgtype(u.ScopeDescuentoCategoriaID),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Condicion{}, domain.ErrCondicionNoEncontrada
	}
	if err != nil {
		return domain.Condicion{}, err
	}
	return toCondicion(row), nil
}
