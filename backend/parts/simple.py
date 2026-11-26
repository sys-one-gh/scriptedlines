# ─────────────────────────────────────────────────────────────
# parts/simple.py
#
# Single-part passthrough for categories that aren't cabinetry —
# Countertop, Fixtures and Extruded Products (die walls, ladder
# base). No carcass/fronts composition: the placed instance's own
# box dimensions ARE the one cut part.
#
# "height" means different things per category in the catalog — a
# countertop's height (e.g. 12mm) is its thickness; a die wall's
# height (e.g. 2438mm) is a real vertical extent, and depth (150mm)
# is closer to its thickness. Rather than special-case every
# category, treat whichever of the three instance dimensions is
# SMALLEST as the part's thickness — true by definition for any
# flat sheet good, and happens to give the right answer for both
# shapes above without guessing per category.
# ─────────────────────────────────────────────────────────────

from parts.types import PartSpec


def generate_simple_part(width_mm: float, height_mm: float, depth_mm: float, description: str) -> list[PartSpec]:
    dims = sorted([width_mm, height_mm, depth_mm])
    thickness_mm, width_mm, length_mm = dims[0], dims[1], dims[2]
    return [
        PartSpec("001", description, "exterior", thickness_mm, width_mm, length_mm),
    ]
