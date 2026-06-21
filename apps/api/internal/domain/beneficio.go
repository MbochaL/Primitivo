package domain

// BeneficioDisponible es un read-model para la vista del cliente: una condición vigente
// de un beneficio de su institución, con el flag de si ya alcanzó el umbral.
type BeneficioDisponible struct {
	BeneficioNombre  string
	UmbralInfusiones int
	TipoDescuento    string // porcentaje | monto_fijo
	ValorDescuento   int
	ReiniciaContador bool
	Alcanzado        bool // contador_infusiones >= umbral_infusiones
}
