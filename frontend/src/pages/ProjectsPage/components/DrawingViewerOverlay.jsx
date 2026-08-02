// ─────────────────────────────────────────────────────────────
// DrawingViewerOverlay.jsx
//
// The zoom/pan/paging drawing viewer modal. `viewer` is the full
// return value of useDrawingViewer() — this component is purely
// presentational over it. Owns its own resizable-sidebar hook
// instance (invert: true — right-anchored panel, grows when
// dragging left) since the divider and its container both live
// entirely inside this overlay.
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useResizableSidebar } from "../../../shared/useResizableSidebar.js";

const SIDEBAR_MIN = 25;
const SIDEBAR_MAX = 40;

function DrawingViewerOverlay({ viewer, selectedProject, onClose }) {
  const viewerRef = useRef(null);
  const sidebar = useResizableSidebar({ containerRef: viewerRef, initial: 28, min: SIDEBAR_MIN, max: SIDEBAR_MAX, invert: true });
  const [dividerHover, setDividerHover] = useState(false);

  const {
    viewerDrawing, zoom, currentPage, totalPages, canvasRef, ZOOM_MIN, ZOOM_MAX,
    zoomIn, zoomOut, zoomReset, nextPage, prevPage,
    handleMouseDown, handleMouseMove, handleMouseUp,
  } = viewer;

  return (
    <div className="vw-overlay">
      <div className="vw-viewer" ref={viewerRef}>
        <div className="vw-header">
          <div className="vw-header-left">
            <span className="vw-header-number">{viewerDrawing.drawing_number}</span>
            <span className="vw-header-sep">·</span>
            <span className="vw-header-title">{viewerDrawing.title}</span>
            {selectedProject && <>
              <span className="vw-header-sep">·</span>
              <span className="vw-header-meta">#{selectedProject.project_number}</span>
              <span className="vw-header-sep">·</span>
              <span className="vw-header-meta">{selectedProject.project_name}</span>
            </>}
            {viewerDrawing.revision !== undefined && <>
              <span className="vw-header-sep">·</span>
              <span className="vw-header-rev">Rev {viewerDrawing.revision}</span>
            </>}
          </div>
          <div className="vw-header-right">
            <button className="vw-close-btn" onClick={onClose} title="Close viewer">✕</button>
          </div>
        </div>

        <div className="vw-body">
          <div className="vw-canvas-col">
            <div ref={canvasRef} className="vw-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}>
              {viewerDrawing.revisions && viewerDrawing.revisions.some(r => r.is_locked && r.pdf_path) ? (
                <div className="vw-canvas-msg">
                  <div className="vw-canvas-msg-icon">📄</div>
                  <div className="vw-canvas-msg-title">PDF viewer — Phase 8</div>
                  <div className="vw-canvas-msg-sub">
                    {viewerDrawing.revisions.filter(r => r.is_locked).length} committed revision(s) available
                  </div>
                </div>
              ) : (
                <div className="vw-canvas-empty">
                  <div className="vw-canvas-empty-glyph">⬡</div>
                  <div className="vw-canvas-empty-title">No revision has been committed for this drawing.</div>
                  <div className="vw-canvas-empty-text">
                    Open the drawing in the workspace, complete your work, then commit the revision to generate a PDF.
                  </div>
                </div>
              )}
            </div>

            <div className="vw-bottom-bar">
              <div className="vw-bottom-inner">
                <div className="vw-zoom-group">
                  <button className="vw-zoom-btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN}>−</button>
                  <span className="vw-zoom-display" onClick={zoomReset} title="Click to reset">{zoom}%</span>
                  <button className="vw-zoom-btn" onClick={zoomIn} disabled={zoom >= ZOOM_MAX}>+</button>
                </div>
                <div className="vw-bottom-sep" />
                <div className="vw-page-nav">
                  <button className="vw-page-btn" disabled={currentPage <= 1} onClick={prevPage}>‹</button>
                  <div className="vw-page-display">
                    <span className="vw-page-label">Page</span>
                    <span className="vw-page-current">{currentPage}</span>
                    <span className="vw-page-label">of</span>
                    <span className="vw-page-total">{totalPages}</span>
                  </div>
                  <button className="vw-page-btn" disabled={currentPage >= totalPages} onClick={nextPage}>›</button>
                </div>
              </div>
            </div>
          </div>

          <div className={`vw-sidebar-divider${(sidebar.isDragging || dividerHover) ? " vw-sidebar-divider--active" : ""}`}
            onMouseDown={sidebar.onDividerDown}
            onMouseEnter={() => setDividerHover(true)}
            onMouseLeave={() => setDividerHover(false)} />

          <div className="vw-sidebar" style={{ width: `${sidebar.pct}%` }}>
            <div className="vw-sidebar-label">PROPERTIES</div>
            <div className="vw-sidebar-empty">
              <div className="vw-sidebar-empty-glyph">⬡</div>
              <div className="vw-sidebar-coming">Coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrawingViewerOverlay;
