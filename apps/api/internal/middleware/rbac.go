package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/pkg/response"
)

// RequireRole corta con 403 si el rol del contexto (puesto por Auth) no está entre los
// permitidos. Debe usarse siempre después de Auth.
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		rol := c.GetString(ContextRol)
		for _, permitido := range roles {
			if rol == permitido {
				c.Next()
				return
			}
		}
		response.Error(c, http.StatusForbidden, "prohibido", "No tenés permiso para esta acción")
		c.Abort()
	}
}
