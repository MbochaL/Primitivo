package domain

import "github.com/google/uuid"

// BeneficioDisponible es un read-model para la vista del cliente: una condición vigente
// de un beneficio de su institución, con el flag de si ya alcanzó el trigger.
type BeneficioDisponible struct {
	CondicionID      uuid.UUID
	BeneficioNombre  string
	UmbralInfusiones int
	TipoDescuento    string // porcentaje | monto_fijo | producto_gratis
	ValorDescuento   int
	ReiniciaContador bool
	Alcanzado        bool

	// Trigger
	TipoTrigger             string    // siempre | dias_semana | contador
	DiasSemana              []int     // relevante si TipoTrigger='dias_semana' (0=dom..6=sab)
	ScopeTrigger            string    // infusiones | categoria | producto
	ScopeTriggerCategoriaID *uuid.UUID
	ScopeTriggerProductoID  *uuid.UUID

	// Alcance del descuento
	ScopeDescuento            string // total | categoria
	ScopeDescuentoCategoriaID *uuid.UUID
}

// ── Entidades admin ──────────────────────────────────────────────────────────

// Beneficio es un programa de beneficios vinculado a una institución.
type Beneficio struct {
	ID            uuid.UUID
	InstitucionID uuid.UUID
	Nombre        string
	Activo        bool
}

// Condicion es una regla dentro de un beneficio.
type Condicion struct {
	ID               uuid.UUID
	BeneficioID      uuid.UUID
	UmbralInfusiones int
	TipoDescuento    string // porcentaje | monto_fijo | producto_gratis
	ValorDescuento   int
	ReiniciaContador bool
	Vigente          bool

	// Trigger
	TipoTrigger             string // siempre | dias_semana | contador
	DiasSemana              []int
	ScopeTrigger            string // infusiones | categoria | producto
	ScopeTriggerCategoriaID *uuid.UUID
	ScopeTriggerProductoID  *uuid.UUID

	// Alcance del descuento
	ScopeDescuento            string // total | categoria
	ScopeDescuentoCategoriaID *uuid.UUID
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

	TipoTrigger             string
	DiasSemana              []int
	ScopeTrigger            string
	ScopeTriggerCategoriaID *uuid.UUID
	ScopeTriggerProductoID  *uuid.UUID

	ScopeDescuento            string
	ScopeDescuentoCategoriaID *uuid.UUID
}

// ActualizarCondicionInput es el input para editar una condición (admin).
type ActualizarCondicionInput struct {
	ID               uuid.UUID
	UmbralInfusiones int
	TipoDescuento    string
	ValorDescuento   int
	ReiniciaContador bool
	Vigente          bool

	TipoTrigger             string
	DiasSemana              []int
	ScopeTrigger            string
	ScopeTriggerCategoriaID *uuid.UUID
	ScopeTriggerProductoID  *uuid.UUID

	ScopeDescuento            string
	ScopeDescuentoCategoriaID *uuid.UUID
}
