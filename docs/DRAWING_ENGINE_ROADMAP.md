ScriptedLines — Path to the Drawing (Geometry) Engine
Written: 2026-07-25
================================================================

CONTEXT
-------
The materials catalog work (Laminates, Cores, Melamine, Layups) is done
and was necessary groundwork, but it is not the geometry engine itself —
it's the parts list the engine will pull FROM. The engine is the thing
that takes a product placed on a drawing and figures out what it's
actually made of: a cut list, sheet goods usage, edge band footage,
hardware takeoff. That logic doesn't exist yet.

The BOM *output* tables already exist and work (drawing_bom_products/
hardware/sheetgoods/edgeband/parts, backend/api/bom.py) — that's where
the engine writes its answers. What's missing is everything that
produces those answers.

This is a point list, not a full design — per your call, we tackle each
step's real design questions when we get there, not all upfront.

================================================================
PHASE 1 — Close the remaining catalog gaps
================================================================
Same build pattern as Cores/Melamine each time (schema confirm → seed →
API → Project Setup tab). Both are real inputs the engine needs and
currently don't exist as catalogs at all — only their BOM output tables
(drawing_bom_hardware, drawing_bom_edgeband) exist today.

  1. Hardware catalog — library_hardware (or one table per category:
     Hinges, Drawer Slides, Handles/Pulls, Shelf Supports, Fasteners).
     Design question to resolve when we get here: one unified table
     with a category discriminator + a flexible spec field, vs. one
     table per category (specs vary a lot — a hinge's relevant fields
     look nothing like a drawer slide's).
  2. Edgebands catalog — library_edgebands. Needs to reference/match a
     face finish (laminate or melamine) by color, since edgebanding is
     chosen to match the panel it's applied to.

================================================================
PHASE 2 — Make DrawingProduct's material fields real references
================================================================
Right now DrawingProduct's material/hardware fields (exterior_material,
interior_material, back_material, subtop_material, edge_banding,
hinge_code, drawer_slide_code, pull_code, shelf_pin_code) are plain
free-text String columns — not references to anything. The engine can't
compute real thickness/cost/spec data from an arbitrary typed string.

  3. Turn each material field into a real, project-scoped reference.
     Note this needs to be polymorphic, same pattern as Layup's own
     faces: a panel might be finished via a project_layup (custom
     core+laminate combo) OR directly via a project_melamine row
     (melamine is already a finished panel, no separate core needed) —
     two different ways to arrive at "a finished panel," both valid.
  4. Same for hardware fields — reference project-scoped hardware
     selections once Phase 1's hardware catalog + its project-junction
     table exist.

================================================================
PHASE 3 — Construction-rule data model (the hard, central part)
================================================================
This is the actual knowledge the engine runs on, and it's a genuinely
different kind of data than anything built so far — closer to encoding
cabinetmaking joinery logic than cataloging a material. library_products
today only stores coarse defaults (default_width/height/depth, door/
drawer/shelf counts) — nothing about how a product decomposes into
parts.

  5. Design a part-template model per product (library_products row):
     for a given product type, what parts exist (Left Gable, Right
     Gable, Top, Bottom, Back, Shelf, Door...), how each part's
     dimensions derive from the product's overall box dimensions
     (offset formulas, not fixed numbers), which material surface
     (exterior/interior/back/subtop) each part draws from, which edges
     get banding, and grain direction per part.
  6. Support variant branching — door/drawer/shelf count changes which
     parts get generated (a 2-door base cabinet generates a different
     part list than a 1-door one from the same product template).
  7. This deserves its own dedicated planning pass when we start it —
     flagged here as the milestone, not designed now.

================================================================
PHASE 4 — The computation engine itself
================================================================
  8. Build the actual Python service: DrawingProduct + resolved part
     templates + resolved material/hardware references → generates
     DrawingBomPart rows (cut list), aggregates into
     DrawingBomSheetGoods, DrawingBomEdgeBand, DrawingBomHardware, and
     a DrawingBomProduct summary row. Writes through the existing
     backend/api/bom.py logic — that part doesn't need to change.
  9. Wire the trigger point — recalculate a product's BOM contribution
     when it's created/updated/saved on the canvas (in
     api/drawing_products.py's create/update handlers).
 10. Wire the frontend — the "BOM" drawing-action button is currently a
     disabled stub; once real data can land in the BOM tables, it needs
     an actual view. ("+ Rev" and "Export" are separate, unrelated
     stubs — not blocked on the engine.)

================================================================
PHASE 5 — Real-world correctness (can start naive, improve later)
================================================================
 11. Sheet nesting / cut optimization — start with naive area-sum
     sheet-count estimates, layer in real nesting (kerf, grain
     direction, offcut reuse) once the basic pipeline works end to end.
 12. Real cost estimation — cost_per_sheet/cost_per_sqft are null
     across every catalog today (deliberately, no fabricated pricing).
     Needs real supplier data before cost output means anything.

================================================================
NOT BLOCKING THE ENGINE — can happen in parallel or later
================================================================
- The 9 remaining empty material sub-tabs (Metal Laminates, Veneer,
  Solids, Metal Surfaces, Glass, Mirror, Solid Surface, Stone, Quartz)
  — only matter to the engine once a product actually needs one of
  those as a material surface. Build on demand, not upfront.
- Dropping the fully-dead library_materials/manufacturers/sheet_sizes/
  finishes tables — cleanup, zero effect on the engine.
- Alembic/migration tooling — real gap, but orthogonal; every phase
  above will keep going through the same hand-confirmed SQL process
  used so far regardless of whether this gets fixed first.
