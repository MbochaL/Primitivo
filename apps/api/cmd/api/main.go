// Package main arranca el servidor HTTP de la API de Primitivo.
//
//	@title			Primitivo API
//	@version		1.0
//	@description	API de fidelización y beneficios de Primitivo (pan · café · cocina).
//	@host			localhost:8080
//	@BasePath		/api/v1
//	@securityDefinitions.apikey	BearerAuth
//	@in				header
//	@name			Authorization
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/martinbosch1996/primitivo/apps/api/internal/config"
	"github.com/martinbosch1996/primitivo/apps/api/internal/handler"
	"github.com/martinbosch1996/primitivo/apps/api/internal/repository/postgres"
	"github.com/martinbosch1996/primitivo/apps/api/internal/router"
	"github.com/martinbosch1996/primitivo/apps/api/internal/service"
	"github.com/martinbosch1996/primitivo/apps/api/pkg/jwt"
)

func main() {
	// Carga el .env (de la raíz del repo o del propio directorio) si existe; silencioso si no.
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../../.env")

	cfg := config.Load()

	// ── Infraestructura: pool de PostgreSQL ─────────────────────────────
	ctx := context.Background()
	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("no se pudo crear el pool de PostgreSQL: %v", err)
	}
	defer pool.Close()

	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		if cfg.IsProduction() {
			log.Fatalf("no se pudo conectar a PostgreSQL: %v", err)
		}
		log.Printf("ADVERTENCIA: PostgreSQL no disponible (%v). El servidor arranca igual en modo %s.", err, cfg.Env)
	}

	jwtManager := jwt.NewManager(cfg.JWTSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)

	// ── Inyección de dependencias por constructor ───────────────────────
	// La cadena se arma de adentro hacia afuera: pool → repos → services → handlers.
	usuarioRepo := postgres.NewUsuarioRepo(pool)
	institucionRepo := postgres.NewInstitucionRepo(pool)
	clienteRepo := postgres.NewClienteRepo(pool)
	menuRepo := postgres.NewMenuRepo(pool)
	compraRepo := postgres.NewCompraRepo(pool)

	authService := service.NewAuthService(usuarioRepo, jwtManager)
	usuarioService := service.NewUsuarioService(usuarioRepo)
	institucionService := service.NewInstitucionService(institucionRepo)
	clienteService := service.NewClienteService(clienteRepo)
	menuService := service.NewMenuService(menuRepo)
	compraService := service.NewCompraService(compraRepo)

	handlers := router.Handlers{
		Health:      handler.NewHealthHandler(pool),
		Auth:        handler.NewAuthHandler(authService),
		Usuario:     handler.NewUsuarioHandler(usuarioService),
		Institucion: handler.NewInstitucionHandler(institucionService),
		Cliente:     handler.NewClienteHandler(clienteService),
		Menu:        handler.NewMenuHandler(menuService),
		Compra:      handler.NewCompraHandler(compraService),
	}

	engine := router.New(cfg, jwtManager, handlers)

	// ── Servidor HTTP ───────────────────────────────────────────────────
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("API escuchando en http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("error del servidor: %v", err)
		}
	}()

	// ── Graceful shutdown ante SIGINT/SIGTERM ───────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("apagando servidor...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("apagado forzado: %v", err)
	}
	log.Println("servidor detenido")
}
