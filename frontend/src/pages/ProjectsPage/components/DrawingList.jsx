// ─────────────────────────────────────────────────────────────
// DrawingList.jsx
//
// Card and list rendering for the selected project's drawings,
// plus the loading / empty states. Both views share the same
// DrawingActionButtons per row so the button markup isn't
// duplicated.
// ─────────────────────────────────────────────────────────────

import DrawingActionButtons from "./DrawingActionButtons.jsx";

const PAPER_SIZE_LABELS = {
  "Arch_D": 'Arch D — 36" × 24"',
  "Arch_C": 'Arch C — 24" × 18"',
  "Arch_E": 'Arch E — 48" × 36"',
  "ANSI_B": 'ANSI B — 17" × 11"',
  "ANSI_A": 'ANSI A — 11" × 8.5"',
  "A1":     "A1 — 841 × 594 mm",
  "A3":     "A3 — 420 × 297 mm",
};

// DB stores draft/review/approved/issued — UI shows human-readable labels
const STATUS_LABELS = {
  draft:             "In Drafting",
  review:            "In Review",
  approved:          "Reviewed as Noted",
  submittal_pending: "Submittal Pending",
  submitted:         "Submitted",
  issued:            "Final Release",
};

// Status → CSS class suffix. Colors defined in ProjectsPage.css (.pp-status--draft etc)
const STATUS_CLASS = {
  draft:             "draft",
  review:            "review",
  approved:          "approved",
  submittal_pending: "subpending",
  submitted:         "submitted",
  issued:            "issued",
};

function DrawingList({
  loadingDrawings, filtered, viewMode, isArchived,
  sortField, sortDir, toggleSort,
  onOpen, onView, onDelete, onBlocked, onNewDrawing,
}) {
  const sortArrow = (field) =>
    sortField === field ? <span className="pp-sort-arrow">{sortDir === "asc" ? " ↑" : " ↓"}</span> : null;

  if (loadingDrawings) return <div className="pp-placeholder">Loading drawings...</div>;

  if (filtered.length === 0) {
    return (
      <div className="pp-empty">
        <div className="pp-empty-glyph">⬡</div>
        <div className="pp-empty-title">No Drawings Yet</div>
        <div className="pp-empty-text">Create the first drawing for this project.</div>
        <button className="pp-btn-primary" onClick={onNewDrawing}>+ New Drawing</button>
      </div>
    );
  }

  if (viewMode === "card") {
    return (
      <div className="pp-cards-grid">
        {filtered.map(d => (
          <div key={d.id} className="pp-card">
            <div className="pp-thumb">
              <div className="pp-thumb-grid" />
              <div className={`pp-thumb-status pp-status--${STATUS_CLASS[d.status] || "draft"}`}>
                <div className="pp-status-dot" />
                {STATUS_LABELS[d.status] || d.status}
              </div>
            </div>
            <div className="pp-card-body">
              <div className="pp-card-line1">
                <span className="pp-card-number">{d.drawing_number}</span>
                <span className="pp-card-sep">·</span>
                <span className="pp-card-title">{d.title}</span>
                <span className="pp-card-rev">Rev {d.revision || "00"}</span>
              </div>
              <div className="pp-card-line2">
                {d.mw_number  && <span className="pp-card-meta-item">MW# {d.mw_number}</span>}
                {d.level      && <><span className="pp-card-dot">·</span><span className="pp-card-meta-item">Lv {d.level}</span></>}
                {d.location   && <><span className="pp-card-dot">·</span><span className="pp-card-meta-item">{d.location}</span></>}
                {d.arch_ref   && <><span className="pp-card-dot">·</span><span className="pp-card-meta-item pp-card-arch">{d.arch_ref}</span></>}
              </div>
              <div className="pp-card-line3">
                <span className="pp-card-meta-item">{PAPER_SIZE_LABELS[d.paper_size] || d.paper_size}</span>
                <span className="pp-card-dot">·</span>
                <span className="pp-card-meta-item">{d.page_count || 1} {(d.page_count || 1) === 1 ? "Page" : "Pages"}</span>
              </div>
            </div>
            <div className="pp-card-actions">
              <DrawingActionButtons d={d} isArchived={isArchived} onOpen={onOpen} onView={onView} onDelete={onDelete} onBlocked={onBlocked} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pp-list-wrap">
      <div className="pp-list-header">
        <span className="pp-list-col pp-list-col--sortable pp-col-num" onClick={() => toggleSort("drawing_number")}>
          Drawing #{sortArrow("drawing_number")}
        </span>
        <span className="pp-list-col pp-list-col--sortable pp-col-name" onClick={() => toggleSort("title")}>
          Drawing Name{sortArrow("title")}
        </span>
        <span className="pp-list-col">Rev #</span>
        <span className="pp-list-col pp-list-col--sortable" onClick={() => toggleSort("mw_number")}>
          MW#{sortArrow("mw_number")}
        </span>
        <span className="pp-list-col pp-list-col--sortable" onClick={() => toggleSort("level")}>
          Level{sortArrow("level")}
        </span>
        <span className="pp-list-col pp-list-col--sortable pp-col-status" onClick={() => toggleSort("status")}>
          Status{sortArrow("status")}
        </span>
        <span className="pp-list-col pp-col-actions">Actions</span>
      </div>

      {filtered.map(d => (
        <div key={d.id} className="pp-list-row">
          <span className="pp-list-cell pp-cell-num">{d.drawing_number}</span>
          <span className="pp-list-cell pp-col-name">{d.title}</span>
          <span className="pp-list-cell pp-cell-mono">{d.revision || "00"}</span>
          <span className="pp-list-cell pp-cell-mono">{d.mw_number || "—"}</span>
          <span className="pp-list-cell">{d.level || "—"}</span>
          <span className="pp-list-cell pp-col-status">
            <span className={`pp-status-badge pp-status--${STATUS_CLASS[d.status] || "draft"}`}>
              <div className="pp-status-dot" />
              {STATUS_LABELS[d.status] || d.status}
            </span>
          </span>
          <span className="pp-list-cell pp-col-actions">
            <div className="pp-list-actions">
              <DrawingActionButtons d={d} isArchived={isArchived} onOpen={onOpen} onView={onView} onDelete={onDelete} onBlocked={onBlocked} />
            </div>
          </span>
        </div>
      ))}
    </div>
  );
}

export default DrawingList;
