package dto

import (
	"time"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// TokenResponse es la respuesta de login/refresh.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
}

// UsuarioResponse es la vista pública de un usuario (sin password_hash).
type UsuarioResponse struct {
	ID     string `json:"id"`
	Email  string `json:"email"`
	Rol    string `json:"rol"`
	Activo bool   `json:"activo"`
}

// ToUsuarioResponse mapea la entidad de dominio a su DTO de respuesta.
func ToUsuarioResponse(u domain.Usuario) UsuarioResponse {
	return UsuarioResponse{
		ID:     u.ID.String(),
		Email:  u.Email,
		Rol:    string(u.Rol),
		Activo: u.Activo,
	}
}

// ToUsuarioResponseList mapea una lista de usuarios a sus DTOs.
func ToUsuarioResponseList(usuarios []domain.Usuario) []UsuarioResponse {
	out := make([]UsuarioResponse, 0, len(usuarios))
	for _, u := range usuarios {
		out = append(out, ToUsuarioResponse(u))
	}
	return out
}

// InstitucionResponse es la vista pública de una institución.
type InstitucionResponse struct {
	ID        string    `json:"id"`
	Nombre    string    `json:"nombre"`
	Activa    bool      `json:"activa"`
	CreatedAt time.Time `json:"created_at"`
}

// ToInstitucionResponse mapea la entidad de dominio a su DTO de respuesta.
func ToInstitucionResponse(i domain.Institucion) InstitucionResponse {
	return InstitucionResponse{
		ID:        i.ID.String(),
		Nombre:    i.Nombre,
		Activa:    i.Activa,
		CreatedAt: i.CreatedAt,
	}
}

// ToInstitucionResponseList mapea una lista de instituciones a sus DTOs.
func ToInstitucionResponseList(instituciones []domain.Institucion) []InstitucionResponse {
	out := make([]InstitucionResponse, 0, len(instituciones))
	for _, i := range instituciones {
		out = append(out, ToInstitucionResponse(i))
	}
	return out
}

// ClienteResponse es la vista pública de un cliente (incluye el nombre de su institución).
type ClienteResponse struct {
	ID                 string    `json:"id"`
	DNI                string    `json:"dni"`
	Nombre             string    `json:"nombre"`
	Email              *string   `json:"email"`
	InstitucionID      *string   `json:"institucion_id"`
	InstitucionNombre  *string   `json:"institucion_nombre"`
	ContadorInfusiones int       `json:"contador_infusiones"`
	CreatedAt          time.Time `json:"created_at"`
}

// ToClienteResponse mapea el read-model (cliente + institución) a su DTO.
func ToClienteResponse(c domain.ClienteConInstitucion) ClienteResponse {
	return ClienteResponse{
		ID:                 c.ID.String(),
		DNI:                c.DNI,
		Nombre:             c.Nombre,
		Email:              c.Email,
		InstitucionID:      uuidPtrToString(c.InstitucionID),
		InstitucionNombre:  c.InstitucionNombre,
		ContadorInfusiones: c.ContadorInfusiones,
		CreatedAt:          c.CreatedAt,
	}
}

// ToClienteResponseFromEntity mapea la entidad (sin join de institución) a su DTO.
func ToClienteResponseFromEntity(c domain.Cliente) ClienteResponse {
	return ClienteResponse{
		ID:                 c.ID.String(),
		DNI:                c.DNI,
		Nombre:             c.Nombre,
		Email:              c.Email,
		InstitucionID:      uuidPtrToString(c.InstitucionID),
		ContadorInfusiones: c.ContadorInfusiones,
		CreatedAt:          c.CreatedAt,
	}
}

// ToClienteResponseList mapea una lista de clientes a sus DTOs.
func ToClienteResponseList(clientes []domain.ClienteConInstitucion) []ClienteResponse {
	out := make([]ClienteResponse, 0, len(clientes))
	for _, c := range clientes {
		out = append(out, ToClienteResponse(c))
	}
	return out
}

// CompraResponse es una línea del historial de compras del cliente.
type CompraResponse struct {
	ID        string    `json:"id"`
	Subtotal  int       `json:"subtotal"`
	Descuento int       `json:"descuento"`
	Total     int       `json:"total"`
	Fecha     time.Time `json:"fecha"`
}

