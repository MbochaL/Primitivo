package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// InstitucionHandler expone la gestión de instituciones (lectura ambos, escritura admin).
type InstitucionHandler struct {
	instituciones *service.InstitucionService
}

// NewInstitucionHandler inyecta el InstitucionService.
func NewInstitucionHandler(instituciones *service.InstitucionService) *InstitucionHandler {
	return &InstitucionHandler{instituciones: instituciones}
}

// List godoc
//
//	@Summary	Listar instituciones
//	@Tags		instituciones
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{array}	dto.InstitucionResponse
//	@Router		/instituciones [get]
func (h *InstitucionHandler) List(c *gin.Context) {
	instituciones, err := h.instituciones.List(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToInstitucionResponseList(instituciones))
}

// Crear godoc
//
//	@Summary	Crear una institución
//	@Tags		instituciones
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.CrearInstitucionRequest	true	"Datos de la institución"
//	@Success	201		{object}	dto.InstitucionResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Router		/instituciones [post]
func (h *InstitucionHandler) Crear(c *gin.Context) {
	var req dto.CrearInstitucionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	institucion, err := h.instituciones.Crear(c.Request.Context(), req.Nombre)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.ToInstitucionResponse(institucion))
}

// Actualizar godoc
//
//	@Summary	Actualizar una institución
//	@Tags		instituciones
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string							true	"ID de la institución"
//	@Param		body	body		dto.ActualizarInstitucionRequest	true	"Datos a actualizar"
//	@Success	200		{object}	dto.InstitucionResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Failure	404		{object}	response.ErrorResponse
//	@Router		/instituciones/{id} [put]
func (h *InstitucionHandler) Actualizar(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	var req dto.ActualizarInstitucionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	institucion, err := h.instituciones.Actualizar(c.Request.Context(), id, service.ActualizarInstitucionInput{
		Nombre: req.Nombre,
		Activa: *req.Activa,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.ToInstitucionResponse(institucion))
}
