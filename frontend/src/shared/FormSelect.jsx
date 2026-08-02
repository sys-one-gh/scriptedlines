// ─────────────────────────────────────────────────────────────
// FormSelect.jsx
//
// Generic labeled <select> counterpart to FormField.jsx — same
// whole-form setter convention.
// ─────────────────────────────────────────────────────────────

function FormSelect({ label, name, val, set, form, opts, display }) {
  return (
    <div className="pp-form-field">
      <label className="pp-form-label">{label}</label>
      <select className="pp-form-select" name={name} value={val}
        onChange={e => set({ ...form, [name]: e.target.value })}>
        <option value="">— Select —</option>
        {opts.map(o => <option key={o} value={o}>{display ? display(o) : o}</option>)}
      </select>
    </div>
  );
}

export default FormSelect;
