// Package repository define los contratos (interfaces) de acceso a datos que consumen
// los services. La implementación concreta (Postgres) vive en el subpaquete postgres.
package repository

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// UsuarioRepository abstrae la persistencia de los usuarios del sistema.
// El service depende de esta interfaz, nunca de la implementación concreta.
type UsuarioRepository interface {
	Crear(ctx context.Context, u domain.Usuario) (domain.Usuario, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.Usuario, error)
	GetByEmail(ctx context.Context, email string) (domain.Usuario, error)
	List(ctx context.Context) ([]domain.Usuario, error)
	Actualizar(ctx context.Context, u domain.Usuario) (domain.Usuario, error)
	ActualizarPassword(ctx context.Context, id uuid.UUID, passwordHash string) error
}

// InstitucionRepository abstrae la persistencia de las instituciones.
type InstitucionRepository interface {
	Crear(ctx context.Context, nombre string) (domain.Institucion, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.Institucion, error)
	List(ctx context.Context) ([]domain.Institucion, error)
	Actualizar(ctx context.Context, i domain.Institucion) (domain.Institucion, error)
}

// ClienteRepository abstrae la persistencia de los clientes y sus vistas asociadas.
type ClienteRepository interface {
	Crear(ctx context.Context, c domain.Cliente) (domain.Cliente, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.ClienteConInstitucion, error)
	GetByDNI(ctx context.Context, dni string) (domain.ClienteConInstitucion, error)
	List(ctx context.Context) ([]domain.ClienteConInstitucion, error)
	Actualizar(ctx context.Context, c domain.Cliente) (domain.Cliente, error)
	Historial(ctx context.Context, clienteID uuid.UUID) ([]domain.Compra, error)
	CondicionesPorInstitucion(ctx context.Context, institucionID *uuid.UUID) ([]domain.BeneficioDisponible, error)

	// Contadores para triggers dinámicos (scope_trigger='categoria'/'producto')
	ContarItemsPorCategoria(ctx context.Context, clienteID, categoriaID uuid.UUID, desde *time.Time) (int, error)
	ContarItemsPorProducto(ctx context.Context, clienteID, productoID uuid.UUID, desde *time.Time) (int, error)
	GetFechaUltimoCanjeCondicion(ctx context.Context, clienteID, condicionID uuid.UUID) (*time.Time, error)
}

// MenuRepository abstrae la lectura y escritura del menú (categorías y productos).
type MenuRepository interface {
	// Lectura (ambos roles)
	ListCategorias(ctx context.Context) ([]domain.Categoria, error)
	ListProductosActivos(ctx context.Context) ([]domain.Producto, error)

	// Admin: listado completo (incluye inactivos)
	ListAllProductos(ctx context.Context) ([]domain.Producto, error)

	// Admin: CRUD categorías
	GetCategoria(ctx context.Context, id uuid.UUID) (domain.Categoria, error)
	CrearCategoria(ctx context.Context, n domain.NuevaCategoria) (domain.Categoria, error)
	ActualizarCategoria(ctx context.Context, u domain.ActualizarCategoriaInput) (domain.Categoria, error)

	// Admin: CRUD productos
	GetProducto(ctx context.Context, id uuid.UUID) (domain.Producto, error)
	CrearProducto(ctx context.Context, n domain.NuevoProducto) (domain.Producto, error)
	ActualizarProducto(ctx context.Context, u domain.ActualizarProductoInput) (domain.Producto, error)
	DesactivarProducto(ctx context.Context, id uuid.UUID) (domain.Producto, error)
}

// BeneficioRepository abstrae la persistencia de beneficios y condiciones (CRUD admin).
type BeneficioRepository interface {
	ListBeneficios(ctx context.Context) ([]domain.BeneficioConDetalle, error)
	GetBeneficio(ctx context.Context, id uuid.UUID) (domain.BeneficioConDetalle, error)
	CrearBeneficio(ctx context.Context, n domain.NuevoBeneficio) (domain.Beneficio, error)
	ActualizarBeneficio(ctx context.Context, u domain.ActualizarBeneficioInput) (domain.Beneficio, error)
	DesactivarBeneficio(ctx context.Context, id uuid.UUID) (domain.Beneficio, error)

	CrearCondicion(ctx context.Context, n domain.NuevaCondicion) (domain.Condicion, error)
	ActualizarCondicion(ctx context.Context, u domain.ActualizarCondicionInput) (domain.Condicion, error)
}

// CompraRepository registra ventas dentro de una transacción (el corazón del sistema).
type CompraRepository interface {
	RegistrarCompra(ctx context.Context, n domain.NuevaCompra) (domain.Compra, error)
	ListEnRango(ctx context.Context, desde, hasta time.Time) ([]domain.CompraConCliente, error)
}
