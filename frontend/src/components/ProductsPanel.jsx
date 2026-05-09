import { useState } from "react";
import { toolLibrary } from "../data/toolLibrary";

function ProductsPanel({ searchText }) {
  const categories = toolLibrary.products;
  const [openCategoryId, setOpenCategoryId] = useState(null);

  const search = searchText.toLowerCase().trim();

  function toggleCategory(categoryId) {
    setOpenCategoryId((currentId) =>
      currentId === categoryId ? null : categoryId
    );
  }

  // Starts drag and stores product data
  function handleDragStart(event, item, categoryName) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: item.id,
        name: item.name,
        type: "product",
        categoryName,
      })
    );

    event.dataTransfer.effectAllowed = "copy";
  }

  // Search mode: show only matching items, not categories
  if (search) {
    const matchingItems = categories.flatMap((category) =>
      category.items
        .filter((item) => item.name.toLowerCase().includes(search))
        .map((item) => ({
          ...item,
          categoryName: category.name,
        }))
    );

    return (
      <div>
        {matchingItems.map((item) => (
          <div
            key={item.id}
            className="library-item"
            draggable={true}
            onDragStart={(event) =>
              handleDragStart(event, item, item.categoryName)
            }
          >
            {item.name}
          </div>
        ))}
      </div>
    );
  }

  // Normal mode: show categories, expand only when clicked
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
                    onDragStart={(event) =>
                      handleDragStart(event, item, category.name)
                    }
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