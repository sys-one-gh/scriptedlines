import { useState, useEffect } from "react";

function ProductsPanel({ searchText }) {

  // ─── STATE ─────────────────────────────────────────────────
  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [openCategory,    setOpenCategory]    = useState(null);
  const [openSubcategory, setOpenSubcategory] = useState(null);


  // ─── FETCH FROM API ────────────────────────────────────────
  // Data comes from PostgreSQL via FastAPI — not toolLibrary.js
  useEffect(() => {
    fetch("http://localhost:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load products.");
        setLoading(false);
      });
  }, []);


  // ─── DRAG START ────────────────────────────────────────────
  function handleDragStart(event, item) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id:             item.id,
        code:           item.code,
        name:           item.name,
        type:           "product",
        svg_type:       item.svg_type,
        category:       item.category,
        subcategory:    item.subcategory,
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


  // ─── TOGGLE HANDLERS ───────────────────────────────────────
  // Clicking a category closes the subcategory when switching
  function toggleCategory(categoryId) {
    setOpenCategory((current) => current === categoryId ? null : categoryId);
    setOpenSubcategory(null);
  }

  function toggleSubcategory(subcategoryId) {
    setOpenSubcategory((current) => current === subcategoryId ? null : subcategoryId);
  }


  // ─── LOADING / ERROR STATES ────────────────────────────────
  if (loading) return <div className="panel-placeholder">Loading products...</div>;
  if (error)   return <div className="panel-placeholder">{error}</div>;


  // ─── SEARCH MODE ───────────────────────────────────────────
  // Flattens all three levels and filters by name
  const search = searchText.toLowerCase().trim();

  if (search) {
    const matchingItems = categories.flatMap((category) =>
      category.subcategories.flatMap((sub) =>
        sub.items.filter((item) =>
          item.name.toLowerCase().includes(search) ||
          item.code.toLowerCase().includes(search)
        )
      )
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
            onDragStart={(e) => handleDragStart(e, item)}
          >
            <div className="library-item-name">{item.name}</div>
            <div className="library-item-code">{item.code}</div>
          </div>
        ))}
      </div>
    );
  }


  // ─── NORMAL MODE — three levels ────────────────────────────
  // Category → Subcategory → Items
  return (
    <div>
      {categories.map((category) => {
        const isCategoryOpen = openCategory === category.id;

        return (
          <div key={category.id} className="library-category">

            {/* ── CATEGORY HEADER ────────────────────────────── */}
            <button
              className="category-header"
              onClick={() => toggleCategory(category.id)}
            >
              <span>{category.name}</span>
              <span>{isCategoryOpen ? "−" : "+"}</span>
            </button>

            {/* ── SUBCATEGORIES ──────────────────────────────── */}
            {isCategoryOpen && (
              <div className="category-items">
                {category.subcategories.map((sub) => {
                  const isSubOpen = openSubcategory === sub.id;

                  return (
                    <div key={sub.id} className="library-subcategory">

                      {/* ── SUBCATEGORY HEADER ─────────────────── */}
                      <button
                        className="subcategory-header"
                        onClick={() => toggleSubcategory(sub.id)}
                      >
                        <span>{sub.name}</span>
                        <span>{isSubOpen ? "−" : "+"}</span>
                      </button>

                      {/* ── ITEMS ──────────────────────────────── */}
                      {isSubOpen && (
                        <div className="subcategory-items">
                          {sub.items.map((item) => (
                            <div
                              key={item.id}
                              className="library-item"
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, item)}
                            >
                              <div className="library-item-name">{item.name}</div>
                              <div className="library-item-code">{item.code}</div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default ProductsPanel;