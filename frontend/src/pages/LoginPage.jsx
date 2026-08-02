import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE, setSession } from "../api/client.js";

const MAX_ATTEMPTS = 3;

// "login"       → normal login form
// "restore"     → choose restore method (email or phone)
// "code"        → enter the verification code sent
// "new_password"→ enter new password after code verified
const VIEWS = {
  LOGIN:        "login",
  RESTORE:      "restore",
  CODE:         "code",
  NEW_PASSWORD: "new_password",
};

function LoginPage() {

  const navigate = useNavigate();

  const [form,        setForm]        = useState({ email: "", password: "" });
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [attempts,    setAttempts]    = useState(0);
  const [locked,      setLocked]      = useState(false);

  const [view,           setView]           = useState(VIEWS.LOGIN);
  const [restoreMethod,  setRestoreMethod]  = useState("email");
  const [restoreContact, setRestoreContact] = useState("");
  const [restoreCode,    setRestoreCode]    = useState("");
  const [enteredCode,    setEnteredCode]    = useState("");
  const [newPassword,    setNewPassword]    = useState("");
  const [confirmPassword,setConfirmPassword]= useState("");
  const [restoreError,   setRestoreError]   = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState("");
  const [showNewPass,    setShowNewPass]    = useState(false);


  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLocked(true);
          setError(`Too many failed attempts. Please restore your password.`);
        } else {
          setError(`Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`);
        }
        setLoading(false);
        return;
      }

      setSession(data.user, data.access_token);
      navigate("/projects");

    } catch {
      setError("Could not connect to server. Make sure the backend is running.");
      setLoading(false);
    }
  }


  function handleRestoreSubmit(e) {
    e.preventDefault();
    setRestoreError("");

    if (!restoreContact.trim()) {
      setRestoreError(`Please enter your ${restoreMethod === "email" ? "email address" : "mobile number"}.`);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRestoreCode(code);
    console.log(`[DEV] Restore code for ${restoreContact}: ${code}`);
    setRestoreSuccess(`A verification code has been sent to ${restoreContact}.`);
    setView(VIEWS.CODE);
  }

  function handleCodeSubmit(e) {
    e.preventDefault();
    setRestoreError("");

    if (!enteredCode.trim()) {
      setRestoreError("Please enter the verification code.");
      return;
    }

    if (enteredCode.trim() !== restoreCode) {
      setRestoreError("Incorrect code. Please try again.");
      return;
    }

    setView(VIEWS.NEW_PASSWORD);
  }

  function handleNewPasswordSubmit(e) {
    e.preventDefault();
    setRestoreError("");

    if (!newPassword) {
      setRestoreError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setRestoreError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setRestoreError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setRestoreError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setRestoreError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setRestoreError("Password must contain at least one special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setRestoreError("Passwords do not match.");
      return;
    }

    setAttempts(0);
    setLocked(false);
    setForm({ email: restoreContact, password: "" });
    setView(VIEWS.LOGIN);
    setError("");
    setRestoreContact("");
    setRestoreCode("");
    setEnteredCode("");
    setNewPassword("");
    setConfirmPassword("");
    setRestoreSuccess("Password updated successfully. Please sign in.");
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

        {/* ── LOGIN VIEW ─────────────────────────────────── */}
        {view === VIEWS.LOGIN && (
          <>
            <p style={styles.subtitle}>Sign in to your account</p>

            {error        && <div style={styles.errorBox}>{error}</div>}
            {restoreSuccess && <div style={styles.successBox}>{restoreSuccess}</div>}

            {attempts > 0 && !locked && (
              <div style={styles.attemptBar}>
                {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.attemptDot,
                      background: i < attempts ? "#f47070" : "#333333",
                    }}
                  />
                ))}
                <span style={styles.attemptText}>
                  {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} remaining
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>EMAIL</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  style={{ ...styles.input, opacity: locked ? 0.5 : 1 }}
                  disabled={locked}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>PASSWORD</label>
                <div style={styles.passwordWrap}>
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    style={{ ...styles.input, paddingRight: "44px", opacity: locked ? 0.5 : 1 }}
                    disabled={locked}
                    autoComplete="current-password"
                  />
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={styles.eyeBtn}
                      tabIndex={-1}
                    >
                      {showPass ? "🙈" : "👁"}
                    </button>
                  )}
                </div>
              </div>

              {!locked ? (
                <button
                  type="submit"
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setView(VIEWS.RESTORE); setRestoreSuccess(""); setRestoreError(""); }}
                  style={styles.restoreBtn}
                >
                  🔒 Restore Password
                </button>
              )}

            </form>

            {!locked && (
              <p style={{ ...styles.footerText, marginTop: "12px" }}>
                <button
                  onClick={() => { setView(VIEWS.RESTORE); setRestoreSuccess(""); setRestoreError(""); }}
                  style={styles.textBtn}
                >
                  Forgot your password?
                </button>
              </p>
            )}

            <p style={styles.footerText}>
              Don't have an account?{" "}
              <Link to="/register" style={styles.link}>Create one</Link>
            </p>
          </>
        )}


        {/* ── RESTORE VIEW — choose method ───────────────── */}
        {view === VIEWS.RESTORE && (
          <>
            <p style={styles.subtitle}>Restore your password</p>
            <p style={styles.bodyText}>
              Choose how you want to receive your verification code.
            </p>

            {restoreError && <div style={styles.errorBox}>{restoreError}</div>}

            <div style={styles.methodToggle}>
              <button
                type="button"
                onClick={() => { setRestoreMethod("email"); setRestoreContact(""); }}
                style={{ ...styles.methodBtn, ...(restoreMethod === "email" ? styles.methodBtnActive : {}) }}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => { setRestoreMethod("phone"); setRestoreContact(""); }}
                style={{ ...styles.methodBtn, ...(restoreMethod === "phone" ? styles.methodBtnActive : {}) }}
              >
                📱 Mobile Number
              </button>
            </div>

            <form onSubmit={handleRestoreSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  {restoreMethod === "email" ? "EMAIL ADDRESS" : "MOBILE NUMBER"}
                </label>
                <input
                  type={restoreMethod === "email" ? "email" : "tel"}
                  value={restoreContact}
                  onChange={(e) => { setRestoreContact(e.target.value); setRestoreError(""); }}
                  placeholder={restoreMethod === "email" ? "you@company.com" : "+1 416 555 0100"}
                  style={styles.input}
                  autoFocus
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Send Verification Code
              </button>
            </form>

            <p style={styles.footerText}>
              <button onClick={() => setView(VIEWS.LOGIN)} style={styles.textBtn}>
                ← Back to Sign In
              </button>
            </p>
          </>
        )}


        {/* ── CODE VIEW — enter verification code ────────── */}
        {view === VIEWS.CODE && (
          <>
            <p style={styles.subtitle}>Enter verification code</p>
            <p style={styles.bodyText}>
              A 6-digit code was sent to <strong style={{ color: "#e0e0e0" }}>{restoreContact}</strong>.
              {" "}Check your {restoreMethod === "email" ? "inbox" : "messages"}.
            </p>
            <p style={{ ...styles.bodyText, color: "#4f8ef7", fontSize: "var(--fs-base)" }}>
              [DEV] Check browser console for the code.
            </p>

            {restoreError && <div style={styles.errorBox}>{restoreError}</div>}

            <form onSubmit={handleCodeSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>VERIFICATION CODE</label>
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => { setEnteredCode(e.target.value); setRestoreError(""); }}
                  placeholder="000000"
                  maxLength={6}
                  style={{ ...styles.input, letterSpacing: "6px", fontSize: "var(--fs-lg)", textAlign: "center" }}
                  autoFocus
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Verify Code
              </button>
            </form>

            <p style={styles.footerText}>
              <button onClick={() => setView(VIEWS.RESTORE)} style={styles.textBtn}>
                ← Resend code
              </button>
            </p>
          </>
        )}


        {/* ── NEW PASSWORD VIEW ──────────────────────────── */}
        {view === VIEWS.NEW_PASSWORD && (
          <>
            <p style={styles.subtitle}>Set a new password</p>

            {restoreError && <div style={styles.errorBox}>{restoreError}</div>}

            <form onSubmit={handleNewPasswordSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>NEW PASSWORD</label>
                <div style={styles.passwordWrap}>
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setRestoreError(""); }}
                    placeholder="Min. 8 chars, upper, lower, number, special"
                    style={{ ...styles.input, paddingRight: "44px" }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={styles.eyeBtn}
                    tabIndex={-1}
                  >
                    {showNewPass ? "🙈" : "👁"}
                  </button>
                </div>
                <p style={styles.hint}>
                  Must include uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>CONFIRM NEW PASSWORD</label>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setRestoreError(""); }}
                  placeholder="Repeat new password"
                  style={styles.input}
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Update Password
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}


