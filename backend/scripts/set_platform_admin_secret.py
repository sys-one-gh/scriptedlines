#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────
# scripts/set_platform_admin_secret.py
#
# Sets (or rotates) the platform-admin registration secret — the
# code checked at POST /users/register when "Register as a
# ScriptedLines Admin" is used (see api/users.py::register()).
#
# The bcrypt hash lives on the internal ScriptedLines company row
# (companies.is_platform_org = true), not an env var, so it's
# identical no matter whose machine the backend runs on. This
# script is the only supported way to set/rotate it — previously
# it was set by hand directly against the database with no
# record of how.
#
# Usage (from backend/, with DATABASE_URL reachable — Supabase
# by default, same as the running app):
#   python3 scripts/set_platform_admin_secret.py
#   python3 scripts/set_platform_admin_secret.py --secret "some-value"
#   python3 scripts/set_platform_admin_secret.py --yes   (skip overwrite prompt)
#
# With no --secret, a random one is generated. Either way it is
# printed ONCE — bcrypt hashes can't be reversed, so if you lose
# it the only recovery is running this script again to set a new
# one (which invalidates the old one for anyone who had it).
# ─────────────────────────────────────────────────────────────

import sys
import os
import argparse
import secrets

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load ../.env if DATABASE_URL isn't already in the environment (e.g. running
# this on the host rather than via `docker-compose exec backend`, where
# docker-compose would normally have injected it already).
if not os.getenv("DATABASE_URL"):
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key, value)

from database import SessionLocal
from models.company import Company
from auth import hash_password


def main():
    parser = argparse.ArgumentParser(description="Set/rotate the ScriptedLines platform-admin registration secret.")
    parser.add_argument("--secret", help="Plaintext secret to set. Omit to auto-generate a random one.")
    parser.add_argument("--yes", action="store_true", help="Skip the overwrite confirmation prompt.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.is_platform_org == True).first()
        if not company:
            print("ERROR: no company row has is_platform_org=true — the internal ScriptedLines company doesn't exist yet.")
            sys.exit(1)

        if company.platform_admin_secret_hash and not args.yes:
            answer = input(
                f"'{company.company_name}' (id={company.id}) already has a secret set. "
                "Overwriting it locks out anyone still using the old one. Continue? [y/N] "
            )
            if answer.strip().lower() != "y":
                print("Aborted — no changes made.")
                sys.exit(0)

        secret = args.secret or secrets.token_hex(32)

        company.platform_admin_secret_hash = hash_password(secret)
        db.commit()

        print(f"\nSecret set on '{company.company_name}' (id={company.id}).")
        print("This is the ONLY time it's shown — it cannot be recovered from the stored hash afterward.")
        print(f"\n    {secret}\n")
        print('Save it now (password manager). Anyone using "Register as a ScriptedLines Admin" needs this exact value.')
    finally:
        db.close()


if __name__ == "__main__":
    main()
