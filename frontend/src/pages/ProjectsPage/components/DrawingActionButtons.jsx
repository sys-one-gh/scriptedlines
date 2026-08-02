// ─────────────────────────────────────────────────────────────
// DrawingActionButtons.jsx
//
// Renamed from ProjectsPageActionButtons.jsx — the old name
// described where it's used, not what it operates on. It's the
// per-drawing-row action buttons, rendered in both the card view
// and the list view so the markup lives in one place instead of
// being duplicated.
//
// Behavior:
//   - View     → always enabled (archived projects are view-only)
//   - Open     → disabled when archived; clicking shows archived notice
//   - 🗑 delete → disabled when archived; clicking shows archived notice
//   - + Rev / Export / BOM → always disabled (stubs for later phases)
//
// Props:
//   d            — the drawing object
//   isArchived   — boolean, true when the selected project is archived
//   onOpen(d)    — open drawing in workspace
//   onView(d)    — open drawing viewer
//   onDelete(d)  — open delete confirmation
//   onBlocked()  — called when an archived action is attempted (shows notice)
// ─────────────────────────────────────────────────────────────

function DrawingActionButtons({ d, isArchived, onOpen, onView, onDelete, onBlocked }) {
  return (
    <>
      <button
        className="pp-act-open"
        disabled={isArchived}
        title={isArchived ? "Archived project — restore to edit" : "Open in workspace"}
        onClick={() => (isArchived ? onBlocked() : onOpen(d))}
      >
        Open
      </button>

      <button className="pp-act-btn" disabled>+ Rev</button>

      <button
        className="pp-act-btn pp-act-btn--view"
        title="View drawing"
        onClick={() => onView(d)}
      >
        View
      </button>

      <button className="pp-act-btn" disabled>Export</button>
      <button className="pp-act-btn" disabled>BOM</button>

      <button
        className="pp-act-btn pp-act-btn--danger"
        disabled={isArchived}
        title={isArchived ? "Archived project — restore to delete" : "Delete drawing"}
        onClick={() => (isArchived ? onBlocked() : onDelete(d))}
      >
        🗑
      </button>
    </>
  );
}

export default DrawingActionButtons;
