# library_cores — sources (cores.csv)

Cores are commodity specs (no manufacturer column). A row was added only if a
real producer publishes that substrate at that thickness. The evidence standard:

- a thickness the producer **names explicitly** (a discrete list, or a range
  endpoint such as "1/4 – 1-1/2 in"), or
- a thickness **inside a producer's published range** that a major distributor
  also stocks as a discrete SKU of that product.

Thicknesses that sit inside a range with no discrete listing were left out.
Size flags come from the producer's published width × length range, or from
distributor SKUs where the producer gives none. Because the loader turns an
empty boolean into 0, a size flag of 0 can mean "not offered" or "not
published". No cost or lead-time values were filled in.

`carb_p2 = 1` means the producer states TSCA Title VI / CARB ATCM 93120 (Phase 2)
compliance. `fsc = 0` on new rows: every producer below offers FSC only as an
order option ("certified available"), and the table has no way to say that.
`leed = 1` only where the producer's own page or sheet claims LEED credit support
for that product line.

## Existing 50 rows (MDF-*, MRMDF-*, FRMDF-12..19, EXMDF-12/19, PB-*, MRPB-*, HWPLY-*, SWPLY-*, FLEXPLY-*)

These are copied unchanged from `load_catalog.py --export` (dry run: 50 unchanged).
I did not re-verify them. Things a reviewer should check:

- **PB-6 / PB-9 / MRPB-6 / MRPB-9** (1/4 in and 3/8 in particleboard): Roseburg's
  particleboard starts at 1/2 in (SkyBlend/UltraBlend). Arauco Duraflake VESTA
  starts at 3/8 in. I found no producer publishing 1/4 in PB.
- **FRMDF-\* core_color "Pink"**: Roseburg's Medite FR sheets don't state a core
  colour. The new FR rows leave core_color empty.
- **EXMDF-\***: Roseburg's exterior MDF is Armorite. Medex is MR50 + NAF and is
  not marketed as exterior.
- **leed flags are inconsistent**: the existing FRMDF rows have leed=0, but
  Medite FR publishes LEED support. The new FRMDF rows have leed=1.
- **HWPLY-\* / SWPLY-\***: these use metric thicknesses (6/8/12/15/18/25 mm),
  while North American HP-1 hardwood plywood is sold at nominal imperial sizes.
  The new veneer-core rows use nominal imperial thicknesses.
- **The 5x12 / 4x12 flags on thin MDF/PB rows** were not checked.

## Roseburg MDF — MDF-29, MDF-32, MDF-38, MRMDF-38, FRMDF-6, FRMDF-38, EXMDF-6, EXMDF-9, NAFMDF-6/19/38

- Roseburg MDF category page (Medite 1/4–1-1/2 in; Medite II "NAF MR50"
  1/4–1-1/2; Medite FR 1/4–1-1/2; Arreis NAF 1/4–1-1/2; all 4–5 ft wide, 8–18 ft long):
  https://www.roseburg.com/medium-density-fiberboard-mdf/
- Medite FR TDS 080526 (1/4–1-1/2 in, Class A ASTM E84, NAF, TSCA VI/CARB, FSC
  available option, LEED support):
  https://www.roseburg.com/wp-content/uploads/2026/08/Medite_FR_Medford_TechDataSheet_Digital_080526.pdf
  and https://www.roseburg.com/medium-density-fiberboard-mdf/medite-fr/
- Arreis (NAF, TSCA VI, 1/4–1-1/2 in, 4/5/6 ft widths, up to 18 ft, LEED v4
  support): https://www.roseburg.com/medium-density-fiberboard-mdf/arreis/
- Armorite (exterior grade, NAF, MR50, 4/5 ft widths, up to 18 ft):
  https://www.roseburg.com/medium-density-fiberboard-mdf/armorite/
  The product page says 1/4–1-1/4 in, but the category page says 1/4–3/4 in. I only
  added 1/4 and 3/8, which a distributor stocks; I left out 1-1/4 because the
  two sources conflict.
