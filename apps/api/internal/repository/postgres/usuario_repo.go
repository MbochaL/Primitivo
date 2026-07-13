package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/martinbosch1996/primitivo/apps/api/internal/db/sqlc"
	"github.com/martinbosch1996/primitivo/apps/api/internal/domain"
)

// UsuarioRepo implementa repository.UsuarioRepository sobre PostgreSQL (pgx + sqlc).
type UsuarioRepo struct {
	q *sqlc.Queries
}

// NewUsuarioRepo construye el repositorio envolviendo el código generado por sqlc.
func NewUsuarioRepo(db sqlc.DBTX) *UsuarioRepo {
	return &UsuarioRepo{q: sqlc.New(db)}
}

func (r *UsuarioRepo) Crear(ctx context.Context, u domain.Usuario) (domain.Usuario, error) {
	row, err := r.q.CreateUsuario(ctx, sqlc.CreateUsuarioParams{
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		Rol:          string(u.Rol),
	})
	if err != nil {
		if esViolacionUnica(err) {
			return domain.Usuario{}, domain.ErrEmailYaRegistrado
		}
		return domain.Usuario{}, err
	}
	return aUsuarioDominio(row), nil
}

func (r *UsuarioRepo) GetByID(ctx context.Context, id uuid.UUID) (domain.Usuario, error) {
	row, err := r.q.GetUsuarioByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Usuario{}, domain.ErrUsuarioNoEncontrado
		}
		return domain.Usuario{}, err
	}
	return aUsuarioDominio(row), nil
}

func (r *UsuarioRepo) GetByEmail(ctx context.Context, email string) (domain.Usuario, error) {
	row, err := r.q.GetUsuarioByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Usuario{}, domain.ErrUsuarioNoEncontrado
		}
		return domain.Usuario{}, err
	}
	return aUsuarioDominio(row), nil
}

func (r *UsuarioRepo) List(ctx context.Context) ([]domain.Usuario, error) {
	rows, err := r.q.ListUsuarios(ctx)
	if err != nil {
		return nil, err
	}
	usuarios := make([]domain.Usuario, 0, len(rows))
	for _, row := range rows {
		usuarios = append(usuarios, aUsuarioDominio(row))
	}
	return usuarios, nil
}

func (r *UsuarioRepo) Actualizar(ctx context.Context, u domain.Usuario) (domain.Usuario, error) {
	row, err := r.q.UpdateUsuario(ctx, sqlc.UpdateUsuarioParams{
		ID:     u.ID,
		Email:  u.Email,
		Rol:    string(u.Rol),
		Activo: u.Activo,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Usuario{}, domain.ErrUsuarioNoEncontrado
		}
		if esViolacionUnica(err) {
			return domain.Usuario{}, domain.ErrEmailYaRegistrado
		}
		return domain.Usuario{}, err
	}
	return aUsuarioDominio(row), nil
}

func (r *UsuarioRepo) ActualizarPassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	return r.q.UpdateUsuarioPassword(ctx, sqlc.UpdateUsuarioPasswordParams{
		ID:           id,
		PasswordHash: passwordHash,
	})
}

// aUsuarioDominio mapea la fila generada por sqlc a la entidad de dominio.
func aUsuarioDominio(row sqlc.UsuariosSistema) domain.Usuario {
	return domain.Usuario{
		ID:           row.ID,
		Email:        row.Email,
		PasswordHash: row.PasswordHash,
		Rol:          domain.Rol(row.Rol),
		Activo:       row.Activo,
	}
}

// esViolacionUnica detecta el error de Postgres de constraint UNIQUE (código 23505).
func esViolacionUnica(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// esViolacionFK detecta el error de Postgres de FK violation (código 23503).
func esViolacionFK(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}
