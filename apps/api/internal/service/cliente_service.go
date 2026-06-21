package service

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
)

// CrearClienteInput son los datos para dar de alta un cliente.
type CrearClienteInput struct {
	DNI           string
	Nombre        string
	Email         *string
	InstitucionID *uuid.UUID
}

// ActualizarClienteInput son los datos editables de un cliente (el DNI no se cambia).
type ActualizarClienteInput struct {
	Nombre        string
	Email         *string
	InstitucionID *uuid.UUID
}

// ClienteService maneja la operación diaria sobre clientes (búsqueda por DNI, alta, etc.).
type ClienteService struct {
	clientes repository.ClienteRepository
}

// NewClienteService inyecta el repositorio de clientes.
func NewClienteService(clientes repository.ClienteRepository) *ClienteService {
	return &ClienteService{clientes: clientes}
}

// BuscarPorDNI es la búsqueda principal del dashboard.
func (s *ClienteService) BuscarPorDNI(ctx context.Context, dni string) (domain.ClienteConInstitucion, error) {
	return s.clientes.GetByDNI(ctx, strings.TrimSpace(dni))
}

// GetByID devuelve el detalle de un cliente con su institución.
func (s *ClienteService) GetByID(ctx context.Context, id uuid.UUID) (domain.ClienteConInstitucion, error) {
	return s.clientes.GetByID(ctx, id)
}

// List devuelve los clientes recientes.
func (s *ClienteService) List(ctx context.Context) ([]domain.ClienteConInstitucion, error) {
	return s.clientes.List(ctx)
}

// Crear da de alta un cliente.
func (s *ClienteService) Crear(ctx context.Context, in CrearClienteInput) (domain.Cliente, error) {
	return s.clientes.Crear(ctx, domain.Cliente{
		DNI:           strings.TrimSpace(in.DNI),
		Nombre:        strings.TrimSpace(in.Nombre),
		Email:         in.Email,
		InstitucionID: in.InstitucionID,
	})
}

// Actualizar modifica los datos editables de un cliente.
func (s *ClienteService) Actualizar(ctx context.Context, id uuid.UUID, in ActualizarClienteInput) (domain.Cliente, error) {
	return s.clientes.Actualizar(ctx, domain.Cliente{
		ID:            id,
		Nombre:        strings.TrimSpace(in.Nombre),
		Email:         in.Email,
		InstitucionID: in.InstitucionID,
	})
}

// Historial devuelve las compras del cliente (más recientes primero).
func (s *ClienteService) Historial(ctx context.Context, clienteID uuid.UUID) ([]domain.Compra, error) {
	// Verifica que el cliente exista (404 claro) antes de listar.
	if _, err := s.clientes.GetByID(ctx, clienteID); err != nil {
		return nil, err
	}
	return s.clientes.Historial(ctx, clienteID)
}

// BeneficiosDisponibles evalúa las condiciones vigentes de la institución del cliente
// y marca cuáles ya alcanzó según su contador de infusiones.
func (s *ClienteService) BeneficiosDisponibles(ctx context.Context, clienteID uuid.UUID) ([]domain.BeneficioDisponible, error) {
	cliente, err := s.clientes.GetByID(ctx, clienteID)
	if err != nil {
		return nil, err
	}
	if cliente.InstitucionID == nil {
		return []domain.BeneficioDisponible{}, nil
	}
	conds, err := s.clientes.CondicionesPorInstitucion(ctx, *cliente.InstitucionID)
	if err != nil {
		return nil, err
	}
	for i := range conds {
		conds[i].Alcanzado = cliente.ContadorInfusiones >= conds[i].UmbralInfusiones
	}
	return conds, nil
}
