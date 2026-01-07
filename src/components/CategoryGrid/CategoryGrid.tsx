/**
 * CategoryGrid Component
 * Reusable grid with category tabs and horizontal scrolling
 */

import { useState, useMemo, ReactNode } from 'react';
import { CategoryTabs } from './CategoryTabs';
import { ScrollableGrid } from './ScrollableGrid';

export interface CategoryGridItem {
  id: string;
  category: string;
  disabled?: boolean;
}

interface CategoryGridProps<T extends CategoryGridItem> {
  items: T[];
  categories: string[];
  onSelect: (id: string) => void;
  onBack: () => void;
  renderItem: (item: T) => ReactNode;
  allLabel?: string;
}

export function CategoryGrid<T extends CategoryGridItem>({
  items,
  categories,
  onSelect,
  onBack,
  renderItem,
  allLabel = 'All',
}: CategoryGridProps<T>) {
  const [activeCategory, setActiveCategory] = useState(allLabel);

  const allCategories = useMemo(() => [allLabel, ...categories], [allLabel, categories]);

  const filteredItems = useMemo(() => {
    if (activeCategory === allLabel) return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory, allLabel]);

  return (
    <div className="category-grid">
      <CategoryTabs
        categories={allCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onBack={onBack}
      />
      <ScrollableGrid>
        <div className="grid-items">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className={`grid-item ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && onSelect(item.id)}
              disabled={item.disabled}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      </ScrollableGrid>
    </div>
  );
}
