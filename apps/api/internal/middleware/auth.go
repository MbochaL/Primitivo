package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/pkg/jwt"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/response"
)

// Claves del contexto de Gin donde Auth inyecta la identidad del usuario.
const (
	ContextUserID = "user_id"
	ContextRol    = "rol"
)

const bearerPrefix = "Bearer "

// Auth valida el access token del header Authorization. Si es válido, inyecta el
// user_id y el rol en el contexto; si no, corta con 401.
func Auth(jwtManager *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, bearerPrefix) {
			response.Error(c, http.StatusUnauthorized, "no_autorizado", "Falta el token de autorización")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(header, bearerPrefix)
		claims, err := jwtManager.Parse(token, jwt.TipoAccess)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "token_invalido", "Token inválido o expirado")
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.Subject)
		c.Set(ContextRol, claims.Rol)
		c.Next()
	}
}
