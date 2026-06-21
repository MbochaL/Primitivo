package postgres

import (
	"context"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// MenuRepo implementa repository.MenuRepository sobre PostgreSQL.
type MenuRepo struct {
	q *sqlc.Queries
}

// NewMenuRepo construye el repositorio del menú.
func NewMenuRepo(db sqlc.DBTX) *MenuRepo {
	return &MenuRepo{q: sqlc.New(db)}
}

func (r *MenuRepo) ListCategorias(ctx context.Context) ([]domain.Categoria, error) {
	rows, err := r.q.ListCategorias(ctx)
	if err != nil {
		return nil, err
	}
	cats := make([]domain.Categoria, 0, len(rows))
	for _, row := range rows {
		cats = append(cats, domain.Categoria{
			ID:      row.ID,
			Nombre:  row.Nombre,
			Seccion: domain.Seccion(row.Seccion),
			Orden:   int(row.Orden),
		})
	}
	return cats, nil
}

func (r *MenuRepo) ListProductosActivos(ctx context.Context) ([]domain.Producto, error) {
	rows, err := r.q.ListProductosActivos(ctx)
	if err != nil {
		return nil, err
	}
	prods := make([]domain.Producto, 0, len(rows))
	for _, row := range rows {
		prods = append(prods, domain.Producto{
			ID:          row.ID,
			CategoriaID: row.CategoriaID,
			Nombre:      row.Nombre,
			Precio:      int(row.Precio),
			EsInfusion:  row.EsInfusion,
			Activo:      row.Activo,
		})
	}
	return prods, nil
}
