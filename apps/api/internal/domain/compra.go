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

// ItemCompra es una línea solicitada al registrar una compra (qué producto y cuánto).
type ItemCompra struct {
	ProductoID uuid.UUID
	Cantidad   int
}

// NuevaCompra son los datos de entrada para registrar una venta dentro de la transacción.
type NuevaCompra struct {
	ClienteID   uuid.UUID
	UsuarioID   uuid.UUID
	Items       []ItemCompra
	CondicionID *uuid.UUID // beneficio a canjear (opcional)
}
