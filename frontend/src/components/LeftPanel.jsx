import { useState } from "react";
import ToolButton from "./ToolButton";
import ProductsPanel from "./ProductsPanel";
import SubassembliesPanel from "./SubassembliesPanel";
import HardwarePanel from "./HardwarePanel";
import MaterialsPanel from "./MaterialsPanel";

function LeftPanel() {
  // Tracks which tab is currently open
  const [activeTab, setActiveTab] = useState("products");

  // Stores what user types in search box
  const [searchText, setSearchText] = useState("");

  const tabs = ["Products", "Subassemblies", "Hardware", "Materials"];

  return (
    <div className="left-panel-content">
      {/* Tab buttons */}
      <div className="tab-bar">
        {tabs.map((tab) => (
          <ToolButton
            key={tab}
            label={tab}
            isActive={activeTab === tab.toLowerCase()}
            onClick={() => setActiveTab(tab.toLowerCase())}
          />
        ))}
      </div>

      {/* Search bar for current active tab */}
      <div className="left-search">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {/* Content changes based on active tab */}
      <div className="tab-content">
        {activeTab === "products" && <ProductsPanel searchText={searchText} />}
        {activeTab === "subassemblies" && (
          <SubassembliesPanel searchText={searchText} />
        )}
        {activeTab === "hardware" && <HardwarePanel searchText={searchText} />}
        {activeTab === "materials" && <MaterialsPanel searchText={searchText} />}
      </div>
    </div>
  );
}

export default LeftPanel;