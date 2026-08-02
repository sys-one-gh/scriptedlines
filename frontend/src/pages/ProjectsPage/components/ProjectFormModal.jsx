// ─────────────────────────────────────────────────────────────
// ProjectFormModal.jsx
//
// New/edit project 5-section wizard. Owns its own draft form
// state (form/section/error/loading) — this is ephemeral UI
// state scoped to the form itself, not the project list, so it
// doesn't belong in useProjects.js. Resets for free each time the
// modal opens, since ProjectsPage.jsx conditionally mounts it
// (open → fresh mount → fresh useState initializer).
//
// onSubmit(payload) must return { ok, error, project? } — see
// useProjects.js's create()/update().
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import FormField from "../../../shared/FormField.jsx";
import FormSelect from "../../../shared/FormSelect.jsx";

const GRADES    = ["Custom", "Premium", "Standard", "Commercial", "Institutional"];
const STANDARDS = ["AWMAC", "AWI", "WI"];
const SECTIONS  = ["Identity", "Team", "Client", "Job Site", "Schedule"];

const EMPTY_PROJECT = {
  project_name:"", job_number:"", description:"",
  project_grade:"", standard:"",
  drawn_by:"", checked_by:"", project_manager:"", draftsman:"",
  architect_name:"", estimator_name:"", contractor_name:"",
  client_name:"", client_address:"", client_phone:"", client_fax:"", client_email:"",
  jobsite_name:"", jobsite_address:"", jobsite_phone:"", jobsite_fax:"", jobsite_email:"",
  scheduled_start_date:"", scheduled_completion_date:"", project_budget:"",
  compliance_leed: false, compliance_fsc: false, compliance_fr: false,
};

function projectToForm(p) {
  return {
    project_name: p.project_name || "", job_number: p.job_number || "",
    description: p.description || "", project_grade: p.project_grade || "",
    standard: p.standard || "", drawn_by: p.drawn_by || "",
    checked_by: p.checked_by || "", project_manager: p.project_manager || "",
    draftsman: p.draftsman || "", architect_name: p.architect_name || "",
    estimator_name: p.estimator_name || "", contractor_name: p.contractor_name || "",
    client_name: p.client_name || "", client_address: p.client_address || "",
    client_phone: p.client_phone || "", client_fax: p.client_fax || "",
    client_email: p.client_email || "", jobsite_name: p.jobsite_name || "",
    jobsite_address: p.jobsite_address || "", jobsite_phone: p.jobsite_phone || "",
    jobsite_fax: p.jobsite_fax || "", jobsite_email: p.jobsite_email || "",
    scheduled_start_date: p.scheduled_start_date || "",
    scheduled_completion_date: p.scheduled_completion_date || "",
    project_budget: p.project_budget ? String(p.project_budget) : "",
    compliance_leed: p.compliance_leed || false,
    compliance_fsc:  p.compliance_fsc  || false,
    compliance_fr:   p.compliance_fr   || false,
  };
}

