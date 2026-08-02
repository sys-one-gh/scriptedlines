// ─────────────────────────────────────────────────────────────
// DeleteDrawingDialog.jsx — confirm-delete for a single drawing.
// ─────────────────────────────────────────────────────────────

function DeleteDrawingDialog({ drawing, error, onCancel, onConfirm }) {
  return (
    <div className="pp-overlay pp-overlay--top">
      <div className="pp-modal pp-modal--sm">
        <div className="pp-modal-header">
          <div className="pp-modal-title">Delete Drawing</div>
          <button className="pp-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="pp-delete-info">
          <div className="pp-delete-info-text">Are you sure you want to delete this drawing?</div>
          <div className="pp-delete-info-card">
            <div className="pp-delete-info-number">{drawing.drawing_number}</div>
            <div className="pp-delete-info-title">{drawing.title}</div>
          </div>
          <div className="pp-delete-warning">⚠ This action cannot be undone.</div>
          {error && <div className="pp-delete-error">{error}</div>}
        </div>
        <div className="pp-modal-footer">
          <div />
          <div className="pp-footer-group">
            <button className="pp-btn-discard" onClick={onCancel}>Cancel</button>
            <button className="pp-btn-add pp-btn-add--danger" onClick={onConfirm}>Delete Drawing</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteDrawingDialog;
