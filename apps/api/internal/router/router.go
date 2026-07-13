// Package router arma el motor Gin: middlewares globales y mapeo de rutas a handlers.
package router

import (
	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/internal/config"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler"
	"github.com/martinbosch1996/primitivo/apps/api/internal/middleware"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/jwt"
)

// Handlers reúne todos los handlers que el router necesita inyectados.
type Handlers struct {
	Health      *handler.HealthHandler
	Auth        *handler.AuthHandler
	Usuario     *handler.UsuarioHandler
	Institucion *handler.InstitucionHandler
	Cliente     *handler.ClienteHandler
	Menu        *handler.MenuHandler
	Compra      *handler.CompraHandler
	Beneficio   *handler.BeneficioHandler
}

// New construye el motor Gin con sus middlewares globales y rutas registradas.
// La cadena de middlewares va de afuera hacia adentro: recovery → logger → cors,
// y sobre las rutas protegidas, auth → rbac.
func New(cfg config.Config, jwtManager *jwt.Manager, h Handlers) *gin.Engine {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))

	// Healthcheck sin versionar (para probes externos).
	r.GET("/health", h.Health.Check)

	v1 := r.Group("/api/v1")
	{
		// ── Rutas públicas ──────────────────────────────────────────────
		v1.GET("/health", h.Health.Check)
		v1.POST("/auth/login", h.Auth.Login)
		v1.POST("/auth/refresh", h.Auth.Refresh)

		// ── Rutas protegidas (requieren JWT) ────────────────────────────
		protegidas := v1.Group("")
		protegidas.Use(middleware.Auth(jwtManager))
		{
			// Lectura compartida por ambos roles (operador y administrador).
			protegidas.GET("/instituciones", h.Institucion.List)

			// Clientes — operación diaria, ambos roles.
			protegidas.GET("/clientes", h.Cliente.List)
			protegidas.POST("/clientes", h.Cliente.Crear)
			protegidas.GET("/clientes/:id", h.Cliente.GetByID)
			protegidas.PUT("/clientes/:id", h.Cliente.Actualizar)
			protegidas.GET("/clientes/:id/historial", h.Cliente.Historial)
			protegidas.GET("/clientes/:id/beneficios", h.Cliente.Beneficios)

			// Menú (lectura) y registro de compras — ambos roles (caja).
			protegidas.GET("/menu", h.Menu.Get)
			protegidas.POST("/compras", h.Compra.Registrar)

			// Gestión — solo administrador.
			admin := protegidas.Group("")
			admin.Use(middleware.RequireRole(string(domain.RolAdministrador)))
			{
				// Importación masiva y eliminación de clientes
				admin.POST("/clientes/importar", h.Cliente.ImportarClientes)
				admin.DELETE("/clientes/:id", h.Cliente.Eliminar)

				// Usuarios del sistema
				admin.GET("/usuarios", h.Usuario.List)
				admin.POST("/usuarios", h.Usuario.Crear)
				admin.PUT("/usuarios/:id", h.Usuario.Actualizar)
				admin.PUT("/usuarios/:id/password", h.Usuario.ResetPassword)

				// Instituciones (escritura)
				admin.POST("/instituciones", h.Institucion.Crear)
				admin.PUT("/instituciones/:id", h.Institucion.Actualizar)
				admin.DELETE("/instituciones/:id", h.Institucion.Eliminar)

				// Menú — gestión admin
				admin.GET("/categorias", h.Menu.ListCategorias)
				admin.POST("/categorias", h.Menu.CrearCategoria)
				admin.PUT("/categorias/:id", h.Menu.ActualizarCategoria)

				admin.GET("/productos", h.Menu.ListProductos)
				admin.POST("/productos", h.Menu.CrearProducto)
				admin.PUT("/productos/:id", h.Menu.ActualizarProducto)
				admin.DELETE("/productos/:id", h.Menu.DesactivarProducto)

				// Historial global de compras
				admin.GET("/compras", h.Compra.List)
				admin.DELETE("/compras/:id", h.Compra.Eliminar)

				// Beneficios y condiciones
				admin.GET("/beneficios", h.Beneficio.List)
				admin.POST("/beneficios", h.Beneficio.Crear)
				admin.PUT("/beneficios/:id", h.Beneficio.Actualizar)
				admin.DELETE("/beneficios/:id", h.Beneficio.Eliminar)
				admin.POST("/beneficios/:id/condiciones", h.Beneficio.CrearCondicion)
				admin.PUT("/condiciones/:id", h.Beneficio.ActualizarCondicion)
			}
		}
	}

	return r
}