function ProjectFormModal({ editingProject, onClose, onSubmit, onCreated }) {
  const [form,    setForm]    = useState(editingProject ? projectToForm(editingProject) : EMPTY_PROJECT);
  const [section, setSection] = useState(0);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.project_name.trim()) { setError("Project name is required."); return; }
    setLoading(true); setError("");
    const payload = {
      ...form,
      project_grade: form.project_grade || null,
      standard:      form.standard      || null,
      scheduled_start_date:      form.scheduled_start_date      || null,
      scheduled_completion_date: form.scheduled_completion_date || null,
      project_budget: form.project_budget ? parseFloat(form.project_budget) : null,
    };
    const result = await onSubmit(payload);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    if (!editingProject) onCreated?.(result.project);
    onClose();
  }

  return (
    <div className="pp-overlay">
      <div className="pp-modal">
        <div className="pp-modal-header">
          <div className="pp-modal-title">
            {editingProject ? `Edit Project #${editingProject.project_number} — ${editingProject.project_name}` : "New Project"}
          </div>
          <button className="pp-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="pp-section-tabs">
          {SECTIONS.map((sec, i) => (
            <button key={i} type="button"
              className={`pp-section-tab${section === i ? " pp-section-tab--active" : ""}`}
              onClick={() => setSection(i)}>{sec}</button>
          ))}
        </div>

        {error && <div className="pp-form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="pp-modal-body">
            {section === 0 && (
              <div className="pp-form-grid">
                <FormField label="PROJECT NAME *" name="project_name" val={form.project_name} set={setForm} form={form} full placeholder="e.g. Thunder Bay Correctional Complex" />
                <FormField label="JOB NUMBER"     name="job_number"   val={form.job_number}   set={setForm} form={form} placeholder="e.g. 1930" />
                <FormSelect label="PROJECT GRADE" name="project_grade" val={form.project_grade} set={setForm} form={form} opts={GRADES} />
                <FormSelect label="STANDARD"      name="standard"      val={form.standard}      set={setForm} form={form} opts={STANDARDS} />
                <div className="pp-form-field">
                  <label className="pp-form-label">COMPLIANCE</label>
                  <div className="pp-checkbox-group">
                    {[["compliance_leed","LEED"],["compliance_fsc","FSC"],["compliance_fr","FR"]].map(([key, lbl]) => (
                      <label key={key} className="pp-checkbox-label">
                        <input type="checkbox" checked={form[key]}
                          onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pp-form-field pp-form-full">
                  <label className="pp-form-label">DESCRIPTION</label>
                  <textarea className="pp-form-textarea" rows={3} name="description"
                    value={form.description} placeholder="Brief description of this project..."
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            )}
            {section === 1 && (
              <div className="pp-form-grid">
                <FormField label="DRAWN BY"        name="drawn_by"        val={form.drawn_by}        set={setForm} form={form} placeholder="e.g. RPB" />
                <FormField label="CHECKED BY"      name="checked_by"      val={form.checked_by}      set={setForm} form={form} placeholder="e.g. AF" />
                <FormField label="PROJECT MANAGER" name="project_manager" val={form.project_manager} set={setForm} form={form} />
                <FormField label="DRAFTSMAN"       name="draftsman"       val={form.draftsman}       set={setForm} form={form} />
                <FormField label="ARCHITECT"       name="architect_name"  val={form.architect_name}  set={setForm} form={form} />
                <FormField label="ESTIMATOR"       name="estimator_name"  val={form.estimator_name}  set={setForm} form={form} />
                <FormField label="CONTRACTOR"      name="contractor_name" val={form.contractor_name} set={setForm} form={form} />
              </div>
            )}
            {section === 2 && (
              <div className="pp-form-grid">
                <FormField label="CLIENT NAME"    name="client_name"    val={form.client_name}    set={setForm} form={form} full />
                <FormField label="CLIENT ADDRESS" name="client_address" val={form.client_address} set={setForm} form={form} full />
                <FormField label="CLIENT PHONE"   name="client_phone"   val={form.client_phone}   set={setForm} form={form} />
                <FormField label="CLIENT FAX"     name="client_fax"     val={form.client_fax}     set={setForm} form={form} />
                <FormField label="CLIENT EMAIL"   name="client_email"   val={form.client_email}   set={setForm} form={form} full type="email" />
              </div>
            )}
            {section === 3 && (
              <div className="pp-form-grid">
                <FormField label="JOB SITE NAME"    name="jobsite_name"    val={form.jobsite_name}    set={setForm} form={form} full />
                <FormField label="JOB SITE ADDRESS" name="jobsite_address" val={form.jobsite_address} set={setForm} form={form} full />
                <FormField label="JOB SITE PHONE"   name="jobsite_phone"   val={form.jobsite_phone}   set={setForm} form={form} />
                <FormField label="JOB SITE FAX"     name="jobsite_fax"     val={form.jobsite_fax}     set={setForm} form={form} />
                <FormField label="JOB SITE EMAIL"   name="jobsite_email"   val={form.jobsite_email}   set={setForm} form={form} full type="email" />
              </div>
            )}
            {section === 4 && (
              <div className="pp-form-grid">
                <FormField label="START DATE"         name="scheduled_start_date"      val={form.scheduled_start_date}      set={setForm} form={form} type="date" />
                <FormField label="COMPLETION DATE"    name="scheduled_completion_date" val={form.scheduled_completion_date} set={setForm} form={form} type="date" />
                <FormField label="PROJECT BUDGET ($)" name="project_budget"            val={form.project_budget}            set={setForm} form={form} type="number" placeholder="0.00" />
              </div>
            )}
          </div>
          <div className="pp-modal-footer">
            <div className="pp-footer-group">
              {section > 0 && <button type="button" className="pp-btn-prev" onClick={() => setSection(section - 1)}>← Prev</button>}
              {section < SECTIONS.length - 1 && <button type="button" className="pp-btn-next" onClick={() => setSection(section + 1)}>Next →</button>}
            </div>
            <div className="pp-footer-group">
              <button type="button" className="pp-btn-discard" onClick={onClose}>Discard</button>
              <button type="submit" className="pp-btn-add" disabled={loading}>
                {loading ? "Saving..." : editingProject ? "Save Changes" : "Add Project"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectFormModal;
