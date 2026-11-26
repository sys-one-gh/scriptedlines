# Wilsonart — library_melamine sources

Researched 2026-11-26. **Partial coverage: 17 verified designs -> 51 active rows.** The 24 pre-existing placeholder rows are kept but set to `is_active=0`.

## Why coverage is partial
Wilsonart's TFL design library (https://www.wilsonart.com/laminate/thermally-fused-laminate/design-library) and every design detail page (`/laminate/thermally-fused-laminate/...`, `/laminate/coordinated-surfaces/tfl-panels/...`) sit behind a "Human verification" slider challenge. Per-design finish, availability (In Stock vs Made to Order) and substrate data live only on those pages. I did not try to get around the challenge. Wilsonart says the program has 250+ curated designs, so the remaining designs need a manual export from the site, or Wilsonart's TFL stocking list from a rep or distributor.

Only designs where an accessible Wilsonart page shows the TFL design number **with** its finish suffix are included:
- https://www.wilsonart.com/tfl-panels: Belair 8234K-05, Walnut Heights 7965K-12, Grey Elm 8201K-12, High Line 7970K-28, Tahoe Oak 8249K-05
- https://www.wilsonart.com/coordinatedsurfaces ("Wilsonart® TFL …"): Belair 8234K-05, Walnut Heights 7965K-12, Pasadena Oak 7986-38
- https://www.wilsonart.com/interiors (Wilsonart Interiors TFL): 5048-60 Bianco Tessere, 5049-60 Panna Tessere, 5051-60 Sabbia Tessere, 5052-60 Grigio Tessere, 5053-60 Frosted Tabby, 5054-60 Wheat Tabby, 5055-60 Heathered Tabby, 4942-38 Crisp Linen, 4943-38 Classic Linen, 4944-38 Casual Linen, 4990-38 Flax Linen

Not included, for lack of a finish suffix: the LUJO Collection listing (https://www.wilsonart.com/lujo-collection-3) shows 45 TFL design names and numbers, but finishes only appear on the gated detail pages. Those designs are 8246 Abisko Oak, 8233 Akira, 8266 Anderson Cherry, 8228 Avondale Ash, 8248 Black Hills Oak, 8261 Brookfield Elm, 8288 Cambridge Ash, 8287 Carolina Ash, 8257 Carson Walnut, 8259 Claremont Oak, 8247 Clearwater Oak, 8244 Coronado Oak, 8243 Crystal River Oak, 8235 Daintree, 8245 De Soto Oak, 8226 Dering Forest, 8238 Fairchild, 8251 Fremont Oak, 8229 Friston Ash, 8265 Granville Cherry, 8258 Harding Oak, 8262 Harrison Elm, 8252 Helena Walnut, 8255 Hidden Springs Walnut, 8291 Highlands, 8263 Kinglake, 8267 Mangrove, 8236 Monteverdi, 7991 NeoWalnut, 8268 Newlands, 8256 Ocala Walnut, 8214 Phantom Charcoal, 8212 Phantom Ecru, 8210 Portico Teak, 8254 Sabine Walnut, 8264 Sherbrooke, 8253 Sierra Walnut, 8289 Sunda, 8231 Valley Forge Elm, 8209 Veranda Teak, 7976 White Cypress and 8227 White River Forest, plus the already-included 8234, 7970 and 8249. Wilsonart solids (e.g. D354 Designer White) are TFL designs according to third-party sources, but they could not be verified on wilsonart.com.

## Substrate/thickness rule (availability per decor isn't published / not accessible)
Wilsonart TFL Guide Specification, Section 06 4219: https://www.wilsonart.com/media/Technical_Resources/en/specification_guide_-_06_4219_thermally_fused_laminate_panels.pdf
- Particleboard: Type 858 5/8", Type 875 3/4", Type 870 1", Type 878 1-1/8".
- MDF: Type 841 1/2", Type 845 3/4". There is **no 5/8" MDF**.
- MR MDF: Types 880/885/886 FR, all 3/4".

Each design is therefore listed on PB 5/8", PB 3/4" and MDF 3/4", the standard 5/8"/3/4" types for the collection. Whether each design is stocked or Made To Order on each substrate is shown only on the gated pages, so `is_mto` is left 0. Treat these rows as orderable, not stocked.

## Field decisions
- `code` = `WA-MEL-{PB|MDF}-{16|19}-{design#-finish}`. `finish_code` = the full Wilsonart number including the finish suffix (e.g. `8234K-05`).
- `texture` and `sheen` come from Wilsonart's finish definitions on the LUJO listing filter (https://www.wilsonart.com/lujo-collection-3):
  - 05 Timbergrain, gloss reading 4.5
  - 12 SoftGrain, gloss 8
  - 28 Gloss Line, gloss 5
  - 38 Fine Velvet Texture, gloss 14
  - 60 Matte, gloss 10

  `sheen` holds the published gloss reading.
- `is_premium_texture` = 0. Wilsonart doesn't call any TFL finish "premium". The "K" designs carry AEON Performance Technology, which the schema has no column for.
- `g_sides` = G2S: the spec guide says "Melamine saturated decorative layers thermally fused to both core face surfaces".
- `carb_p2` = 1, from TFL Technical Data (rev. 2025): "CPA Certifications for sustainability and CARB formaldehyde emission limitations" (https://www.wilsonart.com/media/Technical_Resources/en/tfltechdata.pdf). `fsc` = 0, because FSC is "available upon request".
- Size flags all 0. Technical Data gives nominal 49"/61" widths × 97" length, and the Interiors page says "4- and 5-foot widths and 6-, 8-, 9-, 10-, and 12-foot lengths". Neither says which sizes apply to each design.

## Pre-existing rows
The 24 `WA-MEL-*` rows (finish codes `WA16WH`…) are placeholders identical to the other manufacturers' rows. They are not Wilsonart design numbers, and none could be matched to a verified Wilsonart TFL design. They are kept unchanged with `is_active=0`.
