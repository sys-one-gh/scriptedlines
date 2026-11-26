# Richelieu — library_handles sources

## Access caveat (read first)
richelieu.com resets every direct connection (curl and WebFetch both get ECONNRESET). The
manufacturer pages could only be read through web-search extracts of richelieu.com pages
(search limited to the richelieu.com domain). Specs were then checked against CliqStudios
(an authorized Richelieu dealer whose spec tables copy Richelieu's data) wherever it lists
the SKU. **A reviewer with browser access should spot-check a few rows on richelieu.com
before committing.**

Richelieu SKU pattern: `BP` + model + c-c in mm + finish code (195 Brushed Nickel, 900 Matte
Black, 140 Chrome, 170 Stainless Steel, CHBRZ Champagne Bronze, BORB Brushed Oil-Rubbed Bronze,
160 Satin Brass, 158 Brushed Aurum Gold, 990 Brushed Black, 166 Satin Gold). The pattern was
only used to *read* a code; every code in the CSV was seen listed as a SKU.

## Projection values
Richelieu's metric value is used where a source showed it (305 = 35, 7348 = 27, 7345 knob = 25,
9898 = 42, 873 = 35 mm). Where only inches were seen, the value is an exact conversion: 7340
1 5/16 in = 33.338; 305 stainless and 305 knob 1 3/8 in = 34.925; 332 1 3/16 in = 30.163.

## Rows and sources
- **305 Modern Steel Pull (Steel)**: BN, MB and Chrome SKU tables, plus BP305128160, BP30596160,
  BP305128BORB, all from richelieu.com model 1004844 pages, e.g.
  https://www.richelieu.com/us/en/category/decorative-hardware/cabinet-hardware-pulls-and-knobs/pulls/contemporary-steel-pull-305/1004844/sku-BP305128195
  Projection 35 mm and steel came from https://www.cliqstudios.com/richelieu-contemporary-steel-pull-305-brushed-nickel-expressions-bp305128195.html
  BP305160BORB came from https://www.cliqstudios.com/richelieu-modern-steel-pull-305-brushed-oil-rubbed-bronze-expressions-bp305160borb.html
- **305 Modern Stainless Steel Pull (202 SS)**: BP30576170, BP30596170, BP305128170, BP305192170; projection 1 3/8 in.
  https://www.richelieu.com/us/en/category/decorative-hardware/cabinet-hardware-pulls-and-knobs/pulls/contemporary-stainless-steel-pull-305/1200201/sku-BP305192170
- **305 Modern Steel Knob**: BP30540900, BP30540CHBRZ; projection 1 3/8 in. This is a short bar knob with a single fixing.
  https://www.richelieu.com/us/en/category/decorative-hardware/cabinet-hardware-pulls-and-knobs/knobs/modern-steel-knob-305/1196862/sku-BP30540CHBRZ
- **7348 Modern Metal Pull (Zamak, 27 mm)**: the sizes (128/160/256), finishes and projection
  came from richelieu.com model 1208639 and https://www.richelieu.com/us/en/product/printSku/pdf/BP7348160195
  The BN/CHBRZ/Chrome SKUs came from the CliqStudios 7348 pages. BP7348160900 and BP7348256900 appear on richelieu.com.
  CliqStudios lists BP7348256195 as "253 mm" c-c, a typo; the CSV uses 256 per Richelieu.
- **7340 Modern Metal Pull (Zamak)**: BN/MB/Chrome × 128/160/224, BP7340128CHBRZ; projection 1 5/16 in.
  https://www.richelieu.com/us/en/category/decorative-hardware/cabinet-hardware-pulls-and-knobs/pulls/modern-metal-pull-7340/1208638/sku-BP7340128CHBRZ
- **7345 Modern Metal Knob (Zamak)**: BP734544195/CHBRZ/140/900; projection 31/32 in (25 mm). The
  CliqStudios 7345 knob pages and https://www.richelieu.com/us/en/product/printSku/pdf/BP734544CHBRZ agree.
- **9898 Modern Aluminum Edge Pull**: c-c set 25/33/50/80/96/128/192/416 came from
  https://www.richelieu.com/us/en/glazier/product/printSku/pdf/m-1011060?unit=n
  The 990 and 170 SKU lists, BP989825CHBRZ, BP9898128CHBRZ, BP989825140 and BP9898128166 came from richelieu.com.
  BP989850CHBRZ, BP989850166 and BP989850990 also appear on CliqStudios. Projection 1 21/32 in (42 mm) is stated for the model.
  CliqStudios shows "72 mm" on two of its 9898 pages, which conflicts; 42 matches Richelieu and the third CliqStudios page.
- **332 Functional Steel Pull (wire pull)**: BP33203195, BP33204195, BP33205195, BP33206195, BP33285195, BP33285900, BP33203140, from
  https://www.richelieu.com/us/en/category/decorative-hardware/cabinet-hardware-pulls-and-knobs/pulls/functional-steel-pull-332/1209118/sku-BP33206195
  and https://www.richelieu.com/us/en/product/printSku/pdf/BP33205195
  Projection was published only for BP33205195; the other rows leave it empty. Inch c-c sizes are exact conversions (3 in, 3 1/2 in, 4 in).
- **873 Modern Metal Pull (Zamak, 35 mm)**: BP873128158 and BP873320160, from the CliqStudios pages.

## Left out on purpose
- 305 long, appliance and oversized sizes (298/333/486/12 in/18 in/562/638): projection is not confirmed and the appliance sizes use a larger bar.
- 9898 at 416 mm: it has two c-c values (192 + 416), so it doesn't fit one c-c column. The 96 mm size and aluminum finish (10) were dropped to keep the file balanced.
- 808 (BP80896900): the CliqStudios data contradicts itself (material missing, 1/2 in vs 18 mm projection).
- 8715 (BP8715...131161): the finish name is unclear, and one listing is mis-titled.
- BP873160160: the CliqStudios title mixes models 873 and 8715.
- 7345 pulls, 2368, 5632, 730, 6211, 2221, 107 and similar: SKUs were seen but specs were not verified.
- The 305 knob in BN etc.: only the per-unit code 30540195 was seen, not BP30540195.
