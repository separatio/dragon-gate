/**
 * GridItem Component
 * Individual item in the category grid
 */

import { ReactNode } from 'react';

interface GridItemProps {
  id: string;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function GridItem({ id, selected, disabled, onClick, children }: GridItemProps) {
  return (
    <button
      className={`grid-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
      data-id={id}
    >
      {children}
    </button>
  );
}
