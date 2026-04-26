import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import "../App.css";

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
        // this portion of the UI will have more than one tabs, one for products and subassemblies, one for hardwares, one for finishes, one for line types, one for dimensions, etc. Each tab will have a list of items that 
        // can be dragged and dropped into the center canvas. For example, the products tab will have a list of products that can be dragged and dropped into the center canvas to create a new product instance. The line 
        // types tab will have a list of line types that can be dragged and dropped into the center canvas to create a new line type instance.
        // The dimensions tab will have a list of dimension types that can be dragged and dropped into the center canvas to create a new dimension instance.
        // this will have list of products and components that can be dragged and dropped into the center canvas. It will also have options for line types, dimensions, etc
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