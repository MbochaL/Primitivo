package dto

import (
	"time"

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