// ToCompraResponseList mapea las compras del historial a sus DTOs.
func ToCompraResponseList(compras []domain.Compra) []CompraResponse {
	out := make([]CompraResponse, 0, len(compras))
	for _, c := range compras {
		out = append(out, CompraResponse{
			ID:        c.ID.String(),
			Subtotal:  c.Subtotal,
			Descuento: c.Descuento,
			Total:     c.Total,
			Fecha:     c.Fecha,
		})
	}
	return out
}

// BeneficioDisponibleResponse es una condición de beneficio para la vista del cliente.
type BeneficioDisponibleResponse struct {
	CondicionID      string `json:"condicion_id"`
	BeneficioNombre  string `json:"beneficio_nombre"`
	UmbralInfusiones int    `json:"umbral_infusiones"`
	TipoDescuento    string `json:"tipo_descuento"`
	ValorDescuento   int    `json:"valor_descuento"`
	ReiniciaContador bool   `json:"reinicia_contador"`
	Alcanzado        bool   `json:"alcanzado"`

	TipoTrigger               string  `json:"tipo_trigger"`
	DiasSemana                []int   `json:"dias_semana"`
	ScopeTrigger              string  `json:"scope_trigger"`
	ScopeTriggerCategoriaID   *string `json:"scope_trigger_categoria_id"`
	ScopeTriggerProductoID    *string `json:"scope_trigger_producto_id"`
	ScopeDescuento            string  `json:"scope_descuento"`
	ScopeDescuentoCategoriaID *string `json:"scope_descuento_categoria_id"`
}

// ToBeneficioDisponibleResponseList mapea los beneficios disponibles a sus DTOs.
func ToBeneficioDisponibleResponseList(bs []domain.BeneficioDisponible) []BeneficioDisponibleResponse {
	out := make([]BeneficioDisponibleResponse, 0, len(bs))
	for _, b := range bs {
		out = append(out, BeneficioDisponibleResponse{
			CondicionID:               b.CondicionID.String(),
			BeneficioNombre:           b.BeneficioNombre,
			UmbralInfusiones:          b.UmbralInfusiones,
			TipoDescuento:             b.TipoDescuento,
			ValorDescuento:            b.ValorDescuento,
			ReiniciaContador:          b.ReiniciaContador,
			Alcanzado:                 b.Alcanzado,
			TipoTrigger:               b.TipoTrigger,
			DiasSemana:                b.DiasSemana,
			ScopeTrigger:              b.ScopeTrigger,
			ScopeTriggerCategoriaID:   uuidPtrToString(b.ScopeTriggerCategoriaID),
			ScopeTriggerProductoID:    uuidPtrToString(b.ScopeTriggerProductoID),
			ScopeDescuento:            b.ScopeDescuento,
			ScopeDescuentoCategoriaID: uuidPtrToString(b.ScopeDescuentoCategoriaID),
		})
	}
	return out
}

// ImportErrorResponse describe un registro que no se pudo importar.
type ImportErrorResponse struct {
	DNI    string `json:"dni"`
	Nombre string `json:"nombre"`
	Error  string `json:"error"`
}

// ImportarClientesResponse es la respuesta de POST /clientes/importar.
type ImportarClientesResponse struct {
	Creados    int                   `json:"creados"`
	Duplicados int                   `json:"duplicados"`
	Errores    []ImportErrorResponse `json:"errores"`
}

// ── Menú ────────────────────────────────────────────────────────────────────

// ProductoResponse es un ítem del menú.
type ProductoResponse struct {
	ID         string `json:"id"`
	Nombre     string `json:"nombre"`
	Precio     int    `json:"precio"`
	EsInfusion bool   `json:"es_infusion"`
}

// CategoriaMenuResponse es una categoría del menú con sus productos.
type CategoriaMenuResponse struct {
	ID        string             `json:"id"`
	Nombre    string             `json:"nombre"`
	Seccion   string             `json:"seccion"`
	Productos []ProductoResponse `json:"productos"`
}

