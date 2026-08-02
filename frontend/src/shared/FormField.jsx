// ─────────────────────────────────────────────────────────────
// FormField.jsx
//
// Generic labeled text/date/number/email input for multi-field
// forms (project wizard, drawing form, ...). Controlled via a
// whole-form setter: onChange writes { ...form, [name]: value },
// so callers don't need a per-field change handler.
// ─────────────────────────────────────────────────────────────

function FormField({ label, name, val, set, form, type = "text", placeholder = "", full = false }) {
  return (
    <div className={`pp-form-field${full ? " pp-form-full" : ""}`}>
      <label className="pp-form-label">{label}</label>
      <input className="pp-form-input" type={type} name={name} value={val}
        placeholder={placeholder} onChange={e => set({ ...form, [name]: e.target.value })} />
    </div>
  );
}

export default FormField;
