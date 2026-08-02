// ─────────────────────────────────────────────────────────────
// ProjectSetup.jsx
//
// Project-scoped setup popup. Structurally clones the Drawing
// Viewer shell (vw-* classes from ProjectsPage.css): same overlay,
// same 70vw x 82vh viewer, same draggable sidebar divider with the
// left/right scroll line, same 25% / 40% right-panel clamp.
//
// Layout:
//   header  → three MAIN tabs (Project Data / Material / Hardware)
//   body    → left  = dataset viewer (4-way scroll) for active sub-tab
//             right = add-material/hardware functionality panel
//   The sub-tab bar (13 material / 5 hardware) sits at the top of the
//   RIGHT portion, beside a matching-height dataset-viewer header bar.
//
// Tabs use the workspace .tab system (App.css) with the ‹ / ›
// overflow-scroll pattern from LeftPanel.jsx.
//
// SHELL ONLY: the dataset viewer shows a placeholder (Supabase is
// not yet loaded for these category tables), and the right panel's
// "Add" controls are structural — the project_materials scoping
// layer and real add logic are deferred.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";
import { useResizableSidebar } from "../shared/useResizableSidebar.js";
import "./ProjectSetup.css";

// ─── MAIN TABS ───────────────────────────────────────────────
const MAIN_TABS = [
  { id: "data",     label: "Project Data"     },
  { id: "material", label: "Project Material"  },
  { id: "hardware", label: "Project Hardware"  },
];

// ─── MATERIAL SUB-TABS (13) ──────────────────────────────────
const MATERIAL_SUBTABS = [
  { id: "laminates",      label: "Laminates"      },
  { id: "metal_laminates",label: "Metal Laminates"},
  { id: "veneer",         label: "Veneer"         },
  { id: "solids",         label: "Solids"         },
  { id: "metal_surfaces", label: "Metal Surfaces" },
  { id: "glass",          label: "Glass"          },
  { id: "mirror",         label: "Mirror"         },
  { id: "solid_surface",  label: "Solid Surface"  },
  { id: "stone",          label: "Stone"          },
  { id: "quartz",         label: "Quartz"         },
  { id: "core",           label: "Core"           },
  { id: "layups",         label: "Layups"         },
  { id: "melamine",       label: "Melamine"       },
  { id: "edgebands",      label: "Edgebands"      },
];

// ─── HARDWARE SUB-TABS (first 5) ─────────────────────────────
const HARDWARE_SUBTABS = [
  { id: "hinges",         label: "Hinges"         },
  { id: "drawer_slides",  label: "Drawer Slides"  },
  { id: "handles_pulls",  label: "Handles / Pulls"},
  { id: "shelf_supports", label: "Shelf Supports" },
  { id: "fasteners",      label: "Fasteners"      },
];

// ─── SUB-TAB GROUPS ────────────────────────────────────────────
// How the sub-tab bar organizes the flat lists above: a "Ready" group
// for tabs with a real catalog + API behind them, then the rest
// grouped by material family so the 10 still-unbuilt material tabs
// (and all 5 hardware tabs) read as organized categories instead of
// one long scrolling strip. `soon: true` groups get dimmed tabs and
// a "Coming soon" label — still clickable (they show the placeholder
// dataset table), just visually secondary to what actually works.
const MATERIAL_GROUPS = [
  { label: "Ready",              soon: false, ids: ["laminates", "core", "melamine", "layups", "edgebands"] },
  { label: "Decorative Surfaces", soon: true, ids: ["metal_laminates", "veneer"] },
  { label: "Solid Materials",     soon: true, ids: ["solids", "solid_surface", "stone", "quartz"] },
  { label: "Specialty Surfaces",  soon: true, ids: ["metal_surfaces", "glass", "mirror"] },
];

const HARDWARE_GROUPS = [
  { label: "Ready",     soon: false, ids: ["hinges", "drawer_slides", "handles_pulls", "shelf_supports"] },
  { label: "Fasteners", soon: true,  ids: ["fasteners"] },
];

// Column headers per category — the "general" main-table view.
// (Reference only for now; real rows come once Supabase is loaded.)
const CATEGORY_COLUMNS = {
  laminates: ["Code", "Finish #", "Finish Name", "Collection", "Grade", "Texture", "Thickness (mm)", "Sizes", "Fire", "MTO"],
  core:      ["Code", "Description", "Substrate", "Thickness (mm)", "FR", "LEED", "FSC", "Ext", "CARB"],
  melamine:  ["Code", "Finish", "Core", "Thickness (mm)", "Texture", "Grain", "Sides", "FR"],
  edgebands: ["Code", "Type", "Finish", "Width (mm)", "Thickness (mm)", "Matches"],
  _default:  ["Code", "Name", "Manufacturer", "Spec", "Thickness", "Notes"],
};

function columnsFor(subtabId) {
  return CATEGORY_COLUMNS[subtabId] || CATEGORY_COLUMNS._default;
}

// Real columns for laminates added to a project (live data, unlike the
// reference-only CATEGORY_COLUMNS above).
const LAMINATE_ROW_COLUMNS = [
  "Code", "Finish #", "Finish Name", "Manufacturer", "Collection",
  "Texture", "Grade", "Thickness (in / mm)", "Sizes", "",
];

// Real columns for cores added to a project (live data).
const CORE_ROW_COLUMNS = [
  "Code", "Core Code", "Description", "Substrate",
  "Sizes", "Thickness (mm)", "Grain", "FR", "LEED", "FSC", "Ext", "CARB", "",
];

// Real columns for melamine added to a project (live data).
const MELAMINE_ROW_COLUMNS = [
  "Code", "SKU Code", "Finish", "Manufacturer", "Substrate",
  "Thickness (mm)", "Texture", "Sides", "Sizes", "FR", "",
];

// Standard PVC edgeband thicknesses — the only user-editable field on
// an (auto-created) edgeband row. Must match EDGE_THICKNESS_WIDTH in
// backend/api/laminates.py / api/edgebands.py.
const EDGEBAND_THICKNESS_OPTIONS = [0.5, 1, 2, 3];
const EDGEBAND_ROW_COLUMNS = ["Code", "Type", "Thickness", "Width (mm)", "Description", ""];

// Real columns for hardware added to a project (live data).
const HINGE_ROW_COLUMNS = [
  "Code", "Product Line", "Overlay", "Angle", "Fixing", "Mechanism", "Milling (dia/depth)", "Door Thickness", "",
];
const DRAWER_SLIDE_ROW_COLUMNS = [
  "Code", "Product Line", "Mounting", "Length", "Slide Thickness / Height", "Cabinet Depth", "Load (lbs)", "",
];
const HANDLE_ROW_COLUMNS = [
  "Code", "Style", "Manufacturer", "C-to-C (mm)", "Finish", "",
];
const SHELF_SUPPORT_ROW_COLUMNS = [
  "Code", "Style", "Manufacturer", "Diameter (mm)", "Stop", "",
];

