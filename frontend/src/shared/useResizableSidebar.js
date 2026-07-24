// ─────────────────────────────────────────────────────────────
// useResizableSidebar.js
//
// Drag-to-resize a panel expressed as a percentage of a container
// element's width. Used at every divider-drag site in the app —
// ProjectsPage's project explorer + drawing-viewer sidebar,
// ProjectSetup's sidebar, Workspace's left + right panels.
//
// `invert` matters: a left-anchored panel (divider on its right
// edge) grows when the user drags right; a right-anchored panel
// (divider on its left edge) grows when dragging left. These are
// opposite-sign deltas, not just different min/max — get this
// wrong and the panel resizes backwards.
//
// Returns `isDragging` (true for the whole mousedown→mouseup
// gesture, not just while the cursor sits on the thin divider
// line) so callers can keep the divider looking "active" even if
// the cursor drifts off it mid-drag — plain CSS :hover can't do
// that.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";

export function useResizableSidebar({ containerRef, initial, min, max, invert = false }) {
  const [pct, setPct] = useState(initial);
  const [isDragging, setIsDragging] = useState(false);
  const dragging  = useRef(false);
  const startX    = useRef(0);
  const startPct  = useRef(initial);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const width = containerRef.current.getBoundingClientRect().width;
    const raw = e.clientX - startX.current;
    const dx = invert ? -raw : raw;
    setPct(Math.min(max, Math.max(min, startPct.current + (dx / width) * 100)));
  }, [containerRef, invert, min, max]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function onDividerDown(e) {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startPct.current = pct;
    setIsDragging(true);
  }

  return { pct, isDragging, onDividerDown };
}
