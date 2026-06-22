package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// BeneficioHandler expone la gestión de beneficios y condiciones (solo administrador).
type BeneficioHandler struct {
	svc *service.BeneficioService
}

// NewBeneficioHandler inyecta el BeneficioService.
func NewBeneficioHandler(svc *service.BeneficioService) *BeneficioHandler {
	return &BeneficioHandler{svc: svc}
}

// List godoc
//
//	@Summary	Listar beneficios con sus condiciones e institución (admin)
//	@Tags		beneficios
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{array}	dto.BeneficioAdminResponse
//	@Router		/beneficios [get]
func (h *BeneficioHandler) List(c *gin.Context) {
	bs, err := h.svc.ListBeneficios(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToBeneficiosAdminResponse(bs))
}

// Crear godoc
//
//	@Summary	Crear beneficio (admin)
//	@Tags		beneficios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.CrearBeneficioRequest	true	"Beneficio"
//	@Success	201		{object}	dto.BeneficioAdminResponse
//	@Router		/beneficios [post]
func (h *BeneficioHandler) Crear(c *gin.Context) {
	var req dto.CrearBeneficioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	instID, err := uuid.Parse(req.InstitucionID)
	if err != nil {
		respondValidation(c, err)
		return
	}
	b, err := h.svc.CrearBeneficio(c.Request.Context(), domain.NuevoBeneficio{
		InstitucionID: instID,
		Nombre:        req.Nombre,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	// Retornamos el beneficio con detalle (sin condiciones aún).
	c.JSON(http.StatusCreated, dto.ToBeneficioAdminResponse(domain.BeneficioConDetalle{
		Beneficio:         b,
		InstitucionNombre: "",
		Condiciones:       []domain.Condicion{},
	}))
}

// Actualizar godoc
//
//	@Summary	Actualizar beneficio (admin)
//	@Tags		beneficios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string						true	"ID beneficio"
//	@Param		body	body		dto.ActualizarBeneficioRequest	true	"Beneficio"
//	@Success	200		{object}	dto.BeneficioAdminResponse
//	@Router		/beneficios/{id} [put]
func (h *BeneficioHandler) Actualizar(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	var req dto.ActualizarBeneficioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	instID, err := uuid.Parse(req.InstitucionID)
	if err != nil {
		respondValidation(c, err)
		return
	}
	b, err := h.svc.ActualizarBeneficio(c.Request.Context(), domain.ActualizarBeneficioInput{
		ID:            id,
		InstitucionID: instID,
		Nombre:        req.Nombre,
		Activo:        req.Activo,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	// Recargamos con detalle para devolver las condiciones actuales.
	detalle, err := h.svc.GetBeneficio(c.Request.Context(), b.ID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToBeneficioAdminResponse(detalle))
}

// Desactivar godoc
//
//	@Summary	Desactivar beneficio (admin)
//	@Tags		beneficios
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id	path		string	true	"ID beneficio"
//	@Success	200	{object}	dto.BeneficioAdminResponse
//	@Router		/beneficios/{id} [delete]
func (h *BeneficioHandler) Desactivar(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	b, err := h.svc.DesactivarBeneficio(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToBeneficioAdminResponse(domain.BeneficioConDetalle{
		Beneficio:   b,
		Condiciones: []domain.Condicion{},
	}))
}

// CrearCondicion godoc
//
//	@Summary	Agregar condición a un beneficio (admin)
//	@Tags		beneficios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string						true	"ID beneficio"
//	@Param		body	body		dto.CrearCondicionRequest	true	"Condición"
//	@Success	201		{object}	dto.CondicionResponse
//	@Router		/beneficios/{id}/condiciones [post]
func (h *BeneficioHandler) CrearCondicion(c *gin.Context) {
	beneficioID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	var req dto.CrearCondicionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	vigente := true
	if req.Vigente != nil {
		vigente = *req.Vigente
	}
	cond, err := h.svc.CrearCondicion(c.Request.Context(), domain.NuevaCondicion{
		BeneficioID:      beneficioID,
		UmbralInfusiones: req.UmbralInfusiones,
		TipoDescuento:    req.TipoDescuento,
		ValorDescuento:   req.ValorDescuento,
		ReiniciaContador: req.ReiniciaContador,
		Vigente:          vigente,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.ToCondicionResponse(cond))
}

// ActualizarCondicion godoc
//
//	@Summary	Actualizar condición (admin)
//	@Tags		beneficios
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string							true	"ID condición"
//	@Param		body	body		dto.ActualizarCondicionRequest	true	"Condición"
//	@Success	200		{object}	dto.CondicionResponse
//	@Router		/condiciones/{id} [put]
func (h *BeneficioHandler) ActualizarCondicion(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	var req dto.ActualizarCondicionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	cond, err := h.svc.ActualizarCondicion(c.Request.Context(), domain.ActualizarCondicionInput{
		ID:               id,
		UmbralInfusiones: req.UmbralInfusiones,
		TipoDescuento:    req.TipoDescuento,
		ValorDescuento:   req.ValorDescuento,
		ReiniciaContador: req.ReiniciaContador,
		Vigente:          req.Vigente,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToCondicionResponse(cond))
}
