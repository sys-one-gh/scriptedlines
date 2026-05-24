# ─────────────────────────────────────────────────────────────
# models/default_products.py
#
# Default product catalog seed data for ScriptedLines.
# This file populates the library_products table on first run.
# To add or edit products — update this file and re-run seed.py
# OR use the admin panel once it is built.
#
# Default dimensions are standard millwork industry sizes in mm.
# All heights include toe kick where applicable.
# ─────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────
# COUNTERTOPS
# Standard countertop depth 635mm (25")
# Thickness varies by material — stored in material_sets
# ─────────────────────────────────────────────────────────────
COUNTERTOPS = [
    {
        "category": "Countertop", "subcategory": "Stone & Quartz",
        "name": "Stone & Quartz Counter", "code": "CT-SQ",
        "description": "Stone and quartz countertop. Thickness and edge profile confirmed with client.",
        "svg_type": "countertop",
        "default_width": 2400, "default_height": 12, "default_depth": 635,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 10,
    },
    {
        "category": "Countertop", "subcategory": "Solid Surface",
        "name": "Solid Surface Counter", "code": "CT-SS",
        "description": "Solid surface countertop (Corian or equivalent). 12mm standard thickness.",
        "svg_type": "countertop",
        "default_width": 2400, "default_height": 12, "default_depth": 635,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 20,
    },
    {
        "category": "Countertop", "subcategory": "Metal Cladded",
        "name": "Metal Cladded Counter", "code": "CT-MC",
        "description": "Metal cladded countertop. Metal type and thickness confirmed with client.",
        "svg_type": "countertop",
        "default_width": 2400, "default_height": 12, "default_depth": 635,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 30,
    },
    {
        "category": "Countertop", "subcategory": "Post Formed",
        "name": "Post Formed Counter", "code": "CT-PF",
        "description": "Post formed laminate countertop with integrated backsplash.",
        "svg_type": "countertop",
        "default_width": 2400, "default_height": 38, "default_depth": 635,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 40,
    },
    {
        "category": "Countertop", "subcategory": "Wood",
        "name": "Wood Counter", "code": "CT-W",
        "description": "Wood countertop. Species and finish confirmed with client.",
        "svg_type": "countertop",
        "default_width": 2400, "default_height": 38, "default_depth": 635,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 50,
    },
]


