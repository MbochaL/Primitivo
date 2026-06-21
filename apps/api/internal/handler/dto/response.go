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
	BeneficioNombre  string `json:"beneficio_nombre"`
	UmbralInfusiones int    `json:"umbral_infusiones"`
	TipoDescuento    string `json:"tipo_descuento"`
	ValorDescuento   int    `json:"valor_descuento"`
	ReiniciaContador bool   `json:"reinicia_contador"`
	Alcanzado        bool   `json:"alcanzado"`
}

// ToBeneficioDisponibleResponseList mapea los beneficios disponibles a sus DTOs.
func ToBeneficioDisponibleResponseList(bs []domain.BeneficioDisponible) []BeneficioDisponibleResponse {
	out := make([]BeneficioDisponibleResponse, 0, len(bs))
	for _, b := range bs {
		out = append(out, BeneficioDisponibleResponse{
			BeneficioNombre:  b.BeneficioNombre,
			UmbralInfusiones: b.UmbralInfusiones,
			TipoDescuento:    b.TipoDescuento,
			ValorDescuento:   b.ValorDescuento,
			ReiniciaContador: b.ReiniciaContador,
			Alcanzado:        b.Alcanzado,
		})
	}
	return out
}

func uuidPtrToString(id *uuid.UUID) *string {
	if id == nil {
		return nil
	}
	s := id.String()
	return &s
}
