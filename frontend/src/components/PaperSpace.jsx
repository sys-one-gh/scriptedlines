import { useRef, useState } from "react";

function PaperSpace({ paper }) {
  // Zoom level for the paper
  // 1 = default zoomed-out view
  // 2 = twice as large
  const [zoom, setZoom] = useState(1);

  const paperAreaRef = useRef(null);

  // Stores product dropped on paper
  const [droppedProduct, setDroppedProduct] = useState(null);

  // Mouse wheel controls zoom only
  function handleWheel(event) {
    event.preventDefault();
    event.stopPropagation();

    const zoomStep = event.deltaY < 0 ? 0.25 : -0.25;

    setZoom((currentZoom) => {
      const nextZoom = currentZoom + zoomStep;
      return Math.min(Math.max(nextZoom, 1), 10);
    });
  }

  // Required so browser allows dropping
  function handleDragOver(event) {
    event.preventDefault();
  }

  // Reads dragged product data and opens popup form
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const rawData = event.dataTransfer.getData("application/json");
    if (!rawData) return;

    const productData = JSON.parse(rawData);
    setDroppedProduct(productData);
  }

  return (
    <div
      className="paper-scroll-area"
      onWheel={handleWheel}
      ref={paperAreaRef}
    >
      {/* Stage keeps paper centered in the grey workspace */}
      <div className="paper-stage">
        {/* Drop target + visible paper sizing layer */}
        <div
          className="paper-size-layer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            // Base size = 90% of grey workspace
            // Zoom grows from this base
            width: `${90 * zoom}%`,

            // Keeps correct paper proportions
            aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
          }}
        >
          <svg
            viewBox={`0 0 ${paper.widthMm} ${paper.heightMm}`}
            className="paper-svg"
          >
            {/* White sheet area */}
            <rect
              x="0"
              y="0"
              width={paper.widthMm}
              height={paper.heightMm}
              fill="white"
            />

            {/* Inner drawing boundary at 98% */}
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

      {/* Temporary product detail popup */}
      {droppedProduct && (
        <div className="drop-form-overlay">
          <div className="drop-form">
            <h3>Add Product</h3>

            <p>
              Product: <strong>{droppedProduct.name}</strong>
            </p>

            <label>Width (mm)</label>
            <input type="number" placeholder="Example: 600" />

            <label>Height (mm)</label>
            <input type="number" placeholder="Example: 870" />

            <label>Depth (mm)</label>
            <input type="number" placeholder="Example: 580" />

            <div className="drop-form-actions">
              <button onClick={() => setDroppedProduct(null)}>Cancel</button>
              <button onClick={() => setDroppedProduct(null)}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaperSpace;