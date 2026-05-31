import { useState, useRef, useEffect } from "react";
import ToolButton from "./ToolButton";
import WallsPanel from "./WallsPanel";
import ProductsPanel from "./ProductsPanel";
import SubassembliesPanel from "./SubassembliesPanel";
import PartsPanel from "./PartsPanel";
import HardwarePanel from "./HardwarePanel";
import MaterialsPanel from "./MaterialsPanel";

function LeftPanel({ leftWidth }) {

  const tabs = [
    { id: "walls",         label: "Wall"        },
    { id: "products",      label: "Products"    },
    { id: "subassemblies", label: "SubProducts" },
    { id: "parts",         label: "Parts"       },
    { id: "hardware",      label: "Hardware"    },
    { id: "materials",     label: "Material"    },
  ];

  const [activeTab,      setActiveTab]      = useState("walls");
  const [searchText,     setSearchText]     = useState("");
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabBarRef = useRef(null);

  function checkOverflow() {
    const bar = tabBarRef.current;
    if (!bar) return;
    setCanScrollLeft(bar.scrollLeft > 0);
    setCanScrollRight(bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1);
  }

  useEffect(() => {
    const t = setTimeout(checkOverflow, 50);
    return () => clearTimeout(t);
  }, [leftWidth]);

  useEffect(() => {
    const t = setTimeout(checkOverflow, 50);
    window.addEventListener("resize", checkOverflow);
    return () => { clearTimeout(t); window.removeEventListener("resize", checkOverflow); };
  }, []);

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setSearchText("");
  }

  return (
    <div className="left-panel-content">

      <div className="tab-bar-wrapper">
        <button
          className="tab-scroll-btn"
          onClick={() => tabBarRef.current?.scrollBy({ left: -100, behavior: "smooth" })}
          style={{
            opacity:       canScrollLeft ? 1 : 0.25,
            pointerEvents: canScrollLeft ? "auto" : "none",
          }}
        >‹</button>

        <div className="tab-bar" ref={tabBarRef} onScroll={checkOverflow}>
          {tabs.map(tab => (
            <ToolButton
              key={tab.id}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </div>

        <button
          className="tab-scroll-btn"
          onClick={() => tabBarRef.current?.scrollBy({ left: 100, behavior: "smooth" })}
          style={{
            opacity:       canScrollRight ? 1 : 0.25,
            pointerEvents: canScrollRight ? "auto" : "none",
          }}
        >›</button>
      </div>

      <div className="left-search">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

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