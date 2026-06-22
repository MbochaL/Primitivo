package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
)

// MenuService arma el menú completo agrupado por categoría y expone el CRUD admin.
type MenuService struct {
	menu repository.MenuRepository
}

// NewMenuService inyecta el repositorio del menú.
func NewMenuService(menu repository.MenuRepository) *MenuService {
	return &MenuService{menu: menu}
}

// GetMenu devuelve las categorías (ordenadas por sección/orden) con sus productos activos.
func (s *MenuService) GetMenu(ctx context.Context) ([]domain.CategoriaConProductos, error) {
	cats, err := s.menu.ListCategorias(ctx)
	if err != nil {
		return nil, err
	}
	prods, err := s.menu.ListProductosActivos(ctx)
	if err != nil {
		return nil, err
	}

	porCategoria := make(map[uuid.UUID][]domain.Producto, len(cats))
	for _, p := range prods {
		porCategoria[p.CategoriaID] = append(porCategoria[p.CategoriaID], p)
	}

	out := make([]domain.CategoriaConProductos, 0, len(cats))
	for _, c := range cats {
		out = append(out, domain.CategoriaConProductos{
			Categoria: c,
			Productos: porCategoria[c.ID],
		})
	}
	return out, nil
}

// ListCategorias devuelve todas las categorías (admin).
func (s *MenuService) ListCategorias(ctx context.Context) ([]domain.Categoria, error) {
	return s.menu.ListCategorias(ctx)
}

// CrearCategoria crea una categoría nueva (admin).
func (s *MenuService) CrearCategoria(ctx context.Context, n domain.NuevaCategoria) (domain.Categoria, error) {
	return s.menu.CrearCategoria(ctx, n)
}

// ActualizarCategoria edita una categoría existente (admin).
func (s *MenuService) ActualizarCategoria(ctx context.Context, u domain.ActualizarCategoriaInput) (domain.Categoria, error) {
	return s.menu.ActualizarCategoria(ctx, u)
}

// ListAllProductos devuelve todos los productos incluyendo inactivos (admin).
func (s *MenuService) ListAllProductos(ctx context.Context) ([]domain.Producto, error) {
	return s.menu.ListAllProductos(ctx)
}

// CrearProducto crea un producto nuevo (admin).
func (s *MenuService) CrearProducto(ctx context.Context, n domain.NuevoProducto) (domain.Producto, error) {
	return s.menu.CrearProducto(ctx, n)
}

// ActualizarProducto edita un producto existente (admin).
func (s *MenuService) ActualizarProducto(ctx context.Context, u domain.ActualizarProductoInput) (domain.Producto, error) {
	return s.menu.ActualizarProducto(ctx, u)
}

// DesactivarProducto hace baja lógica de un producto (admin).
func (s *MenuService) DesactivarProducto(ctx context.Context, id uuid.UUID) (domain.Producto, error) {
	return s.menu.DesactivarProducto(ctx, id)
}
