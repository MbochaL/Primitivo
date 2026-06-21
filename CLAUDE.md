# Primitivo — Contexto del proyecto

Sistema de beneficios y fidelización para la cafetería Primitivo.
La especificación completa está en `docs/Primitivo_Documento_Maestro.md` — leela antes de generar código.

## Stack
- Monorepo: Turborepo + pnpm workspaces
- Front: Expo (React Native Web) como PWA, TypeScript
- Back: Go + Gin + sqlc + pgx, Clean Architecture
- BD: PostgreSQL, migraciones con golang-migrate

## Reglas innegociables
- Backend en capas: handler → service → repository → domain. Dependencias hacia adentro.
- Acceso a datos solo con sqlc (nunca un ORM).
- Dos roles: administrador (todo) y operador (solo caja). RBAC por rol.
- DTOs separados del dominio. Errores de dominio traducidos a HTTP en el handler.
- Las compras se registran dentro de una transacción.