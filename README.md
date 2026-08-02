# ScriptedLines

Millwork drawing SaaS — React + FastAPI + PostgreSQL (Supabase), running in Docker.

This file documents everything currently built. For what's planned next, see [NEXT_STEPS.md](NEXT_STEPS.md).

---

## Stack

| Layer    | Technology              | Port |
|----------|--------------------------|------|
| Frontend | React + Vite             | 5173 |
| Backend  | FastAPI + uvicorn        | 8000 |
| Database | PostgreSQL 16 (Supabase) | 5432 |

The database is a single **shared Supabase instance** — WSL and Mac machines both
point at it via `DATABASE_URL` in `.env`, so there's no per-machine data and no
sync step between them. A local-Postgres fallback profile exists for offline
work (see below) but is a separate, non-synced database.

---

## Quick start

```bash
cd ~/projects/scriptedlines
cp .env.example .env      # first time only — fill in DATABASE_URL + JWT_SECRET_KEY
docker-compose up -d
```

Open http://localhost:5173 (redirects to `/login`). Backend docs (Swagger) at
http://localhost:8000/docs. Health check: `curl http://localhost:8000/api/health`.

- `DATABASE_URL` — from Supabase Dashboard → Project Settings → Database →
  Connection string → URI → **Session pooler** (port 5432, IPv4-friendly).
  Avoid the Direct connection (IPv6-only) and Transaction pooler (port 6543,
  not suited to SQLAlchemy sessions). URL-encode special characters in the
  password or the connection string won't parse.
- `JWT_SECRET_KEY` — any long random value (`openssl rand -hex 32`).
- Because the DB is shared, a fresh machine does **not** need to register a
  new account — log in with one that already exists.

**Offline / local-DB fallback:**
```bash
# In .env, point DATABASE_URL at: postgresql://scriptedlines_user:scriptedlines2024@db:5432/scriptedlines_db
docker-compose --profile local-db up -d --build
```
This is a separate, non-synced database — only for working with no internet.

**Common commands:**
```bash
docker-compose ps             # container status
docker-compose logs -f backend
docker-compose restart
docker-compose up -d --build  # rebuild after Dockerfile/requirements.txt changes
docker-compose down           # stop, data safe (never run with -v — deletes the local-db volume)
```

**Troubleshooting:** Supabase free-tier projects pause after ~1 week idle —
resume from the Supabase dashboard. Backend connection errors are almost
always a wrong/unescaped `DATABASE_URL` password or the wrong pooler port.

---

## Git branches

```
main        production-ready
develop     stable merged code — source of truth
working     active development (WSL machine)
mac         active development (Mac machine)
lastpoint   frozen snapshot, cut before a major change — never pushed to directly
```

Daily flow: pull your machine's branch, work, commit, push to your branch,
then merge forward into `develop` and the other machine's branch. Never force-push
`main`. In practice, recent sessions have also committed straight to `main` —
if you're picking a branch for new work, `working` is the documented default
for active development.

---

## Project structure

```
scriptedlines/
├── frontend/src/
│   ├── pages/            LoginPage, RegisterPage, Workspace, ProjectsPage/
│   ├── components/       ProjectSetup, CADToolbar, PaperSpace, LeftPanel, panels/
│   ├── shared/            useResizableSidebar, useOutsideClick, FormField, FormSelect
│   ├── api/client.js      API base URL + fetch wrapper (single source of truth)
│   └── data/              paperSizes.js
├── backend/
│   ├── api/               route handlers, one router per resource
│   ├── models/            SQLAlchemy table definitions
│   ├── geometry/          elevation/plan/section/side_section.py — scaffolded, EMPTY
│   ├── scripts/           set_platform_admin_secret.py
│   ├── database.py        Supabase connection
│   └── main.py            app entry point, registers every router
├── scripts/               docker backup/restore/sync/migrate shell scripts
├── docker-compose.yml
├── .env / .env.example
├── README.md              this file
└── NEXT_STEPS.md          what's planned next
```

---

## What's built

