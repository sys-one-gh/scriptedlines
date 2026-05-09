import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import "../App.css";
import LeftPanel from "../components/LeftPanel";

function Workspace() {

  // Select default paper (24"x36")
  // Later this will come from dropdown
  const paper = paperSizes.ARCH_D;

  return (
    <div className="app-container">
      
      {/* Top section → future toolbar (10% height) */}
      <div className="top-bar">
        // comment: this will be the toolbar with buttons for functinaltites for page like next page, previous page, project name, drawing number + name, website name and logo, etc
      </div>

      {/* Main horizontal layout */}
      <div className="main-layout">

        {/* Left panel → tools/components (15% width) */}
        <div className="left-panel">
          <LeftPanel />
        </div>

        {/* Center panel → drawing canvas (70% width) */}
        <div className="center-panel">
            {/* Inner wrapper centers the paper inside the scrollable canvas area */}
            <div className="canvas-inner">
                <PaperSpace paper={paper} />
            </div>
        </div>

        {/* Right panel → properties/settings (15% width) */}
        <div className="right-panel">
          Properties (15%)
        </div>

      </div>

    </div>
  );
}

export default Workspace;