package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/response"
)

// respondError traduce un error de dominio al código HTTP correspondiente. Los errores
// inesperados se loguean y se devuelven como 500 sin filtrar el detalle al cliente.
func respondError(c *gin.Context, err error) {
	status, codigo := mapDomainError(err)
	if status == http.StatusInternalServerError {
		_ = c.Error(err) // queda registrado en c.Errors para el logger
		response.Error(c, status, codigo, "Ocurrió un error interno")
		return
	}
	response.Error(c, status, codigo, err.Error())
}

// respondValidation responde un 400 ante errores de binding/validación del request.
func respondValidation(c *gin.Context, err error) {
	response.Error(c, http.StatusBadRequest, "request_invalido", err.Error())
}

// parseUUIDParam extrae y valida un parámetro de ruta como UUID; si falla responde 400.
func parseUUIDParam(c *gin.Context, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(name))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "id_invalido", "El identificador no es un UUID válido")
		return uuid.UUID{}, false
	}
	return id, true
}

func mapDomainError(err error) (int, string) {
	switch {
	case errors.Is(err, domain.ErrCredencialesInvalidas):
		return http.StatusUnauthorized, "credenciales_invalidas"
	case errors.Is(err, domain.ErrTokenInvalido):
		return http.StatusUnauthorized, "token_invalido"
	case errors.Is(err, domain.ErrNoAutorizado):
		return http.StatusUnauthorized, "no_autorizado"
	case errors.Is(err, domain.ErrUsuarioInactivo):
		return http.StatusForbidden, "usuario_inactivo"
	case errors.Is(err, domain.ErrProhibido):
		return http.StatusForbidden, "prohibido"
	case errors.Is(err, domain.ErrUsuarioNoEncontrado):
		return http.StatusNotFound, "usuario_no_encontrado"
	case errors.Is(err, domain.ErrInstitucionNoEncontrada):
		return http.StatusNotFound, "institucion_no_encontrada"
	case errors.Is(err, domain.ErrEmailYaRegistrado):
		return http.StatusConflict, "email_ya_registrado"
	case errors.Is(err, domain.ErrRolInvalido):
		return http.StatusBadRequest, "rol_invalido"
	default:
		return http.StatusInternalServerError, "error_interno"
	}
}
