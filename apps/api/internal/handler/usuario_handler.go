package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// UsuarioHandler expone la gestión de usuarios del sistema (solo administrador).
type UsuarioHandler struct {
	usuarios *service.UsuarioService
}

// NewUsuarioHandler inyecta el UsuarioService.
func NewUsuarioHandler(usuarios *service.UsuarioService) *UsuarioHandler {
	return &UsuarioHandler{usuarios: usuarios}
}

// Crear godoc
//
//	@Summary	Crear un usuario del sistema
//	@Tags		usuarios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.CrearUsuarioRequest	true	"Datos del usuario"
//	@Success	201		{object}	dto.UsuarioResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Failure	409		{object}	response.ErrorResponse
//	@Router		/usuarios [post]
func (h *UsuarioHandler) Crear(c *gin.Context) {
	var req dto.CrearUsuarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	usuario, err := h.usuarios.Crear(c.Request.Context(), service.CrearUsuarioInput{
		Email:    req.Email,
		Password: req.Password,
		Rol:      domain.Rol(req.Rol),
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.ToUsuarioResponse(usuario))
}

// List godoc
//
//	@Summary	Listar usuarios del sistema
//	@Tags		usuarios
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{array}	dto.UsuarioResponse
//	@Router		/usuarios [get]
func (h *UsuarioHandler) List(c *gin.Context) {
	usuarios, err := h.usuarios.List(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToUsuarioResponseList(usuarios))
}

// Actualizar godoc
//
//	@Summary	Actualizar un usuario del sistema
//	@Tags		usuarios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string						true	"ID del usuario"
//	@Param		body	body		dto.ActualizarUsuarioRequest	true	"Datos a actualizar"
//	@Success	200		{object}	dto.UsuarioResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Failure	404		{object}	response.ErrorResponse
//	@Router		/usuarios/{id} [put]
func (h *UsuarioHandler) Actualizar(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	var req dto.ActualizarUsuarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	usuario, err := h.usuarios.Actualizar(c.Request.Context(), id, service.ActualizarUsuarioInput{
		Email:  req.Email,
		Rol:    domain.Rol(req.Rol),
		Activo: *req.Activo,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.ToUsuarioResponse(usuario))
}

// ResetPassword godoc
//
//	@Summary	Resetear la contraseña de un usuario
//	@Tags		usuarios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path	string						true	"ID del usuario"
//	@Param		body	body	dto.ResetPasswordRequest	true	"Nueva contraseña"
//	@Success	204		"Sin contenido"
//	@Failure	400		{object}	response.ErrorResponse
//	@Failure	404		{object}	response.ErrorResponse
//	@Router		/usuarios/{id}/password [put]
func (h *UsuarioHandler) ResetPassword(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	if err := h.usuarios.ResetPassword(c.Request.Context(), id, req.Password); err != nil {
		respondError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}
