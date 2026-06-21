package domain

import "github.com/google/uuid"

// Rol distingue los dos tipos de usuario del sistema.
type Rol string

const (
	RolAdministrador Rol = "administrador"
	RolOperador      Rol = "operador"
)

// Valido indica si el rol es uno de los valores permitidos.
func (r Rol) Valido() bool {
	return r == RolAdministrador || r == RolOperador
}

// Usuario es la entidad de dominio de los usuarios del sistema (operadores y admins).
// PasswordHash vive en el dominio porque el caso de uso de login lo necesita, pero
// nunca se expone por HTTP (los DTOs de respuesta lo omiten).
type Usuario struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Rol          Rol
	Activo       bool
}
