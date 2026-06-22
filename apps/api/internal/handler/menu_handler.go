package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler/dto"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
)

// MenuHandler expone el menú y su gestión (CRUD admin).
type MenuHandler struct {
	menu *service.MenuService
}

// NewMenuHandler inyecta el MenuService.
func NewMenuHandler(menu *service.MenuService) *MenuHandler {
	return &MenuHandler{menu: menu}
}

// Get godoc
//
//	@Summary	Menú completo agrupado por categoría (solo activos)
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

// ListCategorias godoc
//
//	@Summary	Lista todas las categorías (admin)
//	@Tags		menu
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{array}	dto.CategoriaAdminResponse
//	@Router		/categorias [get]
func (h *MenuHandler) ListCategorias(c *gin.Context) {
	cats, err := h.menu.ListCategorias(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToCategoriasAdminResponse(cats))
}

// CrearCategoria godoc
//
//	@Summary	Crear categoría (admin)
//	@Tags		menu
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.CrearCategoriaRequest	true	"Categoría"
//	@Success	201		{object}	dto.CategoriaAdminResponse
//	@Router		/categorias [post]
func (h *MenuHandler) CrearCategoria(c *gin.Context) {
	var req dto.CrearCategoriaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	cat, err := h.menu.CrearCategoria(c.Request.Context(), domain.NuevaCategoria{
		Nombre:  req.Nombre,
		Seccion: domain.Seccion(req.Seccion),
		Orden:   req.Orden,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.ToCategoriaAdminResponse(cat))
}

// ActualizarCategoria godoc
//
//	@Summary	Actualizar categoría (admin)
//	@Tags		menu
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string							true	"ID categoría"
//	@Param		body	body		dto.ActualizarCategoriaRequest	true	"Categoría"
//	@Success	200		{object}	dto.CategoriaAdminResponse
//	@Router		/categorias/{id} [put]
func (h *MenuHandler) ActualizarCategoria(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	var req dto.ActualizarCategoriaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	cat, err := h.menu.ActualizarCategoria(c.Request.Context(), domain.ActualizarCategoriaInput{
		ID:      id,
		Nombre:  req.Nombre,
		Seccion: domain.Seccion(req.Seccion),
		Orden:   req.Orden,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToCategoriaAdminResponse(cat))
}

// ListProductos godoc
//
//	@Summary	Lista todos los productos incluyendo inactivos (admin)
//	@Tags		menu
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{array}	dto.ProductoAdminResponse
//	@Router		/productos [get]
func (h *MenuHandler) ListProductos(c *gin.Context) {
	prods, err := h.menu.ListAllProductos(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToProductosAdminResponse(prods))
}

// CrearProducto godoc
//
//	@Summary	Crear producto (admin)
//	@Tags		menu
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		body	body		dto.CrearProductoRequest	true	"Producto"
//	@Success	201		{object}	dto.ProductoAdminResponse
//	@Router		/productos [post]
func (h *MenuHandler) CrearProducto(c *gin.Context) {
	var req dto.CrearProductoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	catID, err := uuid.Parse(req.CategoriaID)
	if err != nil {
		respondValidation(c, err)
		return
	}
	prod, err := h.menu.CrearProducto(c.Request.Context(), domain.NuevoProducto{
		CategoriaID: catID,
		Nombre:      req.Nombre,
		Descripcion: req.Descripcion,
		Precio:      req.Precio,
		EsInfusion:  req.EsInfusion,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.ToProductoAdminResponse(prod))
}

// ActualizarProducto godoc
//
//	@Summary	Actualizar producto (admin)
//	@Tags		menu
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id		path		string						true	"ID producto"
//	@Param		body	body		dto.ActualizarProductoRequest	true	"Producto"
//	@Success	200		{object}	dto.ProductoAdminResponse
//	@Router		/productos/{id} [put]
func (h *MenuHandler) ActualizarProducto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	var req dto.ActualizarProductoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondValidation(c, err)
		return
	}
	catID, err := uuid.Parse(req.CategoriaID)
	if err != nil {
		respondValidation(c, err)
		return
	}
	prod, err := h.menu.ActualizarProducto(c.Request.Context(), domain.ActualizarProductoInput{
		ID:          id,
		CategoriaID: catID,
		Nombre:      req.Nombre,
		Descripcion: req.Descripcion,
		Precio:      req.Precio,
		EsInfusion:  req.EsInfusion,
		Activo:      req.Activo,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToProductoAdminResponse(prod))
}

// DesactivarProducto godoc
//
//	@Summary	Baja lógica de producto (admin)
//	@Tags		menu
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id	path		string	true	"ID producto"
//	@Success	200	{object}	dto.ProductoAdminResponse
//	@Router		/productos/{id} [delete]
func (h *MenuHandler) DesactivarProducto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondValidation(c, err)
		return
	}
	prod, err := h.menu.DesactivarProducto(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToProductoAdminResponse(prod))
}
