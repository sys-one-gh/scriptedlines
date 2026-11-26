# Uniboard — library_melamine sources

Researched 2026-11-26. 130 current decors -> 486 active rows (MDF 5/8" 118, MDF 3/4" 130, PB 5/8" 119, PB 3/4" 119); 24 pre-existing placeholder rows are kept but set to `is_active=0`.

## Sources
- TFL decor list and per-decor pages (name, decor #, thickness range, widths, regular and optional finishes): https://www.uniboard.com/en/tfl-panels, plus `https://www.uniboard.com/en/panels/tfl-panels/<slug>` for each decor (130 pages fetched, table below). Collection membership comes from the same site's collection filter.
- Finish descriptions and the Standard vs Signature finish tiers: https://www.uniboard.com/en/tfl-and-hpl ("See our finishes" tab). Bistro, Dolomite and Vellum are tagged Standard; all other finishes are tagged Signature.
- Delisted colours (version May 1, 2026): http://uniboard.com/images/centre-de-documentation/ENG/Panels/Brochures/Couleurs_discontinuees/General_delist_2026_May_EN.pdf
- TFL sell sheet: "melamine saturated paper to either particleboard or MDF core". It also states EPA TSCA Title VI / CARB 2 compliance (-> `carb_p2=1`) and "FSC certified panels are available upon request" (-> `fsc=0`): http://uniboard.com/images/centre-de-documentation/FR/Panneaux/Fiches-techniques/TFL/20190726_UNI19_018-Uniboard_TFL_SellSheet.pdf
- "The complete Thermally Fused Laminate Collection is available for all types of Uniboard panels, such as raw particleboard, MDF and the NU Green product line." (older brochure still hosted by Uniboard): https://www.uniboard.com/images/centre-de-documentation/ENG/Panels/Brochures/TFL_Brochure/5319_Uniboard_PanneauxLamines_Eng.pdf
- Ambrette L17 texture (its page lists no finish): Origins 2026-27 trendbook, which puts it under "The Original Supermat": http://uniboard.com/images/centre-de-documentation/FR/Panneaux/Brochures/Trendbook/20251028_UNI25_006_Origins_TrendBook.pdf
- Standard collection flipchart (cross-check): http://uniboard.com/images/centre-de-documentation/FR/Panneaux/Brochures/Flipchart/Uniboard-Standard-Collection.pdf

## Substrate/thickness rule (availability per decor isn't published)
Uniboard does not publish stock substrate/thickness availability per decor. Decor pages give only a pressing range ("1/4'' to 1 5/8''") or nothing at all. So:
- Decors with "1/4'' to 1 5/8''" or no thickness stated: listed on PB and MDF at 5/8" (15.875 mm) and 3/4" (19.05 mm). This follows the collection-level statements that the whole TFL collection is made on particleboard and MDF. 5/8" and 3/4" fall inside the published range, but Uniboard does not say they are stocked for every decor. Treat these rows as "orderable", not "stocked".
- Synchronized Brushed Elm / Riviera Oak decors (H50, H52, H53, H54, H70, K13–K18): the page says "1/4'', 3/4'' MDF", so only MDF 3/4" is listed.
- H55 Mystic: page says "1/4'', 3/4'' MDF - 1/2'', 5/8'' 11/16'', 3/4'', 1'' PB M2", so MDF 3/4", PB 5/8" and PB 3/4" are listed. The 1/2", 11/16" and 1" PB options are omitted to stay within the 5/8"/3/4" scope.
- Decors with no stated thickness: the 2018 collection (H68, H69, K30–K34, K36, K37), 2021-22 Redefined (K66–K81), 2023-25 Moments (K82, K83) and Origins 2026-27 (L12–L24).

## Field decisions
- `code` = `UNI-MEL-{PB|MDF}-{16|19}-{decor #}`. The placeholder suffix (3 letters of the name) would collide, e.g. the many "Classic …" names, so the decor number is used instead.
- `texture` = one regular finish per decor. Dolomite is used when it is among the regular finishes, otherwise the first one listed. Decors with two regular finishes (e.g. 113/777/810/241/G17/G18/961/805 Dolomite + High Gloss; 123/G20 Dolomite + Calico; K82/K83 Omnia + Supermat; 511/555/G21/G23 Dolomite + High Gloss) are orderable in the other finish too, but the schema has one texture per code. **Schema gap**: no way to carry the alternate and optional finishes (table below).
- `is_premium_texture` = 1 when the finish is tagged "Signature" on the finishes tab, 0 for "Standard" (Dolomite, Vellum, Bistro).
- `sheen` comes from the finish descriptions: Dolomite "medium reflective" -> Medium; High Gloss "mirror smooth" -> High Gloss; Supermat "smooth and matte" -> Matte; Omnia "low sheen" -> Low Sheen; Aura "low lustre" -> Low Lustre; Vellum "matte" -> Matte; Brushed Elm "matte-oiled" -> Matte. All other finishes are left empty.
- `grain`, `g_sides`: not published per decor; left empty (model defaults apply).
- Size flags all 0. Decor pages publish only widths (4 ft and/or 5 ft, see table) and no lengths. **Schema gap**: widths can't be expressed without a length.
- Omitted: V05 Etrusco (still on the site but on the 2026 delist). Celestine, Dalia, Ohm and Ombre are in the site's collection filters but their product pages render empty, so they can't be verified. 385 Sapelli Mahogany (delisted 2026) does not appear on the site.

## Pre-existing rows (deactivated)
The 24 existing Uniboard rows (`UNI-MEL-*-WHI/ALM/DOV/BLA/GRE/NAT`, finish codes `UNI16WH`…) are placeholders. They are field-for-field identical to the Roseburg, Wilsonart and Arauco placeholder rows apart from the prefix. Their finish codes are not Uniboard decor numbers, and "Dove Grey", "Grey Oak Woodgrain" and "Natural Maple Woodgrain" are not Uniboard decors. "Almond" (136) was delisted in 2020, and "White"/"Black" don't match a single decor (777 White White / 113 Super White; 631 Classic Black / 888 NovaBlack). They are kept unchanged with `is_active=0` so a commit retires them; the reviewer may prefer to delete them.

## Per-decor data captured from uniboard.com
| Decor # | Name | Thickness (page) | Regular finishes | Optional finishes | Widths | Collections |
|---|---|---|---|---|---|---|
| 113 | Super White | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Standard |
| 123 | Charcoal | 1/4'' to 1 5/8'' | Calico, Dolomite | Aura, Eclipse, Rio, Supermat | 4/5 ft | Standard, Signature |
| 168 | Canadian Grey | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard, Signature |
| 204 | Bourbon Cherry | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 205 | Tobacco Cherry | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 206 | Crema Cherry | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 207 | Choco Cherry | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 241 | Audacity | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Signature |
| 262 | Sunrise Maple | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 263 | Sunset Maple | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 290 | Classic Maple | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 300 | Classic White | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio | 4/5 ft | Standard |
| 313 | Classic Chocolate | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 505 | Arctic White | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Sequoia, Supermat | 4/5 ft | Standard |
| 511 | HiTeak | 1/4'' to 1 5/8'' | High Gloss, Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard, Signature |
| 555 | NovaWhite | 1/4'' to 1 5/8'' | High Gloss, Dolomite | Aura, Brushed Elm, Calico, Rio, Riviera Oak, Supermat | 4/5 ft | Standard, Synchronized |
| 631 | Classic Black | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio | 4/5 ft | Standard |
| 744 | Inspiration | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 745 | Finesse | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 766 | Cayenne Maple | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 777 | White White | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4 ft | Standard, Signature |
| 802 | Willow Grey | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard, Signature |
| 805 | Sunset Grey | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Standard, Signature |
| 810 | Antique White | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Standard |
| 828 | Ingot Grey | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 888 | NovaBlack | 1/4'' to 1 5/8'' | Dolomite | Aura, Brushed Elm, Eclipse, Rio, Riviera Oak, Supermat | 4/5 ft | Standard |
| 920 | New England Almond | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 934 | Platinum | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 5 ft | Standard |
| 961 | Stainless | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Standard, Signature |
| 965 | Port | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| 992 | Hardrock Maple | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| G16 | Milano Oak | 1/4'' to 1 5/8'' | Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| G17 | Grigio | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Standard |
| G18 | Caramello | 1/4'' to 1 5/8'' | Dolomite, High Gloss | Aura, Rio, Supermat | 4/5 ft | Standard |
| G20 | Sheer Linen | 1/4'' to 1 5/8'' | Calico, Dolomite | Rio, Supermat | 4/5 ft | Signature |
| G21 | Viva Walnut | 1/4'' to 1 5/8'' | High Gloss, Dolomite | Aura, Rio, Supermat | 4/5 ft | Standard |
| G23 | Coastal Pear | 1/4'' to 1 5/8'' | High Gloss, Dolomite | Aura, Rio, Supermat | 4/5 ft | Signature |
| G63 | Acacia | 1/4'' to 1 5/8'' | Vellum | Aura, Dolomite, Rio, Supermat | 4/5 ft | Standard |
| H50 | Silva | 1/4'', 3/4'' MDF | Brushed Elm |  | 4/5 ft | Synchronized |
| H52 | Riva | 1/4'', 3/4'' MDF | Brushed Elm |  | 4/5 ft | Synchronized |
| H53 | Ember | 1/4'', 3/4'' MDF | Brushed Elm |  | 4/5 ft | Synchronized |
| H54 | Skye | 1/4'', 3/4'' MDF | Brushed Elm |  | 4/5 ft | Synchronized |
| H55 | Mystic | 1/4'', 3/4'' MDF - 1/2'', 5/8'' 11/16'', 3/4'', 1'' PB M2 | Brushed Elm |  | 4/5 ft | Synchronized |
| H56 | Chill | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H57 | Haze | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H58 | Storm | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H59 | Twilight | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H65 | Canyon | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| H66 | Vintage | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| H67 | Kindle | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H68 | Kohl | (not stated) | Supermat |  | 4/5 ft | 2018 |
| H69 | Carbon | (not stated) | Supermat |  | 4/5 ft | 2018 |
| H70 | Driftwood | 1/4'', 3/4'' MDF | Brushed Elm |  | 4/5 ft | Synchronized |
| H72 | Ginger Root | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H73 | Cocoa Bean | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H74 | Blackwood | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H75 | Tundra | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| H76 | Memento | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| K01 | Nutmeg | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| K02 | Sesame | 1/4'' to 1 5/8'' | Aura | Dolomite, Rio, Supermat | 4/5 ft | Signature |
| K04 | Smokewood | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| K05 | Barnwood | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| K06 | Silverwood | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| K07 | Dew Drop | 1/4'' to 1 5/8'' | Aura |  | 4/5 ft | Signature, 2023-25 Moments |
| K08 | Luna | 1/4'' to 1 5/8'' | Supermat | Dolomite | 4/5 ft | Signature |
| K13 | Nizza | 1/4'', 3/4'' MDF | Riviera Oak |  | 4/5 ft | Synchronized, 2017 |
| K14 | Mistral | 1/4'', 3/4'' MDF | Riviera Oak |  | 4/5 ft | Synchronized, 2017 |
| K15 | Cannes | 1/4'', 3/4'' MDF | Riviera Oak |  | 4/5 ft | Synchronized, 2017 |
| K16 | Esterel | 1/4'', 3/4'' MDF | Riviera Oak |  | 4/5 ft | Synchronized, 2017 |
| K17 | Cassis | 1/4'', 3/4'' MDF | Riviera Oak |  | 4/5 ft | Synchronized, 2017 |
| K18 | Monaco | 1/4'', 3/4'' MDF | Riviera Oak |  | 4/5 ft | Synchronized, 2017 |
| K19 | Chino | 1/4'' to 1 5/8'' | Calico |  | 4/5 ft | Signature, 2017 |
| K20 | Frequency | 1/4'' to 1 5/8'' | Calico |  | 4/5 ft | Signature, 2017 |
| K21 | Canvas | 1/4'' to 1 5/8'' | Calico |  | 4/5 ft | Signature, 2017 |
| K22 | Reflexion | 1/4'' to 1 5/8'' | Sequoia |  | 4/5 ft | Signature, 2017 |
| K23 | Shanshu | 1/4'' to 1 5/8'' | Sequoia |  | 4/5 ft | Signature, 2017 |
| K25 | Mimosa | 1/4'' to 1 5/8'' | Sequoia |  | 4/5 ft | Signature, 2017 |
| K29 | Nickel | 1/4'' to 1 5/8'' | Dolomite |  | 4/5 ft | Standard, 2017 |
| K30 | Spectra | (not stated) | Dolomite |  | 4/5 ft | 2018 |
| K31 | Odeon | (not stated) | Dolomite |  | 4/5 ft | 2018 |
| K32 | Equinox | (not stated) | Dolomite |  | 4/5 ft | 2018 |
| K33 | Dorato grey | (not stated) | Rio |  | 4/5 ft | 2018 |
| K34 | Dorato natural | (not stated) | Rio |  | 4/5 ft | 2018 |
| K36 | Soho | (not stated) | Sequoia |  | 4/5 ft | 2018 |
| K37 | Endgrain | (not stated) | Supermat |  | 4 ft | 2018 |
| K38 | Riverside | 1/4'' to 1 5/8'' | Aura |  | 4 ft | Standard, 2019-20 |
| K39 | Nebula | 1/4'' to 1 5/8'' | Sequoia |  | 4 ft | Signature, 2019-20 |
| K40 | Fjord | 1/4'' to 1 5/8'' | Supermat |  | 4 ft | Standard, 2019-20 |
| K41 | Lago | 1/4'' to 1 5/8'' | Supermat | Aura | 4 ft | Signature, 2019-20 |
| K42 | Sway | 1/4'' to 1 5/8'' | Vellum | Aura | 4 ft | Standard, 2019-20 |
| K43 | Summit White | 1/4'' to 1 5/8'' | Vellum | Aura | 4 ft | Standard, 2019-20 |
| K44 | Titan Grey | 1/4'' to 1 5/8'' | Vellum | Aura | 4 ft | Standard, 2019-20 |
| K45 | Wave Blue | 1/4'' to 1 5/8'' | Vellum | Supermat | 4 ft | Standard, 2019-20 |
| K46 | Kali | 1/4'' to 1 5/8'' | Lyra |  | 4 ft | Signature, 2019-20 |
| K47 | Asha | 1/4'' to 1 5/8'' | Lyra |  | 4 ft | Signature, 2019-20 |
| K48 | Whiskey | 1/4'' to 1 5/8'' | Lyra |  | 4 ft | Signature, 2019-20 |
| K60 | Chiffon | 1/4'' to 1 5/8'' | Nobella |  | 4 ft | Synchronized, 2019-20 |
| K61 | Silk | 1/4'' to 1 5/8'' | Nobella |  | 4 ft | Synchronized, 2019-20 |
| K62 | Feather White | 1/4'' to 1 5/8'' | Nobella |  | 4 ft | Synchronized, 2019-20 |
| K63 | Pietra | 1/4'' to 1 5/8'' | Nobella |  | 4 ft | Synchronized, 2019-20 |
| K65 | Americana | 1/4'' to 1 5/8'' | Nobella |  | 4 ft | Synchronized, 2019-20 |
| K66 | Whisper | (not stated) | Nobella |  | 4/5 ft | Synchronized, 2021-22 Redefined |
| K67 | Rumour | (not stated) | Nobella |  | 4/5 ft | Synchronized, 2021-22 Redefined |
| K68 | Conifer | (not stated) | Supermat |  | 4/5 ft | Signature, 2021-22 Redefined |
| K70 | Resonance | (not stated) | Aura |  | 4/5 ft | Signature, 2021-22 Redefined |
| K72 | Data | (not stated) | Omnia |  | 4/5 ft | Signature, 2021-22 Redefined |
| K73 | Mantra | (not stated) | Aura |  | 4/5 ft | Signature, 2021-22 Redefined |
| K74 | Chakra | (not stated) | Aura |  | 4/5 ft | Signature, 2021-22 Redefined |
| K75 | Karma | (not stated) | Omnia | Eclipse | 4/5 ft | Signature, 2021-22 Redefined |
| K76 | Samadhi | (not stated) | Omnia | Eclipse | 4/5 ft | Signature, 2021-22 Redefined |
| K77 | Dosha | (not stated) | Omnia |  | 4/5 ft | Signature, 2021-22 Redefined |
| K79 | Sage | (not stated) | Supermat |  | 4/5 ft | Signature, 2021-22 Redefined |
| K81 | Adobe | (not stated) | Supermat |  | 4/5 ft | Signature, 2021-22 Redefined |
| K82 | Whitesmoke | (not stated) | Omnia, Supermat | Eclipse | 4/5 ft | Signature, 2023-25 Moments |
| K83 | Shipshaw | (not stated) | Supermat, Omnia |  | 4/5 ft | Signature, 2023-25 Moments |
| L12 | Legend | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L13 | Mythos | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L14 | Sepia | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L15 | Obscura | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L16 | Folklore | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L17 | Ambrette | (not stated) | Supermat (Origins trendbook) |  | 4/5 ft | Signature, Origins 2026-27 |
| L19 | Putty | (not stated) | Supermat |  | 4/5 ft | Signature, Origins 2026-27 |
| L20 | Pacifica | (not stated) | Supermat |  | 4/5 ft | Signature, Origins 2026-27 |
| L21 | Selkie | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L22 | Enchanted | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L23 | Hanami | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| L24 | Sakura | (not stated) | Omnia |  | 4/5 ft | Signature, Origins 2026-27 |
| R60 | Fresco | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| R61 | Carnaval | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4 ft | Signature |
| R63 | Samba | 1/4'' to 1 5/8'' | Rio | Aura, Dolomite, Supermat | 4/5 ft | Signature |
| V05 | Etrusco | 1/4'' à 1 5/8'' | Lyra |  | 5 ft | Signature, 2021-22 Redefined |