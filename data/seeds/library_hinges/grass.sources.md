# Grass — library_hinges sources

All rows: `manufacturer=Grass`, cup bore 35 mm, finish Nickel-plated, `cabinet_type` "Frameless / Face Frame" (both catalogs say "For face frame or frameless cabinets"), no cost or lead time.

## Primary sources
1. **Grass America "Tiomos Hinge System" catalog, item 02006-TC-GA-02/26 (Feb 2026)**: https://www.grassusa.com/downloads/grass_catalog_tiomos.pdf
   - p9: "One hinge type for all door thicknesses up to 24mm"; "Cup Depth 12.6mm (1/2")"; Impresso is tool-free; dowelled hinges come in 42 and 45 mm patterns, screw-on in 45 mm.
   - p16 Tiomos 110: item numbers and the cup/arm material for each crank (cup steel; arm steel for 00, zinc for 9.5 and 19).
   - p20 Tiomos 120: item numbers, same materials.
   - p22 Tiomos 155: "10mm cup depth", "door thicknesses up to 32mm", zero protrusion, item numbers.
   - p26–27 Tiomos 95: "door thicknesses up to 36mm (except inset)", and the p27 note for inset "For door thickness up to 28mm".
   - p18, p21, p24, p27 drawings: "min 12.6" bore depth.
2. **Grass America "Nexis Hinge Systems" catalog, item 01988-01-NXC-5C-IT-06/24 (Jun 2024)**: https://www.grassusa.com/downloads/grass_catalog_nexis.pdf
   - p7 features (42/45/48 mm patterns, Impresso).
   - p14 Nexis 110: "Nexis Impresso 11.5mm" and "Nexis 11mm" cup depth, plus the item numbers. Impresso cup is die-cast; Nexis cup is steel; arm is steel.
   - p18 Nexis 170: "Shallow cup depth (11mm) for Nexis and Nexis Impresso"; cup and arm die-cast; zero protrusion; item numbers.

## Conventions and judgement calls
- **Overlay mapping**: cranking 00 is Full Overlay, 9.5 (Tiomos) or 08 (Nexis) is Half Overlay, 19 is Inset. These are Grass's own labels.
- **Fixing type**: Impresso is written as `Impresso`, the Grass tool-free press-fit. Dowelled is `Press-in`. Screw-On is `Screw-on`.
- The boring pattern (42, 45, 48 or 42/45 / 45/48 for Impresso) goes in `application`. The table has no column for it.
- `mechanism`: Tiomos soft-close is "Spring + integrated soft-close (in hinge arm)"; Grass p5 says the soft-close is concealed in the hinge arm. Nexis is self-close only, with soft-close sold as an add-on.
- Reading the order tables: each row is "pattern | type | Impresso item | ... | pattern | type | Screw-On item | Dowelled item". A "-" marks a missing cell. Rows were included only where the column was unambiguous.

## Deliberately left out or unverified
- **Tiomos "Overlay (Cranking 03)" rows**: this is an intermediate crank between full and half overlay with no matching `overlay_type`. They are omitted until a vocabulary value is chosen. The Tiomos 110/120/155/95 tables list them, e.g. F028138520228.
- **Nexis 125 and Nexis 95**: the catalog does not state a cup depth, and `milling_depth_mm` is required.
- **Nexis 110 half overlay "148.322.53.0815"** and **Nexis 125 "148.329.31.0015"**: these are non-Grass-format numbers in the screw-on column, so they were not trusted.
- Tiomos Tipmatic Plus, angled hinges (110/30A, 45A, 45E, 120/-15A, -45A), blind corner 110/90, PCC, M9, M0 and flap hinges, plus Nexis 95/40, angle/post/PCC and Slide-on institutional hinges. These are special applications outside the requested scope.
- `door_thickness_min_mm` is blank. Grass states only maximums; Nexis 110 and 170 state no thickness, so their max is blank too.
