// ─────────────────────────────────────────────────────────────
// useDrawings.js
//
// Owns the drawing list for ONE project, parameterized by
// projectId — reloads automatically whenever the id changes
// (including to null/undefined, which just clears the list).
// This replaces the old imperative "selectProject() manually
// calls loadDrawings()" pattern with a reactive dependency.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "../../../api/client.js";

export function useDrawings(projectId) {
  const [drawings,        setDrawings]        = useState([]);
  const [loadingDrawings, setLoadingDrawings]  = useState(false);
  const [viewMode,        setViewMode]        = useState("card");
  const [drawingSearch,   setDrawingSearch]   = useState("");
  const [sortField,       setSortField]       = useState("drawing_number");
  const [sortDir,         setSortDir]         = useState("asc");

  const refresh = useCallback(async () => {
    if (!projectId) { setDrawings([]); return; }
    setLoadingDrawings(true);
    try {
      const res  = await apiFetch(`/drawings/project/${projectId}`);
      const data = await res.json();
      setDrawings(data.drawings || []);
    } catch (err) {
      console.error("loadDrawings failed:", err);
      setDrawings([]);
    }
    setLoadingDrawings(false);
  }, [projectId]);

  useEffect(() => {
    setDrawingSearch("");
    refresh();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  function clear() { setDrawings([]); }

  async function create(payload) {
    try {
      const res  = await apiFetch(`/drawings`, {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          ...payload,
          drawing_number: payload.drawing_number.toUpperCase(),
          page_count: payload.page_count || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.detail || "Failed." };
      await refresh();
      return { ok: true, drawing: data.drawing };
    } catch (err) {
      console.error("createDrawing failed:", err);
      return { ok: false, error: "Could not connect." };
    }
  }

  async function remove(id) {
    try {
      const res = await apiFetch(`/drawings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.detail || `Server error ${res.status}` };
      }
      await refresh();
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not connect to server." };
    }
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const filtered = useMemo(() => drawings
    .filter(d =>
      d.drawing_number.toLowerCase().includes(drawingSearch.toLowerCase()) ||
      d.title.toLowerCase().includes(drawingSearch.toLowerCase())
    )
    .sort((a, b) => {
      const av = (a[sortField] || "").toString().toLowerCase();
      const bv = (b[sortField] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    }), [drawings, drawingSearch, sortField, sortDir]);

  return {
    projectId, drawings, filtered, loadingDrawings,
    viewMode, setViewMode, drawingSearch, setDrawingSearch,
    sortField, setSortField, sortDir, setSortDir, toggleSort,
    refresh, clear, create, remove,
  };
}
