# Secure Task Management System

Full-stack Task Management System with role-based access control (RBAC) in an Nx monorepo.

## Setup Instructions

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required for the Angular dashboard; Node 20.15 and below will hit ESM/require errors.)
- npm 8+

**Upgrading Node (pick one):**

- **nvm** (if installed): `nvm install 20.19.0` then `nvm use 20.19.0`. Or run `nvm use` in the project root (see `.nvmrc`).
- **macOS with Homebrew:** `brew install node@20` then ensure `node@20` is in your PATH, or install the latest LTS: `brew install node` (often gives 22.x). Then `node -v` should show 20.19+ or 22.x.
- **Direct install:** Download the **LTS** installer (20.x or 22.x) from [nodejs.org](https://nodejs.org/) and run it. Restart the terminal, then run `node -v` to confirm (e.g. `v20.19.0` or `v22.12.0`).

After upgrading, run `npm install` again, then `npm run serve:dashboard`.

### Install

```bash
npm install
```

### Environment

Copy the example env and configure:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `JWT_SECRET` – secret for signing JWTs (min 32 characters)
- `DATABASE_URL` – e.g. `sqlite:./data/tasks.db` or a PostgreSQL URL

See `.env.example` for all options.

### Run Backend (NestJS API)

```bash
npm run serve:api
# or
npx nx serve api
```

API runs at `http://localhost:3333` by default (configurable via `API_PORT`).

### Run Frontend (Angular Dashboard)

```bash
npm run serve:dashboard
# or
npx nx serve dashboard
```

Dashboard runs at `http://localhost:4200`.

### Build

```bash
npx nx build api
npx nx build dashboard
```

### Test

```bash
npx nx test api
npx nx test dashboard
```

---

## Architecture Overview

### Nx Monorepo Layout

```
apps/
  api/           → NestJS backend (TypeORM, JWT, RBAC)
  api-e2e/       → E2E tests for API
  dashboard/     → Angular frontend (TailwindCSS)
libs/
  data/          → Shared TypeScript interfaces and DTOs
  auth/          → Reusable RBAC logic and decorators
packages/        → (optional) additional shared packages
```

**Rationale**

- **apps/api** – Single backend service; NestJS for structure, guards, and DI.
- **apps/dashboard** – Single SPA; Angular for structure and tooling.
- **libs/data** – Shared types and DTOs so API and dashboard stay in sync and both use the same contracts.
- **libs/auth** – Centralized roles, permissions, and (later) guard/decorator helpers so RBAC is consistent and testable in one place.

---

## Data Model

### Entities

- **User** – id, email, organizationId, role (owner | admin | viewer), timestamps.
- **Organization** – id, name, parentId (2-level hierarchy: root org → child orgs).
- **Role** – owner, admin, viewer (hierarchy: owner > admin > viewer).
- **Task** – id, title, description, status (todo | in_progress | done), category, createdById, organizationId, timestamps.

### Schema Summary

- Users belong to one organization and have one role.
- Organizations form a 2-level tree (parentId nullable for root).
- Tasks belong to one organization and one creator; visibility and write access are scoped by organization and role.

*(ERD or diagram to be added during development.)*

---

## Access Control Implementation

### Roles and Permissions

- **Owner** – Full access in the org (CRUD tasks, audit log).
- **Admin** – Same as owner within the org (CRUD tasks, audit log).
- **Viewer** – Read-only (list/read tasks).

Role hierarchy is implemented in `libs/auth` (e.g. `hasRoleOrAbove`, `hasPermission`). Task visibility and mutations are scoped by organization and role.

### Organization Hierarchy

- 2-level: root organizations and optional child organizations.
- Access is enforced at the organization level (user sees/edits only tasks in their org or allowed child orgs, depending on implementation).

### JWT and Access Control

- Login returns a JWT containing at least: sub (userId), email, organizationId, role.
- All protected endpoints verify the JWT (middleware/guard).
- RBAC guards/decorators use the token payload to enforce role and organization scoping.

*(Concrete guard and decorator wiring in the API to be completed during development.)*

---

## API Documentation

*(To be filled as endpoints are implemented.)*

### Endpoints

| Method | Path              | Description        | Auth / RBAC      |
|--------|-------------------|--------------------|------------------|
| POST   | /auth/login       | Login, returns JWT  | Public           |
| POST   | /tasks            | Create task        | JWT + permission|
| GET    | /tasks            | List tasks         | JWT + scoped     |
| PUT    | /tasks/:id        | Update task        | JWT + permission |
| DELETE | /tasks/:id        | Delete task        | JWT + permission |
| GET    | /audit-log        | Get audit log      | Owner/Admin only |

### Sample Requests / Responses

*(Examples to be added with implementation.)*

---

## Future Considerations

- **Advanced role delegation** – Custom roles or per-resource overrides.
- **Production security**
  - JWT refresh tokens and secure storage.
  - CSRF protection for browser clients.
  - RBAC result caching where appropriate.
- **Scaling** – More efficient permission checks (e.g. caching, indexing) as data grows.

---

## Development Status

- **Setup** – Monorepo structure, API and dashboard apps, shared libs (data, auth), Tailwind v4 on dashboard, env example, and README are in place.
- **Backend** – Data models, JWT auth, RBAC guards/decorators, task CRUD, and audit logging to be implemented.
- **Frontend** – Login UI, task list/create/edit/delete, filters/sort, drag-and-drop, and responsive layout to be implemented.

Tradeoffs and unfinished areas will be documented here and in code as development continues.
