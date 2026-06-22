package domain

import "github.com/google/uuid"

// BeneficioDisponible es un read-model para la vista del cliente: una condición vigente
// de un beneficio de su institución, con el flag de si ya alcanzó el umbral.
type BeneficioDisponible struct {
	CondicionID      uuid.UUID
	BeneficioNombre  string
	UmbralInfusiones int
	TipoDescuento    string // porcentaje | monto_fijo
	ValorDescuento   int
	ReiniciaContador bool
	Alcanzado        bool // contador_infusiones >= umbral_infusiones
}

// ── Entidades admin ──────────────────────────────────────────────────────────

// Beneficio es un programa de beneficios vinculado a una institución.
type Beneficio struct {
	ID            uuid.UUID
	InstitucionID uuid.UUID
	Nombre        string
	Activo        bool
}

// Condicion es una regla escalonada dentro de un beneficio.
type Condicion struct {
	ID               uuid.UUID
	BeneficioID      uuid.UUID
	UmbralInfusiones int
	TipoDescuento    string // porcentaje | monto_fijo
	ValorDescuento   int
	ReiniciaContador bool
	Vigente          bool
}

// BeneficioConDetalle es el read-model admin de un beneficio con su institución y condiciones.
type BeneficioConDetalle struct {
	Beneficio
	InstitucionNombre string
	Condiciones       []Condicion
}

// ── Inputs ───────────────────────────────────────────────────────────────────

// NuevoBeneficio es el input para crear un beneficio (admin).
type NuevoBeneficio struct {
	InstitucionID uuid.UUID
	Nombre        string
}

// ActualizarBeneficioInput es el input para editar un beneficio (admin).
type ActualizarBeneficioInput struct {
	ID            uuid.UUID
	InstitucionID uuid.UUID
	Nombre        string
	Activo        bool
}

// NuevaCondicion es el input para crear una condición (admin).
type NuevaCondicion struct {
	BeneficioID      uuid.UUID
	UmbralInfusiones int
	TipoDescuento    string
	ValorDescuento   int
	ReiniciaContador bool
	Vigente          bool
}

// ActualizarCondicionInput es el input para editar una condición (admin).
type ActualizarCondicionInput struct {
	ID               uuid.UUID
	UmbralInfusiones int
	TipoDescuento    string
	ValorDescuento   int
	ReiniciaContador bool
	Vigente          bool
}
