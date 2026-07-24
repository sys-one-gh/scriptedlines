import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE, setSession } from "../api/client.js";

function RegisterPage() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    email:      "",
    password:   "",
    confirm:    "",
    initials:   "",
  });

  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [adminSecret,     setAdminSecret]     = useState("");

  const [mode,        setMode]        = useState("join"); // "join" | "create"
  const [joinCode,    setJoinCode]    = useState("");
  const [companyName, setCompanyName] = useState("");

  // Set after a successful "create company" registration — swaps the
  // form out for a one-time reveal of the join code. There's no
  // company-settings screen to view it again later yet, so this is
  // the only moment it's shown (besides the owner/admin-gated API).
  const [createdCompany, setCreatedCompany] = useState(null);
  const [copied,         setCopied]         = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  function validate() {
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim())  return "Last name is required.";
    if (!form.email.trim())      return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    if (!form.password)          return "Password is required.";
    if (form.password.length < 8)              return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(form.password))          return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(form.password))          return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(form.password))          return "Password must contain at least one number.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password))
                                               return "Password must contain at least one special character (!@#$%^&* etc).";
    if (form.password !== form.confirm)        return "Passwords do not match.";
    if (isPlatformAdmin && !adminSecret.trim()) return "Admin secret code is required.";
    if (!isPlatformAdmin && mode === "join" && !joinCode.trim())     return "Company join code is required.";
    if (!isPlatformAdmin && mode === "create" && !companyName.trim()) return "Company name is required.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const isCreatingCompany = !isPlatformAdmin && mode === "create";
    const endpoint = isCreatingCompany ? "/companies/register" : "/users/register";
    const body = isCreatingCompany
      ? {
          company_name: companyName.trim(),
          first_name:   form.first_name.trim(),
          last_name:    form.last_name.trim(),
          email:        form.email.trim().toLowerCase(),
          password:     form.password,
          initials:     form.initials.trim().toUpperCase(),
        }
      : {
          first_name: form.first_name.trim(),
          last_name:  form.last_name.trim(),
          email:      form.email.trim().toLowerCase(),
          password:   form.password,
          initials:   form.initials.trim().toUpperCase(),
          join_code:              isPlatformAdmin ? undefined : joinCode.trim(),
          platform_admin_secret:  isPlatformAdmin ? adminSecret : undefined,
        };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setSession(data.user, data.access_token);

      if (isCreatingCompany) {
        setCreatedCompany(data.company);
        setLoading(false);
      } else {
        navigate("/projects");
      }

    } catch {
      setError("Could not connect to server. Make sure the backend is running.");
      setLoading(false);
    }
  }

  function copyJoinCode() {
    navigator.clipboard.writeText(createdCompany.join_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div style={styles.page}>

      <div style={styles.grid} />

      <div style={styles.card}>

        {/* Logo — intentionally excluded from font-size token scale */}
        <div style={styles.logoBlock}>
          <div style={styles.logoMark}>SL</div>
          <div style={styles.logoText}>ScriptedLines</div>
        </div>

        {createdCompany ? (
          <>
            <p style={styles.subtitle}>Company created 🎉</p>

            <div style={styles.revealPanel}>
              <p style={styles.revealCompanyName}>{createdCompany.company_name}</p>
              <p style={styles.revealHint}>Share this code with your team so they can join:</p>
              <div style={styles.revealCodeRow}>
                <span style={styles.revealCode}>{createdCompany.join_code}</span>
                <button type="button" onClick={copyJoinCode} style={styles.copyBtn}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            <button type="button" onClick={() => navigate("/projects")} style={styles.submitBtn}>
              Continue to Projects →
            </button>
          </>
        ) : (
        <>

        <p style={styles.subtitle}>Create your account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.row}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>FIRST NAME</label>
              <input
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                placeholder="John"
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>LAST NAME</label>
              <input
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Smith"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.fieldGroup, flex: 2 }}>
              <label style={styles.label}>EMAIL</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                style={styles.input}
                autoComplete="email"
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>INITIALS</label>
              <input
                name="initials"
                type="text"
                value={form.initials}
                onChange={handleChange}
                placeholder="JS"
                maxLength={4}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>PASSWORD</label>
            <div style={styles.passwordWrap}>
              <input
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 chars, upper, lower, number, special"
                style={{ ...styles.input, paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <p style={styles.hint}>
            Must include uppercase, lowercase, number, and special character (!@#$%^&* etc).
          </p>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>CONFIRM PASSWORD</label>
            <div style={styles.passwordWrap}>
              <input
                name="confirm"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat password"
                style={{ ...styles.input, paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {!isPlatformAdmin && (
            <>
              <div style={styles.modeToggle}>
                <button
                  type="button"
                  onClick={() => { setMode("join"); setError(""); }}
                  style={{ ...styles.modeBtn, ...(mode === "join" ? styles.modeBtnActive : {}) }}
                >
                  Join a Company
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("create"); setError(""); }}
                  style={{ ...styles.modeBtn, ...(mode === "create" ? styles.modeBtnActive : {}) }}
                >
                  Create a Company
                </button>
              </div>

              {mode === "join" ? (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>COMPANY JOIN CODE</label>
                  <input
                    name="joinCode"
                    type="text"
                    value={joinCode}
                    onChange={e => { setJoinCode(e.target.value); setError(""); }}
                    placeholder="e.g. WHRK7F3M"
                    style={styles.input}
                    autoCapitalize="characters"
                  />
                </div>
              ) : (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>COMPANY NAME</label>
                  <input
                    name="companyName"
                    type="text"
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setError(""); }}
                    placeholder="e.g. Thunder Bay Millwork"
                    style={styles.input}
                  />
                </div>
              )}
            </>
          )}

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isPlatformAdmin}
              onChange={e => { setIsPlatformAdmin(e.target.checked); setError(""); }}
            />
            Register as a ScriptedLines Admin
          </label>

          {isPlatformAdmin && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>ADMIN SECRET CODE</label>
              <input
                name="adminSecret"
                type="password"
                value={adminSecret}
                onChange={e => { setAdminSecret(e.target.value); setError(""); }}
                placeholder="Provided by ScriptedLines"
                style={styles.input}
                autoComplete="off"
              />
            </div>
          )}

          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : !isPlatformAdmin && mode === "create" ? "Create Company" : "Create Account"}
          </button>

        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>

        </>
        )}

      </div>
    </div>
  );
}


