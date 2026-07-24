// ─────────────────────────────────────────────────────────────
// useOutsideClick.js
//
// Calls onOutside() when a mousedown lands outside the DOM node
// held by `ref`. Used to close popovers/dropdowns/menus — each
// menu owns its own ref and its own instance of this hook, rather
// than one shared document-level listener juggling every open
// menu in the page (that was the old pattern in ProjectsPage.jsx
// before it got split into separate components).
// ─────────────────────────────────────────────────────────────

import { useEffect } from "react";

export function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [ref, onOutside]);
}
