import { useEffect, useRef, useState } from "react";

function PaperSpace({ paper }) {

  // ─── REFS ────────────────────────────────────────────────────
  // scrollRef → the black frame (scroll container / viewport)
  // paperRef  → the SVG sheet (used for cursor zoom math)
  const scrollRef = useRef(null);
  const paperRef  = useRef(null);


  // ─── CONSTANTS ───────────────────────────────────────────────
  // GAP: fixed black border visible on all 4 sides at all zoom levels
  const GAP = 60;


  // ─── STATE ───────────────────────────────────────────────────

  // zoom: 1 = default fitted view, 64 = 6400% max (Adobe PDF Reader)
  const [zoom, setZoom] = useState(1);

  // baseSize: pixel dimensions of white paper at zoom = 1
  const [baseSize, setBaseSize] = useState({ width: 800, height: 533 });

  // frameSize: actual pixel size of the black frame
  // Stored in state so derived calculations always have real values
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  // activeTool: "cursor" = pointer, "hand" = click-drag pan
  const [activeTool, setActiveTool] = useState("cursor");

  // isPanning: true while user is dragging with hand tool
  const [isPanning, setIsPanning] = useState(false);

  // panStart: mouse x/y when drag started
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // scrollStart: scroll position when drag started
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  // contextMenu: x/y position of right-click menu, null = hidden
  const [contextMenu, setContextMenu] = useState(null);

  // droppedProduct: data of item dropped onto paper, null = form hidden
  const [droppedProduct, setDroppedProduct] = useState(null);

  // pages: array of page objects — each page is one drawing sheet
  const [pages, setPages] = useState([
    { id: 1, label: "Page 1" },
  ]);

  // currentPageIndex: index of currently visible page (0-based)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);


  // ─── BASE SIZE + FRAME SIZE CALCULATION ─────────────────────
  // Calculates pixel size of white paper at zoom = 1.
  // Paper fits inside the black frame with GAP space on all sides.
  // Runs on mount, on paper change, and on window resize.
  useEffect(() => {
    function calculateBaseSize() {
      const frame = scrollRef.current;
      if (!frame) return;

      const frameWidth  = frame.clientWidth;
      const frameHeight = frame.clientHeight;

      // Store frame size in state so render always has real values
      setFrameSize({ width: frameWidth, height: frameHeight });

      // Paper aspect ratio — e.g. Arch D 36"×24" = 1.5
      const ratio = paper.widthMm / paper.heightMm;

      // Subtract GAP on both sides before fitting
      const availableWidth  = frameWidth  - GAP * 2;
      const availableHeight = frameHeight - GAP * 2;

      // Fit paper to 90% of available space
      let width  = availableWidth  * 0.9;
      let height = width / ratio;

      // If height overflows, fit by height instead
      if (height > availableHeight * 0.9) {
        height = availableHeight * 0.9;
        width  = height * ratio;
      }

      setBaseSize({ width, height });
    }

    calculateBaseSize();
    window.addEventListener("resize", calculateBaseSize);
    return () => window.removeEventListener("resize", calculateBaseSize);

  }, [paper]);


  // ─── ZOOM — CTRL + SCROLL WHEEL ─────────────────────────────
  // Ctrl + scroll = zoom toward cursor (Adobe-style)
  // Scroll without Ctrl = normal page scroll
  // Min zoom = 1, Max zoom = 64 (6400%)
  useEffect(() => {
    const frame = scrollRef.current;
    if (!frame) return;

    function handleWheel(event) {
      if (!event.ctrlKey) return;

      event.preventDefault();

      const rect   = frame.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const scrollLeft = frame.scrollLeft;
      const scrollTop  = frame.scrollTop;

      setZoom((currentZoom) => {
        const factor  = event.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(currentZoom * factor, 1), 64);

        requestAnimationFrame(() => {
          const ratio = newZoom / currentZoom;
          frame.scrollLeft = (scrollLeft + mouseX) * ratio - mouseX;
          frame.scrollTop  = (scrollTop  + mouseY) * ratio - mouseY;
        });

        return newZoom;
      });
    }

    frame.addEventListener("wheel", handleWheel, { passive: false });
    return () => frame.removeEventListener("wheel", handleWheel);

  }, [baseSize]);


  // ─── PAN — HAND TOOL ────────────────────────────────────────
  // Left mouse + hand tool = click and drag to pan.
  // mousemove and mouseup on window so fast drags never break.

  function handleMouseDown(event) {
    if (event.button !== 0 || activeTool !== "hand") return;

    const frame = scrollRef.current;
    if (!frame) return;

    setIsPanning(true);
    setPanStart({ x: event.clientX, y: event.clientY });
    setScrollStart({ left: frame.scrollLeft, top: frame.scrollTop });
    event.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(event) {
      if (!isPanning) return;

      const frame = scrollRef.current;
      if (!frame) return;

      const dx = event.clientX - panStart.x;
      const dy = event.clientY - panStart.y;

      frame.scrollLeft = scrollStart.left - dx;
      frame.scrollTop  = scrollStart.top  - dy;
    }

    function onMouseUp() {
      setIsPanning(false);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };

  }, [isPanning, panStart, scrollStart]);


  // ─── RIGHT-CLICK CONTEXT MENU ────────────────────────────────
  // Shows at cursor position on right-click.
  // Closes when user clicks anywhere outside.

  function handleContextMenu(event) {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }

  function selectTool(tool) {
    setActiveTool(tool);
    setContextMenu(null);
  }

  useEffect(() => {
    function closeMenu() { setContextMenu(null); }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);


  // ─── PAGE SYSTEM ─────────────────────────────────────────────

  // Add a new blank page after the current page
  function addPage() {
    const newPage = {
      id: pages.length + 1,
      label: `Page ${pages.length + 1}`,
    };

    const updatedPages = [
      ...pages.slice(0, currentPageIndex + 1),
      newPage,
      ...pages.slice(currentPageIndex + 1),
    ];

    setPages(updatedPages);
    setCurrentPageIndex(currentPageIndex + 1);
    setZoom(1);
  }


  // ─── PDF EXPORT ──────────────────────────────────────────────
  // Opens browser print dialog with all pages as mm-sized SVG sheets.
  // Each page prints as a separate page in the PDF.
  // Page label sits below the printable border in the margin strip.
  function exportToPDF() {
    setContextMenu(null);

    const printWindow = window.open("", "_blank");

    // Printable border ends at 98% of paper height (y = heightMm * 0.99)
    // Page label sits at 99.5% — in the margin strip below the border
    const pagesHTML = pages.map((page, index) => `
      <div class="pdf-page" ${index < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 ${paper.widthMm} ${paper.heightMm}"
          width="${paper.widthMm}mm"
          height="${paper.heightMm}mm"
        >
          <!-- White paper background -->
          <rect x="0" y="0" width="${paper.widthMm}" height="${paper.heightMm}" fill="white" />

          <!-- Inner printable boundary — 98% of paper size -->
          <rect
            x="${paper.widthMm * 0.01}" y="${paper.heightMm * 0.01}"
            width="${paper.widthMm * 0.98}" height="${paper.heightMm * 0.98}"
            fill="none" stroke="#333333" stroke-width="0.5"
          />

          <!-- Page label — sits BELOW the printable border in the margin -->
          <!-- Border bottom edge is at heightMm * 0.99 -->
          <!-- Label at heightMm * 0.995 puts it in the margin strip -->
          <text
            x="${paper.widthMm * 0.97}"
            y="${paper.heightMm * 0.995}"
            font-family="IBM Plex Sans, monospace"
            font-size="2.5"
            fill="#999999"
            text-anchor="end"
          >${page.label}</text>
        </svg>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ScriptedLines Export</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; }
            .pdf-page {
              width: ${paper.widthMm}mm;
              height: ${paper.heightMm}mm;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            @page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }
            @media print {
              body { margin: 0; }
              .pdf-page { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${pagesHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }


  // ─── DRAG AND DROP ───────────────────────────────────────────

  // Required so browser allows dropping onto this element
  function handleDragOver(event) {
    event.preventDefault();
  }

  // Fires when a library item is dropped onto the paper
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const rawData = event.dataTransfer.getData("application/json");
    if (!rawData) return;

    setDroppedProduct(JSON.parse(rawData));
  }


  // ─── CURSOR ──────────────────────────────────────────────────
  // Returns CSS cursor string based on active tool and pan state
  function getCursor() {
    if (activeTool === "hand") return isPanning ? "grabbing" : "grab";
    return "default";
  }


  // ─── DERIVED SIZES ───────────────────────────────────────────
  // All paper sizing calculated in JS — CSS does not control sizes.

  // Paper pixel size at current zoom level
  const paperWidth  = baseSize.width  * zoom;
  const paperHeight = baseSize.height * zoom;

  // Stage must fit paper + GAP on all sides
  // Also must be at least as large as the frame for centering at zoom = 1
  const stageWidth  = Math.max(paperWidth  + GAP * 2, frameSize.width);
  const stageHeight = Math.max(paperHeight + GAP * 2, frameSize.height);


  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <>
      {/* ── BLACK FRAME (SCROLL CONTAINER) ──────────────────────
          Fixed size — fills center panel 100%.
          overflow switches dynamically:
            zoom = 1  → hidden  (clean frame, no scrollbars)
            zoom > 1  → auto    (scrollbars appear as paper grows)
          Only onMouseDown here — mousemove/mouseup are on window.
      ──────────────────────────────────────────────────────── */}
      <div
        className="paper-scroll-area"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          cursor:   getCursor(),
          overflow: zoom > 1 ? "auto" : "hidden",
        }}
      >

        {/* ── STAGE ─────────────────────────────────────────────
            Contains white paper + GAP space on all 4 sides.
            Size fully controlled by JS inline style.
        ──────────────────────────────────────────────────────── */}
        <div
          className="paper-stage"
          style={{
            width:          `${stageWidth}px`,
            height:         `${stageHeight}px`,
            display:        "flex",
            justifyContent: "center",
            alignItems:     "center",
          }}
        >

          {/* ── PAPER SIZE LAYER ────────────────────────────────
              Exact pixel size of white paper at current zoom.
          ──────────────────────────────────────────────────────── */}
          <div
            className="paper-size-layer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              width:  `${paperWidth}px`,
              height: `${paperHeight}px`,
            }}
          >

            {/* ── SVG SHEET ───────────────────────────────────────
                viewBox = real mm coordinates.
                All drawing objects use mm units inside here.
                Fully vector — sharp at any zoom level.
            ──────────────────────────────────────────────────────── */}
            <svg
              ref={paperRef}
              viewBox={`0 0 ${paper.widthMm} ${paper.heightMm}`}
              className="paper-svg"
            >
              {/* White sheet — full paper area */}
              <rect
                x="0"
                y="0"
                width={paper.widthMm}
                height={paper.heightMm}
                fill="white"
              />

              {/* Inner printable boundary — 98% of white paper */}
              {/* Border: top/left at 1%, bottom/right at 99% of paper */}
              <rect
                x={paper.widthMm  * 0.01}
                y={paper.heightMm * 0.01}
                width={paper.widthMm  * 0.98}
                height={paper.heightMm * 0.98}
                fill="none"
                stroke="#333"
                strokeWidth="0.5"
              />

              {/* Page label — sits BELOW the printable border */}
              {/* Border bottom edge = heightMm * 0.99              */}
              {/* Label at 0.995 = in the margin strip below border  */}
              <text
                x={paper.widthMm  * 0.97}
                y={paper.heightMm * 0.995}
                fontFamily="'IBM Plex Sans', monospace"
                fontSize="2.5"
                fill="#aaaaaa"
                textAnchor="end"
              >
                {`Page ${currentPageIndex + 1} of ${pages.length}`}
              </text>
            </svg>

          </div>
        </div>
      </div>


      {/* ── RIGHT-CLICK CONTEXT MENU ──────────────────────────────
          Adobe-style popup with tool ribbon + placeholder sections.
      ──────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="canvas-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── TOOL RIBBON ─────────────────────────────────────── */}
          <div className="context-ribbon">

            {/* Cursor tool */}
            <button
              className={`ribbon-btn ${activeTool === "cursor" ? "active-tool" : ""}`}
              onClick={() => selectTool("cursor")}
              title="Cursor"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 0 L4 20 L8 16 L12 24 L14 20 L10 12 L16 12 Z" />
              </svg>
            </button>

            {/* Hand tool */}
            <button
              className={`ribbon-btn ${activeTool === "hand" ? "active-tool" : ""}`}
              onClick={() => selectTool("hand")}
              title="Hand (Pan)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 7.5C21 6.7 20.3 6 19.5 6S18 6.7 18 7.5V6.5C18 5.7 17.3 5 16.5 5S15 5.7 15 6.5V6C15 5.2 14.3 4.5 13.5 4.5S12 5.2 12 6V3.5C12 2.7 11.3 2 10.5 2S9 2.7 9 3.5V14L6.6 11.6C6 11 5 11 4.4 11.6C3.8 12.2 3.8 13.2 4.4 13.8L9.2 19.4C10.1 20.4 11.4 21 12.8 21H16C18.8 21 21 18.8 21 16V7.5Z" />
              </svg>
            </button>

            {/* Add new page */}
            <button
              className="ribbon-btn"
              onClick={() => { addPage(); setContextMenu(null); }}
              title="Add Page"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Export PDF */}
            <button
              className="ribbon-btn"
              onClick={exportToPDF}
              title="Export PDF"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </button>

            {/* Zoom to fit — resets zoom to default view */}
            <button
              className="ribbon-btn"
              onClick={() => { setZoom(1); setContextMenu(null); }}
              title="Zoom to Fit"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>

            {/* Zoom % indicator — IBM Plex Sans technical font */}
            <span className="ribbon-zoom-indicator" title="Current zoom level">
              {Math.round(zoom * 100)}%
            </span>

          </div>

          <div className="context-divider" />

          {/* Section 1 — future annotation tools */}
          <div className="context-section">
            <button className="context-item coming-soon" disabled>
              Add Annotation
            </button>
            <button className="context-item coming-soon" disabled>
              Add Dimension
            </button>
          </div>

          <div className="context-divider" />

          {/* Section 2 — future drawing settings */}
          <div className="context-section">
            <button className="context-item coming-soon" disabled>
              Drawing Properties
            </button>
            <button className="context-item coming-soon" disabled>
              Drawing Settings
            </button>
          </div>

        </div>
      )}


      {/* ── DROP FORM MODAL ───────────────────────────────────────
          Opens when a library item is dropped onto the white paper.
          User fills in dimensions before object is placed.
      ──────────────────────────────────────────────────────── */}
      {droppedProduct && (
        <div className="drop-form-overlay">
          <div className="drop-form">

            <h3>Add Product</h3>
            <p>Product: <strong>{droppedProduct.name}</strong></p>

            <label>Width (mm)</label>
            <input type="number" placeholder="Example: 600" />

            <label>Height (mm)</label>
            <input type="number" placeholder="Example: 870" />

            <label>Depth (mm)</label>
            <input type="number" placeholder="Example: 580" />

            <div className="drop-form-actions">
              <button onClick={() => setDroppedProduct(null)}>Cancel</button>
              <button onClick={() => setDroppedProduct(null)}>Add</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default PaperSpace;