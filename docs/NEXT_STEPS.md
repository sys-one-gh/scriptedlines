SCRIPTEDLINES — NEXT STEPS
Session handoff · material catalog + Project Setup + typography
================================================================


WHERE THINGS STAND
------------------

Branch: working (pushed to GitHub, clean checkpoint)

Committed this session:
  1. Material catalog models — lookups (manufacturers, sheet_sizes,
     finishes, compact_options) + library_cores, library_melamine,
     library_laminate. NOTE: committed as a backup, format NOT final.
  2. Project Setup popup shell — ProjectSetup.jsx + ProjectSetup.css,
     wired into ProjectsPage via the ⚙ Project Setup button.
  3. Font-size token scale + typography streamlined across 9 files
     (tokens.css, App.css, ProjectsPage.css, ProjectSetup.css,
     Workspace.jsx, LoginPage.jsx, RegisterPage.jsx, CADToolbar.jsx,
     PaperSpace.jsx). ScriptedLines logo text deliberately excluded.


IMMEDIATE NEXT STEPS (tomorrow)
-------------------------------

[1] BACKEND .PY FORMAT CLEANUP  ← you flagged this explicitly
    - The material model files were committed but their format is not
      how you want it. Clean them up.
    - DELETE backend/models/material.py — the old flat model. It is
      superseded by the category tables and is no longer imported by
      models/__init__.py. Dead code sitting in the repo.
    - Verify models import cleanly inside the venv:
        cd backend && source m_venv/bin/activate
        python3 -c "import models; print('OK')"

[2] DEPLOY MATERIAL TABLES TO SUPABASE
    - Confirm the 4 model files are in backend/models/ and __init__.py
      registers them (Manufacturer, SheetSize, Finish, CompactOption,
      MaterialCore, MaterialMelamine, MaterialLaminate).
    - Restart backend → Base.metadata.create_all() creates 7 new tables.
    - Verify in Supabase SQL editor:
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' ORDER BY table_name;
      Expect: manufacturers, sheet_sizes, finishes, compact_options,
              library_cores, library_melamine, library_laminate
    - DROP the stale flat table if it exists:
        DROP TABLE IF EXISTS library_materials;

[3] RUN THE FORMICA LAMINATE LOADER
    - Place in backend/scripts/: load_formica_laminates.py
    - Place in backend/data/:    formica_na_laminates.csv
                                 formica_laminate_options.csv
    - Run: python3 scripts/load_formica_laminates.py
    - Expected result: 1 manufacturer (Formica), 6 sheet_sizes,
      332 finishes, 1,820 laminate variants.
    - Loader is dry-run verified. It handles a 42-row code-collision
      case (same finish+grade+texture with different sku/size
      offerings) by disambiguating via sku_code or ALT{n}.
    - NOTE: loader assumes database.py exposes SessionLocal. Adjust
      the import if named differently.

[4] VERIFY PROJECT SETUP POPUP RENDERS
    - Open a project → click ⚙ Project Setup.
    - Check: 3 main tabs, 13 material sub-tabs / 5 hardware sub-tabs,
      the ‹ › overflow scroll on sub-tabs, the draggable divider,
      and that the dataset header bar and sub-tab bar line up (both
      38px) across the divider.
    - Confirm the new font sizes look right throughout.


LARGER OPEN THREADS (beyond tomorrow)
-------------------------------------

[A] PROJECT SCOPING LAYER  ← the big one; makes Setup functional
    - Build project_materials / project_hardware tables: which
      library items belong to which project. Reference by string
      CODE, not FK (forward-compat rule).
    - Read + write endpoints.
    - Wire the Project Setup dataset viewer to show project-scoped
      rows instead of the placeholder.
    - Wire the right-panel "Add" controls (currently disabled shells).
    - Suggested approach: prove the whole pattern end-to-end on
      LAMINATE ONLY first (the one category with real data), then
      replicate across other categories.

