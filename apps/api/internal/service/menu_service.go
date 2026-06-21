package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
)

// MenuService arma el menú completo agrupado por categoría.
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
