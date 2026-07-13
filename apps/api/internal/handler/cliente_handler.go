package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// ClienteHandler expone la operación diaria sobre clientes (ambos roles).
type ClienteHandler struct {
	clientes *service.ClienteService
}

// NewClienteHandler inyecta el ClienteService.
func NewClienteHandler(clientes *service.ClienteService) *ClienteHandler {
	return &ClienteHandler{clientes: clientes}
}

// List godoc
//
//	@Summary	Listar clientes (o buscar por DNI con ?dni=)
//	@Tags		clientes
//	@Produce	json
//	@Security	BearerAuth
//	@Param		dni	query	string	false	"Buscar por DNI exacto (búsqueda principal del dashboard)"
//	@Success	200	{array}	dto.ClienteResponse
//	@Router		/clientes [get]
func (h *ClienteHandler) List(c *gin.Context) {
	if dni := c.Query("dni"); dni != "" {
		cliente, err := h.clientes.BuscarPorDNI(c.Request.Context(), dni)
		if err != nil {
			if errors.Is(err, domain.ErrClienteNoEncontrado) {
				c.JSON(http.StatusOK, []dto.ClienteResponse{})
				return
			}
			respondError(c, err)
			return
		}
		c.JSON(http.StatusOK, []dto.ClienteResponse{dto.ToClienteResponse(cliente)})
		return
	}

	clientes, err := h.clientes.List(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToClienteResponseList(clientes))
}

// GetByID godoc
//
//	@Summary	Obtener un cliente por ID
//	@Tags		clientes
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id	path		string	true	"ID del cliente"
//	@Success	200	{object}	dto.ClienteResponse
//	@Failure	404	{object}	response.ErrorResponse
//	@Router		/clientes/{id} [get]
func (h *ClienteHandler) GetByID(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	cliente, err := h.clientes.GetByID(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToClienteResponse(cliente))
}

// Crear godoc
//
//	@Summary	Registrar un cliente
//	@Tags		clientes
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.CrearClienteRequest	true	"Datos del cliente"
//	@Success	201		{object}	dto.ClienteResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Failure	409		{object}	response.ErrorResponse
//	@Router		/clientes [post]
func (h *ClienteHandler) Crear(c *gin.Context) {
	var req dto.CrearClienteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	cliente, err := h.clientes.Crear(c.Request.Context(), service.CrearClienteInput{
		DNI:           req.DNI,
		Nombre:        req.Nombre,
		Email:         req.Email,
		InstitucionID: optionalUUID(req.InstitucionID),
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.ToClienteResponseFromEntity(cliente))
}

// Actualizar godoc
//
//	@Summary	Actualizar un cliente
//	@Tags		clientes
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string							true	"ID del cliente"
//	@Param		body	body		dto.ActualizarClienteRequest	true	"Datos a actualizar"
//	@Success	200		{object}	dto.ClienteResponse
//	@Failure	404		{object}	response.ErrorResponse
//	@Router		/clientes/{id} [put]
func (h *ClienteHandler) Actualizar(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	var req dto.ActualizarClienteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	cliente, err := h.clientes.Actualizar(c.Request.Context(), id, service.ActualizarClienteInput{
		Nombre:        req.Nombre,
		Email:         req.Email,
		InstitucionID: optionalUUID(req.InstitucionID),
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToClienteResponseFromEntity(cliente))
}

// Historial godoc
//
//	@Summary	Historial de compras del cliente
//	@Tags		clientes
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id	path	string	true	"ID del cliente"
//	@Success	200	{array}	dto.CompraResponse
//	@Failure	404	{object}	response.ErrorResponse
//	@Router		/clientes/{id}/historial [get]
func (h *ClienteHandler) Historial(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	compras, err := h.clientes.Historial(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToCompraResponseList(compras))
}

// Beneficios godoc
//
//	@Summary	Beneficios disponibles del cliente
//	@Tags		clientes
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id	path	string	true	"ID del cliente"
//	@Success	200	{array}	dto.BeneficioDisponibleResponse
//	@Failure	404	{object}	response.ErrorResponse
//	@Router		/clientes/{id}/beneficios [get]
func (h *ClienteHandler) Beneficios(c *gin.Context) {
	id, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	beneficios, err := h.clientes.BeneficiosDisponibles(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToBeneficioDisponibleResponseList(beneficios))
}

// ImportarClientes godoc
//
//	@Summary	Importar clientes en lote (solo administrador)
//	@Tags		clientes
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.ImportarClientesRequest		true	"Lista de clientes a importar"
//	@Success	200		{object}	dto.ImportarClientesResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Router		/clientes/importar [post]
func (h *ClienteHandler) ImportarClientes(c *gin.Context) {
	var req dto.ImportarClientesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	items := make([]service.ImportarClienteItemInput, len(req.Clientes))
	for i, item := range req.Clientes {
		items[i] = service.ImportarClienteItemInput{
			DNI:           item.DNI,
			Nombre:        item.Nombre,
			Email:         item.Email,
			InstitucionID: optionalUUID(item.InstitucionID),
		}
	}

	result, err := h.clientes.ImportarClientes(c.Request.Context(), items)
	if err != nil {
		respondError(c, err)
		return
	}

	errores := make([]dto.ImportErrorResponse, len(result.Errores))
	for i, e := range result.Errores {
		errores[i] = dto.ImportErrorResponse{DNI: e.DNI, Nombre: e.Nombre, Error: e.Error}
	}

	c.JSON(http.StatusOK, dto.ImportarClientesResponse{
		Creados:    result.Creados,
		Duplicados: result.Duplicados,
		Errores:    errores,
	})
}

// optionalUUID parsea un *string (ya validado como uuid por el binding) a *uuid.UUID.
func optionalUUID(s *string) *uuid.UUID {
	if s == nil || *s == "" {
		return nil
	}
	id, err := uuid.Parse(*s)
	if err != nil {
		return nil
	}
	return &id
}
