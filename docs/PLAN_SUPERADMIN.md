# Project Plan: Super Admin Seeding and Documentation

This plan outlines the steps to add a Super Admin user to the system database seed, re-populate the database, and update the existing documentation to cover the new administrative features.

## User Review Required

> [!IMPORTANT]
> Seeding the database will **delete all existing data** in the local development environment as the `seed.ts` script uses `deleteMany()` on all models.
> The new Super Admin will have global access across all tenants.

## Proposed Changes

### [Component] Backend - Database Seeding

#### [MODIFY] [seed.ts](file:///home/thiago/Projetos/eventhub/backend/prisma/seed.ts)
- Add a new `SUPER_ADMIN` user to the `user.createMany` data.
- The SuperAdmin user will have `tenantId: null` (global scope).
- Update the console logs at the end of the script to include the new credentials.

### [Component] Documentation

#### [MODIFY] [modulos-funcionalidades.md](file:///home/thiago/Projetos/eventhub/docs/modulos-funcionalidades.md)
- Add descriptions for the Super Admin role and the Global Audit module.

#### [MODIFY] [api-referencia.md](file:///home/thiago/Projetos/eventhub/docs/api-referencia.md)
- Document the new `/admin/*` endpoints (Tenants management, Audit logs).

#### [MODIFY] [arquitetura.md](file:///home/thiago/Projetos/eventhub/docs/arquitetura.md)
- Update the authorization section to include the Super Admin role hierarchy.

## Open Questions

- Do you have a preferred email/password for the Super Admin? (Currently planning to use `superadmin@eventhub.com.br` / `123456`).

## Verification Plan

### Automated Tests
- Run `npm run seed` in the backend to ensure the database can be populated without errors.
- Run `npm run lint` in both frontend and backend to ensure no documentation or code issues.

### Manual Verification
- Log in as the new Super Admin in the frontend.
- Navigate to the Global Audit page (`/admin/audit`) and verify it displays logs.
