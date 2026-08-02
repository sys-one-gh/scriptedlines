# ScriptedLines — Next Steps

Consolidated from prior session handoffs and `DRAWING_ENGINE_ROADMAP.md`. For
what's already built, see [README.md](README.md).

---

## The drawing (geometry) engine — the big one

The material/hardware catalogs are groundwork, not the engine itself. The
engine is what takes a product placed on a drawing and figures out what it's
actually made of: cut list, sheet goods usage, edge band footage, hardware
takeoff. The BOM *output* tables already exist and work
(`drawing_bom_products/hardware/sheetgoods/edgeband/parts`, `api/bom.py`) —
that's where the engine writes its answers. Everything that *produces* those
answers is still missing. Tackle each phase's real design questions when we
get there, not all upfront.

**Phase 1 — Close remaining catalog gaps — DONE.** Hardware catalog
(hinges/drawer slides/handles/shelf supports) and edgebands both shipped.

**Phase 2 — Make `DrawingProduct`'s material fields real references — NEXT, unblocked.**
Right now `exterior_material`, `interior_material`, `back_material`,
`subtop_material`, `edge_banding`, `hinge_code`, `drawer_slide_code`,
`pull_code`, `shelf_pin_code` are plain free-text `String` columns on
`DrawingProduct` — not references to anything, so the engine can't compute
real thickness/cost/spec data from an arbitrary typed string.
- Turn each material field into a real, project-scoped reference. Needs to be
  polymorphic, same pattern as a Layup's own faces: a panel might be finished
  via a `project_layup` (custom core+laminate combo) OR directly via a
  `project_melamine` row (already a finished panel, no separate core) — two
  valid ways to arrive at "a finished panel."
- Same for hardware fields — reference project-scoped hardware selections
  (`project_hinge`, `project_drawer_slide`, etc. — junction tables already exist).

**Phase 3 — Construction-rule data model — needs its own planning pass before coding.**
The hard, central part. `library_products` today only stores coarse defaults
(width/height/depth, door/drawer/shelf counts) — nothing about how a product
decomposes into parts.
- Design a part-template model per product: for a given product type, what
  parts exist (Left Gable, Right Gable, Top, Bottom, Back, Shelf, Door...),
  how each part's dimensions derive from the product's overall box dimensions
  (offset formulas, not fixed numbers), which material surface each part
  draws from, which edges get banding, grain direction per part.
- Support variant branching — door/drawer/shelf count changes which parts
  get generated (a 2-door base cabinet generates a different part list than
  a 1-door one from the same product template).
- Note: `svg_type` is nearly 1:1 with product (73 distinct values across 81
  products) — no small shared taxonomy of renderer classes to lean on.

**Phase 4 — The computation engine itself.**
- Build the actual Python service: `DrawingProduct` + resolved part templates
  + resolved material/hardware references → generates `DrawingBomPart` rows
  (cut list), aggregates into `DrawingBomSheetGoods`, `DrawingBomEdgeBand`,
  `DrawingBomHardware`, and a `DrawingBomProduct` summary row. Writes through
  the existing `api/bom.py` — that part doesn't need to change.
- Wire the trigger point — recalculate a product's BOM contribution when
  it's created/updated/saved on the canvas (`api/drawing_products.py`'s
  create/update handlers — currently just CRUD, no BOM trigger).
- Wire the frontend — the "BOM" drawing-action button is currently a disabled
  stub; once real data can land in the BOM tables, it needs an actual view.
  ("+ Rev" and "Export" are separate, unrelated stubs — not blocked on the engine.)

**Phase 5 — Real-world correctness, can start naive.**
- Sheet nesting / cut optimization — start with naive area-sum sheet-count
  estimates, layer in real nesting (kerf, grain direction, offcut reuse) once
  the basic pipeline works end to end.
- Real cost estimation — `cost_per_sheet`/`cost_per_sqft` are null across
  every catalog today (deliberately, no fabricated pricing). Needs real
  supplier data before cost output means anything.

**Not blocking the engine** — can happen in parallel or later: the 9 empty
material sub-tabs (only matter once a product needs one as a material
surface — build on demand), the dead-table cleanup below, Alembic.

---

## Catalog completion

- 9 remaining material sub-tabs, same build pattern each time (schema confirm
  → seed → API → Project Setup tab): Metal Laminates, Veneer, Solids, Metal
  Surfaces, Glass, Mirror, Solid Surface, Stone, Quartz.
- Fasteners hardware category — 5th sub-tab already shown in the UI, no
  backend behind it yet.
- Compact options loader — `compact_options` table exists but ships empty.
  Holds the shared Compact menu (3 textures × up to 14 grades) stored once,
  not exploded per-décor (~12,012 duplicate rows across 286 eligible décors
  otherwise). ~246 finishes are currently flagged `compact_available=true`.
- Material approval/review queue — users submit a material not in the
  library, it goes to review before joining the global catalog. Schema needs
  to support a pending state from the start; the "Submit New Material" button
  in Project Setup is already a disabled stub waiting on this.

## Title block / drawing template rendering

`DrawingTemplate` model + `api/templates.py` hold the data (company/client/
notes/finish schedule), but there's no SVG rendering of an actual title block
on the drawing sheet yet. `assets/titleblocks/` is an empty directory.

## Styling cleanup

Inline-style backlog, in priority order (same visual system as the
already-migrated `Workspace.jsx`/`Workspace.css`):
1. `PaperSpace.jsx` (26 `style={{` sites) + `CADToolbar.jsx` (11) — same
   screen as Workspace, so the gap between migrated/not-migrated is visually
   obvious flipping between tabs.
2. `LoginPage.jsx` (11) + `RegisterPage.jsx` (9) — isolated screens, lower
   urgency.

## Housekeeping

- Delete `backend/models/material.py` — dead, unused flat material model.
- Delete `backend/models/material_lookups.py` (`Manufacturer`, `SheetSize`,
  `Finish`) and drop the corresponding DB tables (`manufacturers`,
  `sheet_sizes`, `finishes`) — the shared-lookup design they implement was
  abandoned when laminate/core/melamine all moved to self-contained tables.
  Also drop `library_materials` (dead, never populated).
- Alembic is a dependency but unused — every schema change so far has been
  hand-confirmed SQL against Supabase. Real gap, but orthogonal to the engine
  work above — fix whenever, doesn't block anything.
- `drawing_products` (real placed-on-canvas product instances) has 0 rows —
  worth actually exercising the drop form end-to-end once, to catch UX gaps
  before the BOM engine has real data to compute from.
