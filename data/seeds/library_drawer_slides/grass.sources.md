# Grass — library_drawer_slides sources

## Source

**Grass America "Dynapro Slide System" catalog**, item #01813-01-DC-2M-IT-06/26 (PDF modified July 2026)
https://www.grassusa.com/downloads/grass_catalog_dynapro.pdf

- **Dynapro 16 2D** (F130135013604, F13013501x204U, 5 rows) and **Dynapro 16 3D** (F1301350036/46/56 04, F13013500x204U, 5 rows): drawer length, nominal length, min/max installation depth, 100 lb, 12.7–16 mm drawer material.
- **Dynapro 16 3D Heavy Duty** 18/21/24" (132 lb) and **Extended Length** 27/30" (110 lb): drawer length, nominal length, min installation depth (5 rows).
- **Dynapro 19 2D / 3D / 3D Heavy Duty / Extended Length**: the same structure for 16–19 mm drawer material (15 rows).

Column mapping:
- "Drawer Length" → `length_mm`
- "Nominal Length" (always longer than drawer length, e.g. 262 for a 229 drawer) → `runner_length_mm`
- "Min/Max Installation Depth" → `min_cabinet_depth_mm` / `max_cabinet_depth_mm`

All rows are soft close (integrated liquid damping) and full extension.

## Decisions and caveats

- **Load is the catalog's headline load rating:**
  - 100 lb for standard (100 dynamic / 100 static).
  - 132 lb for heavy duty (150 static).
  - 110 lb for extended lengths (125 static).
- **`max_cabinet_depth_mm` is empty for Heavy Duty and Extended Length.** No maximum is published for them, and they must be blocked out for face-frame use.
- **Material and finish are empty.** The catalog doesn't state the runner material or finish; it only mentions "zinc plated, steel brackets" for an accessory.
- **Left out:**
  - The LH/RH bulk handed items (F1301414xx299, F1301350x7–21299, PU 336/364): these are single-side bulk packs of the same 2D slides.
  - Dynapro Base Panel Mount (F130107884604 etc., 450/500/550 mm, 88 lb): no drawer-length or installation-depth table.
  - Tipmatic and Sensomatic opening units: these are accessories, not runners.
- European metric Dynapro (NL 270–550 mm, 40/60 kg) was not researched. The NA catalog is what a North American shop orders.
