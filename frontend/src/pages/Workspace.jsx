import { paperSizes } from "../data/paperSizes";
import PaperSpace from "../components/PaperSpace";
import "../App.css";
import LeftPanel from "../components/LeftPanel";

function Workspace() {

  // Default paper: 24" x 36"
  // Later this will come from a dropdown in the top bar
  const paper = paperSizes.ARCH_D;

  return (
    <div className="app-container">

      {/* ── TOP BAR ─────────────────────────────────────────────
          10% of screen height.
          Will hold: logo, project name, drawing number,
          page navigation, save, export buttons.
      ──────────────────────────────────────────────────────── */}
      <div className="top-bar">
        ScriptedLines
      </div>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────
          Remaining 90% split into three columns:
          Left panel | Center canvas | Right panel
      ──────────────────────────────────────────────────────── */}
      <div className="main-layout">

        {/* ── LEFT PANEL ────────────────────────────────────────
            18% width — tool library (products, hardware, etc.)
        ─────────────────────────────────────────────────────── */}
        <div className="left-panel">
          <LeftPanel />
        </div>

        {/* ── CENTER PANEL ──────────────────────────────────────
            70% width — main drawing canvas.
            No padding, no overflow here.
            PaperSpace fills this entirely and handles
            its own scrolling, zoom, and pan internally.
        ─────────────────────────────────────────────────────── */}
        <div className="center-panel">
          <PaperSpace paper={paper} />
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────
            15% width — selected object properties.
            Will show dimensions, finish, material info
            when a drawing object is selected.
        ─────────────────────────────────────────────────────── */}
        <div className="right-panel">
          Properties
        </div>

      </div>

    </div>
  );
}

export default Workspace;
