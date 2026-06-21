package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// MenuHandler expone el menú agrupado (lectura, ambos roles).
type MenuHandler struct {
	menu *service.MenuService
}

// NewMenuHandler inyecta el MenuService.
func NewMenuHandler(menu *service.MenuService) *MenuHandler {
	return &MenuHandler{menu: menu}
}

// Get godoc
//
//	@Summary	Menú completo agrupado por categoría
//	@Tags		menu
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{array}	dto.CategoriaMenuResponse
//	@Router		/menu [get]
func (h *MenuHandler) Get(c *gin.Context) {
	menu, err := h.menu.GetMenu(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToMenuResponse(menu))
}
