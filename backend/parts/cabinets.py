# ─────────────────────────────────────────────────────────────
# parts/cabinets.py
#
# Carcass + fronts generators for cabinetry (Framed/Frameless x
# Base/Upper/Tall/Drawer Bank/Sink). One generic carcass shape covers
# all five subcategories — they're dimensionally identical boxes;
# what actually varies (door/drawer count, and therefore front
# layout) is handled by _generate_fronts, driven by the product's
# own default_doors/default_drawers, not by subcategory.
#
# NAIVE: fixed offsets only, no reveal/overlay/joinery math. Framed
# construction gets one placeholder "Face Frame" part instead of a
# real stile/rail breakdown — see types.py's module docstring.
# ─────────────────────────────────────────────────────────────

from parts.types import (
    PartSpec, PANEL_THICKNESS_MM, BACK_THICKNESS_MM,
    FRAME_MEMBER_WIDTH_MM, FRONT_GAP_MM,
)


def _generate_carcass(width_mm: float, height_mm: float, depth_mm: float, construction_type: str) -> list[PartSpec]:
    inner_width = width_mm - 2 * PANEL_THICKNESS_MM

    parts = [
        PartSpec("001", "Left Gable",  "exterior", PANEL_THICKNESS_MM, depth_mm,    height_mm, grain_direction="lengthwise"),
        PartSpec("002", "Right Gable", "exterior", PANEL_THICKNESS_MM, depth_mm,    height_mm, grain_direction="lengthwise"),
        PartSpec("003", "Top",         "interior", PANEL_THICKNESS_MM, inner_width, depth_mm),
        PartSpec("004", "Bottom",      "interior", PANEL_THICKNESS_MM, inner_width, depth_mm),
        PartSpec("005", "Back",        "back",     BACK_THICKNESS_MM,  inner_width, height_mm),
    ]

    if construction_type == "framed":
        parts.append(
            PartSpec("006", "Face Frame — naive placeholder, real stile/rail breakdown TBD",
                     "exterior", FRAME_MEMBER_WIDTH_MM, width_mm, height_mm)
        )

    return parts


def _generate_fronts(width_mm: float, height_mm: float, doors: int, drawers: int) -> list[PartSpec]:
    """Doors sit side by side (each divides width, full zone height).
    Drawers stack vertically (each divides height, full width) — matches
    both drawer-bank-only cabinets and the drawer-over-door combos in the
    catalog (e.g. "1 Drawer 1 Door"). Zone split between the two, when
    both are present, is a naive proportional split by count."""
    parts: list[PartSpec] = []
    total = doors + drawers
    if total == 0:
        return parts

    if doors > 0 and drawers > 0:
        drawer_zone_h = height_mm * (drawers / total)
        door_zone_h   = height_mm - drawer_zone_h
    elif drawers > 0:
        drawer_zone_h = height_mm
        door_zone_h   = 0.0
    else:
        drawer_zone_h = 0.0
        door_zone_h   = height_mm

    n = len(parts)
    for i in range(drawers):
        n += 1
        parts.append(PartSpec(
            f"{n:03d}", f"Drawer Front {i + 1}", "exterior", PANEL_THICKNESS_MM,
            width_mm - FRONT_GAP_MM, (drawer_zone_h / drawers) - FRONT_GAP_MM,
        ))
    for i in range(doors):
        n += 1
        parts.append(PartSpec(
            f"{n:03d}", f"Door Front {i + 1}", "exterior", PANEL_THICKNESS_MM,
            (width_mm / doors) - FRONT_GAP_MM, door_zone_h - FRONT_GAP_MM,
        ))

    return parts


def generate_cabinet_parts(width_mm: float, height_mm: float, depth_mm: float,
                            doors: int, drawers: int, construction_type: str) -> list[PartSpec]:
    carcass = _generate_carcass(width_mm, height_mm, depth_mm, construction_type)
    fronts  = _generate_fronts(width_mm, height_mm, doors, drawers)

    # Renumber sequentially across the combined list — the two generators
    # above number independently so each is testable/readable on its own.
    combined = carcass + fronts
    for i, p in enumerate(combined, start=1):
        p.part_number = f"{i:03d}"
    return combined