# ─────────────────────────────────────────────────────────────
# FIXTURES AND EXTRUDED PRODUCTS
# ─────────────────────────────────────────────────────────────
FIXTURES = [
    {
        "category": "Fixtures and Extruded Products", "subcategory": "Fixture Components",
        "name": "Die Wall", "code": "FX-DW",
        "description": "Standard straight die wall fixture component.",
        "svg_type": "die_wall",
        "default_width": 600, "default_height": 2438, "default_depth": 150,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 10,
    },
    {
        "category": "Fixtures and Extruded Products", "subcategory": "Fixture Components",
        "name": "Curved Die Wall", "code": "FX-CDW",
        "description": "Curved die wall fixture component.",
        "svg_type": "die_wall_curved",
        "default_width": 600, "default_height": 2438, "default_depth": 150,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 20,
    },
    {
        "category": "Fixtures and Extruded Products", "subcategory": "Fixture Components",
        "name": "Angled Straight Die Wall", "code": "FX-ASDW",
        "description": "Angled straight die wall fixture component.",
        "svg_type": "die_wall_angled_straight",
        "default_width": 600, "default_height": 2438, "default_depth": 150,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 30,
    },
    {
        "category": "Fixtures and Extruded Products", "subcategory": "Fixture Components",
        "name": "Angle Curved Die Wall", "code": "FX-ACDW",
        "description": "Angle curved die wall fixture component.",
        "svg_type": "die_wall_angle_curved",
        "default_width": 600, "default_height": 2438, "default_depth": 150,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 40,
    },
    {
        "category": "Fixtures and Extruded Products", "subcategory": "Ladder Base",
        "name": "Ladder Base", "code": "LB-STD",
        "description": "Standard ladder base for fixture installations.",
        "svg_type": "ladder_base",
        "default_width": 600, "default_height": 150, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Fixtures and Extruded Products", "subcategory": "Ladder Base",
        "name": "Finished Toe Kick Ladder Base", "code": "LB-FTK",
        "description": "Ladder base with finished toe kick face.",
        "svg_type": "ladder_base_finished",
        "default_width": 600, "default_height": 150, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 60,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMELESS CABINETRY — BASE CABINETS
# Standard base height 870mm includes 150mm toe kick
# Standard depth 580mm
# ─────────────────────────────────────────────────────────────
FRAMELESS_BASE = [
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 1 Door Frameless", "code": "FL-B1D",
        "description": "Single door frameless base cabinet.",
        "svg_type": "base_cabinet_1d",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 10,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 2 Door Frameless", "code": "FL-B2D",
        "description": "Double door frameless base cabinet.",
        "svg_type": "base_cabinet_2d",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 1, "sort_order": 20,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base Blind Corner Frameless", "code": "FL-B-BC",
        "description": "Blind corner frameless base cabinet.",
        "svg_type": "base_cabinet_blind_corner",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 30,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base Corner Frameless", "code": "FL-B-C",
        "description": "Corner frameless base cabinet.",
        "svg_type": "base_cabinet_corner",
        "default_width": 900, "default_height": 870, "default_depth": 900,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 40,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base Open Frameless", "code": "FL-B-O",
        "description": "Open frameless base cabinet. No doors.",
        "svg_type": "base_cabinet_open",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 1, "sort_order": 50,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 1 Drawer 1 Door Frameless", "code": "FL-B1DR1D",
        "description": "Frameless base cabinet with 1 drawer and 1 door.",
        "svg_type": "base_cabinet_1dr1d",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 1, "default_shelves": 0, "sort_order": 60,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 1 Drawer 2 Door Frameless", "code": "FL-B1DR2D",
        "description": "Frameless base cabinet with 1 drawer and 2 doors.",
        "svg_type": "base_cabinet_1dr2d",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 1, "default_shelves": 0, "sort_order": 70,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 2 Drawer 2 Door Frameless", "code": "FL-B2DR2D",
        "description": "Frameless base cabinet with 2 drawers and 2 doors.",
        "svg_type": "base_cabinet_2dr2d",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 2, "default_shelves": 0, "sort_order": 80,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMELESS CABINETRY — UPPER CABINETS
# Standard upper height 762mm / depth 305mm
# ─────────────────────────────────────────────────────────────
FRAMELESS_UPPER = [
    {
        "category": "Frameless Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper 1 Door Frameless", "code": "FL-U1D",
        "description": "Single door frameless upper cabinet.",
        "svg_type": "upper_cabinet_1d",
        "default_width": 600, "default_height": 762, "default_depth": 305,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 10,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper 2 Door Frameless", "code": "FL-U2D",
        "description": "Double door frameless upper cabinet.",
        "svg_type": "upper_cabinet_2d",
        "default_width": 900, "default_height": 762, "default_depth": 305,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 1, "sort_order": 20,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Blind Corner Frameless", "code": "FL-U-BC",
        "description": "Blind corner frameless upper cabinet.",
        "svg_type": "upper_cabinet_blind_corner",
        "default_width": 900, "default_height": 762, "default_depth": 305,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 30,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Corner Frameless", "code": "FL-U-C",
        "description": "Corner frameless upper cabinet.",
        "svg_type": "upper_cabinet_corner",
        "default_width": 900, "default_height": 762, "default_depth": 305,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 40,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Corner Filler Frameless", "code": "FL-U-CF",
        "description": "Corner filler frameless upper cabinet.",
        "svg_type": "upper_cabinet_corner_filler",
        "default_width": 150, "default_height": 762, "default_depth": 305,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Open Frameless", "code": "FL-U-O",
        "description": "Open frameless upper cabinet. No doors.",
        "svg_type": "upper_cabinet_open",
        "default_width": 600, "default_height": 762, "default_depth": 305,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 1, "sort_order": 60,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMELESS CABINETRY — TALL CABINETS
# Standard tall height 2134mm / depth 580mm
# ─────────────────────────────────────────────────────────────
FRAMELESS_TALL = [
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall 1 Door Frameless", "code": "FL-T1D",
        "description": "Single door frameless tall cabinet.",
        "svg_type": "tall_cabinet_1d",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 3, "sort_order": 10,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall 2 Door Frameless", "code": "FL-T2D",
        "description": "Double door frameless tall cabinet.",
        "svg_type": "tall_cabinet_2d",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 3, "sort_order": 20,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall 3 Door Frameless", "code": "FL-T3D",
        "description": "Three door frameless tall cabinet.",
        "svg_type": "tall_cabinet_3d",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 3, "default_drawers": 0, "default_shelves": 3, "sort_order": 30,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Open Frameless", "code": "FL-T-O",
        "description": "Open frameless tall cabinet. No doors.",
        "svg_type": "tall_cabinet_open",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 3, "sort_order": 40,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Blind Corner 1 Door Frameless", "code": "FL-T-BC1D",
        "description": "Blind corner frameless tall cabinet with 1 door.",
        "svg_type": "tall_cabinet_blind_corner_1d",
        "default_width": 900, "default_height": 2134, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 3, "sort_order": 50,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Blind Corner 2 Door Frameless", "code": "FL-T-BC2D",
        "description": "Blind corner frameless tall cabinet with 2 doors.",
        "svg_type": "tall_cabinet_blind_corner_2d",
        "default_width": 900, "default_height": 2134, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 3, "sort_order": 60,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Corner Frameless", "code": "FL-T-C",
        "description": "Corner frameless tall cabinet.",
        "svg_type": "tall_cabinet_corner",
        "default_width": 900, "default_height": 2134, "default_depth": 900,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 3, "sort_order": 70,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMELESS CABINETRY — SINK CABINETS
# ─────────────────────────────────────────────────────────────
FRAMELESS_SINK = [
    {
        "category": "Frameless Cabinetry", "subcategory": "Sink Cabinets",
        "name": "1 Door Sink Frameless", "code": "FL-SB1D",
        "description": "Single door frameless sink base cabinet.",
        "svg_type": "sink_cabinet_1d",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 0, "sort_order": 10,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Sink Cabinets",
        "name": "2 Door Sink Frameless", "code": "FL-SB2D",
        "description": "Double door frameless sink base cabinet.",
        "svg_type": "sink_cabinet_2d",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 0, "sort_order": 20,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Sink Cabinets",
        "name": "False Front Sink Frameless", "code": "FL-SB-FF",
        "description": "Frameless sink base with false front. No functional doors.",
        "svg_type": "sink_cabinet_false_front",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 30,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Sink Cabinets",
        "name": "1 Drawer Drain Notched Sink Frameless", "code": "FL-SB1DR-DN",
        "description": "Frameless sink base with 1 drain notched drawer.",
        "svg_type": "sink_cabinet_drain_notched",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 1, "default_shelves": 0, "sort_order": 40,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Sink Cabinets",
        "name": "2 Drawer Drain Notched Sink Frameless", "code": "FL-SB2DR-DN",
        "description": "Frameless sink base with 2 drain notched drawers.",
        "svg_type": "sink_cabinet_drain_notched",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 2, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Sink Cabinets",
        "name": "3 Drawer Drain Notched Sink Frameless", "code": "FL-SB3DR-DN",
        "description": "Frameless sink base with 3 drain notched drawers.",
        "svg_type": "sink_cabinet_drain_notched",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 3, "default_shelves": 0, "sort_order": 60,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMELESS CABINETRY — DRAWER BANK CABINETS
# ─────────────────────────────────────────────────────────────
FRAMELESS_DRAWER_BANK = [
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "1 Drawer Frameless", "code": "FL-1DR",
        "description": "Single drawer frameless cabinet.",
        "svg_type": "drawer_bank_1dr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 1, "default_shelves": 0, "sort_order": 10,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "2 Drawer Frameless", "code": "FL-2DR",
        "description": "2 drawer frameless cabinet.",
        "svg_type": "drawer_bank_2dr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 2, "default_shelves": 0, "sort_order": 20,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "3 Drawer Frameless", "code": "FL-3DR",
        "description": "3 drawer frameless cabinet.",
        "svg_type": "drawer_bank_3dr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 3, "default_shelves": 0, "sort_order": 30,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "4 Drawer Frameless", "code": "FL-4DR",
        "description": "4 drawer frameless cabinet.",
        "svg_type": "drawer_bank_4dr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 4, "default_shelves": 0, "sort_order": 40,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "1 Inset Drawer Frameless", "code": "FL-1IDR",
        "description": "Single inset drawer frameless cabinet.",
        "svg_type": "drawer_bank_1idr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 1, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "2 Inset Drawer Frameless", "code": "FL-2IDR",
        "description": "2 inset drawer frameless cabinet.",
        "svg_type": "drawer_bank_2idr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 2, "default_shelves": 0, "sort_order": 60,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "3 Inset Drawer Frameless", "code": "FL-3IDR",
        "description": "3 inset drawer frameless cabinet.",
        "svg_type": "drawer_bank_3idr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 3, "default_shelves": 0, "sort_order": 70,
    },
    {
        "category": "Frameless Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "4 Inset Drawer Frameless", "code": "FL-4IDR",
        "description": "4 inset drawer frameless cabinet.",
        "svg_type": "drawer_bank_4idr",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 4, "default_shelves": 0, "sort_order": 80,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMED CABINETRY — BASE CABINETS
# ─────────────────────────────────────────────────────────────
FRAMED_BASE = [
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 1 Door Framed", "code": "FR-B1D",
        "description": "Single door framed base cabinet.",
        "svg_type": "base_cabinet_1d_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 10,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 2 Door Framed", "code": "FR-B2D",
        "description": "Double door framed base cabinet.",
        "svg_type": "base_cabinet_2d_framed",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 1, "sort_order": 20,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base Blind Corner Framed", "code": "FR-B-BC",
        "description": "Blind corner framed base cabinet.",
        "svg_type": "base_cabinet_blind_corner_framed",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 30,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base Corner Framed", "code": "FR-B-C",
        "description": "Corner framed base cabinet.",
        "svg_type": "base_cabinet_corner_framed",
        "default_width": 900, "default_height": 870, "default_depth": 900,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 40,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base Open Framed", "code": "FR-B-O",
        "description": "Open framed base cabinet. No doors.",
        "svg_type": "base_cabinet_open_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 1, "sort_order": 50,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 1 Drawer 1 Door Framed", "code": "FR-B1DR1D",
        "description": "Framed base cabinet with 1 drawer and 1 door.",
        "svg_type": "base_cabinet_1dr1d_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 1, "default_shelves": 0, "sort_order": 60,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 1 Drawer 2 Door Framed", "code": "FR-B1DR2D",
        "description": "Framed base cabinet with 1 drawer and 2 doors.",
        "svg_type": "base_cabinet_1dr2d_framed",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 1, "default_shelves": 0, "sort_order": 70,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Base Cabinets",
        "name": "Base 2 Drawer 2 Door Framed", "code": "FR-B2DR2D",
        "description": "Framed base cabinet with 2 drawers and 2 doors.",
        "svg_type": "base_cabinet_2dr2d_framed",
        "default_width": 900, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 2, "default_shelves": 0, "sort_order": 80,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMED CABINETRY — UPPER CABINETS
# ─────────────────────────────────────────────────────────────
FRAMED_UPPER = [
    {
        "category": "Framed Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper 1 Door Framed", "code": "FR-U1D",
        "description": "Single door framed upper cabinet.",
        "svg_type": "upper_cabinet_1d_framed",
        "default_width": 600, "default_height": 762, "default_depth": 305,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 10,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper 2 Door Framed", "code": "FR-U2D",
        "description": "Double door framed upper cabinet.",
        "svg_type": "upper_cabinet_2d_framed",
        "default_width": 900, "default_height": 762, "default_depth": 305,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 1, "sort_order": 20,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Blind Corner Framed", "code": "FR-U-BC",
        "description": "Blind corner framed upper cabinet.",
        "svg_type": "upper_cabinet_blind_corner_framed",
        "default_width": 900, "default_height": 762, "default_depth": 305,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 30,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Corner Framed", "code": "FR-U-C",
        "description": "Corner framed upper cabinet.",
        "svg_type": "upper_cabinet_corner_framed",
        "default_width": 900, "default_height": 762, "default_depth": 305,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 1, "sort_order": 40,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Corner Filler Framed", "code": "FR-U-CF",
        "description": "Corner filler framed upper cabinet.",
        "svg_type": "upper_cabinet_corner_filler_framed",
        "default_width": 150, "default_height": 762, "default_depth": 305,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Upper Cabinets",
        "name": "Upper Open Framed", "code": "FR-U-O",
        "description": "Open framed upper cabinet. No doors.",
        "svg_type": "upper_cabinet_open_framed",
        "default_width": 600, "default_height": 762, "default_depth": 305,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 1, "sort_order": 60,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMED CABINETRY — TALL CABINETS
# ─────────────────────────────────────────────────────────────
FRAMED_TALL = [
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall 1 Door Framed", "code": "FR-T1D",
        "description": "Single door framed tall cabinet.",
        "svg_type": "tall_cabinet_1d_framed",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 3, "sort_order": 10,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall 2 Door Framed", "code": "FR-T2D",
        "description": "Double door framed tall cabinet.",
        "svg_type": "tall_cabinet_2d_framed",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 3, "sort_order": 20,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall 3 Door Framed", "code": "FR-T3D",
        "description": "Three door framed tall cabinet.",
        "svg_type": "tall_cabinet_3d_framed",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 3, "default_drawers": 0, "default_shelves": 3, "sort_order": 30,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Open Framed", "code": "FR-T-O",
        "description": "Open framed tall cabinet. No doors.",
        "svg_type": "tall_cabinet_open_framed",
        "default_width": 600, "default_height": 2134, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 3, "sort_order": 40,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Blind Corner 1 Door Framed", "code": "FR-T-BC1D",
        "description": "Blind corner framed tall cabinet with 1 door.",
        "svg_type": "tall_cabinet_blind_corner_1d_framed",
        "default_width": 900, "default_height": 2134, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 3, "sort_order": 50,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Blind Corner 2 Door Framed", "code": "FR-T-BC2D",
        "description": "Blind corner framed tall cabinet with 2 doors.",
        "svg_type": "tall_cabinet_blind_corner_2d_framed",
        "default_width": 900, "default_height": 2134, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 3, "sort_order": 60,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Tall Cabinets",
        "name": "Tall Corner Framed", "code": "FR-T-C",
        "description": "Corner framed tall cabinet.",
        "svg_type": "tall_cabinet_corner_framed",
        "default_width": 900, "default_height": 2134, "default_depth": 900,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 3, "sort_order": 70,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMED CABINETRY — SINK CABINETS
# ─────────────────────────────────────────────────────────────
FRAMED_SINK = [
    {
        "category": "Framed Cabinetry", "subcategory": "Sink Cabinets",
        "name": "1 Door Sink Framed", "code": "FR-SB1D",
        "description": "Single door framed sink base cabinet.",
        "svg_type": "sink_cabinet_1d_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 1, "default_drawers": 0, "default_shelves": 0, "sort_order": 10,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Sink Cabinets",
        "name": "2 Door Sink Framed", "code": "FR-SB2D",
        "description": "Double door framed sink base cabinet.",
        "svg_type": "sink_cabinet_2d_framed",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 2, "default_drawers": 0, "default_shelves": 0, "sort_order": 20,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Sink Cabinets",
        "name": "False Front Sink Framed", "code": "FR-SB-FF",
        "description": "Framed sink base with false front. No functional doors.",
        "svg_type": "sink_cabinet_false_front_framed",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 0, "default_shelves": 0, "sort_order": 30,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Sink Cabinets",
        "name": "1 Drawer Drain Notched Sink Framed", "code": "FR-SB1DR-DN",
        "description": "Framed sink base with 1 drain notched drawer.",
        "svg_type": "sink_cabinet_drain_notched_framed",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 1, "default_shelves": 0, "sort_order": 40,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Sink Cabinets",
        "name": "2 Drawer Drain Notched Sink Framed", "code": "FR-SB2DR-DN",
        "description": "Framed sink base with 2 drain notched drawers.",
        "svg_type": "sink_cabinet_drain_notched_framed",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 2, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Sink Cabinets",
        "name": "3 Drawer Drain Notched Sink Framed", "code": "FR-SB3DR-DN",
        "description": "Framed sink base with 3 drain notched drawers.",
        "svg_type": "sink_cabinet_drain_notched_framed",
        "default_width": 762, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 3, "default_shelves": 0, "sort_order": 60,
    },
]


# ─────────────────────────────────────────────────────────────
# FRAMED CABINETRY — DRAWER BANK CABINETS
# ─────────────────────────────────────────────────────────────
FRAMED_DRAWER_BANK = [
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "1 Drawer Framed", "code": "FR-1DR",
        "description": "Single drawer framed cabinet.",
        "svg_type": "drawer_bank_1dr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 1, "default_shelves": 0, "sort_order": 10,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "2 Drawer Framed", "code": "FR-2DR",
        "description": "2 drawer framed cabinet.",
        "svg_type": "drawer_bank_2dr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 2, "default_shelves": 0, "sort_order": 20,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "3 Drawer Framed", "code": "FR-3DR",
        "description": "3 drawer framed cabinet.",
        "svg_type": "drawer_bank_3dr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 3, "default_shelves": 0, "sort_order": 30,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "4 Drawer Framed", "code": "FR-4DR",
        "description": "4 drawer framed cabinet.",
        "svg_type": "drawer_bank_4dr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 4, "default_shelves": 0, "sort_order": 40,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "1 Inset Drawer Framed", "code": "FR-1IDR",
        "description": "Single inset drawer framed cabinet.",
        "svg_type": "drawer_bank_1idr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 1, "default_shelves": 0, "sort_order": 50,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "2 Inset Drawer Framed", "code": "FR-2IDR",
        "description": "2 inset drawer framed cabinet.",
        "svg_type": "drawer_bank_2idr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 2, "default_shelves": 0, "sort_order": 60,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "3 Inset Drawer Framed", "code": "FR-3IDR",
        "description": "3 inset drawer framed cabinet.",
        "svg_type": "drawer_bank_3idr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 3, "default_shelves": 0, "sort_order": 70,
    },
    {
        "category": "Framed Cabinetry", "subcategory": "Drawer Bank Cabinets",
        "name": "4 Inset Drawer Framed", "code": "FR-4IDR",
        "description": "4 inset drawer framed cabinet.",
        "svg_type": "drawer_bank_4idr_framed",
        "default_width": 600, "default_height": 870, "default_depth": 580,
        "default_doors": 0, "default_drawers": 4, "default_shelves": 0, "sort_order": 80,
    },
]


# ─────────────────────────────────────────────────────────────
# ALL PRODUCTS — combined list used by seed.py
# ─────────────────────────────────────────────────────────────
ALL_PRODUCTS = (
    COUNTERTOPS +
    FIXTURES +
    FRAMELESS_BASE +
    FRAMELESS_UPPER +
    FRAMELESS_TALL +
    FRAMELESS_SINK +
    FRAMELESS_DRAWER_BANK +
    FRAMED_BASE +
    FRAMED_UPPER +
    FRAMED_TALL +
    FRAMED_SINK +
    FRAMED_DRAWER_BANK
)