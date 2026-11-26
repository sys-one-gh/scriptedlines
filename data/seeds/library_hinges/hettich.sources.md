# Hettich — library_hinges sources

All rows: `manufacturer=Hettich`, Sensys concealed hinges, nickel-plated, no cost or lead time.

## Primary source
**Hettich US eShop (shop.hettich.com/us_EN)**, Sensys hinge series, fetched 2026-11-26. Every row was read from that article's own product page, `https://shop.hettich.com/us_EN/-/p/<order no.>`, using its "Technical details" block: door mounting option, opening angle, min/max door thickness, cup diameter, cup depth, type of installation, hinge surface finish, drilling pattern, finish and PU.

Family (variant-listing) pages used to enumerate articles:
- Sensys 8645i 110° with Silent System (nickel): https://shop.hettich.com/us_EN/-/x/bp/variant2264278396136
- Sensys 8645 110° without Silent System: https://shop.hettich.com/us_EN/-/x/bp/variant1252505501929
- Sensys 8631i thick door (up to 32 mm): https://shop.hettich.com/us_EN/-/x/bp/variant2264390337448
- Sensys 8631 thick door without Silent System: https://shop.hettich.com/us_EN/-/x/bp/variant6940680032514
- Sensys 8657i wide angle 165°, zero protrusion: https://shop.hettich.com/us_EN/-/x/bp/variant2264578976901
- Category: https://shop.hettich.com/us_EN/Hinges/Sensys-hinge-series/Hinges/c/group9760331448014

Key published specs:
- 8645i / 8645: 110°, door 15–24 mm, cup 35 × 12.8 mm, steel nickel-plated.
- 8631i / 8631: 95°, door 15–32 mm, cup 35 × 12.8 mm.
- 8657i: 165°, door 15–32 mm, cup 35 × 11.6 mm, steel / die-cast zinc.

## Conventions and judgement calls
- **Overlay mapping**: Hettich "overlay" is Full Overlay, "half overlay" is Half Overlay, "inset" is Inset.
- **Fixing type**: "for screwing on" is `Screw-on`, "for pressing in" is `Press-in`. The remaining values use Hettich's terms because no model value fits: "with expanding sockets" is `Expanding sockets`, plus `Fix fast assembly` and `Flash fast assembly` (tool-free).
- Drilling pattern (TH 52×5.5, TB 45×9.5, TS 48×6, THS = TH 52 / TS 48) and pack unit go in `application`. The table has no columns for either.
- **Same hinge, two order numbers.** Several hinges are sold under two order numbers that differ only by pack unit (PU 50 vs PU 200, e.g. 9073606 / 9071206, 9091400 / 9090260). Both are real orderable articles, so both are rows, with the PU shown in `application`.
- `cabinet_type` is blank because the eShop does not state frameless/face-frame for these articles.

## Deliberately left out
- Obsidian-black articles (e.g. 9091738, 9117002). Only the nickel-plated range is loaded; the black versions can be added later from the same pages.
- Sensys thin-door, aluminium-frame, W20/W30/W45/W90 angle hinges and Intermat corner-folding hinges. These are special applications outside scope.
- Mounting plates and accessories.
