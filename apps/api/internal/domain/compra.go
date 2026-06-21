package domain

import (
	"time"

	"github.com/google/uuid"
)

// Compra es la cabecera de una venta registrada (historial del cliente).
type Compra struct {
	ID        uuid.UUID
	ClienteID uuid.UUID
	UsuarioID uuid.UUID
	Subtotal  int
	Descuento int
	Total     int
	Fecha     time.Time
}
