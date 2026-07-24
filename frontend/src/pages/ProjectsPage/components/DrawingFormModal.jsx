// ─────────────────────────────────────────────────────────────
// DrawingFormModal.jsx
//
// New drawing modal. Owns its own draft form state and its own
// drawing-number format validation — same reasoning as
// ProjectFormModal.jsx (ephemeral, form-scoped, not list-scoped).
//
// onSubmit(payload) must return { ok, error } — see
// ProjectsPage.jsx's handleCreateDrawing (it also refreshes the
// project list's drawing_count badge, which useDrawings.js alone
// can't do).
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import FormField from "../../../shared/FormField.jsx";
import FormSelect from "../../../shared/FormSelect.jsx";

const PAPER_SIZES = ["Arch_D", "Arch_C", "Arch_E", "ANSI_B", "ANSI_A", "A1", "A3"];
const PAPER_SIZE_LABELS = {
  "Arch_D": 'Arch D — 36" × 24"',
  "Arch_C": 'Arch C — 24" × 18"',
  "Arch_E": 'Arch E — 48" × 36"',
  "ANSI_B": 'ANSI B — 17" × 11"',
  "ANSI_A": 'ANSI A — 11" × 8.5"',
  "A1":     "A1 — 841 × 594 mm",
  "A3":     "A3 — 420 × 297 mm",
};
const EMPTY_DRAWING = { drawing_number:"", mw_number:"", title:"", paper_size:"Arch_D", level:"", location:"", arch_ref:"", item_description:"", page_count: 1 };

function validateDrawingNumber(val) {
  return /^D[0-9]{4}$/.test(val.toUpperCase());
}

function DrawingFormModal({ onClose, onSubmit }) {
  const [form,    setForm]    = useState(EMPTY_DRAWING);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleDrawingNumberInput(e) {
    let val = e.target.value.toUpperCase().replace(/[^D0-9]/g, "");
    if (val.length > 0 && val[0] !== "D") val = "D" + val.replace(/D/g, "");
    if (val.length > 5) val = val.slice(0, 5);
    setForm({ ...form, drawing_number: val }); setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.drawing_number.trim()) { setError("Drawing number is required."); return; }
    if (!validateDrawingNumber(form.drawing_number)) {
      setError("Drawing number must be D followed by exactly 4 digits (e.g. D9501). Pages: D9501.01");
      return;
    }
    if (!form.title.trim()) { setError("Title is required."); return; }
    setLoading(true); setError("");
    const result = await onSubmit(form);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    onClose();
  }

  return (
    <div className="pp-overlay">
      <div className="pp-modal pp-modal--drawing">
        <div className="pp-modal-header">
          <div className="pp-modal-title">New Drawing</div>
          <button className="pp-modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="pp-form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="pp-modal-body">
            <div className="pp-form-grid">
              <div className="pp-form-field">
                <label className="pp-form-label">DRAWING NUMBER *</label>
                <input type="text" value={form.drawing_number} onChange={handleDrawingNumberInput}
                  placeholder="e.g. D9501" maxLength={5}
                  className={`pp-form-input pp-input-dwgnum${form.drawing_number && !validateDrawingNumber(form.drawing_number) ? " pp-form-input--error" : ""}`} />
                <span className="pp-form-hint">Format: D + 4 digits. Pages: D9501.01, D9501.02</span>
              </div>
              <FormField label="MW# (MILLWORK SCOPE)"  name="mw_number"        val={form.mw_number}        set={setForm} form={form} placeholder="e.g. MW-01" />
              <FormField label="TITLE *"               name="title"            val={form.title}            set={setForm} form={form} placeholder="e.g. Staff Lunch Counter" full />
              <FormSelect label="PAPER SIZE"           name="paper_size"       val={form.paper_size}       set={setForm} form={form} opts={PAPER_SIZES} display={p => PAPER_SIZE_LABELS[p]} />
              <div className="pp-form-field">
                <label className="pp-form-label">NUMBER OF PAGES</label>
                <input type="number" min="1" max="99" className="pp-form-input"
                  value={form.page_count}
                  onChange={e => setForm({ ...form, page_count: Math.max(1, parseInt(e.target.value) || 1) })} />
                <span className="pp-form-hint">How many canvas pages this drawing has (default 1)</span>
              </div>
              <FormField label="LEVEL"                 name="level"            val={form.level}            set={setForm} form={form} placeholder="e.g. 1G" />
              <FormField label="LOCATION"              name="location"         val={form.location}         set={setForm} form={form} placeholder="e.g. 4.4.01" />
              <FormField label="ARCH REFERENCE"        name="arch_ref"         val={form.arch_ref}         set={setForm} form={form} placeholder="e.g. 7 A2.46B / REV#11" full />
              <FormField label="ITEM DESCRIPTION"      name="item_description" val={form.item_description} set={setForm} form={form} placeholder="e.g. Staff Lunch Counter" full />
            </div>
          </div>
          <div className="pp-modal-footer">
            <div />
            <div className="pp-footer-group">
              <button type="button" className="pp-btn-discard" onClick={onClose}>Discard</button>
              <button type="submit" className="pp-btn-add" disabled={loading}>
                {loading ? "Creating..." : "Create Drawing"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DrawingFormModal;
