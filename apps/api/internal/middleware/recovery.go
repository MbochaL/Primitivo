package middleware

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/pkg/response"
)

// Recovery atrapa cualquier panic, lo loguea y devuelve un 500 limpio con la forma
// de error estándar de la API, en vez de tirar el servidor. Es el primer middleware.
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		slog.Error("panic recuperado",
			"error", recovered,
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
		)
		response.Error(c, http.StatusInternalServerError, "error_interno", "Ocurrió un error interno")
		c.Abort()
	})
}
