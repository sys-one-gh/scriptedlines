# ─────────────────────────────────────────────────────────────
# scripts/load_catalog.py
#
# Generic CSV → library-table loader for the global material and
# hardware catalogs. The catalog-researcher agent
# (.claude/agents/catalog-researcher.md) writes one CSV per
# manufacturer under data/seeds/<table>/; this script validates it
# against the table's SQLAlchemy model and upserts it.
#
# Upsert key is the table's unique `code` column: an existing row
# with the same code is updated in place (so re-running a refreshed
# CSV is safe and never duplicates), anything else is inserted.
# Rows already in the table but absent from the CSV are left alone.
#
# DRY RUN BY DEFAULT — the writes really execute (so constraint and
# RLS-permission errors surface) and are then rolled back. Pass
# --commit to keep them. Run inside the backend container so
# DATABASE_URL is set:
#
#   docker-compose exec backend python scripts/load_catalog.py \
#       --table library_hinges --csv /data/seeds/library_hinges/grass.csv
#   docker-compose exec backend python scripts/load_catalog.py \
#       --table library_hinges --csv /data/seeds/library_hinges/grass.csv --commit
#
# --csv also accepts a directory (loads every *.csv in it).
#
# --export prints the table's current rows as CSV (optionally just
# one --manufacturer) so a refreshed CSV can reuse existing codes:
#
#   docker-compose exec backend python scripts/load_catalog.py \
#       --table library_melamine --export --manufacturer Uniboard
# ─────────────────────────────────────────────────────────────

import os
import sys
import csv
import glob
import argparse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["ENV"] = "script"   # database.py echoes SQL when ENV=development

from sqlalchemy import Boolean, Float, Integer, String, Text

from database import SessionLocal
import models  # registers every model so mapper relationships resolve
from models.material_core import MaterialCore
from models.material_melamine import MaterialMelamine
from models.library_hinges import LibraryHinge
from models.library_drawer_slides import LibraryDrawerSlide
from models.library_handles import LibraryHandle
from models.library_shelf_supports import LibraryShelfSupport

# Tables this loader knows how to fill. New catalog tables get one
# line here once their model exists and has a unique `code` column.
MODELS = {m.__tablename__: m for m in (
    MaterialCore, MaterialMelamine,
    LibraryHinge, LibraryDrawerSlide, LibraryHandle, LibraryShelfSupport,
)}

KEY = "code"
SKIP = {"id", "created_at", "updated_at"}
TRUE, FALSE = {"1", "true", "t", "yes", "y"}, {"0", "false", "f", "no", "n"}


def _columns(model):
    return {c.name: c for c in model.__table__.columns if c.name not in SKIP}


def _coerce(col, raw: str):
    """CSV cell → Python value for this column. Empty cell → NULL for
    nullable columns, the column default otherwise. Raises ValueError."""
    raw = (raw or "").strip()
    if raw == "":
        if col.nullable and col.default is None:
            return None
        if col.default is not None and not callable(col.default.arg):
            return col.default.arg
        if isinstance(col.type, (String, Text)):
            return ""
        raise ValueError("required value is empty")
    if isinstance(col.type, Boolean):
        low = raw.lower()
        if low in TRUE:
            return True
        if low in FALSE:
            return False
        raise ValueError(f"not a boolean: {raw!r}")
    if isinstance(col.type, Integer):
        return int(float(raw))
    if isinstance(col.type, Float):
        return float(raw)
    return raw


