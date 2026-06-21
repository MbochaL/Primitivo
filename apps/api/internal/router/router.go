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
		v1.POST("/auth/login", h.Auth.Login)
		v1.POST("/auth/refresh", h.Auth.Refresh)

		// ── Rutas protegidas (requieren JWT) ────────────────────────────
		protegidas := v1.Group("")
		protegidas.Use(middleware.Auth(jwtManager))
		{
			// Lectura compartida por ambos roles (operador y administrador).
			protegidas.GET("/instituciones", h.Institucion.List)

			// Gestión — solo administrador.
			admin := protegidas.Group("")
			admin.Use(middleware.RequireRole(string(domain.RolAdministrador)))
			{
				// Usuarios del sistema
				admin.GET("/usuarios", h.Usuario.List)
				admin.POST("/usuarios", h.Usuario.Crear)
				admin.PUT("/usuarios/:id", h.Usuario.Actualizar)
				admin.PUT("/usuarios/:id/password", h.Usuario.ResetPassword)

				// Instituciones (escritura)
				admin.POST("/instituciones", h.Institucion.Crear)
				admin.PUT("/instituciones/:id", h.Institucion.Actualizar)
			}
		}
	}

	return r
}
