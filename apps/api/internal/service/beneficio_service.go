package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
)

// BeneficioService gestiona beneficios y sus condiciones escalonadas (CRUD admin).
type BeneficioService struct {
	repo repository.BeneficioRepository
}

// NewBeneficioService inyecta el repositorio de beneficios.
func NewBeneficioService(repo repository.BeneficioRepository) *BeneficioService {
	return &BeneficioService{repo: repo}
}

func (s *BeneficioService) ListBeneficios(ctx context.Context) ([]domain.BeneficioConDetalle, error) {
	return s.repo.ListBeneficios(ctx)
}

func (s *BeneficioService) GetBeneficio(ctx context.Context, id uuid.UUID) (domain.BeneficioConDetalle, error) {
	return s.repo.GetBeneficio(ctx, id)
}

func (s *BeneficioService) CrearBeneficio(ctx context.Context, n domain.NuevoBeneficio) (domain.Beneficio, error) {
	return s.repo.CrearBeneficio(ctx, n)
}

func (s *BeneficioService) ActualizarBeneficio(ctx context.Context, u domain.ActualizarBeneficioInput) (domain.Beneficio, error) {
	return s.repo.ActualizarBeneficio(ctx, u)
}

func (s *BeneficioService) DesactivarBeneficio(ctx context.Context, id uuid.UUID) (domain.Beneficio, error) {
	return s.repo.DesactivarBeneficio(ctx, id)
}

func (s *BeneficioService) CrearCondicion(ctx context.Context, n domain.NuevaCondicion) (domain.Condicion, error) {
	return s.repo.CrearCondicion(ctx, n)
}

func (s *BeneficioService) ActualizarCondicion(ctx context.Context, u domain.ActualizarCondicionInput) (domain.Condicion, error) {
	return s.repo.ActualizarCondicion(ctx, u)
}
