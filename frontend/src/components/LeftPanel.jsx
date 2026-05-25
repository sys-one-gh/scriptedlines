import { useState, useRef, useEffect } from "react";
import ToolButton from "./ToolButton";
import WallsPanel from "./WallsPanel";
import ProductsPanel from "./ProductsPanel";
import SubassembliesPanel from "./SubassembliesPanel";
import PartsPanel from "./PartsPanel";
import HardwarePanel from "./HardwarePanel";
import MaterialsPanel from "./MaterialsPanel";

function LeftPanel({ leftWidth }) {

  // ─── TAB DEFINITIONS ─────────────────────────────────────────
  const tabs = [
    { id: "walls",         label: "Wall"        },
    { id: "products",      label: "Products"    },
    { id: "subassemblies", label: "SubProducts" },
    { id: "parts",         label: "Parts"       },
    { id: "hardware",      label: "Hardware"    },
    { id: "materials",     label: "Material"    },
  ];

  // ─── STATE ───────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState("walls");
  const [searchText,    setSearchText]    = useState("");
  const [canScrollLeft, setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ─── REFS ─────────────────────────────────────────────────────
  const tabBarRef = useRef(null);

  // ─── OVERFLOW DETECTION ───────────────────────────────────────
  // Runs whenever leftWidth changes — panel resize triggers recheck.
  // Also runs on mount and window resize.
  function checkOverflow() {
    const bar = tabBarRef.current;
    if (!bar) return;
    const hasOverflow = bar.scrollWidth > bar.clientWidth;
    setCanScrollLeft(bar.scrollLeft > 0);
    setCanScrollRight(
      hasOverflow && bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1
    );
  }

  // Re-check when leftWidth changes (panel was resized)
  useEffect(() => {
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [leftWidth]);

  // Re-check on mount and window resize
  useEffect(() => {
    const timer = setTimeout(checkOverflow, 50);
    window.addEventListener("resize", checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  // ─── SCROLL HANDLERS ─────────────────────────────────────────
  function handleScrollLeft() {
    const bar = tabBarRef.current;
    if (!bar) return;
    bar.scrollBy({ left: -100, behavior: "smooth" });
  }

  function handleScrollRight() {
    const bar = tabBarRef.current;
    if (!bar) return;
    bar.scrollBy({ left: 100, behavior: "smooth" });
  }

  // ─── TAB CHANGE ──────────────────────────────────────────────
  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setSearchText("");
  }

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="left-panel-content">

      {/* ── TAB BAR ─────────────────────────────────────────────
          Left arrow: visible when scrolled right.
          Right arrow: visible when tabs overflow and there are
          hidden tabs to the right OR when panel is narrow enough
          that not all tabs are visible.
          Both always occupy space to prevent layout shift.
      ──────────────────────────────────────────────────────── */}
      <div className="tab-bar-wrapper">

        {/* Left scroll arrow */}
        <button
          className="tab-scroll-btn"
          onClick={handleScrollLeft}
          style={{
            opacity:       canScrollLeft ? 1 : 0,
            pointerEvents: canScrollLeft ? "auto" : "none",
          }}
          title="Scroll tabs left"
        >
          ‹
        </button>

        {/* Scrollable tab row */}
        <div
          className="tab-bar"
          ref={tabBarRef}
          onScroll={checkOverflow}
        >
          {tabs.map((tab) => (
            <ToolButton
              key={tab.id}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </div>

        {/* Right scroll arrow */}
        <button
          className="tab-scroll-btn"
          onClick={handleScrollRight}
          style={{
            opacity:       canScrollRight ? 1 : 0,
            pointerEvents: canScrollRight ? "auto" : "none",
          }}
          title="Scroll tabs right"
        >
          ›
        </button>

      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────── */}
      <div className="left-search">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* ── PANEL CONTENT ───────────────────────────────────────── */}
      <div className="tab-content">
        {activeTab === "walls"         && <WallsPanel         searchText={searchText} />}
        {activeTab === "products"      && <ProductsPanel      searchText={searchText} />}
        {activeTab === "subassemblies" && <SubassembliesPanel searchText={searchText} />}
        {activeTab === "parts"         && <PartsPanel         searchText={searchText} />}
        {activeTab === "hardware"      && <HardwarePanel      searchText={searchText} />}
        {activeTab === "materials"     && <MaterialsPanel     searchText={searchText} />}
      </div>

    </div>
  );
}

export default LeftPanel;