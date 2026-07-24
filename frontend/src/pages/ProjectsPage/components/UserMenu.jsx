// ─────────────────────────────────────────────────────────────
// UserMenu.jsx
//
// Top-bar avatar button + dropdown + avatar-picker modal. Fully
// self-contained: the avatar choice is a persisted user preference
// (localStorage, not page-to-page handoff — unrelated to the
// sl_drawing/sl_project cleanup elsewhere in this refactor), so it
// lives here rather than in the ProjectsPage orchestrator.
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useOutsideClick } from "../../../shared/useOutsideClick.js";

const AVATARS    = ["🏛", "📐", "📏", "🔩", "🪚", "⚙️", "🔧", "🏗", "✏️", "📋"];
const AVATAR_KEY = "sl_avatar";

function UserMenu({ user, onSignOut }) {
  const [userAvatar,       setUserAvatar]       = useState(localStorage.getItem(AVATAR_KEY) || "🏛");
  const [showUserMenu,     setShowUserMenu]     = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const userMenuRef = useRef(null);

  useOutsideClick(userMenuRef, () => setShowUserMenu(false));

  function pickAvatar(a) {
    setUserAvatar(a);
    localStorage.setItem(AVATAR_KEY, a);
    setShowAvatarPicker(false);
  }

  return (
    <>
      <div className="pp-rel" ref={userMenuRef}>
        <button className="pp-avatar-btn" onClick={() => { setShowUserMenu(!showUserMenu); setShowAvatarPicker(false); }}>
          <span className="pp-avatar-emoji">{userAvatar}</span>
        </button>
        {showUserMenu && (
          <div className="pp-user-menu">
            <div className="pp-user-menu-header">
              <div className="pp-user-menu-avatar">{userAvatar}</div>
              <div>
                <div className="pp-user-menu-name">{user.first_name} {user.last_name}</div>
                <div className="pp-user-menu-role">{user.role}</div>
                {user.is_platform_admin && (
                  <span className="pp-spec-badge pp-spec-badge--blue pp-user-menu-badge">
                    ScriptedLines Admin
                  </span>
                )}
              </div>
            </div>
            <div className="pp-menu-divider" />
            <button className="pp-menu-item" onClick={() => { setShowAvatarPicker(true); setShowUserMenu(false); }}>🖼  Change Avatar</button>
            <button className="pp-menu-item">👤  Account Settings</button>
            <button className="pp-menu-item">⚙️  Company Settings</button>
            <button className="pp-menu-item">💳  Manage Subscription</button>
            <div className="pp-menu-divider" />
            <button className="pp-menu-item pp-menu-item--danger" onClick={onSignOut}>→  Sign Out</button>
          </div>
        )}
      </div>

      {showAvatarPicker && (
        <div className="pp-overlay">
          <div className="pp-modal pp-modal--avatar">
            <div className="pp-modal-header">
              <div className="pp-modal-title">Choose Avatar</div>
              <button className="pp-modal-close" onClick={() => setShowAvatarPicker(false)}>✕</button>
            </div>
            <div className="pp-avatar-grid">
              {AVATARS.map(a => (
                <button key={a} className={`pp-avatar-option${userAvatar === a ? " pp-avatar-option--selected" : ""}`}
                  onClick={() => pickAvatar(a)}>{a}</button>
              ))}
            </div>
            <div className="pp-avatar-hint">Photo upload — coming soon</div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserMenu;
