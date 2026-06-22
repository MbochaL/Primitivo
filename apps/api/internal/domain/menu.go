package domain

import "github.com/google/uuid"

// Seccion agrupa el menú en sus dos grandes ramas.
type Seccion string

const (
	SeccionCafeteria Seccion = "Cafetería"
	SeccionCocina    Seccion = "Cocina de mediodía"
)

// Categoria es una subcategoría del menú (ej. "Espresso & café") dentro de una sección.
type Categoria struct {
	ID      uuid.UUID
	Nombre  string
	Seccion Seccion
	Orden   int
}

// Producto es un ítem del menú. El precio (entero) es editable; es_infusion marca lo que
// cuenta para los beneficios; activo permite baja lógica.
type Producto struct {
	ID          uuid.UUID
	CategoriaID uuid.UUID
	Nombre      string
	Descripcion string
	Precio      int
	EsInfusion  bool
	Activo      bool
}

// CategoriaConProductos es el read-model del menú agrupado: una categoría con sus productos.
type CategoriaConProductos struct {
	Categoria
	Productos []Producto
}

// NuevoProducto es el input para crear un producto (admin).
type NuevoProducto struct {
	CategoriaID uuid.UUID
	Nombre      string
	Descripcion string
	Precio      int
	EsInfusion  bool
}

// ActualizarProductoInput es el input para editar un producto (admin).
type ActualizarProductoInput struct {
	ID          uuid.UUID
	CategoriaID uuid.UUID
	Nombre      string
	Descripcion string
	Precio      int
	EsInfusion  bool
	Activo      bool
}

// NuevaCategoria es el input para crear una categoría (admin).
type NuevaCategoria struct {
	Nombre  string
	Seccion Seccion
	Orden   int
}

// ActualizarCategoriaInput es el input para editar una categoría (admin).
type ActualizarCategoriaInput struct {
	ID      uuid.UUID
	Nombre  string
	Seccion Seccion
	Orden   int
}