[B] REMAINING MATERIAL CATEGORY TABLES (10)
    Designed one at a time, same pattern as laminate:
      metal laminates, veneer, solids (NO grain column — solid wood
      is long-grain only), metal surfaces, glass, mirror,
      solid surface, stone, quartz, edgebands

[C] HARDWARE CATALOG — build from scratch
    - Microvellum's hardware was 13,000+ IP-heavy rows, partly binary
      blobs. Decision: hand-curate, do NOT import.
    - Use the Microvellum Type-52 taxonomy as the category skeleton:
      Hinges, Drawer Slides, Drawer Systems, Handles/Pulls, Locks,
      Legs, Casters, Brackets, Fasteners, Shelf Supports, Lift
      Systems, Wire Management, Lights and Power, Closet Hardware,
      Pullouts, Waste Bin Pullouts, Folding/Sliding Door Systems.
    - First 5 sub-tabs already in the Setup UI: Hinges, Drawer Slides,
      Handles/Pulls, Shelf Supports, Fasteners.

[D] COMPACT OPTIONS LOADER
    - compact_options table exists but ships EMPTY.
    - Holds the shared Compact menu (3 textures × up to 14 grades)
      stored ONCE, not exploded per-décor (would be ~12,012 duplicate
      rows across 286 eligible décors).
    - 246 finishes currently flagged compact_available=true.

[E] MATERIAL APPROVAL QUEUE
    - Users can submit new materials; they go to review before
      entering the global library. Admin approves (automate later).
    - Schema needs to support a pending state from the start.
    - The additional_features fact-check is an ingestion-pipeline
      concern, NOT enforced by the schema.

[F] DEFERRED FROM EARLIER SESSIONS
    - Shared Button component (blue/white consistency across pages,
      incl. the Workspace "← Projects" inline-styled button).
    - Permanent cascade-delete + ZIP for archived projects
      (needs Phase 8 PDFs).
    - is_platform_admin tier on User.
    - JWT / Phase 0 auth — HARD GATE before any public deploy or
      onboarding a second company.
    - Geometry engine (svg_type → Python classes).


KEY ARCHITECTURE DECISIONS (do not re-litigate)
-----------------------------------------------

* Global library is NEVER browsed wholesale in the workspace. It is
  a searchable database. Users pull items into a project; the
  project-scoped list is what they interact with.

* Laminate rows = ONE ROW PER ORDERABLE VARIANT
  (finish × texture × grade × thickness). Size is an AVAILABILITY
  attribute → boolean columns (size_4x8, size_5x12, …), NOT a
  per-row sheet_size_id FK. sheet_sizes is reference data only.

* finishes = pure decorative identity (manufacturer + finish_name +
  finish_number). Texture lives on the VARIANT row, not the finish,
  because one décor comes in many textures.

* Manufacturer on laminate/melamine is reached via
  finish.manufacturer — not stored twice, so they cannot drift.
  Cores keep their own manufacturer_id (cores have no finish).

* Compact is NOT exploded into library_laminate. Its option menu is
  identical across all eligible décors → shared compact_options
  table, pointed to collectively via finishes.compact_available.

* BOMs reference materials by string CODE, never FK. Catalog is
  normalized internally with FKs; the code keeps BOMs decoupled.

* Grain enum is Long / Short everywhere. Solids get NO grain column.

* Microvellum: learn the STRUCTURE and TAXONOMY, do not copy the
  DATA. Their parametric logic lives in binary workbooks tied to
  their engine; ScriptedLines' logic lives in Python classes via
  svg_type. Licensing caution stands for any commercial use of
  their curated library content.


FILES FROM THIS SESSION
-----------------------
  material_lookups.py           lookups + compact_options
  material_core.py              library_cores
  material_melamine.py          library_melamine
  material_laminate.py          library_laminate (variant matrix)
  __init__.py                   model registration
  load_formica_laminates.py     the loader
  ProjectSetup.jsx              setup popup component
  ProjectSetup.css              setup popup styles
  ProjectsPage.jsx              corrected + Setup wired in
  scriptedlines_catalog_reference.md   Microvellum learnings
  font_size_ruler.html          11–20px reference (throwaway tool)


