package service

import (
	"context"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
)

// CompraService orquesta el registro de ventas. La transacción real vive en el repository.
type CompraService struct {
	compras repository.CompraRepository
}

// NewCompraService inyecta el repositorio de compras.
func NewCompraService(compras repository.CompraRepository) *CompraService {
	return &CompraService{compras: compras}
}

// RegistrarCompra valida la entrada y delega la persistencia transaccional al repositorio.
func (s *CompraService) RegistrarCompra(ctx context.Context, n domain.NuevaCompra) (domain.Compra, error) {
	if len(n.Items) == 0 {
		return domain.Compra{}, domain.ErrCompraSinItems
	}
	return s.compras.RegistrarCompra(ctx, n)
}
