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

**Phase 2 — Make `DrawingProduct`'s material fields real references — DONE.**
`exterior/interior/back/subtop_material` are now polymorphic
(`*_type` + `*_id`, "layup" → `project_layups.id` or "melamine" →
`project_melamine.id` — same pattern as `ProjectLayup`'s own faces, extend
`SUPPORTED_MATERIAL_TYPES` in `api/drawing_products.py` for more types later).
`edge_banding_id`/`hinge_id`/`drawer_slide_id`/`pull_id`/`shelf_pin_id` are
real FKs to the matching project-scoped table. All validated against the
drawing's own `project_id` on create/update; `product_to_dict` returns a
resolved summary (not a bare id) for each. Verified live: create/list/update,
a real FK rejecting a delete of an in-use hardware row, cross-project
reference validation.

**Phase 3 — Construction-rule data model — DONE (naive v1).**
New `backend/parts/` package: `registry.py` (`generate_parts(product, dp)`,
the one public entry point — dispatches on `product.category`, confirmed
exhaustive against the live catalog: "Framed Cabinetry"/"Frameless Cabinetry"
→ carcass+fronts, "Countertop"/"Fixtures and Extruded Products" → single
part), `cabinets.py` (one generic carcass shape for all 4 cabinet
subcategories — they're dimensionally identical; a fronts generator reads
`doors`/`drawers` straight off the product, stacks drawers vertically /
lays doors side by side), `simple.py` (single-part passthrough, thickness =
smallest of the 3 instance dimensions). No `svg_type` string-parsing
anywhere — turned out unnecessary once `category` supplied construction
type directly and door/drawer counts read straight off `product.default_*`.

Wired into `api/drawing_products.py`'s create/update/remove handlers
(`_regenerate_bom_parts`/`_clear_bom_parts`) — every save now generates real
`DrawingBomPart` rows + a `DrawingBomProduct` summary row, idempotently
(delete-then-insert). Materials resolved to real project-scoped codes via
Phase 2's existing resolvers; an unset surface gets a `"TBD"` material_code
rather than crashing (`drawing_bom_parts.material_code` is `NOT NULL`).
Verified live: frameless 1-door (6 parts), framed 1-drawer-1-door (8 parts,
incl. the placeholder face-frame part), width-change regenerates without
duplicating, removal clears both tables, a Countertop takes the simple path.

**Deliberately deferred from this pass** (naive-first was an explicit,
confirmed decision — not an oversight):
- Real construction math — no reveal/overlay/joinery/sink-cutout accuracy,
  just fixed placeholder constants (`backend/parts/types.py`). Framed
  cabinets get one placeholder "Face Frame" part instead of real stile/rail
  parts. Needs your actual shop standards, not something to guess at.
- `DrawingBomSheetGoods`/`DrawingBomEdgeBand`/`DrawingBomHardware`
  aggregation — only `DrawingBomPart`/`DrawingBomProduct` are populated so
  far. Sheet-goods aggregation needs nesting-awareness (Phase 5's job
  anyway); edgeband/hardware aggregation is very doable now that Phase 2
  made those real references, just not done yet.
- Real per-part thickness/cost derived from the resolved material (a
  layup's real thickness is core + 2 faces — nontrivial) — using flat
  constants for now.
- Runtime variant branching — confirmed out of scope. Changing
  doors/drawers/shelves on an already-placed instance does NOT regenerate a
  different part list; dropping a different product is how you get a
  different configuration, matching how the catalog itself already varies
  by product (`FR-B1D` vs `FR-B2D` are separate rows).

**Phase 4 — Wire the frontend.**
The actual computation engine (this phase, originally) turned out to fold
into Phase 3's implementation once started — generation + persistence
landed together. What's left:
- **The drop → save flow doesn't exist yet.** `PaperSpace.jsx`'s `handleDrop`
  only sets local React state — it never calls `POST /drawings/:id/products`.
  `drawing_products` has 0 real rows because of this, not because the engine
  isn't ready; the engine is fully exercised today only via direct API calls
  (same as Phase 2's testing). This is the actual next concrete step for
  making any of the above visible to a real user.
- The "BOM" drawing-action button is a disabled stub; once the drop→save
  flow exists, it needs a real view onto `GET /bom/:drawing_id`. ("+ Rev" and
  "Export" are separate, unrelated stubs.)

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
