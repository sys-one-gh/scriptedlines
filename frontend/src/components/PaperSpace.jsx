// ─────────────────────────────────────────────────────────────
// PaperSpace.jsx
//
// The main drawing canvas component.
//
// Font sizes use --fs-base/--fs-md tokens (see tokens.css) for
// UI chrome (bottom bar, modals). The exportToPDF() SVG text
// (font-size="2.5") is physical mm-based sizing for the printed
// sheet — drawing-space content, NOT part of the UI token scale,
// left untouched. navBtnStyle's fontSize sizes icon characters
// (−, +, ‹, ›) — uses --icon-sm.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client.js";

function PaperSpace({ paper, drawing, activeTool, onToolChange, registerZoomFit }) {

  const scrollRef = useRef(null);
  const paperRef  = useRef(null);

  const GAP = 60;

  const [zoom,        setZoom]        = useState(1);
  const [baseSize,    setBaseSize]    = useState({ width: 800, height: 533 });
  const [frameSize,   setFrameSize]   = useState({ width: 0, height: 0 });
  const [isPanning,   setIsPanning]   = useState(false);
  const [panStart,    setPanStart]    = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [droppedProduct, setDroppedProduct] = useState(null);

  const [pages,            setPages]            = useState([{ id: 1, label: "Page 1" }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [savingPage,       setSavingPage]        = useState(false);

  const [commitModal,    setCommitModal]    = useState(null);
  const [commitLoading,  setCommitLoading]  = useState(false);
  const [commitError,    setCommitError]    = useState("");
  const [actionLoading,  setActionLoading]  = useState(false);

  useEffect(() => {
    if (!drawing) return;
    const count = drawing.page_count || 1;
    const initialPages = Array.from({ length: count }, (_, i) => ({
      id:    i + 1,
      label: `Page ${i + 1}`,
    }));
    setPages(initialPages);
    setCurrentPageIndex(0);
  }, [drawing]);

  useEffect(() => {
    if (registerZoomFit) registerZoomFit(() => setZoom(1));
  }, [registerZoomFit]);


  useEffect(() => {
    function calculateBaseSize() {
      const frame = scrollRef.current;
      if (!frame) return;

      const frameWidth  = frame.clientWidth;
      const frameHeight = frame.clientHeight;
      setFrameSize({ width: frameWidth, height: frameHeight });

      const ratio          = paper.widthMm / paper.heightMm;
      const availableWidth  = frameWidth  - GAP * 2;
      const availableHeight = frameHeight - GAP * 2;

      let width  = availableWidth  * 0.9;
      let height = width / ratio;

      if (height > availableHeight * 0.9) {
        height = availableHeight * 0.9;
        width  = height * ratio;
      }

      setBaseSize({ width, height });
    }

    calculateBaseSize();

    const frame = scrollRef.current;
    let observer;
    if (frame && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(calculateBaseSize);
      observer.observe(frame);
    }

    window.addEventListener("resize", calculateBaseSize);
    return () => {
      window.removeEventListener("resize", calculateBaseSize);
      if (observer) observer.disconnect();
    };
  }, [paper]);


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


  function handleMouseDown(event) {
    if (event.button !== 0 || activeTool !== "pan") return;
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
      frame.scrollLeft = scrollStart.left - (event.clientX - panStart.x);
      frame.scrollTop  = scrollStart.top  - (event.clientY - panStart.y);
    }
    function onMouseUp() { setIsPanning(false); }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [isPanning, panStart, scrollStart]);


  function handleContextMenu(event) {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }

  function selectTool(tool) {
    if (onToolChange) onToolChange(tool);
    setContextMenu(null);
  }

  useEffect(() => {
    function closeMenu() { setContextMenu(null); }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);


  function goToPrevPage() {
    if (currentPageIndex <= 0) return;
    setCurrentPageIndex(currentPageIndex - 1);
    setZoom(1);
  }

  function goToNextPage() {
    if (currentPageIndex >= pages.length - 1) return;
    setCurrentPageIndex(currentPageIndex + 1);
    setZoom(1);
  }

  async function addPage() {
    setContextMenu(null);

    const newPage = {
      id:    pages.length + 1,
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

    if (drawing?.id) {
      setSavingPage(true);
      try {
        await apiFetch(`/drawings/${drawing.id}`, {
          method:  "PUT",
          body:    JSON.stringify({ page_count: updatedPages.length }),
        });
      } catch {
        console.error("Failed to save page count to DB");
      }
      setSavingPage(false);
    }
  }


  // ─── PDF EXPORT ──────────────────────────────────────────────
  // Drawing-space / print content — the SVG text font-size here is
  // in millimeters, relative to the physical paper sheet. NOT part
  // of the UI token scale. Left untouched intentionally.
  function exportToPDF() {
    setContextMenu(null);

    const printWindow = window.open("", "_blank");

    const pagesHTML = pages.map((page, index) => `
      <div class="pdf-page" ${index < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 ${paper.widthMm} ${paper.heightMm}"
          width="${paper.widthMm}mm"
          height="${paper.heightMm}mm"
        >
          <rect x="0" y="0" width="${paper.widthMm}" height="${paper.heightMm}" fill="white" />
          <rect
            x="${paper.widthMm * 0.01}" y="${paper.heightMm * 0.01}"
            width="${paper.widthMm * 0.98}" height="${paper.heightMm * 0.98}"
            fill="none" stroke="#333333" stroke-width="0.5"
          />
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


  function handleDragOver(event) { event.preventDefault(); }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const rawData = event.dataTransfer.getData("application/json");
    if (!rawData) return;
    setDroppedProduct(JSON.parse(rawData));
  }


  async function executeCommit() {
    if (!drawing?.id) return;
    setCommitLoading(true);
    setCommitError("");
    try {
      const res  = await apiFetch(`/drawings/${drawing.id}/commit`, {
        method:  "POST",
        body:    JSON.stringify({ description: "Issued for Review" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommitError(data.detail || "Commit failed.");
        setCommitLoading(false);
        return;
      }
      setCommitModal(null);
      window.location.href = "/projects";
    } catch {
      setCommitError("Could not connect to server.");
      setCommitLoading(false);
    }
  }

  async function executeSubmit() {
    if (!drawing?.id) return;
    setActionLoading(true);
    try {
      await apiFetch(`/drawings/${drawing.id}/submit`, {
        method: "POST",
        body:   JSON.stringify({}),
      });
      window.location.href = "/projects";
    } catch { /* silent */ }
    setActionLoading(false);
  }

  async function executeFinalCommit() {
    if (!drawing?.id) return;
    setCommitLoading(true);
    setCommitError("");
    try {
      const res  = await apiFetch(`/drawings/${drawing.id}/final-commit`, {
        method:  "POST",
        body:    JSON.stringify({ description: "Final Release" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommitError(data.detail || "Final commit failed.");
        setCommitLoading(false);
        return;
      }
      setCommitModal(null);
      window.location.href = "/projects";
    } catch {
      setCommitError("Could not connect to server.");
      setCommitLoading(false);
    }
  }

  const status = drawing?.status || "draft";
  const canCommit       = ["draft", "review", "approved"].includes(status);
  const canSubmit       = status === "submittal_pending";
  const canFinalRelease = ["submitted", "approved"].includes(status);
  const isIssued        = status === "issued";

  function getCursor() {
    if (activeTool === "pan") return isPanning ? "grabbing" : "grab";
    return "default";
  }


  const paperWidth  = baseSize.width  * zoom;
  const paperHeight = baseSize.height * zoom;
  const stageWidth  = Math.max(paperWidth  + GAP * 2, frameSize.width);
  const stageHeight = Math.max(paperHeight + GAP * 2, frameSize.height);


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      <div
        className="paper-scroll-area"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        style={{
          flex:     1,
          cursor:   getCursor(),
          overflow: zoom > 1 ? "auto" : "hidden",
        }}
      >
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
          <div
            className="paper-size-layer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ width: `${paperWidth}px`, height: `${paperHeight}px` }}
          >
            <svg
              ref={paperRef}
              viewBox={`0 0 ${paper.widthMm} ${paper.heightMm}`}
              className="paper-svg"
            >
              <rect x="0" y="0" width={paper.widthMm} height={paper.heightMm} fill="white" />

              <rect
                x={paper.widthMm  * 0.01}
                y={paper.heightMm * 0.01}
                width={paper.widthMm  * 0.98}
                height={paper.heightMm * 0.98}
                fill="none"
                stroke="#333"
                strokeWidth="0.5"
              />
            </svg>
          </div>
        </div>
      </div>


      <div style={{
        height:         "44px",
        flexShrink:     0,
        background:     "#111111",
        borderTop:      "1px solid #1e1e1e",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 12px",
        userSelect:     "none",
        gap:            "8px",
      }}>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button onClick={() => setZoom(z => Math.max(1, z / 1.25))} disabled={zoom <= 1}  style={navBtnStyle} title="Zoom out">−</button>
          <span onClick={() => setZoom(1)} title="Click to reset zoom" style={{ fontSize: "var(--fs-base)", color: "#ffffff", fontFamily: "'IBM Plex Sans', monospace", cursor: "pointer", minWidth: "42px", textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(64, z * 1.25))} disabled={zoom >= 64} style={navBtnStyle} title="Zoom in">+</button>
        </div>

        <div style={barSep} />

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button onClick={goToPrevPage} disabled={currentPageIndex <= 0}              style={navBtnStyle} title="Previous page">‹</button>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 12px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: "4px" }}>
            <span style={{ fontSize: "var(--fs-base)", color: "#888888", fontFamily: "'IBM Plex Sans', monospace" }}>Page</span>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: "700", color: "#ffffff", fontFamily: "'IBM Plex Sans', monospace" }}>{currentPageIndex + 1}</span>
            <span style={{ fontSize: "var(--fs-base)", color: "#888888", fontFamily: "'IBM Plex Sans', monospace" }}>of</span>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: "600", color: "#4f8ef7", fontFamily: "'IBM Plex Sans', monospace" }}>{pages.length}</span>
          </div>
          <button onClick={goToNextPage} disabled={currentPageIndex >= pages.length - 1} style={navBtnStyle} title="Next page">›</button>
          <button onClick={addPage} style={{ ...navBtnStyle, width: "auto", padding: "0 10px", fontSize: "var(--fs-base)" }} title="Add page after current">
            {savingPage ? "Saving..." : "+ Page"}
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>

          <BBtn title="Undo (Phase 7)" disabled>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </BBtn>

          <BBtn title="Redo (Phase 7)" disabled>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
            </svg>
          </BBtn>

          <div style={barSep} />

          <BBtn title="Save drawing (Phase 7)" disabled label="Save">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </BBtn>

          <BBtn title="Export draft PDF (Phase 8)" disabled label="Export">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </BBtn>

          <div style={barSep} />

          <BBtn
            title={
              isIssued       ? "Drawing is Final Release — cannot commit" :
              !canCommit     ? `Cannot commit from status: ${status}` :
              "Commit revision — locks this revision and generates PDF"
            }
            disabled={!canCommit || isIssued}
            label="Commit Rev"
            color="#e6a817"
            onClick={() => { setCommitModal("commit"); setCommitError(""); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </BBtn>

          <BBtn
            title={canSubmit ? "Submit to client for review" : `Drawing must be in Submittal Pending to submit`}
            disabled={!canSubmit || actionLoading}
            label={actionLoading ? "Submitting..." : "Submit"}
            color="#4f8ef7"
            onClick={executeSubmit}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </BBtn>

          <BBtn
            title={
              isIssued         ? "Already Final Release" :
              !canFinalRelease ? "Drawing must be Submitted or Approved for Final Release" :
              "Final Release — locks drawing permanently for production"
            }
            disabled={!canFinalRelease || isIssued}
            label="Final Release"
            color="#4caf50"
            onClick={() => { setCommitModal("final"); setCommitError(""); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </BBtn>

        </div>

        <div style={{ fontSize: "var(--fs-base)", color: "#444444", fontFamily: "'IBM Plex Sans', monospace", flexShrink: 0, paddingLeft: "8px" }}>
          {paper.label}
        </div>

      </div>


      {droppedProduct && (
        <div className="drop-form-overlay">
          <div className="drop-form">
            <h3>Add Product</h3>
            <p>Product: <strong>{droppedProduct.name}</strong></p>
            <label>Width (mm)</label>
            <input type="number" placeholder="600" />
            <label>Height (mm)</label>
            <input type="number" placeholder="870" />
            <label>Depth (mm)</label>
            <input type="number" placeholder="580" />
            <div className="drop-form-actions">
              <button onClick={() => setDroppedProduct(null)}>Cancel</button>
              <button onClick={() => setDroppedProduct(null)}>Add</button>
            </div>
          </div>
        </div>
      )}

      {commitModal && (
        <div style={{
          position:        "fixed",
          inset:           0,
          background:      "rgba(0,0,0,0.75)",
          zIndex:          9999,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
        }}>
          <div style={{
            background:   "#111111",
            border:       `1px solid ${commitModal === "final" ? "#2a5a2a" : "#4a3800"}`,
            borderRadius: "8px",
            padding:      "28px 32px",
            maxWidth:     "440px",
            width:        "90%",
            display:      "flex",
            flexDirection:"column",
            gap:          "16px",
          }}>
            <div style={{ fontSize: "var(--fs-md)", fontWeight: "700", color: "#ffffff", fontFamily: "var(--font-ui)" }}>
              {commitModal === "final" ? "Final Release" : "Commit Revision"}
            </div>

            <div style={{
              background:   commitModal === "final" ? "#0a1f0a" : "#1a1200",
              border:       `1px solid ${commitModal === "final" ? "#2a5a2a" : "#4a3800"}`,
              borderRadius: "4px",
              padding:      "12px 14px",
              fontSize:     "var(--fs-base)",
              color:        commitModal === "final" ? "#4caf50" : "#e6a817",
              fontFamily:   "var(--font-ui)",
              lineHeight:   "1.6",
            }}>
              {commitModal === "final"
                ? "This will permanently lock this drawing as the final production release. This action cannot be undone."
                : `Once you commit Rev ${drawing?.revision || "00"}, you will not be able to edit this revision. A PDF will be generated and saved. The drawing status will change to Submittal Pending.`
              }
            </div>

            {commitError && (
              <div style={{ fontSize: "var(--fs-base)", color: "#f47070", fontFamily: "var(--font-ui)" }}>
                {commitError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => { setCommitModal(null); setCommitError(""); }}
                disabled={commitLoading}
                style={{
                  padding:      "8px 18px",
                  background:   "transparent",
                  border:       "1px solid #2a2a2a",
                  borderRadius: "4px",
                  color:        "#888888",
                  fontSize:     "var(--fs-base)",
                  cursor:       "pointer",
                  fontFamily:   "var(--font-ui)",
                }}
              >
                Discard
              </button>
              <button
                onClick={commitModal === "final" ? executeFinalCommit : executeCommit}
                disabled={commitLoading}
                style={{
                  padding:      "8px 20px",
                  background:   commitModal === "final" ? "#4caf50" : "#e6a817",
                  border:       "none",
                  borderRadius: "4px",
                  color:        "#000000",
                  fontSize:     "var(--fs-base)",
                  fontWeight:   "700",
                  cursor:       commitLoading ? "not-allowed" : "pointer",
                  fontFamily:   "var(--font-ui)",
                  opacity:      commitLoading ? 0.6 : 1,
                }}
              >
                {commitLoading ? "Processing..." : commitModal === "final" ? "Final Release" : "Commit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── NAV BUTTON STYLE ────────────────────────────────────────
// fontSize here sizes icon characters (−, +, ‹, ›) — uses --icon-sm.
const navBtnStyle = {
  width:          "28px",
  height:         "28px",
  background:     "#161616",
  border:         "1px solid #2a2a2a",
  color:          "#cccccc",
  fontSize:       "var(--icon-sm)",
  lineHeight:     "1",
  borderRadius:   "4px",
  cursor:         "pointer",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  fontFamily:     "monospace",
  transition:     "color 0.12s, border-color 0.12s, background 0.12s",
};

const barSep = {
  width:      "1px",
  height:     "18px",
  background: "#222222",
  flexShrink: 0,
  margin:     "0 2px",
};

function BBtn({ children, title, disabled, label, color, onClick }) {
  return (
    <button
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "4px",
        height:         "28px",
        padding:        "0 8px",
        background:     "transparent",
        border:         "1px solid transparent",
        borderRadius:   "4px",
        color:          disabled ? "#333333" : (color || "#aaaaaa"),
        cursor:         disabled ? "not-allowed" : "pointer",
        fontFamily:     "'DM Sans', sans-serif",
        fontSize:       "var(--fs-base)",
        whiteSpace:     "nowrap",
        transition:     "background 0.12s, border-color 0.12s",
      }}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
}

export default PaperSpace;