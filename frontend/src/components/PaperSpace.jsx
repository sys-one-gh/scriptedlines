import { useRef, useState } from "react";

function PaperSpace({ paper }) {
  // Zoom level for the paper
  // 1 = default zoomed-out view
  // 2 = twice as large
  // Minimum will stay 1 so paper never becomes smaller than default
  const [zoom, setZoom] = useState(1);
  const paperAreaRef = useRef(null);
  

  // mouse wheel control zoom only when cursor is over paper area
  function handleWheel(event) {
    // stop normal browser scrolling behavior
    event.preventDefault();
    event.stopPropagation();

    // wheel up = zoom in, wheel down = zoom out
    const zoomStep = event.deltaY < 0 ? 0.25 : -0.25;

    setZoom((currentZoom) => {
      // Minimum zoom is 1 (default size), so it does not go below the 90 percent base size of the grey workspace
      
      // Maximum zoom is 5 (500% of default size) to prevent excessive zooming

      const nextZoom = currentZoom + zoomStep;
      return Math.min(Math.max(nextZoom, 1), 10);
    });
  }
  return (
    <div 
      className = "paper-scroll-area"
      onWheel={handleWheel}
      ref={paperAreaRef}
    >
      {/* Stage keeps paper centered in the grey workspace */}
      <div className="paper-stage">
        {/* Paper size layer controls visible paper size */}
        <div
          className="paper-size-layer"
          style={{
            // Base size = 90% of grey workspace
            // Zoom grows from this base
            width: `${90 * zoom}%`,

            // Keeps correct paper proportions (dynamic for any paper size)
            aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
          }}
        >
          <svg
            viewBox={`0 0 ${paper.widthMm} ${paper.heightMm}`}
            className="paper-svg"
          >
            {/* Actual paper outer and inner boundary */}
            {/* outer White sheet (no border) */}
            <rect
              x="0"
              y="0"
              width={paper.widthMm}
              height={paper.heightMm}
              fill="white"
            />

            {/* Inner drawing boundary (98%) kind of like printable area*/}
            <rect
              x={paper.widthMm * 0.01}
              y={paper.heightMm * 0.01}
              width={paper.widthMm * 0.98}
              height={paper.heightMm * 0.98}
              fill="none"
              stroke="black"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default PaperSpace;