// ─── STYLES ──────────────────────────────────────────────────
// Font sizes use --fs-base/--fs-md/--fs-lg tokens (see tokens.css).
// logoMark/logoText are the ScriptedLines brand mark — intentionally
// left hardcoded. eyeBtn sizes an emoji icon (🙈/👁) — not tokenized.
const styles = {
  page: {
    width:           "100vw",
    height:          "100vh",
    background:      "#111111",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontFamily:      "'DM Sans', sans-serif",
    position:        "relative",
    overflow:        "hidden",
  },

  grid: {
    position:        "absolute",
    inset:           0,
    backgroundImage: "radial-gradient(circle, #2a2a2a 1px, transparent 1px)",
    backgroundSize:  "28px 28px",
    opacity:         0.6,
    pointerEvents:   "none",
  },

  card: {
    position:        "relative",
    width:           "480px",
    background:      "#1a1a1a",
    border:          "1px solid #2e2e2e",
    borderRadius:    "8px",
    padding:         "40px",
    boxShadow:       "0 24px 80px rgba(0,0,0,0.6)",
  },

  logoBlock: {
    display:         "flex",
    alignItems:      "center",
    gap:             "12px",
    marginBottom:    "8px",
  },

  logoMark: {
    width:           "36px",
    height:          "36px",
    background:      "#4f8ef7",
    borderRadius:    "6px",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontSize:        "13px",   /* logo — intentionally excluded */
    fontWeight:      "700",
    color:           "#ffffff",
    letterSpacing:   "0.5px",
    fontFamily:      "'IBM Plex Sans', monospace",
  },

  logoText: {
    fontSize:        "20px",   /* logo — intentionally excluded */
    fontWeight:      "600",
    color:           "#ffffff",
    letterSpacing:   "0.3px",
  },

  subtitle: {
    fontSize:        "var(--fs-base)",
    color:           "#666666",
    marginBottom:    "28px",
    marginTop:       "4px",
  },

  errorBox: {
    background:      "#2a1515",
    border:          "1px solid #5a2020",
    borderRadius:    "4px",
    padding:         "10px 14px",
    fontSize:        "var(--fs-base)",
    color:           "#f47070",
    marginBottom:    "20px",
  },

  form: {
    display:         "flex",
    flexDirection:   "column",
    gap:             "16px",
  },

  row: {
    display:         "flex",
    gap:             "12px",
  },

  fieldGroup: {
    display:         "flex",
    flexDirection:   "column",
    gap:             "6px",
  },

  label: {
    fontSize:        "var(--fs-base)",
    fontWeight:      "500",
    color:           "#555555",
    letterSpacing:   "1px",
    fontFamily:      "'IBM Plex Sans', monospace",
  },

  input: {
    height:          "40px",
    padding:         "0 12px",
    background:      "#111111",
    color:           "#e0e0e0",
    border:          "1px solid #333333",
    borderRadius:    "4px",
    outline:         "none",
    fontSize:        "var(--fs-base)",
    fontFamily:      "'DM Sans', sans-serif",
    width:           "100%",
    boxSizing:       "border-box",
    transition:      "border-color 0.15s",
  },

  passwordWrap: {
    position:        "relative",
  },

  eyeBtn: {
    position:        "absolute",
    right:           "10px",
    top:             "50%",
    transform:       "translateY(-50%)",
    background:      "transparent",
    border:          "none",
    cursor:          "pointer",
    fontSize:        "14px",   /* icon (emoji) — not tokenized */
    padding:         "0",
    lineHeight:      "1",
  },

  submitBtn: {
    height:          "42px",
    background:      "#4f8ef7",
    color:           "#ffffff",
    border:          "none",
    borderRadius:    "4px",
    fontSize:        "var(--fs-md)",
    fontWeight:      "600",
    fontFamily:      "'DM Sans', sans-serif",
    cursor:          "pointer",
    marginTop:       "4px",
    transition:      "background 0.15s",
  },

  footerText: {
    fontSize:        "var(--fs-base)",
    color:           "#555555",
    textAlign:       "center",
    marginTop:       "24px",
  },

  link: {
    color:           "#4f8ef7",
    textDecoration:  "none",
    fontWeight:      "500",
  },

  hint: {
    fontSize:        "var(--fs-base)",
    color:           "#555555",
    marginTop:       "-8px",
    lineHeight:      "1.5",
    fontFamily:      "'IBM Plex Sans', monospace",
  },

  checkboxLabel: {
    display:         "flex",
    alignItems:      "center",
    gap:             "8px",
    fontSize:        "var(--fs-base)",
    color:           "#aaaaaa",
    fontFamily:      "'DM Sans', sans-serif",
    cursor:          "pointer",
  },

  modeToggle: {
    display:         "flex",
    gap:             "8px",
    marginBottom:    "-4px",
  },

  modeBtn: {
    flex:            1,
    height:          "36px",
    background:      "transparent",
    color:           "#888888",
    border:          "1px solid #333333",
    borderRadius:    "4px",
    fontSize:        "var(--fs-base)",
    fontWeight:      "500",
    fontFamily:      "'DM Sans', sans-serif",
    cursor:          "pointer",
    transition:      "border-color 0.15s, color 0.15s",
  },

  modeBtnActive: {
    color:           "#4f8ef7",
    border:          "1px solid #4f8ef7",
  },

  revealPanel: {
    background:      "#141b2e",
    border:          "1px solid #1a3a6a",
    borderRadius:    "6px",
    padding:         "18px",
    marginBottom:    "8px",
  },

  revealCompanyName: {
    fontSize:        "var(--fs-md)",
    fontWeight:      "600",
    color:           "#ffffff",
    marginBottom:    "4px",
  },

  revealHint: {
    fontSize:        "var(--fs-base)",
    color:           "#888888",
    marginBottom:    "12px",
  },

  revealCodeRow: {
    display:         "flex",
    alignItems:      "center",
    gap:             "10px",
  },

  revealCode: {
    flex:            1,
    fontSize:        "var(--fs-lg)",
    fontWeight:      "700",
    letterSpacing:   "2px",
    color:           "#4f8ef7",
    fontFamily:      "'IBM Plex Sans', monospace",
    background:      "#0d0d0d",
    border:          "1px solid #2a2a2a",
    borderRadius:    "4px",
    padding:         "10px 14px",
    textAlign:       "center",
  },

  copyBtn: {
    height:          "40px",
    padding:         "0 16px",
    background:      "transparent",
    color:           "#4f8ef7",
    border:          "1px solid #4f8ef7",
    borderRadius:    "4px",
    fontSize:        "var(--fs-base)",
    fontWeight:      "600",
    fontFamily:      "'DM Sans', sans-serif",
    cursor:          "pointer",
  },
};

export default RegisterPage;