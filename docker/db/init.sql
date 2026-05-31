-- ─────────────────────────────────────────────────────────────
-- docker/db/init.sql
-- Runs ONCE on first container startup when volume is empty.
-- Creates the app user with full privileges.
-- The database itself is created by POSTGRES_DB env var.
-- ─────────────────────────────────────────────────────────────

-- Grant all privileges on the database to the app user
-- (POSTGRES_USER already owns the DB but this ensures future tables too)
ALTER DATABASE scriptedlines_db OWNER TO scriptedlines_user;

-- Ensure the user has full privileges
GRANT ALL PRIVILEGES ON DATABASE scriptedlines_db TO scriptedlines_user;
