// ─────────────────────────────────────────────────────────────
// CADToolbar.jsx
//
// Horizontal CAD tool strip.
//
// Font sizes use --fs-base token (see tokens.css) for text labels.
// Scroll arrow chars (‹ ›) are icons — not tokenized, separate pass.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  barBg:       "#0f0f0f",
  barBorder:   "#1e1e1e",
  groupLabel:  "#888888",
  iconActive:  "#4f8ef7",
  iconEnabled: "#cccccc",
  iconDisabled:"#555555",
  activeBg:    "#0f1e35",
  activeBorder:"#4f8ef7",
  sepColor:    "#222222",
  tooltipBg:   "#161616",
  tooltipBorder:"#2a2a2a",
  tooltipText: "#ffffff",
  tooltipSoon: "#666666",
};

const TOOL_GROUPS = [
  {
    label: "SELECT",
    tools: [
      {
        id: "select", label: "Select / Move", active: true,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 0L4 20L8 16L12 24L14 20L10 12L16 12Z"/>
        </svg>,
      },
      {
        id: "pan", label: "Pan", active: true,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 7.5C21 6.7 20.3 6 19.5 6S18 6.7 18 7.5V6.5C18 5.7 17.3 5 16.5 5S15 5.7 15 6.5V6C15 5.2 14.3 4.5 13.5 4.5S12 5.2 12 6V3.5C12 2.7 11.3 2 10.5 2S9 2.7 9 3.5V14L6.6 11.6C6 11 5 11 4.4 11.6C3.8 12.2 3.8 13.2 4.4 13.8L9.2 19.4C10.1 20.4 11.4 21 12.8 21H16C18.8 21 21 18.8 21 16V7.5Z"/>
        </svg>,
      },
    ],
  },
  {
    label: "DRAW",
    tools: [
      {
        id: "line", label: "Line", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="4" y1="20" x2="20" y2="4" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "arc", label: "Arc", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M4 20 Q12 4 20 20" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "rectangle", label: "Rectangle", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="1"/>
        </svg>,
      },
      {
        id: "circle", label: "Circle / Ellipse", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="9"/>
        </svg>,
      },
      {
        id: "polygon", label: "Polygon", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <polygon points="12,3 21,9 18,20 6,20 3,9"/>
        </svg>,
      },
      {
        id: "spline", label: "Spline / Curve", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M3 20 C7 4 17 4 21 20" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "wall", label: "Draw Wall", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="9" width="20" height="6" rx="1"/>
        </svg>,
      },
    ],
  },
  {
    label: "MODIFY",
    tools: [
      {
        id: "rotate", label: "Rotate", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "mirror", label: "Mirror", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="12" y1="3" x2="12" y2="21"/>
          <path d="M5 7l-3 5 3 5M19 7l3 5-3 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "trim", label: "Trim / Crop", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M6 2L6 16L20 16M2 6L16 6L16 20" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "stretch", label: "Stretch", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M3 12h18M15 6l6 6-6 6M9 6L3 12l6 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "offset", label: "Offset", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="1"/>
          <rect x="11" y="11" width="10" height="10" rx="1"/>
        </svg>,
      },
    ],
  },
  {
    label: "INSERT",
    tools: [
      {
        id: "insert_product", label: "Insert Product", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="7" width="18" height="13" rx="1"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "insert_block", label: "Insert Block / Symbol", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "insert_image", label: "Insert Image", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
    ],
  },
  {
    label: "ANNOTATE",
    tools: [
      {
        id: "text", label: "Text / Label", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <polyline points="4 7 4 4 20 4 20 7" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="9" y1="20" x2="15" y2="20" strokeLinecap="round"/>
          <line x1="12" y1="4" x2="12" y2="20" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "annotation", label: "Annotation / Note Bubble", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "leader", label: "Leader / Pointer", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M5 19L19 5M19 5h-6M19 5v6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
    ],
  },
  {
    label: "DIMENSION",
    tools: [
      {
        id: "dim_linear", label: "Linear Dimension", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
          <line x1="3" y1="6" x2="3" y2="18" strokeLinecap="round"/>
          <line x1="21" y1="6" x2="21" y2="18" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "dim_aligned", label: "Aligned Dimension", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="4" y1="20" x2="20" y2="4" strokeLinecap="round"/>
          <line x1="4" y1="20" x2="4" y2="14" strokeLinecap="round"/>
          <line x1="20" y1="10" x2="20" y2="4" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "dim_radius", label: "Radius Dimension", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="9"/>
          <line x1="12" y1="12" x2="19" y2="12" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "dim_angular", label: "Angular Dimension", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 19V5M5 12h14" strokeLinecap="round"/>
          <path d="M9 9 A4 4 0 0 1 15 9" strokeLinecap="round" fill="none"/>
        </svg>,
      },
      {
        id: "measure_length", label: "Measure Length", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M2 12h20M6 8l-4 4 4 4M18 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "measure_area", label: "Measure Area", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="1" strokeDasharray="3 2"/>
          <text x="12" y="14" fontSize="6" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="monospace" fontWeight="bold">m²</text>
        </svg>,
      },
      {
        id: "measure_perimeter", label: "Measure Perimeter", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M3 3h18v18H3z"/>
          <circle cx="3" cy="3" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="21" cy="3" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="21" cy="21" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="3" cy="21" r="1.5" fill="currentColor" stroke="none"/>
        </svg>,
      },
    ],
  },
  {
    label: "VIEW",
    tools: [
      {
        id: "zoomfit", label: "Zoom to Fit", active: true,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round"/>
          <line x1="8" y1="11" x2="14" y2="11" strokeLinecap="round"/>
          <line x1="11" y1="8" x2="11" y2="14" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "grid", label: "Toggle Grid", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
          <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>
        </svg>,
      },
      {
        id: "snap", label: "Snap — snaps products to adjacent products and walls when placing", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round"/>
        </svg>,
      },
      {
        id: "ortho", label: "Ortho Mode — constrain lines to 90°", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M4 20V4h16" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 12h8v8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
      {
        id: "layers", label: "Layer Manager", active: false,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
      },
    ],
  },
];

// ─── COMPONENT ───────────────────────────────────────────────
function CADToolbar({ activeTool, onToolChange, onZoomFit }) {

  const [tooltip, setTooltip] = useState(null);
  const btnRefs = useRef({});

  const stripRef = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const t = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  function scrollStrip(dir) {
    stripRef.current?.scrollBy({ left: dir * 120, behavior: "smooth" });
  }

  function handleClick(tool) {
    if (!tool.active) return;
    if (tool.id === "zoomfit") {
      if (onZoomFit) onZoomFit();
      return;
    }
    onToolChange(tool.id);
  }

  function handleMouseEnter(e, tool) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label:  tool.label,
      active: tool.active,
      x:      rect.left + rect.width / 2,
      y:      rect.bottom + 6,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <>
      <div style={{
        width:        "100%",
        height:       "38px",
        flexShrink:   0,
        background:   C.barBg,
        borderBottom: `1px solid ${C.barBorder}`,
        display:      "flex",
        alignItems:   "center",
        zIndex:       10,
      }}>

        <button
          onClick={() => scrollStrip(-1)}
          title="Scroll left"
          style={{
            flex:           "0 0 26px",
            width:          "26px",
            height:         "100%",
            background:     C.barBg,
            border:         "none",
            borderRight:    `1px solid ${C.sepColor}`,
            color:          C.iconEnabled,
            fontSize:       "18px",   /* icon (‹) — not tokenized */
            lineHeight:     1,
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            opacity:        canScrollLeft ? 1 : 0.25,
            pointerEvents:  canScrollLeft ? "auto" : "none",
            transition:     "opacity 0.15s",
          }}
        >‹</button>

        <div
          ref={stripRef}
          onScroll={checkScroll}
          style={{
            flex:           1,
            minWidth:       0,
            height:         "100%",
            display:        "flex",
            alignItems:     "center",
            padding:        "0 8px",
            overflowX:      "auto",
            overflowY:      "visible",
            scrollbarWidth: "none",
          }}
        >

          {TOOL_GROUPS.map((group, gi) => (
            <div key={gi} style={{ display: "flex", alignItems: "center", gap: "0" }}>

              <span style={{
                fontSize:      "var(--fs-base)",
                color:         C.groupLabel,
                fontFamily:    "'IBM Plex Sans', monospace",
                letterSpacing: "0.8px",
                padding:       "0 5px 0 4px",
                whiteSpace:    "nowrap",
                userSelect:    "none",
                textTransform: "uppercase",
              }}>
                {group.label}
              </span>

              {group.tools.map(tool => {
                const isActive  = activeTool === tool.id;
                const isEnabled = tool.active;

                return (
                  <button
                    key={tool.id}
                    ref={el => btnRefs.current[tool.id] = el}
                    onClick={() => handleClick(tool)}
                    onMouseEnter={e => handleMouseEnter(e, tool)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      width:          "30px",
                      height:         "30px",
                      background:     isActive ? C.activeBg : "transparent",
                      border:         `1px solid ${isActive ? C.activeBorder : "transparent"}`,
                      borderRadius:   "4px",
                      color:          isActive
                                        ? C.iconActive
                                        : isEnabled
                                          ? C.iconEnabled
                                          : C.iconDisabled,
                      cursor:         isEnabled ? "pointer" : "not-allowed",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      flexShrink:     0,
                      transition:     "background 0.1s, color 0.1s, border-color 0.1s",
                    }}
                  >
                    {tool.icon}
                  </button>
                );
              })}

              {gi < TOOL_GROUPS.length - 1 && (
                <div style={{
                  width:      "1px",
                  height:     "20px",
                  background: C.sepColor,
                  margin:     "0 6px",
                  flexShrink: 0,
                }} />
              )}

            </div>
          ))}

        </div>

        <button
          onClick={() => scrollStrip(1)}
          title="Scroll right"
          style={{
            flex:           "0 0 26px",
            width:          "26px",
            height:         "100%",
            background:     C.barBg,
            border:         "none",
            borderLeft:     `1px solid ${C.sepColor}`,
            color:          C.iconEnabled,
            fontSize:       "18px",   /* icon (›) — not tokenized */
            lineHeight:     1,
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            opacity:        canScrollRight ? 1 : 0.25,
            pointerEvents:  canScrollRight ? "auto" : "none",
            transition:     "opacity 0.15s",
          }}
        >›</button>

      </div>

      {tooltip && (
        <div style={{
          position:     "fixed",
          left:         `${tooltip.x}px`,
          top:          `${tooltip.y}px`,
          transform:    "translateX(-50%)",
          background:   C.tooltipBg,
          border:       `1px solid ${C.tooltipBorder}`,
          borderRadius: "4px",
          padding:      "5px 10px",
          display:      "flex",
          flexDirection:"column",
          gap:          "2px",
          zIndex:       9999,
          pointerEvents:"none",
          whiteSpace:   "nowrap",
          boxShadow:    "0 4px 16px rgba(0,0,0,0.6)",
        }}>
          <span style={{ fontSize: "var(--fs-base)", color: C.tooltipText, fontFamily: "'DM Sans', sans-serif" }}>
            {tooltip.label}
          </span>
          {!tooltip.active && (
            <span style={{ fontSize: "var(--fs-base)", color: C.tooltipSoon, fontFamily: "'IBM Plex Sans', monospace", letterSpacing: "0.5px" }}>
              coming soon
            </span>
          )}
        </div>
      )}
    </>
  );
}

export default CADToolbar;