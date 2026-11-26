# Blum — library_hinges sources

All rows: `manufacturer=Blum`, cup bore 35 mm, `is_active=1`, no cost or lead time.

## Primary sources
1. **Blum Inc. "Concealed Hinges" brochure (US, © 2019)**, distributed as an official Blum PDF:
   https://www.dakotahardwoods.com/wp-content/uploads/2020/07/Blum_ConcealedHinges_DAKOTA_7-2020.pdf
   - p12 CLIP top BLUMOTION 110° (71B35xx/36xx/37xx, 71B358E): SKUs, cranks, "door thicknesses up to 26", 13 mm cup depth in the diagrams plus the brochure note "All 35 mm and 8 mm holes must be a minimum of 13 mm deep".
   - p13 110°+ (73B35xx): SKUs, max 26 mm door, 13 mm depth, "overlays up to 22 mm".
   - p14 95° thick door (71B95xx/96xx/97xx): max 30 mm door, 13 mm depth.
   - p15–16 CLIP top BLUMOTION 155° (71B75xx): max 24 mm door, 11.7 mm cup depth.
   - p20 CLIP top BLUMOTION Diagonal 45° (79B3598): INSERTA, max 19 mm door, 13 mm depth.
   - p27 CLIP top 107° (75T1550/1580/1590B): max 19 mm door, 11.5 mm depth, nickel-plated.
   - p28 CLIP top 110° (71T35xx/36xx/37xx, 71T358E, free-swing 70T3xxx.TL): max 26 mm door, 13 mm depth.
   - p32 CLIP top 95° thick door (71T95xx/96xx/97xx, INSERTA "B" codes): max 30 mm door, 12.7 mm depth.
   - p33 CLIP top 170° (71T6550/6580/6540B, 71T6650/6680/6640B): max 24 mm door, 11 mm depth.
   - p35 CLIP top 155° (71T7550/7590): max 24 mm door, 11.7 mm depth.
   - p40 CLIP top Diagonal 45° (79T5550/5580/5590B): max 19 mm door, 13 mm depth.
   - p79–84, p87–89 COMPACT BLUMOTION 38N/39C/38C/38B and COMPACT 38N/39C/38C: SKUs, overlays, cup depth (11 mm for the 7/16" cup, 13 mm for the 1/2" cup), "Maximum door thickness 3/4"" (19.05 mm).
2. **Blum Inc. "COMPACT CLIP" brochure (© 2025)**: https://d2.blum.com/services/BEC003/compactclip_ep_dok_bus_$sen-us_$aof_$v2.pdf
   - p10–12 and the part-number index on p16: 30C2 (105°, 11 mm cup), 31C3 (110°, 13 mm cup), 31C1 (107°, 11 mm cup), max door 3/4".
3. **Blum Quick Reference Guide (US, v3)**: https://d2.blum.com/services/BEC003/hinges_td_dok_bus_$sen-us_$aof_$v3.pdf (cross-check of every CLIP top / CLIP top BLUMOTION part number and its crank).
4. **CLIP top BLUMOTION 155° sell sheet (US, LIT.HNG4103.07.18)**: https://d2.blum.com/services/BEC003/lit.hng4200.07.18.cliptopbmn155_ss_dok_bus_$sen-us_$aof_$v2.pdf (half-cranked 71B7650/71B7690 and 71T7650; "door thicknesses up to 24"; all metal, nickel-plated; "all dimensions remain the same" as the previous 155°).
5. **Blum catalogue and technical manual 2027/2028 (international)**: https://publications.blum.com/2026/catalogue/en/70/ (pages 68–89). Used to confirm that the 110°, 110°+, 155°, 170° and thick-door part numbers are still current and offered in NI (nickel).
6. **Blum US website** COMPACT / COMPACT BLUMOTION programme pages, which confirm the 38N/39C/38C families are current: https://www.blum.com/us/en/products/hingesystems/compact-blumotion/programme/ and https://www.blum.com/us/en/products/hingesystems/compact/programme/
7. **Blum Hinge Identification Guide (US, 2025)**: https://d2.blum.com/services/BEC003/hingeidentification_td_dok_bus_$sen-us_$aof_$v4.pdf (fixing-type identification: screw-on 71B3550, press-in 71B3580, EXPANDO 71B358E, INSERTA 71B3590).

## Conventions and judgement calls
- **Overlay mapping**: straight arm is Full Overlay, half-cranked is Half Overlay, full-cranked is Inset. This matches the existing rows.
- **Fixing type**: Blum's part-number suffix gives 50 = Screw-on, 80 = Press-in (knock-in dowels), 90 or 40B = INSERTA, 8E = EXPANDO. The face-frame families use the same scheme: x55 = screw-on and x58 = press-in, as every paired row in the brochure tables shows. That scheme is how the single-entry rows were assigned (38N358B.05, 39C358C.25, 31C358B.25, 30C258B.05, 31C158B.20).
- **Press-in hinges are included.** They are a published fixing variant, and the model lists Press-in.
- **Face-frame partial overlay** (38N, 30C2): written as `Partial Overlay`, which is Blum's term. The model comment lists only Full/Half/Inset. Face-frame overlay dimensions (e.g. 1/2") go in `application` because the table has no column for them.
- **`cabinet_type`**: CLIP top rows use `Frameless`, matching the existing rows. The brochure also shows face-frame use with CLIP face-frame adapter plates. COMPACT rows use `Face Frame`.
- **`milling_depth_mm`** is the cup depth printed in each hinge's drawing (13 / 12.7 / 11.7 / 11.5 / 11 mm).
- **Left blank (not published as hinge specs)**: `door_thickness_min_mm`, `cabinet_thickness_min_mm`, `material`. Blum publishes only maximum door thickness. Its reveal tables start at 16 mm, but that is a table column, not a stated minimum.
  - **This changes the 5 existing rows on load**: 71B3550/3650/3750/3590 lose door min 16, cabinet min 16 and material "Steel", and 71T6550 loses "Steel (cup), Zinc (arm)". None of those values could be traced to a Blum source.
- **`finish`** is Nickel-plated for CLIP top / CLIP top BLUMOTION ("NI", "all metal hinge, nickel-plated"). It is blank for COMPACT rows because the brochure does not state the hinge finish there (the "steel, nickel-plated" lines on those pages refer to cover caps).
- COMPACT (non-BLUMOTION) rows: `mechanism` is blank because the brochure does not describe the closing mechanism. `soft_close=0` because these hinges have no integrated BLUMOTION; it is offered as the add-on 971A9700.

## Deliberately left out
- COMPACT 33: Blum marks it "Product discontinued 2023" (compact33dis PDF).
- Mounting plates, cover caps, angle-restriction clips and other accessories, as instructed.
- CLIP top 120°/120°+, CLIP top 110°+ (73T), 125° zero protrusion (71B755xD), blind-corner, aluminium-frame, glass-door, thin-door (71B453T), CLIP 100° and the ±5°–45° angled programme. These are niche applications or outside the requested scope; the diagonal 45° hinges are included as the published "angled" option.
- Onyx Black (ONS) versions. Blum lists them under the same part numbers with a colour option, so they are not separate rows.
- The 38C COMPACT BLUMOTION overlays other than 1-1/4", because only 38C355B.20/38C358B.20 appear in the brochure text.
