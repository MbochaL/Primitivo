// Package handler contiene la capa HTTP (transport) de la API.
package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// HealthHandler responde el healthcheck del servicio.
type HealthHandler struct {
	db *pgxpool.Pool
}

// NewHealthHandler construye el handler de health con sus dependencias.
func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{db: db}
}

// HealthResponse es la respuesta del healthcheck.
type HealthResponse struct {
	Status string `json:"status"`
	DB     string `json:"db"`
}

// Check godoc
//
//	@Summary	Healthcheck del servicio
//	@Tags		health
//	@Produce	json
//	@Success	200	{object}	HealthResponse
//	@Router		/health [get]
func (h *HealthHandler) Check(c *gin.Context) {
	dbStatus := "up"
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	if err := h.db.Ping(ctx); err != nil {
		dbStatus = "down"
	}

	c.JSON(http.StatusOK, HealthResponse{Status: "ok", DB: dbStatus})
}
