package handler

import (
	"net/http"

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
