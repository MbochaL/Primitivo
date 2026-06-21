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
	InstitucionID *string `json:"institucion_id" binding:"omitempty,uuid"`
}

// ActualizarClienteRequest es el cuerpo de PUT /clientes/:id (el DNI no se edita).
type ActualizarClienteRequest struct {
	Nombre        string  `json:"nombre" binding:"required"`
	Email         *string `json:"email" binding:"omitempty,email"`
	InstitucionID *string `json:"institucion_id" binding:"omitempty,uuid"`
}
