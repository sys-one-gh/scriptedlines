# Egger — library_melamine sources

Manufacturer: EGGER Wood Products, LLC (Linwood / Lexington, NC). Written as `Egger`.
Code pattern: `EGG-MEL-<PB|MDF>-<nominal mm>-<decor#><texture>` e.g. `EGG-MEL-PB-19-W1100ST9`.
The decor number + texture is used in place of the 3-letter colour abbreviation in the
existing rows because Egger sells the same decor in several textures (W1100 ST9 / ST19,
U999 ST7 / ST19) and 3-letter name abbreviations collide.

## Sources

1. **EGGER Availability Guide, Decorative Collection 24+, Version 10/2023 (US letter,
   `Availability Guide_LEX_EN_US_letter_10/2023_DSR`)** — Egger-authored PDF, hosted by
   distributor Hardwoods Specialty Products:
   https://res.cloudinary.com/hdi/image/upload/v1704828957/Suppliers/Egger/Documents/EGGER_Availability_Guide_2024_HW_US.pdf
   - Supports **every row**: decor number, texture code, decor name, and the dot matrix
     of thickness x format for "Eurodekor TFL Particleboard PB TSCA 187" and
     "Eurodekor TFL Single Sided Door Core MDF E1 TSCA MB".
   - Matrix was extracted from the PDF text layer by glyph x-position and then checked
     visually against rendered pages 2–5.
2. **Egger product page, "EGGER Decorative TFL Particleboards TSCA 187"**
   https://www.egger.com/en/furniture-interior-design/range/products/pbtfl187?country=US
   - Confirms product is current, decorative paper fused to **both sides** (→ `G2S`),
     and that Feelwood decors are multilayer (+0.6 mm total thickness).
3. **Egger textures page** https://www.egger.com/en/furniture-interior-design/decorative-collection/textures/?country=US
   - Texture names: ST7 Smoothtouch Fine Pearl, ST9 Smoothtouch Matt, ST10 Deepskin Rough,
     ST12 Omnipore Matt, ST19 Deepskin Excellent, ST22 Deepskin Linear, ST37 Feelwood Rift,
     ST40 Feelwood Oakgrain.
4. **Egger "Products, Decors and Services" NA brochure (EN/NAM_2020_10)** — distributor-hosted
   Egger PDF: https://res.cloudinary.com/hdi/image/upload/v1690995488/DesignOneSource/Documents/Brochures/EGGER/Products_Decors_and_Services_Brochure.pdf
   - Feelwood = embossed-in-register textures (basis for `is_premium_texture`), TFL on
     Eurospan particleboard. Background only; no rows taken from it.

## Field mapping / assumptions

- **Rows** = one per decor x substrate x thickness where the 10/2023 guide shows any dot
  (filled or hollow) in that thickness. Decors with no TFL dots (PM / TM9 lacquered
  boards, colored-core laminates, edge-band-only H89xx/Q-codes) are excluded.
- **Thicknesses**: imperial nominal converted exactly (1/4"=6.35, 1/2"=12.7,
  5/8"=15.875, 3/4"=19.05, 1"=25.4, 1-1/8"=28.575). Egger prints 16.0 / 19.0 mm
  next to 5/8" / 3/4"; exact imperial was used to match the rest of the table.
  Feelwood (ST37/ST40) boards are +0.6 mm actual — not reflected (no column).
- **Substrate**: `PB` = Eurodekor TFL PB TSCA 187 (G2S). `MDF` = single-sided door core
  MDF E1 TSCA MB, 3/4" only, `G1S`.
- **Sizes**: 49"x97" → `size_4x8`; 61"x97" → `size_5x8`. 61"x109" (5x9) and
  81.5"x110.24" have **no column** — rows available only in those formats (e.g. all
  1-1/8" rows, Feelwood ST37/ST40 decors) have every size flag 0.
- **is_mto** = 1 when every format offered at that thickness is a hollow dot
  ("Delivery time: please contact your EGGER dealer"), i.e. not stocked by Egger.
  This is an interpretation of the guide's stock/non-stock legend, not an Egger "MTO" label.
- **is_premium_texture** = 1 for Feelwood EIR textures (ST37, ST40) only.
- **grain, sheen**: not published per decor → left empty (loader stores the column
  default `Long` for grain).
- **carb_p2 / fsc / leed / fr_rated**: left 0. Product is labelled "TSCA" (EPA TSCA
  Title VI) but no explicit CARB Phase 2 statement was found on the pages read;
  Egger notes FSC is "depending on availability". Reviewer may wish to set carb_p2.
- `GFE ST9 Painting Grade` is included (it is a TFL board in the matrix).

## Uncertain / left out

- Guide is dated **10/2023 ("Decorative Collection 24+")**. Egger's site now references a
  2026+ collection; the live availability tool (edc-availability.egger.services) is a
  JS app and was not read. Some decors may have been added/dropped since — re-check
  against the current guide before committing.
- egger.com product page says 49 decors are currently available for PB TSCA 187; the
  10/2023 guide shows ~71 decor/texture combos with TFL dots — consistent with the
  guide being older and/or counting differently. Not reconciled.