// ─── STYLES ──────────────────────────────────────────────────
// Font sizes use --fs-base/--fs-md/--fs-lg tokens (see tokens.css).
// logoMark/logoText are the ScriptedLines brand mark — intentionally
// left hardcoded, not part of the token scale. eyeBtn sizes an emoji
// icon (🙈/👁) — uses --icon-sm.
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
    width:           "420px",
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
    marginBottom:    "20px",
    marginTop:       "4px",
  },

  bodyText: {
    fontSize:        "var(--fs-base)",
    color:           "#777777",
    marginBottom:    "20px",
    lineHeight:      "1.6",
  },

  errorBox: {
    background:      "#2a1515",
    border:          "1px solid #5a2020",
    borderRadius:    "4px",
    padding:         "10px 14px",
    fontSize:        "var(--fs-base)",
    color:           "#f47070",
    marginBottom:    "16px",
  },

  successBox: {
    background:      "#152a15",
    border:          "1px solid #205a20",
    borderRadius:    "4px",
    padding:         "10px 14px",
    fontSize:        "var(--fs-base)",
    color:           "#70c870",
    marginBottom:    "16px",
  },

  attemptBar: {
    display:         "flex",
    alignItems:      "center",
    gap:             "6px",
    marginBottom:    "16px",
  },

  attemptDot: {
    width:           "8px",
    height:          "8px",
    borderRadius:    "50%",
    transition:      "background 0.2s",
  },

  attemptText: {
    fontSize:        "var(--fs-base)",
    color:           "#f47070",
    marginLeft:      "4px",
    fontFamily:      "'IBM Plex Sans', monospace",
  },

  form: {
    display:         "flex",
    flexDirection:   "column",
    gap:             "16px",
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
    fontSize:        "var(--icon-sm)",
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
    transition:      "background 0.15s",
  },

  restoreBtn: {
    height:          "42px",
    background:      "#c8712a",
    color:           "#ffffff",
    border:          "none",
    borderRadius:    "4px",
    fontSize:        "var(--fs-md)",
    fontWeight:      "600",
    fontFamily:      "'DM Sans', sans-serif",
    cursor:          "pointer",
    transition:      "background 0.15s",
  },

  methodToggle: {
    display:         "flex",
    gap:             "8px",
    marginBottom:    "20px",
  },

  methodBtn: {
    flex:            1,
    height:          "36px",
    background:      "#222222",
    color:           "#777777",
    border:          "1px solid #333333",
    borderRadius:    "4px",
    fontSize:        "var(--fs-base)",
    fontFamily:      "'DM Sans', sans-serif",
    cursor:          "pointer",
    transition:      "all 0.15s",
  },

  methodBtnActive: {
    background:      "#1a3a6a",
    color:           "#4f8ef7",
    border:          "1px solid #4f8ef7",
  },

  footerText: {
    fontSize:        "var(--fs-base)",
    color:           "#555555",
    textAlign:       "center",
    marginTop:       "20px",
  },

  link: {
    color:           "#4f8ef7",
    textDecoration:  "none",
    fontWeight:      "500",
  },

  textBtn: {
    background:      "none",
    border:          "none",
    color:           "#4f8ef7",
    fontSize:        "var(--fs-base)",
    cursor:          "pointer",
    fontFamily:      "'DM Sans', sans-serif",
    padding:         "0",
  },

  hint: {
    fontSize:        "var(--fs-base)",
    color:           "#555555",
    lineHeight:      "1.5",
    fontFamily:      "'IBM Plex Sans', monospace",
  },
};

export default LoginPage;