================================================================


# Next Steps — ScriptedLines Materials Catalog (Formica)

Summary of pending/unresolved items from this chat, in rough priority order.

## 1. Finalize the parent/child table split (immediate, in progress)
We agreed on: one manufacturer-agnostic **parent** table (`laminates`) holding
just identity fields (finish_number, finish_name, collection, variant, sku_code,
grain, product_type, region, manufacturer_id), and one **child** table per
manufacturer (e.g. `formica_laminate_options`) holding all texture/grade/size/
thickness detail, FK'd back via `laminate_id`.

**Still pending:** `formica_na_laminates.csv` currently still carries all the
Formica-specific boolean columns (texture_*, grade_*, size_*, fire_rated_*,
compact_available) — these are now redundant with `formica_laminate_options.csv`
and don't belong on a cross-manufacturer parent table. Need to strip them out so
the parent CSV matches the intended clean parent shape.

## 2. Build the actual manufacturer table
A `manufacturers` table (Formica, Wilsonart, Panolam...) needs to exist and be
referenced by the parent `laminates` table via `manufacturer_id`. Not yet built.

## 3. Model Compact as shared reference data, not per-row
Compact (`compact_available` flag) applies identically to all ~286 eligible
decors — its 3 textures x up to 14 grades should NOT be exploded per finish.
Needs its own small reference table that eligible finishes point to
collectively (not a per-finish join), separate from the main options table.

## 4. Load into Supabase
No live Supabase connection is active in this chat - either connect a Supabase
MCP connector to load directly, or generate the SQL (CREATE TABLE +
INSERT/COPY statements) to run manually. Not yet done either way.

## 5. Data-quality follow-ups
- **Solid Colors `-58` Grade 12** size reading came out unusually sparse from
  the source image (only `5'x8'` matched a tracked size bucket, everything else
  was unpaired single dimensions). Worth a manual re-check against the original
  image if precision matters.
- **`-DP`/`-BH`/`-PA`** texture descriptions are placeholder-only - names are
  confirmed from source guides, but full descriptions were never on the
  "Product Textures" reference page. Backfill if that source ever surfaces.
- **MicroDot/Sculpted/Crystal/ColorCore2 `sku_code`** values are inferred
  (BASE-TEXTURECODE convention), not confirmed by Formica directly. Confirm if
  exact order codes are ever needed.

## 6. Everform Solid Surface
Separate product type from laminate (solid surface, not laminate). Only an
identity list exists (`formica_na_everform_master.csv`, 40 rows, no technical
data). Need to determine whether source material (texture/size/thickness
guides equivalent to what we had for laminate) actually exists before
attempting the same build-out.

## 7. Wilsonart / Panolam (future manufacturers)
Same manufacturer-first pattern applies: each gets its own child table with
its own texture/grade vocabulary, referencing the shared parent `laminates`
table via `manufacturer_id`. Not started - deliberately deferred until Formica
is fully wrapped up.

---

## Current state (for reference)
- `formica_na_laminates.csv` - 390 rows / 332 unique finishes, 11 collections
  (6 base collections + 5 promoted specialty lines: Antimicrobial, ColorCore2,
  Crystal, MicroDot, Sculpted)
- `formica_laminate_options.csv` - 1,820 rows, one per orderable variant
  (finish x texture x grade x thickness), sizes as boolean flags
- All obsolete intermediate files (`formica_grades.csv`, `formica_textures.csv`,
  `formica_laminate_specs.csv`, `formica_laminate_junction.csv`,
  `formica_na_finishes_master.csv`, `formica_na_specialty_products.csv`) have
  been fully superseded - do not use them going forward.
