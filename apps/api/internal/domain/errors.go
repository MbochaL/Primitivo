// Package domain contiene las entidades y reglas puras del negocio, sin dependencias externas.
package domain

import "errors"

// Errores de dominio. El handler los traduce a códigos HTTP; el cliente nunca ve un error SQL crudo.
var (
	// Usuarios / auth
	ErrUsuarioNoEncontrado   = errors.New("usuario no encontrado")
	ErrEmailYaRegistrado     = errors.New("ya existe un usuario con ese email")
	ErrRolInvalido           = errors.New("rol inválido")
	ErrCredencialesInvalidas = errors.New("credenciales inválidas")
	ErrUsuarioInactivo       = errors.New("el usuario está inactivo")
	ErrTokenInvalido         = errors.New("token inválido o expirado")
	ErrNoAutorizado          = errors.New("no autorizado")
	ErrProhibido             = errors.New("no tenés permiso para esta acción")

	// Instituciones
	ErrInstitucionNoEncontrada = errors.New("institución no encontrada")

	// Clientes / menú / beneficios
	ErrClienteNoEncontrado   = errors.New("cliente no encontrado")
	ErrDNIYaRegistrado       = errors.New("ya existe un cliente con ese DNI")
	ErrProductoNoEncontrado  = errors.New("producto no encontrado")
	ErrBeneficioNoDisponible = errors.New("el beneficio no está disponible para el cliente")
	ErrUmbralNoAlcanzado     = errors.New("el cliente no alcanzó el umbral de la condición")
	ErrCompraSinItems        = errors.New("la compra no tiene items")
)
