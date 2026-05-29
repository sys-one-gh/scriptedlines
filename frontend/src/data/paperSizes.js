// ─────────────────────────────────────────────────────────────
// paperSizes.js
//
// All supported drawing paper sizes.
// widthMm = landscape width, heightMm = landscape height.
// All sizes stored in landscape orientation (wider than tall).
// key matches the PaperSize enum in backend/models/drawing.py
// ─────────────────────────────────────────────────────────────

export const paperSizes = {

  Arch_D: {
    id:       "Arch_D",
    label:    'Arch D — 36" × 24"',
    widthMm:  914.4,   // 36"
    heightMm: 609.6,   // 24"
  },

  Arch_C: {
    id:       "Arch_C",
    label:    'Arch C — 24" × 18"',
    widthMm:  609.6,   // 24"
    heightMm: 457.2,   // 18"
  },

  Arch_E: {
    id:       "Arch_E",
    label:    'Arch E — 48" × 36"',
    widthMm:  1219.2,  // 48"
    heightMm: 914.4,   // 36"
  },

  ANSI_B: {
    id:       "ANSI_B",
    label:    'ANSI B — 17" × 11"',
    widthMm:  431.8,   // 17"
    heightMm: 279.4,   // 11"
  },

  ANSI_A: {
    id:       "ANSI_A",
    label:    'ANSI A — 11" × 8.5"',
    widthMm:  279.4,   // 11"
    heightMm: 215.9,   // 8.5"
  },

  A1: {
    id:       "A1",
    label:    "A1 — 841 × 594 mm",
    widthMm:  841.0,
    heightMm: 594.0,
  },

  A3: {
    id:       "A3",
    label:    "A3 — 420 × 297 mm",
    widthMm:  420.0,
    heightMm: 297.0,
  },

};

// Ordered list for dropdowns — most common millwork sizes first
export const paperSizeOptions = [
  paperSizes.Arch_D,
  paperSizes.Arch_C,
  paperSizes.Arch_E,
  paperSizes.ANSI_B,
  paperSizes.ANSI_A,
  paperSizes.A1,
  paperSizes.A3,
];