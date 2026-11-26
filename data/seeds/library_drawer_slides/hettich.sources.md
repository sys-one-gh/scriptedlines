# Hettich — library_drawer_slides sources

All rows are from the Hettich eShop, US English site (shop.hettich.com/us_EN), product "Technical details" blocks, scraped 2026-11-26. Codes are the "left and right" **set** order numbers, one per nominal length.

## Sources

1. **Actro 5D with Silent System** (variant listing)
   https://shop.hettich.com/us_EN/-/Actro-5D-with-Silent-System%2C-optionally-with-Push-to-open-Silent/bp/variant12528169317421
   - L (40 kg): 9318268–9318270 and 9318281–9318291 (NL 250–600, 14 rows).
   - XL (70 kg): 9318310–9318318 (NL 450–750, 9 rows).
   - Example product page: https://shop.hettich.com/us_EN/Runner-systems/Concealed-drawer-runners/Actro-5D-drawer-runners/Actro-5D-with-Silent-System/Full-extension-runner-Actro-5D-L-%2840-kg%29-with-Silent-System%2C-compatible-with-Push-to-open-Silent%2C-600-mm%2C-left-and-right/p/9318291
   - Fields used: Drawer length SKL → `length_mm`, Nominal length → `length_label`, Minimum cabinet body depth KT → `min_cabinet_depth_mm`, Load capacity kg (× 2.20462 → lbs), "drawer side profile thickness ≤ 16mm", "Galvanised steel", Silent System (soft close).
2. **Quadro V6 with Silent System, full extension, side profile ≤ 16 mm** (variant listing)
   https://shop.hettich.com/us_EN/-/Quadro-V6-with-Silent-System%2C-full-extension-runner-for-wooden-drawer-%28slide-on-installation%2C-drawer-side-profile-thickness-%E2%89%A4-16-mm%29/bp/variant9396867968384
   - 9048819, 9048823, 9048826–9048836 (NL 280–600, 13 rows). Same fields as above.
   - Load capacity varies by length: 20 kg at 280, 25 kg at 300–380 and 600, 30 kg at 400–580.

## Decisions and caveats

- **`runner_length_mm` is empty.** Hettich publishes the nominal length (NL, used as the label) and SKL, but no separate physical runner length.
- **Left out: Quadro V6 NL 250 and 320.** The shop lists only handed left and right articles for these, with no set number.
- **Left out: Quadro V6 / Quadro 4D V6 IW21 face-frame inch lengths (9"–24").** The Hettich US brochure (March 2017, https://web.hettich.com/fileadmin/media/RES/Quadro_IW21_4D_HUS_0317_16397_9225592_en.pdf) lists set numbers such as 9 209 777–9 209 802 and 9 134 xxx. The current US eShop, however, shows only a 24" 4D V6 with different handed numbers (9262852/53), and the 12" page for 9262844 renders empty. Because I couldn't confirm which numbers are current, I loaded none. That brochure gives 90 lb dynamic / 100 lb static and min–max cabinet depths, if someone wants to confirm with Hettich America.
- **Left out: Quadro V6 5D M (30 kg).** It is sold as handed singles only.
- **Also left out:** Push-to-open-only variants (no soft close), Quadro V6 YOU / plus, under-base Actro 5D, and Quadro 25 partial extension.
- **Load is Hettich's rated capacity in kg (EN 15338 Level 3)**, converted exactly to lbs. It is not the ANSI/BHMA rating that Blum and Accuride quote, so values aren't strictly comparable across brands.
