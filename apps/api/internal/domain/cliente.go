package domain

import "time"

// Cliente es la entidad de dominio del cliente de la cafetería, identificado por DNI.
// El contador de infusiones se mantiene denormalizado para lectura rápida y habilita
// la evaluación de beneficios.
type Cliente struct {
	ID                 string
	DNI                string
	Nombre             string
	Email              *string
	InstitucionID      *string
	ContadorInfusiones int
	CreatedAt          time.Time
}
