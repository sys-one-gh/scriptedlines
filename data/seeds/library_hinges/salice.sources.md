# Salice — library_hinges sources

All rows: `manufacturer=Salice`, cup bore 35 mm, no cost or lead time. Catalog index: https://www.salice.com/us/en/download/catalogues

## Primary sources
1. **Salice America "Silentia+ Euro and Face Frame Hinges — United States", D0CASAA29USA (rev. Feb 2025)**: https://www.salice.com/media/Catalog/hinges/silentia-plus/Salice_SILENTIAPLUS_D0CASAA29USA.pdf
   - p10–13 100 Series 105°: "Minimum 15 mm / maximum 20 mm door thickness", "12 mm deep cup", order codes (nickel …E9, titanium …E6).
   - p18–21 200 Series thick door 94°: "Minimum 18 mm / maximum 35 mm door thickness", "15.5 mm deep cup", order codes.
   - p19, p22–23 200 Series 155° 0-protrusion: "13.5 mm deep cup", "Minimum 16 mm - 28 mm maximum door thickness", order codes.
   - p28–31 700 Series 110°: "Minimum 16 mm / maximum 26 mm door thickness", "13.5 mm deep cup", order codes.
   - p11 / p19 / p29: the third character of the code is the attachment (P = wood screw, R = dowel, 7 = Rapido, J = Logica).
2. **Salice "Concealed hinges for the cabinet and furniture industries", D0CASAA03USA (rev. Nov 2024)**: https://www.salice.com/media/Catalog/hinges/concealed-hinges/Salice_CONCEALED-HINGES-FOR-THE-CABINET_D0CASAA03USA.pdf
   - p13 Series 200 110° and 120°: order codes, F/S (free swing) and S/C (self-closing), 11 mm cup (printed under the cup symbol), and the legend Screw-in / Press-in / Rapido / Logica.
   - p14 Series 200 165°: order codes, 11 mm cup.
   - p22 Series 200 thick door 94°: "For thick doors up to 32 mm (1-1/4") 11 mm deep metal cup".
   - p23 Series 200 155° K series: "For thick doors up to 28 mm (1-1/8") 8 mm deep metal cup".

## Conventions and judgement calls
- **Overlay mapping**: crank A is Full Overlay, G is Half Overlay, P is Inset (Salice's own labels).
- **Fixing type**: wood screw is `Screw-on`, dowel is `Press-in`. `Rapido` and `Logica` use Salice's names because no model value fits.
- Silentia+ finish comes from the order code: …E9 is Nickel-plated, …E6 is Titanium; both are listed in the catalog columns. Series 200 (non-soft-close) finish is blank because those pages don't state it.
- Series 200: S/C is "Spring (Self-Close, no soft-close)" and F/S is "Free swing (no spring)", both with `soft_close=0`.
- `material` and `cabinet_type` are blank because neither is stated for these hinges.

## Deliberately left out or unverified
- **D crank ("1/2" overlay", 5 mm)** rows for Silentia+ 100/200/700 and Series 200: this is an intermediate crank with no matching `overlay_type`, so the rows are omitted pending a vocabulary decision. Examples: C7P6DE9, C2P4D99.
- **Salice Air** (CEL6DE9XXI / CEL6SE9XXI …): the US catalog gives a 16.5 mm cup depth, min 18 mm doors and 105°, but it does not state a cup diameter (`milling_diameter_mm` is required). It also doesn't explain the D vs S variant letters. Air is a top/bottom-panel hinge that doesn't fit the overlay model either.
- **Silentia+ CU face-frame hinges** (CUP3xD9 …): the extracted tables don't make clear which SKUs are partial and which are full overlay, and the titanium column alignment is ambiguous. Specs (106°, 11 mm cup, door 14–22 mm) are published if someone wants to add them by hand from p51–58.
- Silentia+ Series N (40 mm cup), metal-profile hinges, Series 200 angled/blind-corner, B, F, M and S series, Push and mounting plates.
