// Package service contiene la lógica de negocio (casos de uso). Depende de las interfaces
// de repository, nunca de la implementación concreta ni de la capa HTTP.
package service

import (
	"context"
	"errors"
	"strings"

	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/hash"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/jwt"
)

// TokenPair son los tokens emitidos al autenticarse.
type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

// AuthService maneja el login y la renovación de tokens.
type AuthService struct {
	usuarios repository.UsuarioRepository
	jwt      *jwt.Manager
}

// NewAuthService inyecta el repositorio de usuarios y el manager de JWT.
func NewAuthService(usuarios repository.UsuarioRepository, jwtManager *jwt.Manager) *AuthService {
	return &AuthService{usuarios: usuarios, jwt: jwtManager}
}

// Login valida credenciales y emite los tokens. Ante cualquier fallo de credenciales
// devuelve siempre ErrCredencialesInvalidas para no filtrar si el email existe.
func (s *AuthService) Login(ctx context.Context, email, password string) (TokenPair, error) {
	usuario, err := s.usuarios.GetByEmail(ctx, normalizarEmail(email))
	if err != nil {
		if errors.Is(err, domain.ErrUsuarioNoEncontrado) {
			return TokenPair{}, domain.ErrCredencialesInvalidas
		}
		return TokenPair{}, err
	}
	if !usuario.Activo {
		return TokenPair{}, domain.ErrCredencialesInvalidas
	}
	if err := hash.Compare(usuario.PasswordHash, password); err != nil {
		return TokenPair{}, domain.ErrCredencialesInvalidas
	}
	return s.emitirTokens(usuario)
}

// Refresh valida un refresh token, recarga el usuario (para reflejar rol/estado actuales)
// y emite tokens nuevos.
func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (TokenPair, error) {
	claims, err := s.jwt.Parse(refreshToken, jwt.TipoRefresh)
	if err != nil {
		return TokenPair{}, domain.ErrTokenInvalido
	}
	userID, err := claims.UserID()
	if err != nil {
		return TokenPair{}, domain.ErrTokenInvalido
	}
	usuario, err := s.usuarios.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrUsuarioNoEncontrado) {
			return TokenPair{}, domain.ErrTokenInvalido
		}
		return TokenPair{}, err
	}
	if !usuario.Activo {
		return TokenPair{}, domain.ErrNoAutorizado
	}
	return s.emitirTokens(usuario)
}

func (s *AuthService) emitirTokens(u domain.Usuario) (TokenPair, error) {
	access, err := s.jwt.GenerateAccessToken(u.ID, string(u.Rol))
	if err != nil {
		return TokenPair{}, err
	}
	refresh, err := s.jwt.GenerateRefreshToken(u.ID)
	if err != nil {
		return TokenPair{}, err
	}
	return TokenPair{AccessToken: access, RefreshToken: refresh}, nil
}

func normalizarEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
