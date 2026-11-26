# Hettich — library_shelf_supports sources

All rows were verified first-hand from the "Technical details" table (title, Order no., material,
removal protection, pin/drilling diameter, glass/chipboard) on Hettich's own US eShop, fetched 2026-11-26.

- Category listing (8 families, the complete US range): https://shop.hettich.com/us_EN/Further-products/Shelf-supports-rails/Shelf-supports/c/group8124329317423
- Product pages, one per row: `https://shop.hettich.com/us_EN/p/<code>` for
  52096, 20782, 1006203, 1005655, 19557, 25100, 9134679, 9005558, 53012, 1004701, 1056163,
  1005432, 16181, 9131209, 1010564, 47609, 79709, 1005082, 63549

## Field mapping
- `has_stop` = 1 only where the page says "Removal protection: Yes" (Sekura 1.1, 6, 7, shelf studs 1005082 / 63549).
  Set to 0 where the page says "No" or "-". **52096 and 1006203 have no removal-protection
  attribute on the page.** They are set to 0 because the column cannot be null. Their glass/Sekura 8 pages also say "Without tilt prevention".
- `style` uses Hettich's product-line name. "Flattened" is Hettich's term for the spoon type.
- Finish: Hettich writes "galvanised". It is normalised to "Galvanized".

## Left out / unsure
- Duplicate pack-size article numbers for the same product: 9010110 (Sekura 1.1, 1,000 ea.; same
  spec as 19557) and 9010111 (Sekura 2.1, 1,000 ea.; same spec as 9134679). One row is kept per product, using the 500-ea. article.
- Load group (L25/L50/L75) is published but the table has no column for it.
- Glass-thickness range (Alfa Glass 8–12 mm) is published but has no column. It is kept in `style`.
- No 1/4in (6.35 mm) Hettich supports are listed on the US eShop.
- The US eShop has no separate metal shelf-pin sleeves.
