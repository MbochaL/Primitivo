package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/middleware"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// CompraHandler expone el registro de ventas (núcleo operativo, ambos roles).
type CompraHandler struct {
	compras *service.CompraService
}

// NewCompraHandler inyecta el CompraService.
func NewCompraHandler(compras *service.CompraService) *CompraHandler {
	return &CompraHandler{compras: compras}
}

// Registrar godoc
//
//	@Summary	Registrar una compra (calcula total y aplica beneficio si corresponde)
//	@Tags		compras
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.RegistrarCompraRequest	true	"Pedido"
//	@Success	201		{object}	dto.CompraRegistradaResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Failure	409		{object}	response.ErrorResponse
//	@Router		/compras [post]
func (h *CompraHandler) Registrar(c *gin.Context) {
	var req dto.RegistrarCompraRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}

	// El usuario que registra sale del JWT (lo inyecta el middleware Auth).
	usuarioID, err := uuid.Parse(c.GetString(middleware.ContextUserID))
	if err != nil {
		respondError(c, domain.ErrNoAutorizado)
		return
	}

	clienteID, err := uuid.Parse(req.ClienteID)
	if err != nil {
		respondValidation(c, err)
		return
	}

	items := make([]domain.ItemCompra, 0, len(req.Items))
	for _, it := range req.Items {
		pid, perr := uuid.Parse(it.ProductoID)
		if perr != nil {
			respondValidation(c, perr)
			return
		}
		items = append(items, domain.ItemCompra{ProductoID: pid, Cantidad: it.Cantidad})
	}

	compra, err := h.compras.RegistrarCompra(c.Request.Context(), domain.NuevaCompra{
		ClienteID:   clienteID,
		UsuarioID:   usuarioID,
		Items:       items,
		CondicionID: optionalUUID(req.CondicionID),
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.ToCompraRegistradaResponse(compra))
}

// List godoc
//
//	@Summary	Listar compras en un rango de fechas (admin)
//	@Tags		compras
//	@Produce	json
//	@Security	BearerAuth
//	@Param		desde	query		string	true	"Fecha inicio (YYYY-MM-DD)"
//	@Param		hasta	query		string	true	"Fecha fin exclusiva (YYYY-MM-DD)"
//	@Success	200		{array}		dto.CompraListaResponse
//	@Failure	400		{object}	response.ErrorResponse
//	@Router		/compras [get]
func (h *CompraHandler) List(c *gin.Context) {
	const layout = "2006-01-02"

	desdeStr := c.DefaultQuery("desde", time.Now().Format(layout))
	hastaStr := c.DefaultQuery("hasta", time.Now().AddDate(0, 0, 1).Format(layout))

	desde, err := time.Parse(layout, desdeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetro 'desde' inválido, usar YYYY-MM-DD"})
		return
	}
	hasta, err := time.Parse(layout, hastaStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetro 'hasta' inválido, usar YYYY-MM-DD"})
		return
	}
	// hasta es exclusivo: incluir todo el día si desde == hasta
	if !hasta.After(desde) {
		hasta = desde.AddDate(0, 0, 1)
	}

	compras, err := h.compras.ListEnRango(c.Request.Context(), desde, hasta)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.ToCompraListaResponseList(compras))
}