### Auth & roles
JWT auth (`backend/auth.py`), bcrypt password hashing (SHA-256 pre-hashed to
dodge bcrypt's 72-byte limit). One role per user, company-scoped:
`owner`, `admin`, `draftsman` (default on join), `viewer`, `scriptedlines_admin`.

- **Owner/Admin** — enforced identically today; company settings, join code,
  role changes, everything Draftsman can do.
- **Draftsman** — create/edit projects & drawings, add/remove materials to a
  project. Default role for anyone joining via a company join code.
- **Viewer** — read-only.
- **scriptedlines_admin** — platform-level tier, read-only across *every*
  company's projects/drawings (support/debugging use case). Granted only at
  registration via a secret code, never through the normal role-change
  endpoint (`PUT /users/:id` explicitly blocks setting this role — otherwise
  any company owner could hand out cross-company read access). The secret is
  a bcrypt hash on the internal "ScriptedLines" company row
  (`companies.platform_admin_secret_hash`), not an env var, so it's identical
  everywhere the backend runs. Set/rotate it with:
  ```bash
  cd backend && python3 scripts/set_platform_admin_secret.py
  ```
  Prints the plaintext once — it can't be recovered from the stored hash afterward.

Companies self-register (`POST /companies/register`, creates the company +
its first user as `owner`) or join an existing one via join code
(`POST /users/register`). A user of any role hitting another company's
project/drawing by ID gets a vague 404 (anti-enumeration), except
`scriptedlines_admin`, which gets an explicit 403 explaining the read-only boundary.

### Projects & Drawings
Standard CRUD (`api/projects.py`, `api/drawings.py`, `api/drawing_products.py`).
Drawing creation auto-creates a revision-00 row. Products dropped on a drawing
canvas save to `drawing_products` (0 rows currently — not yet exercised for real).
BOM output tables exist and have a working CRUD API (`api/bom.py`:
`drawing_bom_products/hardware/sheetgoods/edgeband/parts`) — but nothing
computes into them yet; see NEXT_STEPS.md.

A per-project drawing template (`DrawingTemplate` model, `api/templates.py`)
holds the title-block fields (company/client/notes/finish schedule) — but
there's no SVG rendering of it yet.

### Material catalog (Project Setup → Project Material tab)
Same build pattern each time: schema → seed data → API → Project Setup UI tab.
Live and project-scoped end-to-end:

- **Laminates** — `laminates` + `laminate_formica` (390 rows, Formica). Adding
  a laminate to a project auto-creates a matching edgeband row; removing it
  auto-deletes that edgeband.
- **Cores** — `library_cores` (50 rows). No manufacturer field — a core is a
  commodity spec, not a proprietary decor.
- **Melamine** — `library_melamine` (96 rows: Uniboard, Wilsonart, Arauco,
  Roseburg). Self-contained schema (manufacturer as a plain string, boolean
  size flags) — matches the laminate/core pattern, not the older shared-lookup
  design (see Known gaps below).
- **Layups** — project-scoped compositions of a core + 2 faces (each face is
  either a `project_laminate` or `project_melamine` row).
- **Edgebands** — auto-derived from a project's laminates, not separately
  browsable/addable.

9 material sub-tabs remain UI-only placeholders: Metal Laminates, Veneer,
Solids, Metal Surfaces, Glass, Mirror, Solid Surface, Stone, Quartz.

### Hardware catalog (Project Setup → Project Hardware tab)
Real manufacturer spec data, project-scoped, same pattern as materials:

- **Hinges** — `library_hinges` (5 rows, Blum)
- **Drawer Slides** — `library_drawer_slides` (17 rows, Blum + Accuride 3832)
- **Handles/Pulls** — `library_handles` (5 rows)
- **Shelf Supports** — `library_shelf_supports` (2 rows)

**Fasteners** is a 5th sub-tab shown in the UI but has no backend yet.

### API surface
One router per resource, all mounted under `/api` in `main.py`:
`products, companies, users, projects, drawings, drawing_products, bom,
templates, laminates, cores, melamine, hinges, drawer_slides, handles,
shelf_supports, edgebands, layups`.

---

## Known gaps / inconsistencies

- `backend/models/material.py` — old flat material model, fully dead (not
  imported anywhere), never deleted.
- `backend/models/material_lookups.py` (`Manufacturer`, `SheetSize`, `Finish`)
  — the original shared-lookup design, abandoned when laminate/core/melamine
  all moved to self-contained tables. Only referenced by itself and
  `models/__init__.py` now — fully dead, along with the DB tables
  `manufacturers`, `sheet_sizes`, `finishes`, and the never-populated
  `library_materials`.
- Inline-style cleanup backlog (tracked in a prior session's notes, not yet
  done): `PaperSpace.jsx` (26 `style={{` sites), `CADToolbar.jsx` (11),
  `LoginPage.jsx` (11), `RegisterPage.jsx` (9). `Workspace.jsx` already got
  this treatment (see `Workspace.css`).
- `backend/geometry/{elevation,plan,section,side_section}.py` exist but are
  completely empty — scaffolding only.
- Alembic is in `requirements.txt` but unused — the app relies on
  `Base.metadata.create_all()` in `main.py`, and every schema change so far
  has been hand-confirmed SQL against Supabase rather than a tracked migration.