def _read(path, cols):
    errors, rows = [], []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        header = [h.strip() for h in (reader.fieldnames or [])]
        unknown = [h for h in header if h not in cols and h not in SKIP]
        if unknown:
            errors.append(f"unknown columns (not in table): {unknown}")
        if KEY not in header:
            errors.append(f"missing required '{KEY}' column")
        required = [n for n, c in cols.items()
                    if not c.nullable and c.default is None and c.server_default is None
                    and not isinstance(c.type, (String, Text))]
        missing = [n for n in required if n not in header]
        if missing:
            errors.append(f"missing required columns: {missing}")
        if errors:
            return [], errors
        seen = set()
        for lineno, raw in enumerate(reader, start=2):
            row, bad = {}, []
            for name in header:
                if name in SKIP:
                    continue
                try:
                    row[name] = _coerce(cols[name], raw.get(name))
                except ValueError as e:
                    bad.append(f"{name}: {e}")
            # non-null string columns must actually have a value
            for n, c in cols.items():
                if n in row and not c.nullable and isinstance(c.type, (String, Text)) \
                        and c.default is None and row[n] in ("", None):
                    bad.append(f"{n}: required value is empty")
            if row.get(KEY) in seen:
                bad.append(f"duplicate {KEY} {row.get(KEY)!r} within file")
            seen.add(row.get(KEY))
            if bad:
                errors.append(f"line {lineno}: " + "; ".join(bad))
            else:
                rows.append(row)
    return rows, errors


def _export(model, cols, manufacturer):
    db = SessionLocal()
    try:
        q = db.query(model)
        if manufacturer and "manufacturer" in cols:
            q = q.filter(model.manufacturer == manufacturer)
        writer = csv.writer(sys.stdout)
        writer.writerow(cols)
        for r in q.order_by(model.id).all():
            writer.writerow(["" if getattr(r, n) is None else
                             int(getattr(r, n)) if isinstance(getattr(r, n), bool) else getattr(r, n)
                             for n in cols])
    finally:
        db.close()


def main():
    ap = argparse.ArgumentParser(description="Validate and upsert a catalog CSV into a library table.")
    ap.add_argument("--table", required=True, choices=sorted(MODELS))
    ap.add_argument("--csv", help="CSV file, or a directory of CSVs")
    ap.add_argument("--export", action="store_true", help="print current rows as CSV instead of loading")
    ap.add_argument("--manufacturer", help="with --export: only this manufacturer's rows")
    ap.add_argument("--commit", action="store_true", help="keep the changes (default is a rolled-back dry run)")
    args = ap.parse_args()

    model = MODELS[args.table]
    cols = _columns(model)
    if args.export:
        return _export(model, cols, args.manufacturer)
    if not args.csv:
        ap.error("--csv is required unless --export is given")
    paths = sorted(glob.glob(os.path.join(args.csv, "*.csv"))) if os.path.isdir(args.csv) else [args.csv]
    if not paths:
        sys.exit(f"no CSV files found at {args.csv}")

    all_rows, failed = [], False
    for path in paths:
        rows, errors = _read(path, cols)
        print(f"{os.path.basename(path)}: {len(rows)} valid rows, {len(errors)} errors")
        for e in errors[:25]:
            print(f"   ✗ {e}")
        if len(errors) > 25:
            print(f"   … {len(errors) - 25} more")
        failed |= bool(errors)
        all_rows += rows
    if failed:
        sys.exit("\nValidation failed — nothing written. Fix the CSV(s) and re-run.")

    db = SessionLocal()
    inserted = updated = unchanged = 0
    try:
        existing = {getattr(r, KEY): r for r in db.query(model).filter(
            getattr(model, KEY).in_([r[KEY] for r in all_rows])).all()}
        for row in all_rows:
            obj = existing.get(row[KEY])
            if obj is None:
                db.add(model(**row))
                inserted += 1
            elif any(getattr(obj, k) != v for k, v in row.items()):
                for k, v in row.items():
                    setattr(obj, k, v)
                updated += 1
            else:
                unchanged += 1
        db.flush()   # executes every INSERT/UPDATE — surfaces DB errors in dry run too
        total = db.query(model).count()
        if args.commit:
            db.commit()
        else:
            db.rollback()
    except Exception as e:
        db.rollback()
        sys.exit(f"\nDatabase error — rolled back, nothing written:\n{e}")
    finally:
        db.close()

    mode = "COMMITTED" if args.commit else "DRY RUN (rolled back — pass --commit to keep)"
    print(f"\n{args.table}: {inserted} inserted, {updated} updated, {unchanged} unchanged "
          f"→ {total} rows after load.  {mode}")


if __name__ == "__main__":
    main()
