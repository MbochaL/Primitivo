package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
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

	// 2. Subtotal con precios ACTUALES + conteo de infusiones compradas.
	subtotal := 0
	infusiones := 0
	precios := make([]int32, len(n.Items))
	for i, it := range n.Items {
		p, err := q.GetProductoPorID(ctx, it.ProductoID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.Compra{}, domain.ErrProductoNoEncontrado
			}
			return domain.Compra{}, err
		}
		precios[i] = p.Precio
		subtotal += int(p.Precio) * it.Cantidad
		if p.EsInfusion {
			infusiones += it.Cantidad
		}
	}

	// 3. Beneficio (opcional): validar y calcular descuento.
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
		// El beneficio debe pertenecer a la institución del cliente.
		if !cliente.InstitucionID.Valid || cliente.InstitucionID.UUID != cond.InstitucionID {
			return domain.Compra{}, domain.ErrBeneficioNoDisponible
		}
		if int(cliente.ContadorInfusiones) < int(cond.UmbralInfusiones) {
			return domain.Compra{}, domain.ErrUmbralNoAlcanzado
		}
		if cond.TipoDescuento == "porcentaje" {
			descuento = subtotal * int(cond.ValorDescuento) / 100
		} else {
			descuento = int(cond.ValorDescuento)
		}
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
			PrecioUnitario: precios[i],
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

	// 5. Actualizar contador de infusiones: reinicia si el canje lo indica; si no, suma
	//    las infusiones compradas.
	if canje != nil && canje.ReiniciaContador {
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
