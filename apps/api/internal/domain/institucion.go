package domain

import (
	"time"

	"github.com/google/uuid"
)

// Institucion es un convenio: agrupa clientes y ofrece beneficios.
type Institucion struct {
	ID        uuid.UUID
	Nombre    string
	Activa    bool
	CreatedAt time.Time
}
