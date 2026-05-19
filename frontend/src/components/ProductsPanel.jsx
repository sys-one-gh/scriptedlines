import { useState, useEffect } from "react";

function ProductsPanel({ searchText }) {

  // ─── STATE ─────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [openCategoryId, setOpenCategoryId] = useState(null);

  // ─── FETCH FROM API ────────────────────────────────────────
  // Replaces toolLibrary.js — data now comes from PostgreSQL
  useEffect(() => {
    fetch("http://localhost:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load products.");
        setLoading(false);
      });
  }, []);

  // ─── DRAG START ────────────────────────────────────────────
  function handleDragStart(event, item, categoryName) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id:           item.id,
        code:         item.code,
        name:         item.name,
        type:         "product",
        svg_type:     item.svg_type,
        categoryName: categoryName,
        defaultWidth:   item.default_width,
        defaultHeight:  item.default_height,
        defaultDepth:   item.default_depth,
        defaultDoors:   item.default_doors,
        defaultDrawers: item.default_drawers,
        defaultShelves: item.default_shelves,
      })
    );
    event.dataTransfer.effectAllowed = "copy";
  }

  function toggleCategory(categoryId) {
    setOpenCategoryId((current) =>
      current === categoryId ? null : categoryId
    );
  }

  // ─── LOADING / ERROR STATES ────────────────────────────────
  if (loading) return <div className="panel-placeholder">Loading products...</div>;
  if (error)   return <div className="panel-placeholder">{error}</div>;

  // ─── SEARCH MODE ───────────────────────────────────────────
  const search = searchText.toLowerCase().trim();

  if (search) {
    const matchingItems = categories.flatMap((category) =>
      category.items
        .filter((item) => item.name.toLowerCase().includes(search))
        .map((item) => ({ ...item, categoryName: category.name }))
    );

    if (matchingItems.length === 0) {
      return <div className="panel-placeholder">No products found.</div>;
    }

    return (
      <div>
        {matchingItems.map((item) => (
          <div
            key={item.id}
            className="library-item"
            draggable={true}
            onDragStart={(e) => handleDragStart(e, item, item.categoryName)}
          >
            {item.name}
          </div>
        ))}
      </div>
    );
  }

  // ─── NORMAL MODE ───────────────────────────────────────────
  return (
    <div>
      {categories.map((category) => {
        const isOpen = openCategoryId === category.id;
        return (
          <div key={category.id} className="library-category">
            <button
              className="category-header"
              onClick={() => toggleCategory(category.id)}
            >
              <span>{category.name}</span>
              <span>{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="category-items">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="library-item"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item, category.name)}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProductsPanel;