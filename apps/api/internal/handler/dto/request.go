// Package dto define los structs de request/response de la capa HTTP. NO son entidades
// de dominio: se mapean explícitamente para no exponer ni aceptar campos internos.
package dto

// LoginRequest es el cuerpo de POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest es el cuerpo de POST /auth/refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// CrearUsuarioRequest es el cuerpo de POST /usuarios.
type CrearUsuarioRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Rol      string `json:"rol" binding:"required,oneof=administrador operador"`
}

// ActualizarUsuarioRequest es el cuerpo de PUT /usuarios/:id.
// Activo es *bool para distinguir "false" de "ausente" con binding:"required".
type ActualizarUsuarioRequest struct {
	Email  string `json:"email" binding:"required,email"`
	Rol    string `json:"rol" binding:"required,oneof=administrador operador"`
	Activo *bool  `json:"activo" binding:"required"`
}

// ResetPasswordRequest es el cuerpo de PUT /usuarios/:id/password.
type ResetPasswordRequest struct {
	Password string `json:"password" binding:"required,min=8"`
}

// CrearInstitucionRequest es el cuerpo de POST /instituciones.
type CrearInstitucionRequest struct {
	Nombre string `json:"nombre" binding:"required"`
}

// ActualizarInstitucionRequest es el cuerpo de PUT /instituciones/:id.
type ActualizarInstitucionRequest struct {
	Nombre string `json:"nombre" binding:"required"`
	Activa *bool  `json:"activa" binding:"required"`
}

// CrearClienteRequest es el cuerpo de POST /clientes.
type CrearClienteRequest struct {
	DNI           string  `json:"dni" binding:"required"`
	Nombre        string  `json:"nombre" binding:"required"`
	Email         *string `json:"email" binding:"omitempty,email"`
	InstitucionID string  `json:"institucion_id" binding:"required,uuid"`
}

// ActualizarClienteRequest es el cuerpo de PUT /clientes/:id (el DNI no se edita).
type ActualizarClienteRequest struct {
	Nombre        string  `json:"nombre" binding:"required"`
	Email         *string `json:"email" binding:"omitempty,email"`
	InstitucionID string  `json:"institucion_id" binding:"required,uuid"`
}

// ItemCompraRequest es una línea del pedido (producto + cantidad).
type ItemCompraRequest struct {
	ProductoID string `json:"producto_id" binding:"required,uuid"`
	Cantidad   int    `json:"cantidad" binding:"required,min=1"`
}

// RegistrarCompraRequest es el cuerpo de POST /compras.
type RegistrarCompraRequest struct {
	ClienteID   string              `json:"cliente_id" binding:"required,uuid"`
	Items       []ItemCompraRequest `json:"items" binding:"required,min=1,dive"`
	CondicionID *string             `json:"condicion_id" binding:"omitempty,uuid"`
}

// ── Menú admin ──────────────────────────────────────────────────────────────

// CrearCategoriaRequest es el cuerpo de POST /categorias.
type CrearCategoriaRequest struct {
	Nombre  string `json:"nombre" binding:"required"`
	Seccion string `json:"seccion" binding:"required,oneof=Cafetería 'Cocina de mediodía'"`
	Orden   int    `json:"orden"`
}

// ActualizarCategoriaRequest es el cuerpo de PUT /categorias/:id.
type ActualizarCategoriaRequest struct {
	Nombre  string `json:"nombre" binding:"required"`
	Seccion string `json:"seccion" binding:"required,oneof=Cafetería 'Cocina de mediodía'"`
	Orden   int    `json:"orden"`
}

// CrearProductoRequest es el cuerpo de POST /productos.
type CrearProductoRequest struct {
	CategoriaID string `json:"categoria_id" binding:"required,uuid"`
	Nombre      string `json:"nombre" binding:"required"`
	Descripcion string `json:"descripcion"`
	Precio      int    `json:"precio" binding:"min=0"`
	EsInfusion  bool   `json:"es_infusion"`
}

// ActualizarProductoRequest es el cuerpo de PUT /productos/:id.
type ActualizarProductoRequest struct {
	CategoriaID string `json:"categoria_id" binding:"required,uuid"`
	Nombre      string `json:"nombre" binding:"required"`
	Descripcion string `json:"descripcion"`
	Precio      int    `json:"precio" binding:"min=0"`
	EsInfusion  bool   `json:"es_infusion"`
	Activo      bool   `json:"activo"`
}

// ── Beneficios admin ─────────────────────────────────────────────────────────

// CrearBeneficioRequest es el cuerpo de POST /beneficios.
type CrearBeneficioRequest struct {
	InstitucionIDs []string `json:"institucion_ids" binding:"required,min=1,dive,uuid"`
	Nombre         string   `json:"nombre" binding:"required"`
}

// ActualizarBeneficioRequest es el cuerpo de PUT /beneficios/:id.
type ActualizarBeneficioRequest struct {
	InstitucionIDs []string `json:"institucion_ids" binding:"required,min=1,dive,uuid"`
	Nombre         string   `json:"nombre" binding:"required"`
	Activo         bool     `json:"activo"`
}

// CrearCondicionRequest es el cuerpo de POST /beneficios/:id/condiciones.
type CrearCondicionRequest struct {
	UmbralInfusiones int    `json:"umbral_infusiones" binding:"min=0"`
	TipoDescuento    string `json:"tipo_descuento" binding:"required,oneof=porcentaje monto_fijo producto_gratis"`
	ValorDescuento   int    `json:"valor_descuento" binding:"min=0"`
	ReiniciaContador bool   `json:"reinicia_contador"`
	Vigente          *bool  `json:"vigente"`

	TipoTrigger             string   `json:"tipo_trigger" binding:"omitempty,oneof=siempre dias_semana contador"`
	DiasSemana              []int    `json:"dias_semana"`
	ScopeTrigger            string   `json:"scope_trigger" binding:"omitempty,oneof=infusiones categoria producto"`
	ScopeTriggerCategoriaID *string  `json:"scope_trigger_categoria_id" binding:"omitempty,uuid"`
	ScopeTriggerProductoID  *string  `json:"scope_trigger_producto_id" binding:"omitempty,uuid"`
	ScopeDescuento          string   `json:"scope_descuento" binding:"omitempty,oneof=total categoria"`
	ScopeDescuentoCategoriaID *string `json:"scope_descuento_categoria_id" binding:"omitempty,uuid"`
}

// ImportarClienteItem es un cliente dentro del lote de POST /clientes/importar.
type ImportarClienteItem struct {
	DNI           string  `json:"dni" binding:"required"`
	Nombre        string  `json:"nombre" binding:"required"`
	Email         *string `json:"email" binding:"omitempty,email"`
	InstitucionID string  `json:"institucion_id" binding:"required,uuid"`
}

// ImportarClientesRequest es el cuerpo de POST /clientes/importar.
type ImportarClientesRequest struct {
	Clientes []ImportarClienteItem `json:"clientes" binding:"required,min=1,dive"`
}

// ActualizarCondicionRequest es el cuerpo de PUT /condiciones/:id.
type ActualizarCondicionRequest struct {
	UmbralInfusiones int    `json:"umbral_infusiones" binding:"min=0"`
	TipoDescuento    string `json:"tipo_descuento" binding:"required,oneof=porcentaje monto_fijo producto_gratis"`
	ValorDescuento   int    `json:"valor_descuento" binding:"min=0"`
	ReiniciaContador bool   `json:"reinicia_contador"`
	Vigente          bool   `json:"vigente"`

	TipoTrigger             string   `json:"tipo_trigger" binding:"omitempty,oneof=siempre dias_semana contador"`
	DiasSemana              []int    `json:"dias_semana"`
	ScopeTrigger            string   `json:"scope_trigger" binding:"omitempty,oneof=infusiones categoria producto"`
	ScopeTriggerCategoriaID *string  `json:"scope_trigger_categoria_id" binding:"omitempty,uuid"`
	ScopeTriggerProductoID  *string  `json:"scope_trigger_producto_id" binding:"omitempty,uuid"`
	ScopeDescuento          string   `json:"scope_descuento" binding:"omitempty,oneof=total categoria"`
	ScopeDescuentoCategoriaID *string `json:"scope_descuento_categoria_id" binding:"omitempty,uuid"`
}