- Distributor SKUs (Plywood Company of Fort Worth):
  - standard MDF 1-1/8, 1-1/4, 1-1/2 in:
    https://www.plywoodcompany.com/pl/panels-mdf-panels-mdf-mdf-over-1-2-thick/752
  - Armorite 1/4 and 3/8 in:
    https://www.plywoodcompany.com/pl/panels-fscr-material-c009036-armorite-ext-mdf-c009036/644
  - Arreis 1/4 and 3/4 in:
    https://www.plywoodcompany.com/pl/panels-fscr-material-c009036-arreis-mdf-c009036/645
  - Medite FR 1/4, 1/2, 3/4 in:
    https://www.plywoodcompany.com/pl/panels-fscr-material-fire-retardant-mdf/646
- MDF-38, MRMDF-38, FRMDF-38 and NAFMDF-38 rest on the producer's range
  endpoint (1-1/2 in). MDF-38 is also a distributor SKU.
- Left out: FR MDF at 3/8 in and 1 in (inside the range, but no discrete listing
  found). 1/8 in NAF MDF (a distributor stocks it, but it is below every producer
  range I found). 14 mm and 1-3/4 in MDF (distributor special orders with no
  producer listing).

## Arauco Trupan Ultralight MDF — ULMDF-12, ULMDF-18, ULMDF-25

- Product page ("thicknesses up to 50mm"): https://na.arauco.com/en/p/trupan-ultralight-mdf-trupan_ultralight
- Trupan Ultralight spec sheet (density 470–550 kg/m³; thickness bands
  12–14, 15–17, 18–24, 25–30 and 38–50 mm; TSCA VI):
  https://www.plywoodcompany.com/m/mdf/trupan/trupan_spec-ultralight.pdf
- Distributor SKUs (12 mm 4x8; 18 mm 4x8, 5x10, 5x12; 1 in 4x10 special order;
  45 mm 5x12): https://www.plywoodcompany.com/pl/panels-mdf-panels-ultra-lite-mdf/655
- The 1 in SKU is unbranded at the distributor. It falls in Trupan's published
  25–30 mm band.
- carb_p2=1 is based on TSCA VI.
- Left out: 15 mm (no discrete listing found) and 45 mm (a special-order size not
  commonly used in millwork).

## Roseburg particleboard — PB-38, NAUFPB-12, NAUFPB-19, NAUFPB-29

- Roseburg particleboard brochure, Missoula mill (SkyBlend/UltraBlend; 1/2–1-1/2 in;
  4 and 5 ft widths; 8, 10, 12 ft lengths):
  https://www.roseburg.com/wp-content/uploads/2021/01/Particleboard_CategoryBrochure_11x17_Digital-002.pdf
- SkyBlend TDS 091423 (NAUF / ULEF exempt, TSCA VI, 1/2–1-1/8 in, 4 and 5 ft wide,
  up to 12 ft long, flame spread Class C, FSC available option, LEED support):
  https://www.roseburg.com/wp-content/uploads/2023/10/RFP-SkyBlend-TechDataSheet_DIGITAL_091423.pdf
- SkyBlend 3/4 in NAF PB SKU:
  https://www.plywoodcompany.com/pl/panels-fscr-material-c009036-particleboard-c009036/650
