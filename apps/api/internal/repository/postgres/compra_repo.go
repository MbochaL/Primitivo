package postgres

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// CompraRepo implementa repository.CompraRepository. Registra la venta dentro de una
// transacción pgx: o se persiste todo (compra + detalle + canje + contador) o nada.
type CompraRepo struct {
	pool *pgxpool.Pool
}

// NewCompraRepo recibe el pool para poder abrir transacciones.
func NewCompraRepo(pool *pgxpool.Pool) *CompraRepo {
	return &CompraRepo{pool: pool}
}

// itemInfo agrupa los datos de producto necesarios para calcular el descuento.
type itemInfo struct {
	productoID  uuid.UUID
	categoriaID uuid.UUID
	precio      int32
	cantidad    int
}

func (r *CompraRepo) RegistrarCompra(ctx context.Context, n domain.NuevaCompra) (domain.Compra, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.Compra{}, err
	}
	defer tx.Rollback(ctx) // no-op si ya se hizo Commit

	q := sqlc.New(tx)

	// 1. Cliente (contador + institución).
	cliente, err := q.GetClientePorID(ctx, n.ClienteID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Compra{}, domain.ErrClienteNoEncontrado
		}
		return domain.Compra{}, err
	}

	// 2. Cargar productos: subtotal + conteo de infusiones + datos para descuento.
	subtotal := 0
	infusiones := 0
	items := make([]itemInfo, len(n.Items))
	for i, it := range n.Items {
		p, err := q.GetProductoPorID(ctx, it.ProductoID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.Compra{}, domain.ErrProductoNoEncontrado
			}
			return domain.Compra{}, err
		}
		items[i] = itemInfo{
			productoID:  p.ID,
			categoriaID: p.CategoriaID,
			precio:      p.Precio,
			cantidad:    it.Cantidad,
		}
		subtotal += int(p.Precio) * it.Cantidad
		if p.EsInfusion {
			infusiones += it.Cantidad
		}
	}

	// 3. Beneficio (opcional): validar trigger y calcular descuento.
	descuento := 0
	var canje *sqlc.GetCondicionParaCanjeRow
	if n.CondicionID != nil {
		cond, err := q.GetCondicionParaCanje(ctx, *n.CondicionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.Compra{}, domain.ErrBeneficioNoDisponible
			}
			return domain.Compra{}, err
		}
		if !cond.Vigente || !cond.BeneficioActivo {
			return domain.Compra{}, domain.ErrBeneficioNoDisponible
		}
		if !cliente.InstitucionID.Valid || cliente.InstitucionID.UUID != cond.InstitucionID {
			return domain.Compra{}, domain.ErrBeneficioNoDisponible
		}

		// Validar trigger.
		switch cond.TipoTrigger {
		case "siempre":
			// siempre disponible

		case "dias_semana":
			weekday := int(time.Now().Weekday())
			if !containsInt32(cond.DiasSemana, int32(weekday)) {
				return domain.Compra{}, domain.ErrBeneficioNoDisponible
			}

		default: // "contador"
			var count int
			switch cond.ScopeTrigger {
			case "categoria":
				if !cond.ScopeTriggerCategoriaID.Valid {
					return domain.Compra{}, domain.ErrBeneficioNoDisponible
				}
				catID := uuid.UUID(cond.ScopeTriggerCategoriaID.Bytes)
				// Buscar último canje de esta condición para determinar desde cuándo contar.
				desde, err := r.ultimoCanje(ctx, q, n.ClienteID, cond.ID, cond.ReiniciaContador)
				if err != nil {
					return domain.Compra{}, err
				}
				n32, err := q.ContarItemsPorClienteYCategoria(ctx, sqlc.ContarItemsPorClienteYCategoriaParams{
					ClienteID:   n.ClienteID,
					CategoriaID: catID,
					Desde:       timePtrToPgtype(desde),
				})
				if err != nil {
					return domain.Compra{}, err
				}
				count = int(n32)

			case "producto":
				if !cond.ScopeTriggerProductoID.Valid {
					return domain.Compra{}, domain.ErrBeneficioNoDisponible
				}
				prodID := uuid.UUID(cond.ScopeTriggerProductoID.Bytes)
				desde, err := r.ultimoCanje(ctx, q, n.ClienteID, cond.ID, cond.ReiniciaContador)
				if err != nil {
					return domain.Compra{}, err
				}
				n32, err := q.ContarItemsPorClienteYProducto(ctx, sqlc.ContarItemsPorClienteYProductoParams{
					ClienteID:  n.ClienteID,
					ProductoID: prodID,
					Desde:      timePtrToPgtype(desde),
				})
				if err != nil {
					return domain.Compra{}, err
				}
				count = int(n32)

			default: // "infusiones"
				count = int(cliente.ContadorInfusiones)
			}

			if count < int(cond.UmbralInfusiones) {
				return domain.Compra{}, domain.ErrUmbralNoAlcanzado
			}
		}

		// Calcular descuento.
		descuento = calcularDescuento(cond, items, subtotal)
		if descuento > subtotal {
			descuento = subtotal
		}
		canje = &cond
	}

	total := subtotal - descuento

	// 4. Insertar compra + detalle (+ canje si corresponde).
	compra, err := q.CreateCompra(ctx, sqlc.CreateCompraParams{
		ClienteID: n.ClienteID,
		UsuarioID: n.UsuarioID,
		Subtotal:  int32(subtotal),
		Descuento: int32(descuento),
		Total:     int32(total),
	})
	if err != nil {
		return domain.Compra{}, err
	}

	for i, it := range n.Items {
		if err := q.CreateDetalleCompra(ctx, sqlc.CreateDetalleCompraParams{
			CompraID:       compra.ID,
			ProductoID:     it.ProductoID,
			Cantidad:       int32(it.Cantidad),
			PrecioUnitario: items[i].precio,
		}); err != nil {
			return domain.Compra{}, err
		}
	}

	if canje != nil {
		if _, err := q.CreateCanje(ctx, sqlc.CreateCanjeParams{
			ClienteID:         n.ClienteID,
			BeneficioID:       canje.BeneficioID,
			CondicionID:       canje.ID,
			CompraID:          compra.ID,
			UsuarioID:         n.UsuarioID,
			DescuentoAplicado: int32(descuento),
		}); err != nil {
			return domain.Compra{}, err
		}
	}

	// 5. Actualizar contador de infusiones (solo para scope_trigger='infusiones').
	if canje != nil && canje.ReiniciaContador && canje.ScopeTrigger == "infusiones" {
		if err := q.ReiniciarContadorInfusiones(ctx, n.ClienteID); err != nil {
			return domain.Compra{}, err
		}
	} else if infusiones > 0 {
		if err := q.IncrementarContadorInfusiones(ctx, sqlc.IncrementarContadorInfusionesParams{
			ID:                 n.ClienteID,
			ContadorInfusiones: int32(infusiones),
		}); err != nil {
			return domain.Compra{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Compra{}, err
	}

	return domain.Compra{
		ID:        compra.ID,
		ClienteID: compra.ClienteID,
		UsuarioID: compra.UsuarioID,
		Subtotal:  int(compra.Subtotal),
		Descuento: int(compra.Descuento),
		Total:     int(compra.Total),
		Fecha:     compra.Fecha.Time,
	}, nil
}

// ListEnRango devuelve todas las compras (con datos del cliente) dentro del rango [desde, hasta).
func (r *CompraRepo) ListEnRango(ctx context.Context, desde, hasta time.Time) ([]domain.CompraConCliente, error) {
	rows, err := sqlc.New(r.pool).ListComprasEnRango(ctx,
		pgtype.Timestamptz{Time: desde, Valid: true},
		pgtype.Timestamptz{Time: hasta, Valid: true},
	)
	if err != nil {
		return nil, err
	}
	out := make([]domain.CompraConCliente, 0, len(rows))
	for _, row := range rows {
		out = append(out, domain.CompraConCliente{
			ID:            row.ID,
			ClienteID:     row.ClienteID,
			ClienteNombre: row.ClienteNombre,
			ClienteDNI:    row.ClienteDni,
			Subtotal:      int(row.Subtotal),
			Descuento:     int(row.Descuento),
			Total:         int(row.Total),
			Fecha:         row.Fecha.Time,
		})
	}
	return out, nil
}

// ── helpers privados ──────────────────────────────────────────────────────────

// ultimoCanje obtiene la fecha del último canje de esta condición para el cliente.
// Si reinicia_contador=false, devuelve nil (contar desde el inicio).
func (r *CompraRepo) ultimoCanje(ctx context.Context, q *sqlc.Queries, clienteID, condicionID uuid.UUID, reinicia bool) (*time.Time, error) {
	if !reinicia {
		return nil, nil
	}
	ts, err := q.GetFechaUltimoCanjeCondicion(ctx, sqlc.GetFechaUltimoCanjeCondicionParams{
		ClienteID:   clienteID,
		CondicionID: condicionID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if !ts.Valid {
		return nil, nil
	}
	t := ts.Time
	return &t, nil
}

// calcularDescuento aplica la lógica de descuento según tipo y scope.
func calcularDescuento(cond sqlc.GetCondicionParaCanjeRow, items []itemInfo, subtotal int) int {
	switch cond.TipoDescuento {
	case "porcentaje":
		base := scopeSubtotal(cond, items, subtotal)
		return base * int(cond.ValorDescuento) / 100

	case "monto_fijo":
		base := scopeSubtotal(cond, items, subtotal)
		d := int(cond.ValorDescuento)
		if d > base {
			d = base
		}
		return d

	case "producto_gratis":
		if !cond.ScopeDescuentoCategoriaID.Valid {
			return 0
		}
		catID := uuid.UUID(cond.ScopeDescuentoCategoriaID.Bytes)
		// El producto más barato de esa categoría que está en el carrito es gratis (una unidad).
		minPrice := math.MaxInt32
		for _, it := range items {
			if it.categoriaID == catID && int(it.precio) < minPrice {
				minPrice = int(it.precio)
			}
		}
		if minPrice == math.MaxInt32 {
			return 0
		}
		return minPrice
	}
	return 0
}

// scopeSubtotal calcula el subtotal al que se aplica el descuento según scope_descuento.
func scopeSubtotal(cond sqlc.GetCondicionParaCanjeRow, items []itemInfo, total int) int {
	if cond.ScopeDescuento == "categoria" && cond.ScopeDescuentoCategoriaID.Valid {
		catID := uuid.UUID(cond.ScopeDescuentoCategoriaID.Bytes)
		s := 0
		for _, it := range items {
			if it.categoriaID == catID {
				s += int(it.precio) * it.cantidad
			}
		}
		return s
	}
	return total
}

func containsInt32(s []int32, v int32) bool {
	for _, x := range s {
		if x == v {
			return true
		}
	}
	return false
}

func timePtrToPgtype(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}
