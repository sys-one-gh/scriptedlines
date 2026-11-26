# Blum — library_drawer_slides sources

All rows are Blum Inc. (North America) inch-length runners. Values are taken straight from Blum's own dimension tables (mm).

## Sources

1. **TANDEM plus BLUMOTION brochure, © 2025 Blum, Inc.** (dated 08-11-2025 on the downloads page)
   https://www.blum.com/file/tdmbmn_ep_dok_bus?country=us&language=en
   Linked from https://www.blum.com/us/en/products/runnersystems/tandem/downloads-videos/
   - 563H (5 rows), 563F (5), 563. (2), 554H (5): article numbers, drawer length, "for overall cabinet depth" (→ `cabinet_depth_mm`), inside cabinet depth max/min, runner length, max drawer thickness (16 mm for H/./554H, 19 mm for 563F), static load 100 lb, "Zinc-coated steel".
   - 554H is "TANDEM edge BLUMOTION", 7/8 extension, so `extension_type` = Partial Extension. Its max/min inside depth is the value "with 295.3750.03 bracket".
   - 563. publishes a minimum inside depth only, so max is empty.
2. **TANDEM plus BLUMOTION 563H/563. installation instructions** (INST-TDM563H-563. 05.16)
   https://d2.blum.com/services/BEC003/tdm563h_ma_dok_bus_$sen-us_$aof_$v4.pdf
   - Cross-check of the 563H figures. They match the 2025 brochure and the 5 existing rows.
3. **MOVENTO brochure, © 2026 Blum, Inc.** (dated 11-19-2026 on the downloads page)
   https://www.blum.com/file/movento_ep_dok_bus?country=us&language=en
   Linked from https://www.blum.com/us/en/products/runnersystems/movento/downloads-videos/
   - 763H (4 rows), 763. (4), 769. (5): article numbers, drawer length, overall cabinet depth, inside depth (max/min for 763H, min only for 763./769.), runner length, 16 mm max drawer thickness, static load (125 lb for 763, 170 lb for 769.), "Zinc-coated steel", BLUMOTION soft close.
   - Cross-checked against the 2019 MOVENTO brochure (https://woodworkinstitute.com/wp-content/uploads/2024/07/Blum-Movento-Brochure.pdf). The values are identical.
4. **TANDEM plus BLUMOTION 569H/569. heavy duty spec pages, © 2013 Blum, Inc.**
   https://www.onepointesolutions.com/wp-content/uploads/2021/03/blumtandemblumotion569h569dotgeneral.pdf
   Plus the installation instructions INST-TDM569H-569. 05.16
   https://www.woodworkerexpress.com/skin/common_files/files/specs/blum/Tandem_plus_blumotion_569H_installation_instructions.pdf
   - 569H (2 rows) and 569. (3 rows): article numbers, drawer length, overall cabinet depth, minimum inside depth, runner length, 150 lb static, 16 mm max thickness.

## Decisions and caveats

- **569H / 569. are `is_active = 0`.** They are missing from the 2025 TANDEM brochure, from the Blum US TANDEM downloads page and from the product page, which now says "up to 100 lbs". I treat them as discontinued and kept them only because they were asked for by name. The only primary sources are Blum PDFs from 2013 and 2016 that are re-hosted by dealers.
- **MOVENTO 760H was not added.** 760H is Blum's international metric series (NL 250–600 mm), sold outside North America. The current Blum Inc. MOVENTO brochure lists 763H, 763., 769. and 769R instead, and 763H is the North American BLUMOTION standard-duty equivalent. If metric 760H is wanted, it would come from publications.blum.com (international catalogue), which I did not load.
- **769R was skipped.** It is a 21"-only specialty bottom-mount or sink runner, and some of its SKUs are tied to SERVO-DRIVE sets.
- **TANDEMBOX / LEGRABOX were skipped.** They are complete box systems: the runner is ordered with metal sides, and capacity, side profile and NL are properties of the box set. `max_drawer_side_thickness_mm` and drawer-length semantics don't fit them.
- **Finish changed on the 5 existing 563H rows.** It is now "Zinc-coated" instead of "Zinc-plated", which is Blum's own wording.
- **Load is the static rating Blum publishes.** The TANDEM dynamic ratings (90 lb for 563, 75 lb for 554H) have no column.
