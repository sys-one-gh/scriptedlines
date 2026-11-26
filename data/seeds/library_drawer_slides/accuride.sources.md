# Accuride — library_drawer_slides sources

## Sources

1. **Accuride Europe 3832 data sheet** (Telescopic Slides catalogue p.82–83, 08/22)
   https://hs-europe.accuride.com/hubfs/Datasheets/3832_en.pdf
   - The 12 existing DZ3832-00xx rows. Fields: SL (slide length → `runner_length_mm`), load per pair in kg (45–50 kg, varies by length), 12.7 mm thickness, 45.7 mm height, and the DZ prefix meaning bright zinc plate.
2. **Accuride Europe 3832EC-D data sheet** (01/24)
   https://hs-europe.accuride.com/hubfs/Datasheets/DZ3832-EC-D_en.pdf
   - DZ3832-0035EC-D … -0070EC-D (8 rows): SL, load in kg (43–45), 12.7 × 45.7 mm, soft close.
3. **Accuride 3832E / 3834E Quick Reference** (3700-9464, © 2016)
   https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf
   - 3832-E6 … 3832-E28 (12 rows): part number, slide length mm, 100 lb, 1.80" height, 1/2" side space, cold-rolled steel, bright electro-zinc.
4. **Accuride 3832EC Quick Reference** (accuride.com)
   https://www.accuride.com/media/amasty/amfile/attach/lsENsMwHMdlHk0OlD2EpkPTjq1u8ZoYw.pdf
   - 3832-C12EC … 3832-C28EC (9 rows): part number, slide length, 100 lb, 1.80" height, 1/2" side space, Easy-Close.
5. **Accuride 7432/7434 Quick Reference** (accuride.com)
   https://www.accuride.com/media/amasty/amfile/attach/52390e588ee07e2932aa19b8d3fec78a.pdf
   - 7434-12 … 7434-28 (9 rows): part number, slide length, 100 lb, 1.71" height (excluding rail), 1/2" side space.
6. **Accuride 9301E technical sheet**
   https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf
   **9307E/9308E technical sheet**
   https://www.accuride.com/media/amasty/amfile/attach/63beb4dc6b2872c888fc3f51a8bcb234.pdf
   **9300 family sell sheet** (© 2023)
   https://www.accuride.com/media/amasty/amfile/attach/ToFFgUGNIoehDJVXG5UcbucmIvzQgto3.pdf
   - 9301-E12 … E36 and 9308-E12 … E36 (13 rows each): part number, slide length equal to travel, 3.00" height, .75" side space.
7. **Accuride Cabinet Drawer Slides Catalog 2018**
   https://www.accuride.com/media/pdf/accuride-drawer-slide-wood-catalog-2018.pdf
   - Cross-check of the model lineup and ratings.

## Decisions and caveats

- **Changes to the existing DZ rows:**
  - `length_mm` is now the nominal length (150, 200 … mm, which matches `length_label` and the part number). Before, it held the slide length SL.
  - SL moved to `runner_length_mm`, in line with the model's drawer-length vs runner-length split. Only 0015 (148) and 0020 (199) differ.
  - Load is now the exact kg × 2.20462 conversion to 3 decimals (e.g. 45 kg = 99.208 lb), where the rows previously held rounded integers.
- **NA lengths:** `length_mm` is the nominal inch length converted exactly (12" = 304.8). `runner_length_mm` is Accuride's own published mm slide length (e.g. [300]); I did not re-convert their rounded inch figures. 3832E heights use the exact conversion 1.80" = 45.72 mm, and 7434 uses 1.71" = 43.434 mm.
- **`code` = the "Part Number" column of Accuride's tables** (e.g. 3832-E18, 3832-C18EC, 7434-18, 9301-E18). Finish (C / CB / EW) and packaging (D or P pack) are ordering suffixes, so one row covers all finishes. Finish is recorded as Zinc-plated (clear).
- **9301E / 9308E load = 600 lb** ("Moderate Use", 22" slide in a 24" wide drawer, 10k cycles). This is the one rating both sheets publish. The 9301E sheet also gives 480 lb (frequent, 75k cycles) and 180 lb (flat mount), and the 9308E sheet gives 360 lb (mobile). The sell sheet says these ratings apply to 12"–36", so **10" and 40"–60" were left out**. 9308E is handed (L/R ordering suffix), and a pair is usually one 9308E plus one 9301E.
- **The 7434 is a medium-duty (100 lb) slide with 1" over-travel, not a heavy-duty one.** I stored it as "Full Extension" because the column has no over-travel value (schema gap).
- **9301 / 9308 without an E suffix** do not exist as current parts. The Enhanced "E" versions replaced them.
- **Travel quirks:** 3832-C14EC travel is 12.19", 3832-E6 travel is 5.42" and DZ3832-0035EC-D travel is 310 mm, all shorter than nominal even though the extension is published as full. All three are stored as Full Extension as published.
- Not included: other 3832 variants (ESC, EHDSC, ETR, EDO, CH3832) and 7432. They were not requested.
