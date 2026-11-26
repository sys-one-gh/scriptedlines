# Hafele — library_shelf_supports sources

**Primary source:** Häfele America "Connectors and Shelf Supports" catalog, 2019 edition (chapter FC 11).
These are Häfele's own catalog pages (www.hafele.com/us footer). They are hosted as PDF extracts by the dealer Home Decor Hardware:
- FC 11.68–11.76 (metal supports, 1/4in supports, Ex-Cellent H): https://p11.secure.hostingprod.com/@site.homedecorhardware.com/ssl/2019-Catalogs/Hafele-2019/selection_11.68-11.76.pdf
- FC 11.77–11.78 (plastic supports): https://p11.secure.hostingprod.com/@site.homedecorhardware.com/ssl/2019-Catalogs/Hafele-2019/selection_11.77-11.78.pdf
- FC 11.79–11.82 (glass supports): https://p11.secure.hostingprod.com/@site.homedecorhardware.com/ssl/2019-Catalogs/Hafele-2019/selection_11.79-11.82.pdf

Each row's item number, material, finish and diameter come from the catalog table for that item.
The style descriptions come from the catalog bullet text and drawings.

## IMPORTANT: current availability not verified
hafele.com (all regions tried) returns HTTP 403 to automated fetches, so no row could be checked against
the live Häfele site. The catalog dates from 2019. Some items may have been discontinued or renumbered since then, but every row is
set `is_active=1`. A reviewer should spot-check against hafele.com/us before using `--commit`.
Web search results show that hafele.com/us product pages still exist for 282.04.711 / 282.04.712, but I could not read those pages.

## Field mapping
- 1/4in items (FC 11.75 and 282.17.469) have `diameter_mm` = 6.35.
- `has_stop` = 1 where the catalog lists a feature that holds the shelf to the support:
  a shelf fixing plug (282.24.727/728/720, 282.26.706/701), a spring clip (282.17.*, 282.33.*),
  a double pin "for 32 mm system locks" (282.47.*), a securing screw hole (282.11.510/710/110/556/752/154),
  a clamp (Ex-Cellent H 282.23.725/716, 282.13.610), a set screw (282.20.715/724), a safety catch (281.42.403),
  or an explicit anti-tip/lift statement (282.13.711/712/701/702).
  **This is my interpretation of the catalog feature text. Häfele does not have a "removal protection" attribute.**
  The 282.04.712/512 anti-slide fin is set to 0, the same as the existing generic "Spoon (flush, anti-slide)" row.
- For plastic items, the catalog "Color" (white/beige/transparent…) goes in `finish`.

## Left out
- Ø3 mm, Ø4 mm and Ø7 mm (grommet) supports, Swedish wire supports, shelf hold-downs (282.28.*) and the
  M4 threaded support/bolt/expanding sleeve (282.39.705, 282.13.791, 051.45.004): these are out of scope or are not a 5 mm/1/4in pin.
- 282.13.600: catalog says "For Ø3 or Ø5 mm" (Varianta screw-mount). The diameter is ambiguous.
- 287.28.450 / 287.28.470: the PDF text layout did not clearly show which glass thickness goes with which item.
- Tab V support element 263.61.553 (anti-tip, 5 mm pin) and the K-Line / "Shelf support with plug and spring clip" products were
  seen only as hafele.com search-result titles. Those pages are blocked, so they are not included.
- No Häfele 5 mm metal sleeves are in the catalog pages above.
- Published weight capacities (e.g. 80 kg / 175 lbs) have no column in the table.
