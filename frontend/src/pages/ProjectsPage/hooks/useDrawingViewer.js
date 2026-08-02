// ─────────────────────────────────────────────────────────────
// useDrawingViewer.js
//
// Owns the zoom/pan/paging drawing-viewer overlay: which drawing
// is open, zoom level, current page, and pan offset. `open()`
// shows the drawing immediately with whatever data the caller
// already has (e.g. a row from the drawing list), then swaps in
// the fully-detailed version once the fetch resolves.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../../api/client.js";

const ZOOM_MIN = 100;
const ZOOM_MAX = 2400;

export function useDrawingViewer() {
  const [viewerDrawing, setViewerDrawing] = useState(null);
  const [zoom,          setZoom]          = useState(100);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [pan,           setPan]           = useState({ x: 0, y: 0 });

  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const panLast   = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    function onWheel(e) {
      if (!e.ctrlKey) return;
      e.preventDefault(); e.stopPropagation();
      const delta = e.deltaY > 0 ? -15 : 15;
      setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [viewerDrawing]);

  async function open(d) {
    setZoom(100); setCurrentPage(1);
    setPan({ x: 0, y: 0 }); panOffset.current = { x: 0, y: 0 };
    setViewerDrawing(d);
    try {
      const res  = await apiFetch(`/drawings/${d.id}`);
      const data = await res.json();
      if (res.ok && data.drawing) setViewerDrawing(data.drawing);
    } catch (err) {
      console.error("openViewer fetch failed:", err);
    }
  }
  function close() { setViewerDrawing(null); }

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current  = { x: e.clientX, y: e.clientY };
    panLast.current   = { ...panOffset.current };
  }
  function handleMouseMove(e) {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    panOffset.current = { x: panLast.current.x + dx, y: panLast.current.y + dy };
    setPan({ ...panOffset.current });
  }
  function handleMouseUp() { isPanning.current = false; }

  function zoomIn()    { setZoom(z => Math.min(ZOOM_MAX, z + 25)); }
  function zoomOut()   { setZoom(z => Math.max(ZOOM_MIN, z - 25)); }
  function zoomReset() { setZoom(100); setPan({ x: 0, y: 0 }); panOffset.current = { x: 0, y: 0 }; }

  function nextPage() { setCurrentPage(p => p + 1); zoomReset(); }
  function prevPage() { setCurrentPage(p => p - 1); zoomReset(); }

  const totalPages = viewerDrawing?.total_pages || 1;

  return {
    viewerDrawing, zoom, currentPage, pan, canvasRef, totalPages,
    ZOOM_MIN, ZOOM_MAX,
    open, close, zoomIn, zoomOut, zoomReset, nextPage, prevPage,
    handleMouseDown, handleMouseMove, handleMouseUp,
  };
}
