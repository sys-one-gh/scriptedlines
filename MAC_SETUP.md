# Mac Setup — ScriptedLines

Setup for working on ScriptedLines from a Mac. The database now lives on
**Supabase** (shared cloud Postgres), so the Mac and WSL machines connect to
the **same** database — same login, same projects, same data, no syncing.

---

## Prerequisites

- **Docker Desktop** — install from docker.com, then launch it (whale icon in
  the menu bar must be steady, not animating, before running any commands).
- **Git** — `git --version` to confirm.

That's it. No Homebrew Postgres, Python, or Node needed — everything runs in
Docker, and the database is remote.

---

## First-time setup

```bash
# 1. Clone (or pull) the repo
git clone <repo-url> ~/projects/scriptedlines
cd ~/projects/scriptedlines

# 2. Create your .env from the template
cp .env.example .env

# 3. Edit .env — paste the real Supabase DATABASE_URL + JWT secret
#    (get the connection string from the Supabase dashboard)
nano .env

# 4. Start backend + frontend (they connect to Supabase automatically)
docker-compose up -d --build

# 5. Confirm the backend connected and built/verified the tables
docker logs scriptedlines_backend
#    → look for "✔ Database tables verified." and no connection errors
```

Then open:
- Frontend → http://localhost:5173
- Backend docs → http://localhost:8000/docs

Because the database is shared, **you do not register again on the Mac** —
log in with the account you already created. The data is the same everywhere.

---

## Daily workflow

```bash
cd ~/projects/scriptedlines
git pull
docker-compose up -d        # start
# ... work ...
docker-compose down         # stop (data is safe on Supabase regardless)
```

No backup/restore needed between machines anymore — there's one database.

---

## The DATABASE_URL

Get it from: **Supabase Dashboard → Project Settings → Database → Connection
string → URI → Session pooler** (port 5432). Paste it into `.env` as
`DATABASE_URL`, replacing the password placeholder with your real database
password.

- Use the **Session pooler** string (port 5432) — it's IPv4-friendly and works
  on any network. Avoid the Direct connection (IPv6-only) and the Transaction
  pooler (port 6543, not suited to SQLAlchemy sessions).
- Use a password with **letters and numbers only**, or URL-encode special
  characters, or the connection string won't parse.

---

## Offline fallback (optional)

If you're somewhere with no internet and need a local database:

```bash
# Point DATABASE_URL in .env back to the local container:
#   postgresql://scriptedlines_user:scriptedlines2024@db:5432/scriptedlines_db
docker-compose --profile local-db up -d --build
```

This starts a local Postgres container. Note: this is a SEPARATE database from
Supabase — data created here won't sync. Switch DATABASE_URL back to the
Supabase string when you're back online.

---

## Troubleshooting

**`Cannot connect to the Docker daemon`**
Docker Desktop isn't running. Launch it and wait for the menu-bar whale icon to
go steady.

**Backend log shows connection / password errors**
- Check the `DATABASE_URL` password is correct (it's the Supabase *database*
  password, not your account login).
- Check for unencoded special characters in the password.
- Confirm you used the Session pooler host (`...pooler.supabase.com:5432`).

**Supabase project is paused**
Free-tier projects pause after ~1 week of inactivity. Open the Supabase
dashboard and click "Restore" / "Resume," then retry.

**Login fails / "Invalid email or password"**
Confirm the company row and your user exist:
- Supabase Dashboard → Table Editor → `companies` (should have id=1)
- Supabase Dashboard → Table Editor → `users` (should list your account)