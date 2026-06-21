package service

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
)

// ActualizarInstitucionInput son los datos editables de una institución.
type ActualizarInstitucionInput struct {
	Nombre string
	Activa bool
}

// InstitucionService gestiona los convenios (instituciones).
type InstitucionService struct {
	instituciones repository.InstitucionRepository
}

// NewInstitucionService inyecta el repositorio de instituciones.
func NewInstitucionService(instituciones repository.InstitucionRepository) *InstitucionService {
	return &InstitucionService{instituciones: instituciones}
}

// Crear da de alta una institución.
func (s *InstitucionService) Crear(ctx context.Context, nombre string) (domain.Institucion, error) {
	return s.instituciones.Crear(ctx, strings.TrimSpace(nombre))
}

// List devuelve todas las instituciones.
func (s *InstitucionService) List(ctx context.Context) ([]domain.Institucion, error) {
	return s.instituciones.List(ctx)
}

// Actualizar modifica nombre y estado (activa) de una institución.
func (s *InstitucionService) Actualizar(ctx context.Context, id uuid.UUID, in ActualizarInstitucionInput) (domain.Institucion, error) {
	return s.instituciones.Actualizar(ctx, domain.Institucion{
		ID:     id,
		Nombre: strings.TrimSpace(in.Nombre),
		Activa: in.Activa,
	})
}
