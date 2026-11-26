# Tafisa — library_melamine sources

Manufacturer: Tafisa Canada Inc. (Lac-Mégantic, QC). Written as `Tafisa`.
Code pattern: `TAF-MEL-PB-<16|19>-<decor#><texture letter>` e.g. `TAF-MEL-PB-19-L586K`.
Texture letter is required because the same colour number ships in several textures
(e.g. L203 Black in Materia, Karisma, Crystalite; M203 in ICONIQ, VIVA, BRAVA).

## Sources (all tafisa.ca)

1. **Prélude series brochure 09/2025** — https://tafisa.ca/sites/default/files/2025-11/brochure_prelude_2025-en.pdf
   - All Prelude decors: Materia (M), Karisma (K), Alto (A), Urbania (R), Smoothwood (S),
     Crystalite (C) — decor numbers, names. Dimensions & thicknesses table.
2. **Sommet / ICONIQ brochure 03/2026** — https://tafisa.ca/sites/default/files/2026-07/brochure_sommet_iconiq_2026_web.pdf
   - ICONIQ (Q), VIVA (Y), BRAVA (B) decors; TFL dimension table.
3. **Karisma one-pager 06/2026** — https://tafisa.ca/sites/default/files/2026-07/one_pager-karisma_juin-2026_en.pdf
   - Confirms the same 18 Karisma decors are current.
4. **Materia brochure 06/2026** — https://tafisa.ca/sites/default/files/2026-07/brochure_materia_2026-en.pdf
   - Confirms the 15 Materia decors; solid-colour availability by texture.
5. **TFL & HPL one-pager 07/2026** — https://tafisa.ca/sites/default/files/2026-07/one_pager-hpl_tfl_en.pdf
   - Per-series standard sizes/thicknesses, TAFIPAN® (CARB 2) substrate, texture codes,
     "All Sommet Series colours ... available for FSC Mix Credit".
6. **Cancelled colours 2016–2026** — https://tafisa.ca/sites/default/files/2025-09/annulations_2016-2026.pdf
   - Used to exclude cancelled decors.
7. **Sommet page** https://www.tafisa.ca/en/Sommet and **Decorative panels (TFL)** page
   https://www.tafisa.ca/en/decorative-panels-tfl — Sommet = 2-sided EIR texture;
   TFL has top and bottom decorative layers (→ `G2S`).

## Field mapping / assumptions

- **Substrate/thickness**: only **PB 5/8" (15.875) and 3/4" (19.05)** — the thicknesses
  Tafisa lists as standard for 4'x8' for every series ("5/8” and/or 3/4”"). Tafisa
  publishes thickness *ranges* (3/8"–1-1/2" on 5'x9', 1/2"–1" ULEF Tafipan-Evolo, MDF
  1/4"–1") but no per-decor list, so those were **not** expanded into rows.
  "and/or" means a given decor might stock only one of 5/8 / 3/4 at a given distributor;
  Tafisa does not publish which.
- **Sizes**: 49"x97" → `size_4x8` = 1. 61"x109" (5'x9') is also standard for every
  series but has **no column**.
- **texture** = Tafisa texture name (Karisma, Materia, Alto, Urbania, Smoothwood,
  Crystalite, ICONIQ, VIVA, BRAVA). `finish_code` = Tafisa TFL code with texture letter,
  e.g. `L586 (K)`.
- **is_premium_texture** = 1 for Sommet series (ICONIQ, VIVA, BRAVA — embossed-in-register).
- **carb_p2** = 1: substrate listed as TAFIPAN® (CARB 2).
- **fsc** = 1 for Sommet only ("All Sommet Series colours ... available for FSC Mix
  Credit"); Prelude 0 ("several Prélude colours" — not itemised).
- **grain, sheen**: not published → empty (grain stored as default `Long`).
- Name spelling: L585 is "Rhapsody" in the 09/2025 brochure, "Rhapsodie" in the 06/2026
  Karisma sheet; "Rhapsody" used. Ligature-damaged names repaired (Natural Affinity,
  Cream Puff); ™/® marks dropped (Candlelight, Summer Flame, Chocolate Pear Tree).

## Left out

- **L768 Sundown** — still in the Materia 2026 solid-colour table under Crystalite, but
  listed in the cancelled-colours sheet and absent from the Prelude brochure. Excluded.
- **Isola** texture — described on tafisa.ca but no Isola decor list in any current
  brochure. Not included.
- **LUMMIA** (PM / HG) — UV-lacquered panels, not TFL melamine. Not included.
- MDF-core TFL (1/4"–1") and ULEF Tafipan-Evolo variants — published only as ranges.
