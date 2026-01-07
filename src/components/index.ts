/**
 * Components barrel exports
 */

// Bottom Panel
export {
  BottomPanelProvider,
  BottomPanel,
  useBottomPanel,
} from './BottomPanel';
export type {
  PanelState,
  ChoiceOption,
  ActionOption,
  SkillOption,
  ItemOption,
  TargetOption,
  BottomPanelContextValue,
} from './BottomPanel';

// Category Grid
export {
  CategoryGrid,
  CategoryTabs,
  ScrollableGrid,
  GridItem,
} from './CategoryGrid';
export type { CategoryGridItem } from './CategoryGrid';

// Error Handling
export { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

// Loading States
export { LoadingSpinner, LoadingOverlay } from './Loading';

// Save UI
export { SaveSlotCard, SaveSlotsPanel } from './save';

// UI Components
export { ChoiceButton } from './ui';

// Standalone Components
export { AccessibilityMenu } from './AccessibilityMenu';
export { default as BottomSection } from './BottomSection';
export { default as CenterSection } from './CenterSection';
export { default as VisualArea } from './VisualArea';