// ToMenuResponse mapea el menú agrupado a su DTO.
func ToMenuResponse(cats []domain.CategoriaConProductos) []CategoriaMenuResponse {
	out := make([]CategoriaMenuResponse, 0, len(cats))
	for _, c := range cats {
		productos := make([]ProductoResponse, 0, len(c.Productos))
		for _, p := range c.Productos {
			productos = append(productos, ProductoResponse{
				ID:         p.ID.String(),
				Nombre:     p.Nombre,
				Precio:     p.Precio,
				EsInfusion: p.EsInfusion,
			})
		}
		out = append(out, CategoriaMenuResponse{
			ID:        c.ID.String(),
			Nombre:    c.Nombre,
			Seccion:   string(c.Seccion),
			Productos: productos,
		})
	}
	return out
}

// ── Menú admin ──────────────────────────────────────────────────────────────

// CategoriaAdminResponse expone todos los campos de una categoría (admin).
type CategoriaAdminResponse struct {
	ID      string `json:"id"`
	Nombre  string `json:"nombre"`
	Seccion string `json:"seccion"`
	Orden   int    `json:"orden"`
}

// ToCategoriaAdminResponse mapea una categoría a su DTO admin.
func ToCategoriaAdminResponse(c domain.Categoria) CategoriaAdminResponse {
	return CategoriaAdminResponse{
		ID:      c.ID.String(),
		Nombre:  c.Nombre,
		Seccion: string(c.Seccion),
		Orden:   c.Orden,
	}
}

// ToCategoriasAdminResponse mapea un slice de categorías.
func ToCategoriasAdminResponse(cats []domain.Categoria) []CategoriaAdminResponse {
	out := make([]CategoriaAdminResponse, 0, len(cats))
	for _, c := range cats {
		out = append(out, ToCategoriaAdminResponse(c))
	}
	return out
}

// ProductoAdminResponse expone todos los campos de un producto (admin).
type ProductoAdminResponse struct {
	ID          string `json:"id"`
	CategoriaID string `json:"categoria_id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion"`
	Precio      int    `json:"precio"`
	EsInfusion  bool   `json:"es_infusion"`
	Activo      bool   `json:"activo"`
}

// ToProductoAdminResponse mapea un producto a su DTO admin.
func ToProductoAdminResponse(p domain.Producto) ProductoAdminResponse {
	return ProductoAdminResponse{
		ID:          p.ID.String(),
		CategoriaID: p.CategoriaID.String(),
		Nombre:      p.Nombre,
		Descripcion: p.Descripcion,
		Precio:      p.Precio,
		EsInfusion:  p.EsInfusion,
		Activo:      p.Activo,
	}
}

// ToProductosAdminResponse mapea un slice de productos.
func ToProductosAdminResponse(prods []domain.Producto) []ProductoAdminResponse {
	out := make([]ProductoAdminResponse, 0, len(prods))
	for _, p := range prods {
		out = append(out, ToProductoAdminResponse(p))
	}
	return out
}

// ── Historial global de compras (admin) ─────────────────────────────────────

// CompraListaResponse es una fila del historial global (con datos del cliente).
type CompraListaResponse struct {
	ID            string    `json:"id"`
	ClienteID     string    `json:"cliente_id"`
	ClienteNombre string    `json:"cliente_nombre"`
	ClienteDNI    string    `json:"cliente_dni"`
	Subtotal      int       `json:"subtotal"`
	Descuento     int       `json:"descuento"`
	Total         int       `json:"total"`
	Fecha         time.Time `json:"fecha"`
}

// ToCompraListaResponseList mapea el historial global a sus DTOs.
func ToCompraListaResponseList(compras []domain.CompraConCliente) []CompraListaResponse {
	out := make([]CompraListaResponse, 0, len(compras))
	for _, c := range compras {
		out = append(out, CompraListaResponse{
			ID:            c.ID.String(),
			ClienteID:     c.ClienteID.String(),
			ClienteNombre: c.ClienteNombre,
			ClienteDNI:    c.ClienteDNI,
			Subtotal:      c.Subtotal,
			Descuento:     c.Descuento,
			Total:         c.Total,
			Fecha:         c.Fecha,
		})
	}
	return out
}

// ── Compra registrada ───────────────────────────────────────────────────────

// CompraRegistradaResponse es el resultado de registrar una venta.
type CompraRegistradaResponse struct {
	ID        string    `json:"id"`
	Subtotal  int       `json:"subtotal"`
	Descuento int       `json:"descuento"`
	Total     int       `json:"total"`
	Fecha     time.Time `json:"fecha"`
}

