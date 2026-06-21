// Package config carga la configuración de la API desde variables de entorno.
package config

import (
	"os"
	"strings"
	"time"
)

// Config agrupa toda la configuración de la aplicación.
type Config struct {
	Env                string
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTAccessTTL       time.Duration
	JWTRefreshTTL      time.Duration
	CORSAllowedOrigins []string
}

// Load lee las variables de entorno y devuelve la configuración con defaults de desarrollo.
func Load() Config {
	return Config{
		Env:                getEnv("APP_ENV", "development"),
		// Render (y otros PaaS) inyectan PORT; localmente usamos API_PORT.
		Port:               getEnv("PORT", getEnv("API_PORT", "8080")),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/primitivo?sslmode=disable"),
		JWTSecret:          getEnv("JWT_SECRET", "dev-secret-cambiar"),
		JWTAccessTTL:       getDuration("JWT_ACCESS_TTL", 15*time.Minute),
		JWTRefreshTTL:      getDuration("JWT_REFRESH_TTL", 168*time.Hour),
		CORSAllowedOrigins: splitAndTrim(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:8081")),
	}
}

// IsProduction indica si la app corre en entorno productivo.
func (c Config) IsProduction() bool {
	return c.Env == "production"
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getDuration(key string, def time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
