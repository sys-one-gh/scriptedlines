# ─────────────────────────────────────────────────────────────
# parts/types.py
#
# PartSpec — what a generator function returns: one entry per cut
# part, before it's persisted as a DrawingBomPart row. material_role
# is NOT a material code — it's which surface of the DrawingProduct
# (exterior/interior/back/subtop) this part's finish comes from;
# registry.py's caller resolves that to a real project-scoped
# material_code via the Phase 2 resolvers already in
# api/drawing_products.py. role=None means "no finish applies"
# (nothing uses this today, but keeps the field honest for future
# unfinished/structural parts).
#
# All dimensional constants below are DELIBERATE PLACEHOLDERS, not
# real shop standards — no reveal/overlay/joinery math, no per-
# material real thickness. Confirmed with the user: naive first, get
# the pipeline flowing end to end, refine once it's proven. See
# NEXT_STEPS.md's "Real construction math" deferred item.
# ─────────────────────────────────────────────────────────────

from dataclasses import dataclass
from typing import Optional, Literal

MaterialRole = Literal["exterior", "interior", "back", "subtop"]


@dataclass
class PartSpec:
    part_number:     str
    description:     str
    material_role:   Optional[MaterialRole]
    thickness_mm:    float
    width_mm:        float
    length_mm:       float
    quantity:        int = 1
    grain_direction: str = "none"


# ── NAIVE PLACEHOLDER CONSTANTS (mm) ───────────────────────────
PANEL_THICKNESS_MM      = 19.0   # gables, top, bottom, shelves, doors, drawer fronts
BACK_THICKNESS_MM       = 6.0    # back panel
FRAME_MEMBER_WIDTH_MM   = 38.0   # framed construction: face-frame stile/rail width
FRONT_GAP_MM            = 3.0    # naive gap between adjacent door/drawer fronts on a multi-front cabinet

# Toe kick is deliberately NOT modeled here — the catalog already has it as
# its own separate product ("Ladder Base" / "Finished Toe Kick Ladder Base",
# category "Fixtures and Extruded Products"), dropped independently. Baking
# a toe-kick allowance into the cabinet carcass too would double-count it.
