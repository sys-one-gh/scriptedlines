import { useState, useRef, useEffect } from "react";
import ToolButton from "./ToolButton";
import WallsPanel from "./WallsPanel";
import ProductsPanel from "./ProductsPanel";
import SubassembliesPanel from "./SubassembliesPanel";
import PartsPanel from "./PartsPanel";
import HardwarePanel from "./HardwarePanel";
import MaterialsPanel from "./MaterialsPanel";

function LeftPanel() {

  // ─── TAB DEFINITIONS ─────────────────────────────────────────
  // Full list of all 6 tabs in order.
  const tabs = [
    { id: "walls",         label: "Wall"        },
    { id: "products",      label: "Products"    },
    { id: "subassemblies", label: "SubProducts" },
    { id: "parts",         label: "Parts"       },
    { id: "hardware",      label: "Hardware"    },
    { id: "materials",     label: "Material"    },
  ];


  // ─── STATE ───────────────────────────────────────────────────

  // activeTab: which tab content is currently shown
  const [activeTab, setActiveTab] = useState("walls");

  // searchText: resets when switching tabs
  const [searchText, setSearchText] = useState("");

  // Arrow visibility
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);


  // ─── REFS ─────────────────────────────────────────────────────
  // tabBarRef → the scrollable tab row
  const tabBarRef = useRef(null);


  // ─── OVERFLOW DETECTION ───────────────────────────────────────
  // Checks if tabs overflow the container.
  // Updates arrow visibility based on scroll position.
  function checkOverflow() {
    const bar = tabBarRef.current;
    if (!bar) return;
    setCanScrollLeft(bar.scrollLeft > 0);
    setCanScrollRight(bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1);
  }

  useEffect(() => {
    // Small delay so DOM is fully painted before measuring
    const timer = setTimeout(checkOverflow, 50);
    window.addEventListener("resize", checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);


  // ─── SCROLL HANDLERS ─────────────────────────────────────────
  // Scrolls the tab bar by a fixed amount.
  // 100px per click feels natural for tab navigation.

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
          Left arrow appears when scrolled right.
          Right arrow appears when there are hidden tabs to the right.
          Both arrows always occupy space to prevent layout shift —
          they are invisible (opacity 0) when not needed.
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

        {/* Scrollable tab row — hides scrollbar, arrows handle nav */}
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