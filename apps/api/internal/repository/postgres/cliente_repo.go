package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// ClienteRepo implementa repository.ClienteRepository sobre PostgreSQL.
type ClienteRepo struct {
	q *sqlc.Queries
}

// NewClienteRepo construye el repositorio envolviendo el código generado por sqlc.
func NewClienteRepo(db sqlc.DBTX) *ClienteRepo {
	return &ClienteRepo{q: sqlc.New(db)}
}

func (r *ClienteRepo) Crear(ctx context.Context, c domain.Cliente) (domain.Cliente, error) {
	row, err := r.q.CreateCliente(ctx, sqlc.CreateClienteParams{
		Dni:           c.DNI,
		Nombre:        c.Nombre,
		Email:         ptrToText(c.Email),
		InstitucionID: ptrToNullUUID(c.InstitucionID),
	})
	if err != nil {
		if esViolacionUnica(err) {
			return domain.Cliente{}, domain.ErrDNIYaRegistrado
		}
		return domain.Cliente{}, err
	}
	return aClienteDominio(row), nil
}

func (r *ClienteRepo) GetByID(ctx context.Context, id uuid.UUID) (domain.ClienteConInstitucion, error) {
	row, err := r.q.GetClientePorID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.ClienteConInstitucion{}, domain.ErrClienteNoEncontrado
		}
		return domain.ClienteConInstitucion{}, err
	}
	return clienteConInstitucion(
		row.ID, row.Dni, row.Nombre, row.Email, row.InstitucionID,
		row.ContadorInfusiones, row.CreatedAt, row.InstitucionNombre,
	), nil
}

func (r *ClienteRepo) GetByDNI(ctx context.Context, dni string) (domain.ClienteConInstitucion, error) {
	row, err := r.q.GetClientePorDNI(ctx, dni)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.ClienteConInstitucion{}, domain.ErrClienteNoEncontrado
		}
		return domain.ClienteConInstitucion{}, err
	}
	return clienteConInstitucion(
		row.ID, row.Dni, row.Nombre, row.Email, row.InstitucionID,
		row.ContadorInfusiones, row.CreatedAt, row.InstitucionNombre,
	), nil
}

func (r *ClienteRepo) List(ctx context.Context) ([]domain.ClienteConInstitucion, error) {
	rows, err := r.q.ListClientes(ctx)
	if err != nil {
		return nil, err
	}
	clientes := make([]domain.ClienteConInstitucion, 0, len(rows))
	for _, row := range rows {
		clientes = append(clientes, clienteConInstitucion(
			row.ID, row.Dni, row.Nombre, row.Email, row.InstitucionID,
			row.ContadorInfusiones, row.CreatedAt, row.InstitucionNombre,
		))
	}
	return clientes, nil
}

func (r *ClienteRepo) Actualizar(ctx context.Context, c domain.Cliente) (domain.Cliente, error) {
	row, err := r.q.UpdateCliente(ctx, sqlc.UpdateClienteParams{
		ID:            c.ID,
		Nombre:        c.Nombre,
		Email:         ptrToText(c.Email),
		InstitucionID: ptrToNullUUID(c.InstitucionID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Cliente{}, domain.ErrClienteNoEncontrado
		}
		return domain.Cliente{}, err
	}
	return aClienteDominio(row), nil
}

func (r *ClienteRepo) Historial(ctx context.Context, clienteID uuid.UUID) ([]domain.Compra, error) {
	rows, err := r.q.ListComprasPorCliente(ctx, clienteID)
	if err != nil {
		return nil, err
	}
	compras := make([]domain.Compra, 0, len(rows))
	for _, row := range rows {
		compras = append(compras, domain.Compra{
			ID:        row.ID,
			ClienteID: row.ClienteID,
			UsuarioID: row.UsuarioID,
			Subtotal:  int(row.Subtotal),
			Descuento: int(row.Descuento),
			Total:     int(row.Total),
			Fecha:     row.Fecha.Time,
		})
	}
	return compras, nil
}

func (r *ClienteRepo) CondicionesPorInstitucion(ctx context.Context, institucionID uuid.UUID) ([]domain.BeneficioDisponible, error) {
	rows, err := r.q.ListCondicionesPorInstitucion(ctx, institucionID)
	if err != nil {
		return nil, err
	}
	out := make([]domain.BeneficioDisponible, 0, len(rows))
	for _, row := range rows {
		out = append(out, domain.BeneficioDisponible{
			BeneficioNombre:  row.BeneficioNombre,
			UmbralInfusiones: int(row.UmbralInfusiones),
			TipoDescuento:    row.TipoDescuento,
			ValorDescuento:   int(row.ValorDescuento),
			ReiniciaContador: row.ReiniciaContador,
		})
	}
	return out, nil
}

// ── Mappers ──────────────────────────────────────────────────────────────────

func aClienteDominio(row sqlc.Cliente) domain.Cliente {
	return domain.Cliente{
		ID:                 row.ID,
		DNI:                row.Dni,
		Nombre:             row.Nombre,
		Email:              textToPtr(row.Email),
		InstitucionID:      nullUUIDToPtr(row.InstitucionID),
		ContadorInfusiones: int(row.ContadorInfusiones),
		CreatedAt:          row.CreatedAt.Time,
	}
}

func clienteConInstitucion(
	id uuid.UUID, dni, nombre string, email pgtype.Text, inst uuid.NullUUID,
	contador int32, created pgtype.Timestamptz, instNombre pgtype.Text,
) domain.ClienteConInstitucion {
	return domain.ClienteConInstitucion{
		Cliente: domain.Cliente{
			ID:                 id,
			DNI:                dni,
			Nombre:             nombre,
			Email:              textToPtr(email),
			InstitucionID:      nullUUIDToPtr(inst),
			ContadorInfusiones: int(contador),
			CreatedAt:          created.Time,
		},
		InstitucionNombre: textToPtr(instNombre),
	}
}

// ── Conversores pgx <-> punteros ────────────────────────────────────────────

func textToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	s := t.String
	return &s
}

func ptrToText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func nullUUIDToPtr(u uuid.NullUUID) *uuid.UUID {
	if !u.Valid {
		return nil
	}
	id := u.UUID
	return &id
}

func ptrToNullUUID(id *uuid.UUID) uuid.NullUUID {
	if id == nil {
		return uuid.NullUUID{}
	}
	return uuid.NullUUID{UUID: *id, Valid: true}
}
