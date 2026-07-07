package service

import (
	"context"
	"strings"
	"time"

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
	if _, err := s.clientes.GetByID(ctx, clienteID); err != nil {
		return nil, err
	}
	return s.clientes.Historial(ctx, clienteID)
}

// BeneficiosDisponibles evalúa las condiciones vigentes de la institución del cliente
// y marca cuáles ya alcanzó según su trigger (siempre, días de semana o contador).
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

	now := time.Now()
	for i := range conds {
		conds[i].Alcanzado, err = s.evaluarTrigger(ctx, &conds[i], cliente, clienteID, now)
		if err != nil {
			return nil, err
		}
	}
	return conds, nil
}

// evaluarTrigger determina si la condición está disponible para el cliente ahora.
func (s *ClienteService) evaluarTrigger(
	ctx context.Context,
	c *domain.BeneficioDisponible,
	cliente domain.ClienteConInstitucion,
	clienteID uuid.UUID,
	now time.Time,
) (bool, error) {
	switch c.TipoTrigger {
	case "siempre":
		return true, nil

	case "dias_semana":
		weekday := int(now.Weekday())
		for _, d := range c.DiasSemana {
			if d == weekday {
				return true, nil
			}
		}
		return false, nil

	default: // "contador"
		var count int
		var err error

		switch c.ScopeTrigger {
		case "categoria":
			if c.ScopeTriggerCategoriaID == nil {
				return false, nil
			}
			var desde *time.Time
			if c.ReiniciaContador {
				desde, err = s.clientes.GetFechaUltimoCanjeCondicion(ctx, clienteID, c.CondicionID)
				if err != nil {
					return false, err
				}
			}
			count, err = s.clientes.ContarItemsPorCategoria(ctx, clienteID, *c.ScopeTriggerCategoriaID, desde)
			if err != nil {
				return false, err
			}

		case "producto":
			if c.ScopeTriggerProductoID == nil {
				return false, nil
			}
			var desde *time.Time
			if c.ReiniciaContador {
				desde, err = s.clientes.GetFechaUltimoCanjeCondicion(ctx, clienteID, c.CondicionID)
				if err != nil {
					return false, err
				}
			}
			count, err = s.clientes.ContarItemsPorProducto(ctx, clienteID, *c.ScopeTriggerProductoID, desde)
			if err != nil {
				return false, err
			}

		default: // "infusiones"
			count = cliente.ContadorInfusiones
		}

		return count >= c.UmbralInfusiones, nil
	}
}
