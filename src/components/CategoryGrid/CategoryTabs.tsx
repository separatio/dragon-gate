/**
 * CategoryTabs Component
 * Tab navigation for filtering grid items by category
 */

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onBack: () => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  onBack,
}: CategoryTabsProps) {
  return (
    <div className="category-tabs">
      <button className="category-tab-back" onClick={onBack} aria-label="Go back">
        ← Back
      </button>
      <div className="category-tab-list">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
