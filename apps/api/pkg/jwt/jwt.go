// Package jwt genera y valida los JSON Web Tokens de la API (access y refresh).
package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Tipos de token. El access se usa en cada request; el refresh solo para renovar.
const (
	TipoAccess  = "access"
	TipoRefresh = "refresh"
)

// ErrTokenInvalido se devuelve cuando un token no es válido, expiró o tiene el tipo incorrecto.
var ErrTokenInvalido = errors.New("token inválido o expirado")

// Claims son los claims propios de Primitivo embebidos en el JWT.
type Claims struct {
	Rol  string `json:"rol,omitempty"`
	Tipo string `json:"tipo"`
	jwt.RegisteredClaims
}

// Manager firma y verifica tokens con una clave secreta y TTLs configurables.
type Manager struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

// NewManager construye el Manager con el secreto y las duraciones de cada tipo de token.
func NewManager(secret string, accessTTL, refreshTTL time.Duration) *Manager {
	return &Manager{
		secret:     []byte(secret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}
}

// GenerateAccessToken emite un token de acceso con el id y el rol del usuario.
func (m *Manager) GenerateAccessToken(userID uuid.UUID, rol string) (string, error) {
	return m.generar(userID, rol, TipoAccess, m.accessTTL)
}

// GenerateRefreshToken emite un token de refresco (sin rol; el rol se relee al renovar).
func (m *Manager) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	return m.generar(userID, "", TipoRefresh, m.refreshTTL)
}

func (m *Manager) generar(userID uuid.UUID, rol, tipo string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		Rol:  rol,
		Tipo: tipo,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// Parse valida la firma y la expiración y exige que el tipo coincida con el esperado.
func (m *Manager) Parse(tokenString, tipoEsperado string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrTokenInvalido
		}
		return m.secret, nil
	})
	if err != nil || !token.Valid || claims.Tipo != tipoEsperado {
		return nil, ErrTokenInvalido
	}
	return claims, nil
}

// UserID extrae y parsea el subject del token como UUID.
func (c *Claims) UserID() (uuid.UUID, error) {
	return uuid.Parse(c.Subject)
}
