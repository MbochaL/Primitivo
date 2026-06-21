package domain

import (
	"time"

	"github.com/google/uuid"
)

// Cliente es la entidad de dominio del cliente de la cafetería, identificado por DNI.
// El contador de infusiones se mantiene denormalizado para lectura rápida y habilita
// la evaluación de beneficios.
type Cliente struct {
	ID                 uuid.UUID
	DNI                string
	Nombre             string
	Email              *string
	InstitucionID      *uuid.UUID
	ContadorInfusiones int
	CreatedAt          time.Time
}

// ClienteConInstitucion es un read-model: el cliente más el nombre de su institución
// (resuelto por join). Se usa en las vistas de búsqueda y detalle.
type ClienteConInstitucion struct {
	Cliente
	InstitucionNombre *string
}