// ToCompraRegistradaResponse mapea la compra registrada a su DTO.
func ToCompraRegistradaResponse(c domain.Compra) CompraRegistradaResponse {
	return CompraRegistradaResponse{
		ID:        c.ID.String(),
		Subtotal:  c.Subtotal,
		Descuento: c.Descuento,
		Total:     c.Total,
		Fecha:     c.Fecha,
	}
}

func uuidPtrToString(id *uuid.UUID) *string {
	if id == nil {
		return nil
	}
	s := id.String()
	return &s
}

// ── Beneficios admin ─────────────────────────────────────────────────────────

// CondicionResponse expone los campos de una condición.
type CondicionResponse struct {
	ID               string `json:"id"`
	BeneficioID      string `json:"beneficio_id"`
	UmbralInfusiones int    `json:"umbral_infusiones"`
	TipoDescuento    string `json:"tipo_descuento"`
	ValorDescuento   int    `json:"valor_descuento"`
	ReiniciaContador bool   `json:"reinicia_contador"`
	Vigente          bool   `json:"vigente"`

	TipoTrigger               string  `json:"tipo_trigger"`
	DiasSemana                []int   `json:"dias_semana"`
	ScopeTrigger              string  `json:"scope_trigger"`
	ScopeTriggerCategoriaID   *string `json:"scope_trigger_categoria_id"`
	ScopeTriggerProductoID    *string `json:"scope_trigger_producto_id"`
	ScopeDescuento            string  `json:"scope_descuento"`
	ScopeDescuentoCategoriaID *string `json:"scope_descuento_categoria_id"`
}

// BeneficioAdminResponse expone el beneficio con su institución y condiciones (admin).
// InstitucionID e InstitucionNombre son nil para beneficios globales.
type BeneficioAdminResponse struct {
	ID                string              `json:"id"`
	InstitucionID     *string             `json:"institucion_id"`
	InstitucionNombre *string             `json:"institucion_nombre"`
	Nombre            string              `json:"nombre"`
	Activo            bool                `json:"activo"`
	Condiciones       []CondicionResponse `json:"condiciones"`
}

// ToBeneficioAdminResponse mapea un BeneficioConDetalle a su DTO.
func ToBeneficioAdminResponse(b domain.BeneficioConDetalle) BeneficioAdminResponse {
	conds := make([]CondicionResponse, 0, len(b.Condiciones))
	for _, c := range b.Condiciones {
		conds = append(conds, ToCondicionResponse(c))
	}
	return BeneficioAdminResponse{
		ID:                b.ID.String(),
		InstitucionID:     uuidPtrToString(b.InstitucionID),
		InstitucionNombre: b.InstitucionNombre,
		Nombre:            b.Nombre,
		Activo:            b.Activo,
		Condiciones:       conds,
	}
}

// ToBeneficiosAdminResponse mapea un slice de beneficios.
func ToBeneficiosAdminResponse(bs []domain.BeneficioConDetalle) []BeneficioAdminResponse {
	out := make([]BeneficioAdminResponse, 0, len(bs))
	for _, b := range bs {
		out = append(out, ToBeneficioAdminResponse(b))
	}
	return out
}

// ToCondicionResponse mapea una condición a su DTO.
func ToCondicionResponse(c domain.Condicion) CondicionResponse {
	return CondicionResponse{
		ID:                        c.ID.String(),
		BeneficioID:               c.BeneficioID.String(),
		UmbralInfusiones:          c.UmbralInfusiones,
		TipoDescuento:             c.TipoDescuento,
		ValorDescuento:            c.ValorDescuento,
		ReiniciaContador:          c.ReiniciaContador,
		Vigente:                   c.Vigente,
		TipoTrigger:               c.TipoTrigger,
		DiasSemana:                c.DiasSemana,
		ScopeTrigger:              c.ScopeTrigger,
		ScopeTriggerCategoriaID:   uuidPtrToString(c.ScopeTriggerCategoriaID),
		ScopeTriggerProductoID:    uuidPtrToString(c.ScopeTriggerProductoID),
		ScopeDescuento:            c.ScopeDescuento,
		ScopeDescuentoCategoriaID: uuidPtrToString(c.ScopeDescuentoCategoriaID),
	}
}
