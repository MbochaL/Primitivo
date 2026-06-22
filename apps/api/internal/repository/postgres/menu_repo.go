package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"

	"github.com/google/uuid"
)

// MenuRepo implementa repository.MenuRepository sobre PostgreSQL.
type MenuRepo struct {
	q *sqlc.Queries
}

// NewMenuRepo construye el repositorio del menú.
func NewMenuRepo(db sqlc.DBTX) *MenuRepo {
	return &MenuRepo{q: sqlc.New(db)}
}

// ── helpers de mapeo ────────────────────────────────────────────────────────

func toCategoria(row sqlc.Categoria) domain.Categoria {
	return domain.Categoria{
		ID:      row.ID,
		Nombre:  row.Nombre,
		Seccion: domain.Seccion(row.Seccion),
		Orden:   int(row.Orden),
	}
}

func toProducto(row sqlc.Producto) domain.Producto {
	return domain.Producto{
		ID:          row.ID,
		CategoriaID: row.CategoriaID,
		Nombre:      row.Nombre,
		Descripcion: row.Descripcion,
		Precio:      int(row.Precio),
		EsInfusion:  row.EsInfusion,
		Activo:      row.Activo,
	}
}

// ── Lectura (ambos roles) ───────────────────────────────────────────────────

func (r *MenuRepo) ListCategorias(ctx context.Context) ([]domain.Categoria, error) {
	rows, err := r.q.ListCategorias(ctx)
	if err != nil {
		return nil, err
	}
	cats := make([]domain.Categoria, 0, len(rows))
	for _, row := range rows {
		cats = append(cats, toCategoria(row))
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
		prods = append(prods, toProducto(row))
	}
	return prods, nil
}

// ── Admin: listado completo ─────────────────────────────────────────────────

func (r *MenuRepo) ListAllProductos(ctx context.Context) ([]domain.Producto, error) {
	rows, err := r.q.ListAllProductos(ctx)
	if err != nil {
		return nil, err
	}
	prods := make([]domain.Producto, 0, len(rows))
	for _, row := range rows {
		prods = append(prods, toProducto(row))
	}
	return prods, nil
}

// ── Admin: CRUD categorías ──────────────────────────────────────────────────

func (r *MenuRepo) GetCategoria(ctx context.Context, id uuid.UUID) (domain.Categoria, error) {
	row, err := r.q.GetCategoriaPorID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Categoria{}, domain.ErrCategoriaNoEncontrada
	}
	if err != nil {
		return domain.Categoria{}, err
	}
	return toCategoria(row), nil
}

func (r *MenuRepo) CrearCategoria(ctx context.Context, n domain.NuevaCategoria) (domain.Categoria, error) {
	row, err := r.q.CreateCategoria(ctx, sqlc.CreateCategoriaParams{
		Nombre:  n.Nombre,
		Seccion: string(n.Seccion),
		Orden:   int32(n.Orden),
	})
	if err != nil {
		return domain.Categoria{}, err
	}
	return toCategoria(row), nil
}

func (r *MenuRepo) ActualizarCategoria(ctx context.Context, u domain.ActualizarCategoriaInput) (domain.Categoria, error) {
	row, err := r.q.UpdateCategoria(ctx, sqlc.UpdateCategoriaParams{
		ID:      u.ID,
		Nombre:  u.Nombre,
		Seccion: string(u.Seccion),
		Orden:   int32(u.Orden),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Categoria{}, domain.ErrCategoriaNoEncontrada
	}
	if err != nil {
		return domain.Categoria{}, err
	}
	return toCategoria(row), nil
}

// ── Admin: CRUD productos ───────────────────────────────────────────────────

func (r *MenuRepo) GetProducto(ctx context.Context, id uuid.UUID) (domain.Producto, error) {
	row, err := r.q.GetProductoPorID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Producto{}, domain.ErrProductoNoEncontrado
	}
	if err != nil {
		return domain.Producto{}, err
	}
	return toProducto(row), nil
}

func (r *MenuRepo) CrearProducto(ctx context.Context, n domain.NuevoProducto) (domain.Producto, error) {
	row, err := r.q.CreateProducto(ctx, sqlc.CreateProductoParams{
		CategoriaID: n.CategoriaID,
		Nombre:      n.Nombre,
		Descripcion: n.Descripcion,
		Precio:      int32(n.Precio),
		EsInfusion:  n.EsInfusion,
	})
	if err != nil {
		return domain.Producto{}, err
	}
	return toProducto(row), nil
}

func (r *MenuRepo) ActualizarProducto(ctx context.Context, u domain.ActualizarProductoInput) (domain.Producto, error) {
	row, err := r.q.UpdateProducto(ctx, sqlc.UpdateProductoParams{
		ID:          u.ID,
		CategoriaID: u.CategoriaID,
		Nombre:      u.Nombre,
		Descripcion: u.Descripcion,
		Precio:      int32(u.Precio),
		EsInfusion:  u.EsInfusion,
		Activo:      u.Activo,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Producto{}, domain.ErrProductoNoEncontrado
	}
	if err != nil {
		return domain.Producto{}, err
	}
	return toProducto(row), nil
}

func (r *MenuRepo) DesactivarProducto(ctx context.Context, id uuid.UUID) (domain.Producto, error) {
	row, err := r.q.ToggleProductoActivo(ctx, sqlc.ToggleProductoActivoParams{
		ID:     id,
		Activo: false,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Producto{}, domain.ErrProductoNoEncontrado
	}
	if err != nil {
		return domain.Producto{}, err
	}
	return toProducto(row), nil
}
