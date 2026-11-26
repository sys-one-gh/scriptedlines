# Arauco — library_melamine sources

Researched 2026-11-26. 89 current Prism TFL / TFL Basics designs -> 356 active rows (PB and MDF at 5/8" and 3/4"). 20 pre-existing placeholder rows are kept but set to `is_active=0`. The 4 existing `ARA-MEL-*-BLA` codes are reused for BLK100 Black.

## Sources
- Full design list: Prism TFL design search, https://na.arauco.com/en/search/prismtfl?q=%3Arelevance%3Aitemtype%3APrismTFLProduct&pageSize=20&page=0..4 (90 results).
- Per-design pages (`https://na.arauco.com/en/p/<slug>`, e.g. https://na.arauco.com/en/p/wf458-presten-ash-WF458): design #, name, "Substrate Options", "Specialty Substrates" and "Standard Texture" for every row (table below).
- Cross-check against the current 2026-28 collection brochure ("Quietude"): https://na.arauco.com/en/resources/download/Quietude-Collection_2026_Design-Debut_DigitalVersion. All WF designs on the site appear in it.
- Inactive notice, Jan 2024: SF253 Adobe, WF101 Autumn Glow, WF460 Benham Pine, WF100 Desert Glow and WF443 Luxent went inactive. None of them are in the CSV. https://na.arauco.com/en/resources/download/Prism_TFL_Inactive_Notice_Jan_2024
- Textures page (Madera, Suede, Taction, Boreal, Velvet descriptions and the mills that produce each): https://na.arauco.com/en/PrismTextures
- Prism brand page: "Prism TFL complies with TSCA Title VI/CARB-2" (-> `carb_p2=1`). FSC and ULEF are specified options, not defaults (-> `fsc=0`). https://na.arauco.com/en/c/BR_PRISM
- 3-part spec (exposed parts are "TFL two (2) sides"; 5/8" and 3/4" members on PB or MDF; -> `g_sides=G2S`): https://na.arauco.com/en/resources/download/prismtfl_3_part_specification
- Duraflake PB: "available in thickness ranges from 3/8” to 1 3/4”": https://na.arauco.com/en/c/BR_DURPB

## Substrate/thickness rule (availability per decor isn't published)
Every design page lists the same substrate options: "Duraflake Particleboard, Ultra Particleboard, Trupan MDF". So each design is listed on PB and MDF. Arauco publishes no per-design or collection-standard thickness. The 5/8" and 3/4" rows are an assumption: both are within Duraflake's published 3/8"–1 3/4" range, and the 3-part spec specifies 5/8" and 3/4" members. Arauco does not say these are stocked for every design, and all brochures say "contact your local distributor or sales representative for availability". Duraflake vs Ultra PB, and the specialty substrates (FR, MR, VESTA NAF/ULEF, listed per design in the table), are not split out. **Schema gap**: `core_substrate` is just PB/MDF, with no grade (FR/MR/NAF) dimension.

## Field decisions
- `code` = `ARA-MEL-{PB|MDF}-{16|19}-{design #}`; BLK100 reuses `ARA-MEL-*-BLA`.
- `texture` = the page's "Standard Texture". Optional textures aren't shown on the pages, and the brochure says other textures may be available.
- `is_premium_texture` = 0. Arauco does not designate any texture as premium. Taction is a synchronized (EIR) finish but is not called premium.
- `sheen`: Velvet "super-smooth, matte finish" -> Matte; Taction "dual low gloss" -> Low Gloss; others empty.
- Size flags all 0. Sizes aren't published per design; only the "How to Specify" example shows 1" x 49" x 97".
- `grain` left empty (default).
- Omitted: SF201 PG Backer. It is a backer sheet with texture "N/A", not a decor.
- WF451 Narvik Ash lists no specialty substrates; the standard substrates are the same as the others.

## Pre-existing rows
The 24 `ARA-MEL-*` rows are placeholders identical to the other manufacturers' rows (finish codes `ARA16WH`… are not Arauco design numbers; there is no Arauco Almond, Dove Grey, Grey Oak Woodgrain or Natural Maple Woodgrain). "Black" maps to BLK100 Black, so those 4 codes are reused with the real data. "White" is ambiguous between W100 White (Suede) and W300 White (Velvet), so `ARA-*-WHI` is deactivated rather than guessed. The other 20 rows are kept unchanged with `is_active=0`.

## Per-design data captured from na.arauco.com
| Design # | Name | Standard texture | Substrate options | Specialty substrates | Line |
|---|---|---|---|---|---|
| AF200 | Pewter Frost | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| AF209 | Shadow Frost | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| AF210 | Silver Frost | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| AF232 | Natural Linen | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| AF238 | Chantilly Flax | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| AF239 | Total Eclipse | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| BLK100 | Black | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF100 | Victorian White | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF201 | PG Backer (expect color variation) | N/A | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF204 | Opal | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF208 | Folkstone | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF210 | Antique White | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF213 | Fog Grey | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| SF230 | Sienna | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| SF232 | Ashen | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| SF233 | Fossil | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| SF237 | Charcoal | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| SF239 | Storm | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| SF247 | Mysterious | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| SF250 | Duke | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF251 | Celadon | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF252 | Quarry | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF255 | Willow | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF256 | Mist | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF257 | Verde | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF258 | Roja | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| SF264 | Nocturne | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| W100 | White | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | TFL Basics |
| W300 | White | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| W919 | Cotton White | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| W920 | Vogue White | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF121 | Burma Cherry | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF202 | Verismo | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF203 | Seria | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF208 | Libretti | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF220 | Brazilian Walnut | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| WF226 | Zambukka | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF228 | Sable Glow | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| WF229 | Merit Maple | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| WF236 | Ankara Cherry | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF263 | Walnut Amati | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF270 | Cabinet Maple | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| WF275 | Hardrock Maple | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | TFL Basics |
| WF301 | Noce Vettore | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF310 | Talas Cherry | Suede | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF340 | Aria | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF341 | Soprano | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF344 | Queenston Oak | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF356 | Driftwood | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF357 | Sandalwood | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF368 | Linear Ash | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF375 | Diva | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF377 | Pewter Pine | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF392 | Licorice Groovz | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF393 | Concrete Groovz | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF394 | Arctic Groovz | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF397 | Stromboli | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF432 | Alabaster | Taction | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF433 | Argento | Taction | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF434 | Gibraltar | Taction | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF435 | Palomino | Taction | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF440 | Ginger | Taction | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF442 | Chique | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF444 | Tumalo Pine | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF445 | Sahalie Pine | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF447 | Toasted Oak | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF448 | Seared Oak | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF449 | Sarek Ash | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF450 | Bergen Ash | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF451 | Narvik Ash | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF |  | Prism TFL |
| WF452 | Karuna Ash | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA NAF/ULEF | Prism TFL |
| WF456 | Enigma | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF457 | Castanho | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF458 | Presten Ash | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF459 | Abiqua Pine | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF461 | Koosah Pine | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF462 | Wallowa Pine | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF464 | Urban | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF466 | Rogue Valley Pear | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF467 | Pelee Island Pear | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF468 | Metro | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF474 | Endless Elm | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF475 | Casual Chestnut | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF476 | Wright Walnut | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF478 | Bracken | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF479 | Emberline | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF480 | Summit | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF481 | Moorland | Boreal | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF482 | Alderon | Madera | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
| WF483 | Kindred | Velvet | Duraflake Particleboard, Ultra Particleboard, Trupan MDF | Fire Rated, Moisture Resistant, VESTA ULEF | Prism TFL |