function ProjectSetup({ project, onClose }) {

  // ── Main + sub tab state ─────────────────────────────────
  const [mainTab, setMainTab] = useState("data");
  const [materialSub, setMaterialSub] = useState(MATERIAL_SUBTABS[0].id);
  const [hardwareSub, setHardwareSub] = useState(HARDWARE_SUBTABS[0].id);

  const activeSubtabs = mainTab === "material" ? MATERIAL_SUBTABS
                      : mainTab === "hardware" ? HARDWARE_SUBTABS
                      : [];
  const activeGroups = mainTab === "material" ? MATERIAL_GROUPS
                      : mainTab === "hardware" ? HARDWARE_GROUPS
                      : [];
  const activeSub = mainTab === "material" ? materialSub
                  : mainTab === "hardware" ? hardwareSub
                  : null;
  const setActiveSub = mainTab === "material" ? setMaterialSub : setHardwareSub;

  // ── Right-panel (functionality) resize ────────────────────
  const setupRef = useRef(null);
  const sidebar = useResizableSidebar({ containerRef: setupRef, initial: 30, min: 25, max: 40, invert: true });
  const [sidebarDivHover, setSidebarDivHover] = useState(false);

  // ── Esc to close ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── LAMINATES: search + add-to-project ────────────────────
  const isLaminatesTab = mainTab === "material" && materialSub === "laminates";

  const [lamManufacturers, setLamManufacturers] = useState([]);
  const [lamQuery,         setLamQuery]         = useState("");
  const [lamManufacturer,  setLamManufacturer]  = useState("");
  const [lamResults,       setLamResults]       = useState([]);
  const [lamSearching,     setLamSearching]     = useState(false);
  const [lamSelected,      setLamSelected]      = useState(null);
  const [lamCode,          setLamCode]          = useState("");
  const [lamAdding,        setLamAdding]        = useState(false);
  const [lamAdded,         setLamAdded]         = useState([]);
  const [lamAddedLoading,  setLamAddedLoading]  = useState(false);
  const [lamError,         setLamError]         = useState("");

  const loadProjectLaminates = useCallback(async () => {
    if (!project) return;
    setLamAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/laminates`);
      const data = await res.json();
      if (res.ok) setLamAdded(data.laminates || []);
    } finally {
      setLamAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isLaminatesTab) return;
    apiFetch("/laminates/manufacturers")
      .then(res => res.json())
      .then(data => setLamManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectLaminates();
  }, [isLaminatesTab, loadProjectLaminates]);

  // Debounced search-as-you-type — only fires once the user has given
  // the search something to narrow on (typed text or picked a
  // manufacturer). Opening the tab with no criteria shouldn't pull the
  // whole catalog.
  useEffect(() => {
    if (!isLaminatesTab) return;
    if (!lamQuery.trim() && !lamManufacturer) {
      setLamResults([]);
      setLamSearching(false);
      return;
    }
    setLamSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (lamQuery.trim())     params.set("q", lamQuery.trim());
      if (lamManufacturer)     params.set("manufacturer", lamManufacturer);
      apiFetch(`/laminates/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setLamResults(data.results || []))
        .catch(() => setLamResults([]))
        .finally(() => setLamSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isLaminatesTab, lamQuery, lamManufacturer]);

  async function handleAddLaminate() {
    if (!lamSelected || !project || !lamCode.trim()) return;
    setLamAdding(true);
    setLamError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/laminates`, {
        method: "POST",
        body: JSON.stringify({ variant_id: lamSelected.variant_id, project_code: lamCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLamError(data.detail || "Could not add laminate");
        return;
      }
      setLamSelected(null);
      setLamCode("");
      await loadProjectLaminates();
    } finally {
      setLamAdding(false);
    }
  }

  async function handleRemoveLaminate(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/laminates/${rowId}`, { method: "DELETE" });
    if (res.ok) setLamAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── CORE: search + add-to-project ─────────────────────────
  // Mirrors the LAMINATES block above exactly — same shape, only the
  // endpoint prefix and add-body field name (core_id vs variant_id) differ.
  const isCoreTab = mainTab === "material" && materialSub === "core";

  const [coreSubstrateTypes, setCoreSubstrateTypes] = useState([]);
  const [coreQuery,         setCoreQuery]         = useState("");
  const [coreSubstrateType, setCoreSubstrateType] = useState("");
  const [coreResults,       setCoreResults]       = useState([]);
  const [coreSearching,     setCoreSearching]     = useState(false);
  const [coreSelected,      setCoreSelected]      = useState(null);
  const [coreCode,          setCoreCode]          = useState("");
  const [coreAdding,        setCoreAdding]        = useState(false);
  const [coreAdded,         setCoreAdded]         = useState([]);
  const [coreAddedLoading,  setCoreAddedLoading]  = useState(false);
  const [coreError,         setCoreError]         = useState("");

  const loadProjectCores = useCallback(async () => {
    if (!project) return;
    setCoreAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/cores`);
      const data = await res.json();
      if (res.ok) setCoreAdded(data.cores || []);
    } finally {
      setCoreAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isCoreTab) return;
    apiFetch("/cores/substrate-types")
      .then(res => res.json())
      .then(data => setCoreSubstrateTypes(data.substrate_types || []))
      .catch(() => {});
    loadProjectCores();
  }, [isCoreTab, loadProjectCores]);

  useEffect(() => {
    if (!isCoreTab) return;
    if (!coreQuery.trim() && !coreSubstrateType) {
      setCoreResults([]);
      setCoreSearching(false);
      return;
    }
    setCoreSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (coreQuery.trim())    params.set("q", coreQuery.trim());
      if (coreSubstrateType)   params.set("substrate_type", coreSubstrateType);
      apiFetch(`/cores/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setCoreResults(data.results || []))
        .catch(() => setCoreResults([]))
        .finally(() => setCoreSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isCoreTab, coreQuery, coreSubstrateType]);

  async function handleAddCore() {
    if (!coreSelected || !project || !coreCode.trim()) return;
    setCoreAdding(true);
    setCoreError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/cores`, {
        method: "POST",
        body: JSON.stringify({ core_id: coreSelected.core_id, project_code: coreCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoreError(data.detail || "Could not add core");
        return;
      }
      setCoreSelected(null);
      setCoreCode("");
      await loadProjectCores();
    } finally {
      setCoreAdding(false);
    }
  }

  async function handleRemoveCore(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/cores/${rowId}`, { method: "DELETE" });
    if (res.ok) setCoreAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── MELAMINE: search + add-to-project ──────────────────────
  // Mirrors the LAMINATES block exactly — manufacturer matters here
  // too (a decor is manufacturer-specific), unlike cores.
  const isMelamineTab = mainTab === "material" && materialSub === "melamine";

  const [melManufacturers, setMelManufacturers] = useState([]);
  const [melQuery,         setMelQuery]         = useState("");
  const [melManufacturer,  setMelManufacturer]  = useState("");
  const [melResults,       setMelResults]       = useState([]);
  const [melSearching,     setMelSearching]     = useState(false);
  const [melSelected,      setMelSelected]      = useState(null);
  const [melCode,          setMelCode]          = useState("");
  const [melAdding,        setMelAdding]        = useState(false);
  const [melAdded,         setMelAdded]         = useState([]);
  const [melAddedLoading,  setMelAddedLoading]  = useState(false);
  const [melError,         setMelError]         = useState("");

  const loadProjectMelamine = useCallback(async () => {
    if (!project) return;
    setMelAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/melamine`);
      const data = await res.json();
      if (res.ok) setMelAdded(data.melamine || []);
    } finally {
      setMelAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isMelamineTab) return;
    apiFetch("/melamine/manufacturers")
      .then(res => res.json())
      .then(data => setMelManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectMelamine();
  }, [isMelamineTab, loadProjectMelamine]);

  useEffect(() => {
    if (!isMelamineTab) return;
    if (!melQuery.trim() && !melManufacturer) {
      setMelResults([]);
      setMelSearching(false);
      return;
    }
    setMelSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (melQuery.trim())        params.set("q", melQuery.trim());
      if (melManufacturer)        params.set("manufacturer", melManufacturer);
      apiFetch(`/melamine/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setMelResults(data.results || []))
        .catch(() => setMelResults([]))
        .finally(() => setMelSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isMelamineTab, melQuery, melManufacturer]);

  async function handleAddMelamine() {
    if (!melSelected || !project || !melCode.trim()) return;
    setMelAdding(true);
    setMelError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/melamine`, {
        method: "POST",
        body: JSON.stringify({ melamine_id: melSelected.melamine_id, project_code: melCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMelError(data.detail || "Could not add melamine");
        return;
      }
      setMelSelected(null);
      setMelCode("");
      await loadProjectMelamine();
    } finally {
      setMelAdding(false);
    }
  }

  async function handleRemoveMelamine(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/melamine/${rowId}`, { method: "DELETE" });
    if (res.ok) setMelAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── HINGES: search + add-to-project ────────────────────────
  // Mirrors the MELAMINE block exactly — manufacturer matters here too.
  const isHingesTab = mainTab === "hardware" && hardwareSub === "hinges";

  const [hgManufacturers, setHgManufacturers] = useState([]);
  const [hgQuery,         setHgQuery]         = useState("");
  const [hgManufacturer,  setHgManufacturer]  = useState("");
  const [hgResults,       setHgResults]       = useState([]);
  const [hgSearching,     setHgSearching]     = useState(false);
  const [hgSelected,      setHgSelected]      = useState(null);
  const [hgCode,          setHgCode]          = useState("");
  const [hgAdding,        setHgAdding]        = useState(false);
  const [hgAdded,         setHgAdded]         = useState([]);
  const [hgAddedLoading,  setHgAddedLoading]  = useState(false);
  const [hgError,         setHgError]         = useState("");

  const loadProjectHinges = useCallback(async () => {
    if (!project) return;
    setHgAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/hinges`);
      const data = await res.json();
      if (res.ok) setHgAdded(data.hinges || []);
    } finally {
      setHgAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isHingesTab) return;
    apiFetch("/hinges/manufacturers")
      .then(res => res.json())
      .then(data => setHgManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectHinges();
  }, [isHingesTab, loadProjectHinges]);

  useEffect(() => {
    if (!isHingesTab) return;
    if (!hgQuery.trim() && !hgManufacturer) {
      setHgResults([]);
      setHgSearching(false);
      return;
    }
    setHgSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (hgQuery.trim())       params.set("q", hgQuery.trim());
      if (hgManufacturer)       params.set("manufacturer", hgManufacturer);
      apiFetch(`/hinges/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setHgResults(data.results || []))
        .catch(() => setHgResults([]))
        .finally(() => setHgSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isHingesTab, hgQuery, hgManufacturer]);

  async function handleAddHinge() {
    if (!hgSelected || !project || !hgCode.trim()) return;
    setHgAdding(true);
    setHgError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/hinges`, {
        method: "POST",
        body: JSON.stringify({ hinge_id: hgSelected.hinge_id, project_code: hgCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHgError(data.detail || "Could not add hinge");
        return;
      }
      setHgSelected(null);
      setHgCode("");
      await loadProjectHinges();
    } finally {
      setHgAdding(false);
    }
  }

  async function handleRemoveHinge(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/hinges/${rowId}`, { method: "DELETE" });
    if (res.ok) setHgAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── DRAWER SLIDES: search + add-to-project ─────────────────
  const isDrawerSlidesTab = mainTab === "hardware" && hardwareSub === "drawer_slides";

  const [dsManufacturers, setDsManufacturers] = useState([]);
  const [dsQuery,         setDsQuery]         = useState("");
  const [dsManufacturer,  setDsManufacturer]  = useState("");
  const [dsResults,       setDsResults]       = useState([]);
  const [dsSearching,     setDsSearching]     = useState(false);
  const [dsSelected,      setDsSelected]      = useState(null);
  const [dsCode,          setDsCode]          = useState("");
  const [dsAdding,        setDsAdding]        = useState(false);
  const [dsAdded,         setDsAdded]         = useState([]);
  const [dsAddedLoading,  setDsAddedLoading]  = useState(false);
  const [dsError,         setDsError]         = useState("");

  const loadProjectDrawerSlides = useCallback(async () => {
    if (!project) return;
    setDsAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/drawer-slides`);
      const data = await res.json();
      if (res.ok) setDsAdded(data.drawer_slides || []);
    } finally {
      setDsAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isDrawerSlidesTab) return;
    apiFetch("/drawer-slides/manufacturers")
      .then(res => res.json())
      .then(data => setDsManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectDrawerSlides();
  }, [isDrawerSlidesTab, loadProjectDrawerSlides]);

  useEffect(() => {
    if (!isDrawerSlidesTab) return;
    if (!dsQuery.trim() && !dsManufacturer) {
      setDsResults([]);
      setDsSearching(false);
      return;
    }
    setDsSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (dsQuery.trim())       params.set("q", dsQuery.trim());
      if (dsManufacturer)       params.set("manufacturer", dsManufacturer);
      apiFetch(`/drawer-slides/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setDsResults(data.results || []))
        .catch(() => setDsResults([]))
        .finally(() => setDsSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isDrawerSlidesTab, dsQuery, dsManufacturer]);

  async function handleAddDrawerSlide() {
    if (!dsSelected || !project || !dsCode.trim()) return;
    setDsAdding(true);
    setDsError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/drawer-slides`, {
        method: "POST",
        body: JSON.stringify({ drawer_slide_id: dsSelected.drawer_slide_id, project_code: dsCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDsError(data.detail || "Could not add drawer slide");
        return;
      }
      setDsSelected(null);
      setDsCode("");
      await loadProjectDrawerSlides();
    } finally {
      setDsAdding(false);
    }
  }

  async function handleRemoveDrawerSlide(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/drawer-slides/${rowId}`, { method: "DELETE" });
    if (res.ok) setDsAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── HANDLES / PULLS: search + add-to-project ────────────────
  const isHandlesTab = mainTab === "hardware" && hardwareSub === "handles_pulls";

  const [hdManufacturers, setHdManufacturers] = useState([]);
  const [hdQuery,         setHdQuery]         = useState("");
  const [hdManufacturer,  setHdManufacturer]  = useState("");
  const [hdResults,       setHdResults]       = useState([]);
  const [hdSearching,     setHdSearching]     = useState(false);
  const [hdSelected,      setHdSelected]      = useState(null);
  const [hdCode,          setHdCode]          = useState("");
  const [hdAdding,        setHdAdding]        = useState(false);
  const [hdAdded,         setHdAdded]         = useState([]);
  const [hdAddedLoading,  setHdAddedLoading]  = useState(false);
  const [hdError,         setHdError]         = useState("");

  const loadProjectHandles = useCallback(async () => {
    if (!project) return;
    setHdAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/handles`);
      const data = await res.json();
      if (res.ok) setHdAdded(data.handles || []);
    } finally {
      setHdAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isHandlesTab) return;
    apiFetch("/handles/manufacturers")
      .then(res => res.json())
      .then(data => setHdManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectHandles();
  }, [isHandlesTab, loadProjectHandles]);

  useEffect(() => {
    if (!isHandlesTab) return;
    if (!hdQuery.trim() && !hdManufacturer) {
      setHdResults([]);
      setHdSearching(false);
      return;
    }
    setHdSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (hdQuery.trim())       params.set("q", hdQuery.trim());
      if (hdManufacturer)       params.set("manufacturer", hdManufacturer);
      apiFetch(`/handles/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setHdResults(data.results || []))
        .catch(() => setHdResults([]))
        .finally(() => setHdSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isHandlesTab, hdQuery, hdManufacturer]);

  async function handleAddHandle() {
    if (!hdSelected || !project || !hdCode.trim()) return;
    setHdAdding(true);
    setHdError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/handles`, {
        method: "POST",
        body: JSON.stringify({ handle_id: hdSelected.handle_id, project_code: hdCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHdError(data.detail || "Could not add handle");
        return;
      }
      setHdSelected(null);
      setHdCode("");
      await loadProjectHandles();
    } finally {
      setHdAdding(false);
    }
  }

  async function handleRemoveHandle(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/handles/${rowId}`, { method: "DELETE" });
    if (res.ok) setHdAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── SHELF SUPPORTS: search + add-to-project ──────────────────
  const isShelfSupportsTab = mainTab === "hardware" && hardwareSub === "shelf_supports";

  const [ssManufacturers, setSsManufacturers] = useState([]);
  const [ssQuery,         setSsQuery]         = useState("");
  const [ssManufacturer,  setSsManufacturer]  = useState("");
  const [ssResults,       setSsResults]       = useState([]);
  const [ssSearching,     setSsSearching]     = useState(false);
  const [ssSelected,      setSsSelected]      = useState(null);
  const [ssCode,          setSsCode]          = useState("");
  const [ssAdding,        setSsAdding]        = useState(false);
  const [ssAdded,         setSsAdded]         = useState([]);
  const [ssAddedLoading,  setSsAddedLoading]  = useState(false);
  const [ssError,         setSsError]         = useState("");

  const loadProjectShelfSupports = useCallback(async () => {
    if (!project) return;
    setSsAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/shelf-supports`);
      const data = await res.json();
      if (res.ok) setSsAdded(data.shelf_supports || []);
    } finally {
      setSsAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isShelfSupportsTab) return;
    apiFetch("/shelf-supports/manufacturers")
      .then(res => res.json())
      .then(data => setSsManufacturers(data.manufacturers || []))
      .catch(() => {});
    loadProjectShelfSupports();
  }, [isShelfSupportsTab, loadProjectShelfSupports]);

  useEffect(() => {
    if (!isShelfSupportsTab) return;
    if (!ssQuery.trim() && !ssManufacturer) {
      setSsResults([]);
      setSsSearching(false);
      return;
    }
    setSsSearching(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (ssQuery.trim())       params.set("q", ssQuery.trim());
      if (ssManufacturer)       params.set("manufacturer", ssManufacturer);
      apiFetch(`/shelf-supports/search?${params.toString()}`)
        .then(res => res.json())
        .then(data => setSsResults(data.results || []))
        .catch(() => setSsResults([]))
        .finally(() => setSsSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [isShelfSupportsTab, ssQuery, ssManufacturer]);

  async function handleAddShelfSupport() {
    if (!ssSelected || !project || !ssCode.trim()) return;
    setSsAdding(true);
    setSsError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/shelf-supports`, {
        method: "POST",
        body: JSON.stringify({ shelf_support_id: ssSelected.shelf_support_id, project_code: ssCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSsError(data.detail || "Could not add shelf support");
        return;
      }
      setSsSelected(null);
      setSsCode("");
      await loadProjectShelfSupports();
    } finally {
      setSsAdding(false);
    }
  }

  async function handleRemoveShelfSupport(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/shelf-supports/${rowId}`, { method: "DELETE" });
    if (res.ok) setSsAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── EDGEBANDS: derived, not searched/added ─────────────────
  // Rows only exist because a laminate created them (see
  // api/laminates.py::add_project_laminate) — this tab is list +
  // thickness-dropdown + remove only, no search/add UI at all.
  const isEdgebandsTab = mainTab === "material" && materialSub === "edgebands";

  const [edgebandAdded,        setEdgebandAdded]        = useState([]);
  const [edgebandAddedLoading, setEdgebandAddedLoading] = useState(false);

  const loadProjectEdgebands = useCallback(async () => {
    if (!project) return;
    setEdgebandAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/edgebands`);
      const data = await res.json();
      if (res.ok) setEdgebandAdded(data.edgebands || []);
    } finally {
      setEdgebandAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isEdgebandsTab) return;
    loadProjectEdgebands();
  }, [isEdgebandsTab, loadProjectEdgebands]);

  async function handleUpdateEdgebandThickness(rowId, thicknessMm) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/edgebands/${rowId}`, {
      method: "PUT",
      body: JSON.stringify({ thickness_mm: thicknessMm }),
    });
    const data = await res.json();
    if (res.ok) {
      setEdgebandAdded(prev => prev.map(r => r.id === rowId ? data.edgeband : r));
    }
    return res.ok;
  }

  async function handleRemoveEdgeband(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/edgebands/${rowId}`, { method: "DELETE" });
    if (res.ok) setEdgebandAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── LAYUPS: compose from the project's own cores/laminates ─
  // No search here — a layup combines materials already added to
  // THIS project, so it lists coreAdded/lamAdded (loaded above) rather
  // than hitting a global-catalog search endpoint.
  const isLayupsTab = mainTab === "material" && materialSub === "layups";

  const [layupCore,         setLayupCore]         = useState(null);
  const [layupFaceA,        setLayupFaceA]        = useState(null);
  const [layupFaceB,        setLayupFaceB]        = useState(null);
  const [layupActiveSlot,   setLayupActiveSlot]   = useState(null); // null | "core" | "faceA" | "faceB"
  const [layupCode,         setLayupCode]         = useState("");
  const [layupAdding,       setLayupAdding]       = useState(false);
  const [layupAdded,        setLayupAdded]        = useState([]);
  const [layupAddedLoading, setLayupAddedLoading] = useState(false);
  const [layupError,        setLayupError]        = useState("");

  const loadProjectLayups = useCallback(async () => {
    if (!project) return;
    setLayupAddedLoading(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/layups`);
      const data = await res.json();
      if (res.ok) setLayupAdded(data.layups || []);
    } finally {
      setLayupAddedLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!isLayupsTab) return;
    loadProjectLayups();
    // Picker lists — reuse the loaders the Core/Laminates tabs already
    // define above, so switching straight to Layups still has data to
    // pick from even if those tabs were never visited this session.
    loadProjectCores();
    loadProjectLaminates();
  }, [isLayupsTab, loadProjectLayups, loadProjectCores, loadProjectLaminates]);

  async function handleCreateLayup() {
    if (!layupCore || !layupFaceA || !layupFaceB || !project || !layupCode.trim()) return;
    setLayupAdding(true);
    setLayupError("");
    try {
      const res = await apiFetch(`/projects/${project.id}/layups`, {
        method: "POST",
        body: JSON.stringify({
          project_code:    layupCode.trim(),
          project_core_id: layupCore.id,
          face_a_type: "laminate", face_a_id: layupFaceA.id,
          face_b_type: "laminate", face_b_id: layupFaceB.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLayupError(data.detail || "Could not create layup");
        return;
      }
      setLayupCore(null); setLayupFaceA(null); setLayupFaceB(null); setLayupCode("");
      await loadProjectLayups();
    } finally {
      setLayupAdding(false);
    }
  }

  async function handleRemoveLayup(rowId) {
    if (!project) return;
    const res = await apiFetch(`/projects/${project.id}/layups/${rowId}`, { method: "DELETE" });
    if (res.ok) setLayupAdded(prev => prev.filter(r => r.id !== rowId));
  }

  // ── SEARCH+ADD CONFIG (right panel) ─────────────────────────
  // Laminates/Core/Melamine/Hinges/Drawer Slides/Handles/Shelf Supports
  // all share the exact same search → filter → results → project-code →
  // add shape, just with different endpoints/fields/labels. Layups and
  // Edgebands are NOT here — they use their own bespoke panels above.
  const searchTab =
    isLaminatesTab ? {
      filterLabel: "Manufacturer", filterOptions: lamManufacturers,
      query: lamQuery, setQuery: setLamQuery, filter: lamManufacturer, setFilter: setLamManufacturer,
      results: lamResults, searching: lamSearching, selected: lamSelected, setSelected: setLamSelected,
      code: lamCode, setCode: setLamCode, codePlaceholder: "e.g. PL-01",
      error: lamError, adding: lamAdding, onAdd: handleAddLaminate,
      ResultsList: LaminateResultsList,
    } : isCoreTab ? {
      filterLabel: "Substrate", filterOptions: coreSubstrateTypes,
      query: coreQuery, setQuery: setCoreQuery, filter: coreSubstrateType, setFilter: setCoreSubstrateType,
      results: coreResults, searching: coreSearching, selected: coreSelected, setSelected: setCoreSelected,
      code: coreCode, setCode: setCoreCode, codePlaceholder: "e.g. CR-01",
      error: coreError, adding: coreAdding, onAdd: handleAddCore,
      ResultsList: CoreResultsList,
    } : isMelamineTab ? {
      filterLabel: "Manufacturer", filterOptions: melManufacturers,
      query: melQuery, setQuery: setMelQuery, filter: melManufacturer, setFilter: setMelManufacturer,
      results: melResults, searching: melSearching, selected: melSelected, setSelected: setMelSelected,
      code: melCode, setCode: setMelCode, codePlaceholder: "e.g. ML-01",
      error: melError, adding: melAdding, onAdd: handleAddMelamine,
      ResultsList: MelamineResultsList,
    } : isHingesTab ? {
      filterLabel: "Manufacturer", filterOptions: hgManufacturers,
      query: hgQuery, setQuery: setHgQuery, filter: hgManufacturer, setFilter: setHgManufacturer,
      results: hgResults, searching: hgSearching, selected: hgSelected, setSelected: setHgSelected,
      code: hgCode, setCode: setHgCode, codePlaceholder: "e.g. HG-01",
      error: hgError, adding: hgAdding, onAdd: handleAddHinge,
      ResultsList: HingeResultsList,
    } : isDrawerSlidesTab ? {
      filterLabel: "Manufacturer", filterOptions: dsManufacturers,
      query: dsQuery, setQuery: setDsQuery, filter: dsManufacturer, setFilter: setDsManufacturer,
      results: dsResults, searching: dsSearching, selected: dsSelected, setSelected: setDsSelected,
      code: dsCode, setCode: setDsCode, codePlaceholder: "e.g. DS-01",
      error: dsError, adding: dsAdding, onAdd: handleAddDrawerSlide,
      ResultsList: DrawerSlideResultsList,
    } : isHandlesTab ? {
      filterLabel: "Manufacturer", filterOptions: hdManufacturers,
      query: hdQuery, setQuery: setHdQuery, filter: hdManufacturer, setFilter: setHdManufacturer,
      results: hdResults, searching: hdSearching, selected: hdSelected, setSelected: setHdSelected,
      code: hdCode, setCode: setHdCode, codePlaceholder: "e.g. HD-01",
      error: hdError, adding: hdAdding, onAdd: handleAddHandle,
      ResultsList: HandleResultsList,
    } : isShelfSupportsTab ? {
      filterLabel: "Manufacturer", filterOptions: ssManufacturers,
      query: ssQuery, setQuery: setSsQuery, filter: ssManufacturer, setFilter: setSsManufacturer,
      results: ssResults, searching: ssSearching, selected: ssSelected, setSelected: setSsSelected,
      code: ssCode, setCode: setSsCode, codePlaceholder: "e.g. SP-01",
      error: ssError, adding: ssAdding, onAdd: handleAddShelfSupport,
      ResultsList: ShelfSupportResultsList,
    } : null;

  const activeSubLabel = activeSubtabs.find(s => s.id === activeSub)?.label || "";

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="vw-overlay">
      <div className="vw-viewer ps-viewer" ref={setupRef}>

        {/* ═══ HEADER — main tabs + identity + close ═══ */}
        <div className="vw-header ps-header">
          <div className="ps-header-tabs">
            {MAIN_TABS.map(t => (
              <button
                key={t.id}
                className={`tab${mainTab === t.id ? " active" : ""}`}
                onClick={() => setMainTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ps-header-right">
            {project && (
              <span className="ps-header-project">
                <span className="ps-header-jobnum">{project.job_number}</span>
                {project.job_number && <span className="vw-header-sep">·</span>}
                <span className="ps-header-pname">{project.project_name}</span>
              </span>
            )}
            <button className="vw-close-btn" onClick={onClose} title="Close setup">✕</button>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="vw-body">

          {/* ── LEFT: dataset viewer ── */}
          <div className="vw-canvas-col ps-dataset-col">

            {/* dataset header bar — matches sub-tab bar height (38px) */}
            <div className="ps-dataset-header">
              {mainTab === "data"
                ? <span className="ps-dataset-title">Project Data</span>
                : <span className="ps-dataset-title">{activeSubLabel}</span>}
            </div>

            {/* dataset body — 4-way scroll */}
            <div className="ps-dataset-body">
              {mainTab === "data" ? (
                <div className="ps-placeholder">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">Project Data</div>
                  <div className="ps-placeholder-text">
                    Default sizes and construction assumptions for this project.
                    Coming soon.
                  </div>
                </div>
              ) : isLaminatesTab ? (
                <LaminateDatasetTable
                  rows={lamAdded}
                  loading={lamAddedLoading}
                  onRemove={handleRemoveLaminate}
                />
              ) : isCoreTab ? (
                <CoreDatasetTable
                  rows={coreAdded}
                  loading={coreAddedLoading}
                  onRemove={handleRemoveCore}
                />
              ) : isMelamineTab ? (
                <MelamineDatasetTable
                  rows={melAdded}
                  loading={melAddedLoading}
                  onRemove={handleRemoveMelamine}
                />
              ) : isLayupsTab ? (
                <LayupDatasetTable
                  rows={layupAdded}
                  loading={layupAddedLoading}
                  onRemove={handleRemoveLayup}
                />
              ) : isEdgebandsTab ? (
                <EdgebandDatasetTable
                  rows={edgebandAdded}
                  loading={edgebandAddedLoading}
                  onUpdateThickness={handleUpdateEdgebandThickness}
                  onRemove={handleRemoveEdgeband}
                />
              ) : isHingesTab ? (
                <HingeDatasetTable
                  rows={hgAdded}
                  loading={hgAddedLoading}
                  onRemove={handleRemoveHinge}
                />
              ) : isDrawerSlidesTab ? (
                <DrawerSlideDatasetTable
                  rows={dsAdded}
                  loading={dsAddedLoading}
                  onRemove={handleRemoveDrawerSlide}
                />
              ) : isHandlesTab ? (
                <HandleDatasetTable
                  rows={hdAdded}
                  loading={hdAddedLoading}
                  onRemove={handleRemoveHandle}
                />
              ) : isShelfSupportsTab ? (
                <ShelfSupportDatasetTable
                  rows={ssAdded}
                  loading={ssAddedLoading}
                  onRemove={handleRemoveShelfSupport}
                />
              ) : (
                <DatasetTable columns={columnsFor(activeSub)} categoryLabel={activeSubLabel} />
              )}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          {mainTab !== "data" && (
            <div
              className={`vw-sidebar-divider${(sidebar.isDragging || sidebarDivHover) ? " vw-sidebar-divider--active" : ""}`}
              onMouseDown={sidebar.onDividerDown}
              onMouseEnter={() => setSidebarDivHover(true)}
              onMouseLeave={() => setSidebarDivHover(false)}
            />
          )}

          {/* ── RIGHT: sub-tabs + functionality ── */}
          {mainTab !== "data" && (
            <div className="vw-sidebar ps-func" style={{ width: `${sidebar.pct}%` }}>

              {/* sub-tab bar — grouped, wraps instead of scrolling */}
              <div className="ps-subtab-groups">
                {activeGroups.map(group => (
                  <div key={group.label} className="ps-subtab-group">
                    <div className="ps-subtab-group-label">
                      {group.label}
                      {group.soon && <span className="ps-subtab-soon">Coming soon</span>}
                    </div>
                    <div className="ps-subtab-group-tabs">
                      {group.ids.map(id => {
                        const s = activeSubtabs.find(t => t.id === id);
                        if (!s) return null;
                        return (
                          <button
                            key={s.id}
                            className={`ps-subtab${activeSub === s.id ? " active" : ""}${group.soon ? " ps-subtab--soon" : ""}`}
                            onClick={() => setActiveSub(s.id)}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* functionality body */}
              <div className="ps-func-body">
              {isLayupsTab ? (
                <LayupComposerPanel
                  projectCores={coreAdded}
                  projectLaminates={lamAdded}
                  core={layupCore} faceA={layupFaceA} faceB={layupFaceB}
                  activeSlot={layupActiveSlot} onSlotChange={setLayupActiveSlot}
                  onSelectCore={c => { setLayupCore(c); setLayupActiveSlot(null); }}
                  onSelectFaceA={f => { setLayupFaceA(f); setLayupActiveSlot(null); }}
                  onSelectFaceB={f => { setLayupFaceB(f); setLayupActiveSlot(null); }}
                  onClearCore={() => setLayupCore(null)}
                  onClearFaceA={() => setLayupFaceA(null)}
                  onClearFaceB={() => setLayupFaceB(null)}
                  code={layupCode} onCodeChange={setLayupCode}
                  onCreate={handleCreateLayup}
                  adding={layupAdding} error={layupError}
                />
              ) : isEdgebandsTab ? (
                <>
                  <div className="ps-func-section">EDGEBANDS</div>
                  <div className="ps-func-hint">
                    Edgebands aren't added manually — one is created
                    automatically for every laminate added to this project's
                    Laminates tab, matched to that finish. Removing the
                    laminate removes its edgeband too.
                  </div>
                  <div className="ps-func-hint">
                    Adjust thickness directly in the table on the left —
                    width follows automatically. Color Core finishes use
                    the laminate itself as the edge, so there's no
                    thickness to pick.
                  </div>
                </>
              ) : searchTab ? (
                <>
                <div className="ps-func-section">ADD TO {activeSubLabel.toUpperCase()}</div>

                <label className="ps-func-label">Search Global Library</label>
                <input
                  className="ps-func-input"
                  placeholder={`Search ${activeSubLabel}...`}
                  value={searchTab.query}
                  onChange={e => searchTab.setQuery(e.target.value)}
                />

                <label className="ps-func-label">{searchTab.filterLabel}</label>
                <select
                  className="ps-func-input"
                  value={searchTab.filter}
                  onChange={e => searchTab.setFilter(e.target.value)}
                >
                  <option value="">— Any —</option>
                  {searchTab.filterOptions.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>

                <searchTab.ResultsList
                  results={searchTab.results}
                  loading={searchTab.searching}
                  selected={searchTab.selected}
                  onSelect={searchTab.setSelected}
                  hasQuery={!!(searchTab.query.trim() || searchTab.filter)}
                />

                {searchTab.selected && (
                  <>
                    <label className="ps-func-label">Project Code</label>
                    <input
                      className="ps-func-input"
                      placeholder={searchTab.codePlaceholder}
                      value={searchTab.code}
                      onChange={e => searchTab.setCode(e.target.value)}
                    />
                    <div className="ps-func-hint">
                      Identifies this {mainTab === "hardware" ? "hardware item" : "material"} on drawings for this project only.
                      Entered by you — not assigned automatically.
                    </div>
                  </>
                )}

                {searchTab.error && (
                  <div className="ps-func-hint ps-func-hint--error">{searchTab.error}</div>
                )}

                <button
                  className="ps-func-add"
                  disabled={!searchTab.selected || !searchTab.code.trim() || searchTab.adding}
                  onClick={searchTab.onAdd}
                >
                  {searchTab.adding ? "Adding…" : `+ Add to ${activeSubLabel}`}
                </button>

                <div className="ps-func-divider" />

                <div className="ps-func-section">{mainTab === "hardware" ? "NEW HARDWARE" : "NEW MATERIAL"}</div>
                <div className="ps-func-hint">
                  Submit a {mainTab === "hardware" ? "hardware item" : "material"} not in the library. Goes to review before
                  it joins the global catalog.
                </div>
                <button className="ps-func-add ps-func-add--ghost" disabled>
                  + Submit New {mainTab === "hardware" ? "Hardware" : "Material"}
                </button>
                </>
              ) : null}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── DATASET TABLE (shell — placeholder rows) ────────────────
function DatasetTable({ columns, categoryLabel }) {
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>
            {columns.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="ps-table-empty-row">
            <td colSpan={columns.length}>
              <div className="ps-table-empty">
                <div className="ps-placeholder-glyph">⬡</div>
                <div className="ps-placeholder-title">No {categoryLabel} in this project</div>
                <div className="ps-placeholder-text">
                  Add {categoryLabel.toLowerCase()} from the panel on the right.
                  Catalog data is not loaded yet.
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── LAMINATE SEARCH RESULTS (right panel) ────────────────────
function LaminateResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a finish name/code or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.variant_id}
            className={`ps-lam-result${selected?.variant_id === r.variant_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.finish_code} — {r.finish_name}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer}{r.collection ? ` · ${r.collection}` : ""}
              {r.texture_name ? ` · ${r.texture_name}` : ""}
              {r.grade_code ? ` · Grade ${r.grade_code}` : ""}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── LAMINATES ADDED TO PROJECT (left dataset table) ──────────
function LaminateDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{LAMINATE_ROW_COLUMNS.map(c => <th key={c || "_actions"}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={LAMINATE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Laminates in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a finish to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{LAMINATE_ROW_COLUMNS.map(c => <th key={c || "_actions"}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.finish_code}</td>
              <td>{r.finish_name}</td>
              <td>{r.manufacturer}</td>
              <td>{r.collection}</td>
              <td>{r.texture_name}</td>
              <td>{r.grade_code}</td>
              <td>{r.thickness_in ?? "—"} / {r.thickness_mm ?? "—"}</td>
              <td>{(r.sizes || []).join(", ")}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── CORE SEARCH RESULTS (right panel) ────────────────────────
function CoreResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a code/description or pick a substrate to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.core_id}
            className={`ps-lam-result${selected?.core_id === r.core_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.code} — {r.description}
            </div>
            <div className="ps-lam-result-sub">
              {r.substrate_type} · {r.thickness_mm}mm
              {r.grain ? ` · ${r.grain} Grain` : ""}
              {(r.sizes || []).length ? ` · ${r.sizes.join(", ")}` : ""}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── CORES ADDED TO PROJECT (left dataset table) ──────────────
function CoreDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{CORE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={CORE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Core in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a core to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{CORE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.code}</td>
              <td>{r.description}</td>
              <td>{r.substrate_type}</td>
              <td>{(r.sizes || []).join(", ")}</td>
              <td>{r.thickness_mm}</td>
              <td>{r.grain || "—"}</td>
              <td>{r.fr_rated ? "✓" : "—"}</td>
              <td>{r.leed ? "✓" : "—"}</td>
              <td>{r.fsc ? "✓" : "—"}</td>
              <td>{r.exterior_grade ? "✓" : "—"}</td>
              <td>{r.carb_p2 ? "✓" : "—"}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MELAMINE SEARCH RESULTS (right panel) ────────────────────
function MelamineResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a finish name/code or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.melamine_id}
            className={`ps-lam-result${selected?.melamine_id === r.melamine_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.finish_code} — {r.finish_name}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer} · {r.core_substrate} · {r.thickness_mm}mm · {r.texture}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── MELAMINE ADDED TO PROJECT (left dataset table) ────────────
function MelamineDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{MELAMINE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={MELAMINE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Melamine in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a finish to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{MELAMINE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.code}</td>
              <td>{r.finish_code} — {r.finish_name}</td>
              <td>{r.manufacturer}</td>
              <td>{r.core_substrate}</td>
              <td>{r.thickness_mm}</td>
              <td>{r.texture}</td>
              <td>{r.g_sides}</td>
              <td>{(r.sizes || []).join(", ")}</td>
              <td>{r.fr_rated ? "✓" : "—"}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── HINGE SEARCH RESULTS (right panel) ───────────────────────
function HingeResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a code/model or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.hinge_id}
            className={`ps-lam-result${selected?.hinge_id === r.hinge_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.code} — {r.product_line}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer} · {r.overlay_type} · {r.opening_angle_deg}° · {r.fixing_type} · {r.mechanism}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── HINGES ADDED TO PROJECT (left dataset table) ──────────────
function HingeDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{HINGE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={HINGE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Hinges in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a hinge to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{HINGE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.product_line}</td>
              <td>{r.overlay_type}</td>
              <td>{r.opening_angle_deg}°</td>
              <td>{r.fixing_type}</td>
              <td>{r.mechanism}</td>
              <td>{r.milling_diameter_mm}mm / {r.milling_depth_mm}mm</td>
              <td>{r.door_thickness_min_mm}–{r.door_thickness_max_mm}mm</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── DRAWER SLIDE SEARCH RESULTS (right panel) ────────────────
function DrawerSlideResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a code/model or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.drawer_slide_id}
            className={`ps-lam-result${selected?.drawer_slide_id === r.drawer_slide_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.code} — {r.product_line}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer} · {r.length_label} · {r.mounting_type} · {r.extension_type}
              {r.slide_thickness_mm ? ` · ${r.slide_thickness_mm}mm thick / ${r.slide_height_mm}mm high` : ""}
              {r.cabinet_depth_mm ? ` · Cabinet ${r.cabinet_depth_mm}mm` : ""}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── DRAWER SLIDES ADDED TO PROJECT (left dataset table) ────────
function DrawerSlideDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{DRAWER_SLIDE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={DRAWER_SLIDE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Drawer Slides in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a slide to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{DRAWER_SLIDE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.product_line}</td>
              <td>{r.mounting_type}</td>
              <td>{r.length_label}</td>
              <td>{r.slide_thickness_mm != null ? `${r.slide_thickness_mm}mm / ${r.slide_height_mm}mm` : "—"}</td>
              <td>{r.min_cabinet_depth_mm != null ? `${r.min_cabinet_depth_mm}–${r.max_cabinet_depth_mm}mm` : "—"}</td>
              <td>{r.load_capacity_lbs}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── HANDLE SEARCH RESULTS (right panel) ──────────────────────
function HandleResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a code/style or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.handle_id}
            className={`ps-lam-result${selected?.handle_id === r.handle_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.code} — {r.style}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer ? `${r.manufacturer} · ` : ""}{r.finish}
              {r.center_to_center_mm ? ` · ${r.center_to_center_mm}mm C-C` : ""}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── HANDLES ADDED TO PROJECT (left dataset table) ─────────────
function HandleDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{HANDLE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={HANDLE_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Handles in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a handle to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{HANDLE_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.style}</td>
              <td>{r.manufacturer || "—"}</td>
              <td>{r.center_to_center_mm ?? "—"}</td>
              <td>{r.finish}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── SHELF SUPPORT SEARCH RESULTS (right panel) ────────────────
function ShelfSupportResultsList({ results, loading, selected, onSelect, hasQuery }) {
  if (!hasQuery) {
    return <div className="ps-lam-results-idle">Type a code/style or pick a manufacturer to search.</div>;
  }
  return (
    <div className="ps-lam-results">
      {loading ? (
        <div className="ps-lam-results-hint">Searching…</div>
      ) : results.length === 0 ? (
        <div className="ps-lam-results-hint">No matches</div>
      ) : (
        results.map(r => (
          <button
            key={r.shelf_support_id}
            className={`ps-lam-result${selected?.shelf_support_id === r.shelf_support_id ? " selected" : ""}`}
            onClick={() => onSelect(r)}
            type="button"
          >
            <div className="ps-lam-result-title">
              {r.code} — {r.style}
            </div>
            <div className="ps-lam-result-sub">
              {r.manufacturer ? `${r.manufacturer} · ` : ""}{r.diameter_mm}mm{r.has_stop ? " · Locking" : ""}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── SHELF SUPPORTS ADDED TO PROJECT (left dataset table) ───────
function ShelfSupportDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{SHELF_SUPPORT_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={SHELF_SUPPORT_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Shelf Supports in this project</div>
                  <div className="ps-placeholder-text">
                    Search the global library on the right and add a shelf support to get started.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{SHELF_SUPPORT_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.style}</td>
              <td>{r.manufacturer || "—"}</td>
              <td>{r.diameter_mm}</td>
              <td>{r.has_stop ? "✓" : "—"}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EDGEBANDS DERIVED FOR PROJECT (left dataset table) ────────
// Not a browse-and-add table like the others — rows only exist
// because a laminate created them. Thickness is the one editable
// field (a live dropdown), width recomputes on the backend when it
// changes. Color Core rows have no thickness to pick.
function EdgebandDatasetTable({ rows, loading, onUpdateThickness, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{EDGEBAND_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={EDGEBAND_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Edgebands in this project</div>
                  <div className="ps-placeholder-text">
                    Add a laminate on the Laminates tab — its matching
                    edgeband appears here automatically.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{EDGEBAND_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.edge_type}</td>
              <td>
                {r.edge_type === "PVC" ? (
                  <select
                    className="ps-edgeband-thickness-select"
                    value={r.thickness_mm}
                    onChange={e => onUpdateThickness(r.id, parseFloat(e.target.value))}
                  >
                    {EDGEBAND_THICKNESS_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}mm</option>
                    ))}
                  </select>
                ) : "—"}
              </td>
              <td>{r.width_mm != null ? `${r.width_mm}mm` : "—"}</td>
              <td>{r.description}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── LAYUP COMPOSER (right panel) ──────────────────────────────
// No search — lists materials already added to this project
// (projectCores / projectLaminates, loaded by the parent) instead
// of hitting a global-catalog search endpoint.
function LayupComposerPanel({
  projectCores, projectLaminates,
  core, faceA, faceB,
  activeSlot, onSlotChange,
  onSelectCore, onSelectFaceA, onSelectFaceB,
  onClearCore, onClearFaceA, onClearFaceB,
  code, onCodeChange, onCreate, adding, error,
}) {
  const thicknessMismatch = !!(
    faceA && faceB && faceA.thickness_mm != null && faceB.thickness_mm != null &&
    faceA.thickness_mm !== faceB.thickness_mm
  );
  const allPicked = !!(core && faceA && faceB);

  return (
    <>
      <div className="ps-func-section">CREATE LAYUP</div>

      <LayupSlot
        label="Core"
        summary={core ? `${core.project_code} — ${core.code}` : null}
        open={activeSlot === "core"}
        onToggle={() => onSlotChange(activeSlot === "core" ? null : "core")}
        onClear={onClearCore}
      >
        {projectCores.length === 0 ? (
          <div className="ps-lam-results-hint">No cores added to this project yet.</div>
        ) : (
          <div className="ps-lam-results">
            {projectCores.map(c => (
              <button key={c.id} type="button"
                className={`ps-lam-result${core?.id === c.id ? " selected" : ""}`}
                onClick={() => onSelectCore(c)}>
                <div className="ps-lam-result-title">{c.project_code} — {c.code}</div>
                <div className="ps-lam-result-sub">{c.description}</div>
              </button>
            ))}
          </div>
        )}
      </LayupSlot>

      <LayupSlot
        label="Face A"
        summary={faceA ? `${faceA.project_code} — ${faceA.finish_name}` : null}
        open={activeSlot === "faceA"}
        onToggle={() => onSlotChange(activeSlot === "faceA" ? null : "faceA")}
        onClear={onClearFaceA}
      >
        {projectLaminates.length === 0 ? (
          <div className="ps-lam-results-hint">No laminates added to this project yet.</div>
        ) : (
          <div className="ps-lam-results">
            {projectLaminates.map(f => (
              <button key={f.id} type="button"
                className={`ps-lam-result${faceA?.id === f.id ? " selected" : ""}`}
                onClick={() => onSelectFaceA(f)}>
                <div className="ps-lam-result-title">{f.project_code} — {f.finish_name}</div>
                <div className="ps-lam-result-sub">{f.manufacturer} · {f.thickness_mm}mm</div>
              </button>
            ))}
          </div>
        )}
      </LayupSlot>

      <LayupSlot
        label="Face B"
        summary={faceB ? `${faceB.project_code} — ${faceB.finish_name}` : null}
        open={activeSlot === "faceB"}
        onToggle={() => onSlotChange(activeSlot === "faceB" ? null : "faceB")}
        onClear={onClearFaceB}
      >
        {projectLaminates.length === 0 ? (
          <div className="ps-lam-results-hint">No laminates added to this project yet.</div>
        ) : (
          <div className="ps-lam-results">
            {projectLaminates.map(f => (
              <button key={f.id} type="button"
                className={`ps-lam-result${faceB?.id === f.id ? " selected" : ""}`}
                onClick={() => onSelectFaceB(f)}>
                <div className="ps-lam-result-title">{f.project_code} — {f.finish_name}</div>
                <div className="ps-lam-result-sub">{f.manufacturer} · {f.thickness_mm}mm</div>
              </button>
            ))}
          </div>
        )}
      </LayupSlot>

      {thicknessMismatch && (
        <div className="ps-func-hint ps-func-hint--error">
          Face thicknesses don't match ({faceA.thickness_mm}mm vs {faceB.thickness_mm}mm) —
          risk of panel warping or bending.
        </div>
      )}

      {allPicked && (
        <>
          <label className="ps-func-label">Project Code</label>
          <input
            className="ps-func-input"
            placeholder="e.g. LY-01"
            value={code}
            onChange={e => onCodeChange(e.target.value)}
          />
          <div className="ps-func-hint">
            Identifies this layup on drawings for this project only.
            Entered by you — not assigned automatically.
          </div>
        </>
      )}

      {error && <div className="ps-func-hint ps-func-hint--error">{error}</div>}

      <button
        className="ps-func-add"
        disabled={!allPicked || !code.trim() || adding}
        onClick={onCreate}
      >
        {adding ? "Creating…" : "+ Create Layup"}
      </button>
    </>
  );
}

// One slot in the composer — Core / Face A / Face B. Filled shows a
// summary chip with a clear control; empty shows a "+ Choose" button
// that expands an inline pick-list (children).
function LayupSlot({ label, summary, open, onToggle, onClear, children }) {
  return (
    <div className="ps-layup-slot">
      <div className="ps-layup-slot-header">
        <span className="ps-func-label ps-layup-slot-label">{label}</span>
        {summary ? (
          <div className="ps-layup-slot-filled">
            <span className="ps-layup-slot-summary">{summary}</span>
            <button type="button" className="ps-lam-remove" onClick={onClear} title={`Change ${label}`}>✕</button>
          </div>
        ) : (
          <button type="button" className="ps-layup-slot-choose" onClick={onToggle}>
            {open ? "Cancel" : `+ Choose ${label}`}
          </button>
        )}
      </div>
      {open && !summary && <div className="ps-layup-slot-picker">{children}</div>}
    </div>
  );
}

// ─── LAYUPS ADDED TO PROJECT (left dataset table) ──────────────
const LAYUP_ROW_COLUMNS = ["Code", "Core", "Face A", "Face B", ""];

function LayupDatasetTable({ rows, loading, onRemove }) {
  if (loading) {
    return (
      <div className="ps-table-empty">
        <div className="ps-placeholder-title">Loading…</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>{LAYUP_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="ps-table-empty-row">
              <td colSpan={LAYUP_ROW_COLUMNS.length}>
                <div className="ps-table-empty">
                  <div className="ps-placeholder-glyph">⬡</div>
                  <div className="ps-placeholder-title">No Layups in this project</div>
                  <div className="ps-placeholder-text">
                    Add a core and at least two laminates to this project first,
                    then compose a layup on the right.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>{LAYUP_ROW_COLUMNS.map((c, i) => <th key={c || `_actions_${i}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.project_code}</td>
              <td>{r.core?.project_code} — {r.core?.code}</td>
              <td>{r.face_a?.finish_code} — {r.face_a?.finish_name}</td>
              <td>{r.face_b?.finish_code} — {r.face_b?.finish_name}</td>
              <td>
                <button className="ps-lam-remove" onClick={() => onRemove(r.id)} title="Remove from project">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProjectSetup;
