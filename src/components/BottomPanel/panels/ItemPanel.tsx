/**
 * ItemPanel Component
 * Item selection using CategoryGrid with quantity display
 */

import { CategoryGrid } from '../../CategoryGrid';
import { ItemOption } from '../BottomPanelContext';

interface ItemPanelProps {
  items: ItemOption[];
  categories: string[];
  onSelect: (itemId: string) => void;
  onBack: () => void;
}

export default function ItemPanel({ items, categories, onSelect, onBack }: ItemPanelProps) {
  return (
    <CategoryGrid
      items={items}
      categories={categories}
      onSelect={onSelect}
      onBack={onBack}
      renderItem={(item) => (
        <>
          <span className="item-name">{item.name}</span>
          <span className="item-quantity">×{item.quantity}</span>
        </>
      )}
    />
  );
}
