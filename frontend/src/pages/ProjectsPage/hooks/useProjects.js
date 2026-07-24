// ─────────────────────────────────────────────────────────────
// useProjects.js
//
// Owns the project list (active + archived) and CRUD against
// /api/projects. Deliberately knows nothing about drawings or the
// viewer — any action that needs to touch more than one domain
// (e.g. refreshing this list after a drawing is deleted, since
// project rows show a drawing_count badge) is composed explicitly
// in ProjectsPage.jsx instead of being hidden inside this hook.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../../../api/client.js";

export function useProjects() {
  const [activeProjects,   setActiveProjects]   = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loadingProjects,  setLoadingProjects]  = useState(true);
  const [projectTab,       setProjectTab]       = useState("active");
  const [selectedProject,  setSelectedProject]  = useState(null);
  const [projectSearch,    setProjectSearch]    = useState("");

  const refresh = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res  = await apiFetch(`/projects`);
      const data = await res.json();
      const groups = data.groups || [];
      setActiveProjects(  groups.find(g => g.label === "Active")?.projects   || []);
      setArchivedProjects(groups.find(g => g.label === "Archived")?.projects || []);
    } catch (err) {
      console.error("loadProjects failed:", err);
      setActiveProjects([]); setArchivedProjects([]);
    }
    setLoadingProjects(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function select(project) { setSelectedProject(project); }
  function clear()          { setSelectedProject(null); }

  async function create(payload) {
    try {
      const res  = await apiFetch(`/projects`, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.detail || "Failed." };
      await refresh();
      return { ok: true, project: data.project };
    } catch (err) {
      console.error("createProject failed:", err);
      return { ok: false, error: "Could not connect to server." };
    }
  }

  async function update(id, payload) {
    try {
      const res  = await apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.detail || "Failed." };
      await refresh();
      return { ok: true, project: data.project };
    } catch (err) {
      console.error("updateProject failed:", err);
      return { ok: false, error: "Could not connect to server." };
    }
  }

  async function remove(id) {
    try {
      const res = await apiFetch(`/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.detail || `Server error ${res.status}` };
      }
      await refresh();
      return { ok: true };
    } catch (err) {
      console.error("deleteProject failed:", err);
      return { ok: false, error: "Could not connect to server." };
    }
  }

  function archive(id) { return update(id, { status: "archived" }); }
  function restore(id) { return update(id, { status: "active" }); }

  // Client-side filter — the project list is already fetched in full,
  // and matching on name/job number this way scales fine well past the
  // point (~100+ projects) where scanning the raw list by eye stops
  // working. Search text persists across the Active/Archived tabs.
  const matches = useCallback((p) => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return true;
    return p.project_name.toLowerCase().includes(q) ||
           (p.job_number || "").toLowerCase().includes(q);
  }, [projectSearch]);

  const filteredActiveProjects   = useMemo(() => activeProjects.filter(matches),   [activeProjects, matches]);
  const filteredArchivedProjects = useMemo(() => archivedProjects.filter(matches), [archivedProjects, matches]);

  return {
    activeProjects, archivedProjects, loadingProjects,
    filteredActiveProjects, filteredArchivedProjects,
    projectSearch, setProjectSearch,
    projectTab, setProjectTab,
    selectedProject, select, clear,
    refresh, create, update, remove, archive, restore,
  };
}
