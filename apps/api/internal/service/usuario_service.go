package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/hash"
)

// CrearUsuarioInput son los datos para dar de alta un usuario (password en texto plano).
type CrearUsuarioInput struct {
	Email    string
	Password string
	Rol      domain.Rol
}

// ActualizarUsuarioInput son los datos editables de un usuario.
type ActualizarUsuarioInput struct {
	Email  string
	Rol    domain.Rol
	Activo bool
}

// UsuarioService gestiona el alta y la administración de usuarios del sistema (solo admin).
type UsuarioService struct {
	usuarios repository.UsuarioRepository
}

// NewUsuarioService inyecta el repositorio de usuarios.
func NewUsuarioService(usuarios repository.UsuarioRepository) *UsuarioService {
	return &UsuarioService{usuarios: usuarios}
}

// Crear hashea la contraseña y persiste el usuario.
func (s *UsuarioService) Crear(ctx context.Context, in CrearUsuarioInput) (domain.Usuario, error) {
	if !in.Rol.Valido() {
		return domain.Usuario{}, domain.ErrRolInvalido
	}
	hashed, err := hash.Hash(in.Password)
	if err != nil {
		return domain.Usuario{}, err
	}
	return s.usuarios.Crear(ctx, domain.Usuario{
		Email:        normalizarEmail(in.Email),
		PasswordHash: hashed,
		Rol:          in.Rol,
	})
}

// List devuelve todos los usuarios del sistema.
func (s *UsuarioService) List(ctx context.Context) ([]domain.Usuario, error) {
	return s.usuarios.List(ctx)
}

// Actualizar modifica email, rol y estado (activo) de un usuario.
func (s *UsuarioService) Actualizar(ctx context.Context, id uuid.UUID, in ActualizarUsuarioInput) (domain.Usuario, error) {
	if !in.Rol.Valido() {
		return domain.Usuario{}, domain.ErrRolInvalido
	}
	return s.usuarios.Actualizar(ctx, domain.Usuario{
		ID:     id,
		Email:  normalizarEmail(in.Email),
		Rol:    in.Rol,
		Activo: in.Activo,
	})
}

// ResetPassword cambia la contraseña de cualquier usuario (acción de administrador).
func (s *UsuarioService) ResetPassword(ctx context.Context, id uuid.UUID, nuevaPassword string) error {
	// Verifica existencia para devolver 404 claro (ActualizarPassword es :exec y no lo informa).
	if _, err := s.usuarios.GetByID(ctx, id); err != nil {
		return err
	}
	hashed, err := hash.Hash(nuevaPassword)
	if err != nil {
		return err
	}
	return s.usuarios.ActualizarPassword(ctx, id, hashed)
}