- Panels from both mills are about 1 in oversize ("actual … one inch longer than
  stated size"). There is no column for this.

## Arauco Duraflake VESTA FR ULEF particleboard — FRPB-12, FRPB-19

- Spec sheet (VESTA FR ULEF thickness bands 3/8"–15 mm, 5/8"–3/4", 7/8"–1";
  Intertek Class A/Class 1; TSCA VI; CARB ATCM 93120; LEED qualifying credits):
  https://na.arauco.com/en/resources/download/DURAFLAKE_PB_VESTA_ULEF
- Product page ("3/8 to 1 in"; "4ft wide press"):
  https://na.arauco.com/en/p/duraflake-fire-rated-particleboard-duraflake-firerated
- Distributor SKUs, 1/2 and 3/4 in in 4x8 and 5x8:
  - https://www.plywoodcompany.com/pd/duraflake-fr-1-2/506
  - https://www.plywoodcompany.com/pd/duraflake-fr-1-2-5x8/508
  - https://www.plywoodcompany.com/pd/duraflake-fr-3-4/678
  - https://www.plywoodcompany.com/pd/duraflake-fr-3-4-5x8/680
- Left out: 3/8, 5/8, 7/8 and 1 in. Arauco names these thicknesses but publishes
  no sheet sizes for them, and I found no distributor SKUs.
- core_color is not published, so it is left empty.

## Columbia Forest Products hardwood plywood — VCPLY-6/12/19, CCPLY-12/16/19/25/32, FRPLY-11/25, MPPLY-12/19/25

- PureBond (veneer core, NAF, TSCA VI/CARB, FSC Mix on request, LEED):
  https://www.columbiaforestproducts.com/plywood/purebond
- Certified Wood page ("Nominal finished thickness of 1/4″, 1/2″ and 3/4″ are
  the most common"): https://www.columbiaforestproducts.com/plywood/certified-wood
- Mill size ranges: Old Fort makes 4x8, 5/32–1-1/4 in
  (https://www.columbiaforestproducts.com/mills/old-fort-mill). Klamath Falls
  makes 4x6 through 4x10, 5/32–1-1/2 in
  (https://www.columbiaforestproducts.com/mills/klamath-falls-mill). These
  ranges are the basis for the 4x8 and 4x10 flags on the VCPLY and CCPLY rows.
- Classic Core (combination core: veneer core inner plies with NAUF/ULEF MDF
  crossbands; standard thicknesses 1/2, 5/8, 3/4, 1, 1-1/4 in; CARB P2; LEED
  IEQ 4.4; standard at Klamath Falls):
  https://www.columbiaforestproducts.com/plywood/classic-core
  and http://catawbahardwoods.com/wp-content/uploads/2018/09/ClassicCore.pdf
- FireBrand (Class A ASTM E84 / CAN/ULC S102 veneer-core platform, 7/16 through
  1 in, 4x8 and 4x10, NAF, TSCA VI/CARB P2):
  https://www.columbiaforestproducts.com/plywood/firebrand
  and https://www.columbiaforestproducts.com/blog/firebrand-intro
  Only the 7/16 and 1 in endpoints are listed. 1/2 and 3/4 in are probably
  offered but are not published as discrete thicknesses.
  **Important:** Class A applies to the core only. Columbia says panels revert to
  Class C once decorative veneer is applied. The description says "core only".
- Europly (multi-ply birch core, 1/2 in 11-ply and 3/4 in 13-ply, 4'x8', CARB/TSCA
  VI, LEED support): https://cdn.columbiaforestproducts.com/Europly%20Product%20Sheet%20121125.pdf
- MPX (hardwood crossbands, 3/4 in, 19.5 mm and 1 in, 4x8, PureBond, TSCA/CARB):
  https://www.columbiaforestproducts.com/plywood/mpx
- Left out: 5/32 in veneer core (a skin, not a core); MPX 19.5 mm (close to the
  3/4 in row; add it if a metric row is wanted); DesignEdge (7/16, 9/16, 11/16 in
  maple core with poplar faces, sold as a "Baltic Birch alternative"; niche and
  supply is limited); CFP60s 60-in-wide panels (no lengths published).

## Birch plywood (Baltic/Finnish birch) — BBPLY-6/9/12/15/18/24

- Latvijas Finieris / Riga Wood Plywood Handbook (2022, revised 2026): Riga Ply
  nominal thicknesses 4–50 mm, with ply counts 6.5=5, 9=7, 12=9, 15=11, 18=13,
  24=17; E1, CARB Phase 2 and EPA TSCA VI; glue is PF/LPF (EN 314 Class 3
  exterior) or MUF (Class 1 interior):
  https://www.finieris.com/wp-content/uploads/2026/03/RigaWood_PlywoodHandbook-1.pdf
  and https://www.finieris.com/products/riga-ply/
- Koskisen Handbook of Plywood (birch thicknesses 4–50 mm with matching ply
  counts; standard sizes include 1525x1525, 1220x2440, 1525x2440, 1525x3050;
  ULEF; mostly PF glue, some UF interior):
  https://koskisen.fi/wp-content/uploads/materials/HandBook-of-Koskisen-Plywood.pdf
- Size flags: 5x5 (1525x1525), 4x8 (1220x2440), 5x8 (1525x2440) and 5x10
  (1525x3050), from Koskisen's size table.
- exterior_grade is 0 because glue class varies by order (exterior PF or interior
  UF/MUF). Thicknesses are metric (6.5 mm is stored as 6.5).
- Left out: 4 mm, and 21 mm and up apart from 24 mm.
- These producers are European, not North American mills, but this is the
  Baltic birch that North American shops buy.

## Not researched / not added

- Uniboard, Timber Products and West Fraser data were not used. Roseburg, Arauco
  and Columbia already supplied published data for every new row.
- No new MR-PB, softwood or flex plywood rows were added.
