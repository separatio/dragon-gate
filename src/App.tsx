import { useContext } from 'react';
import VisualArea from './components/VisualArea';
import { BottomPanelProvider, BottomPanel } from './components/BottomPanel';
import MainMenu from './screens/full/MainMenuScreen';
import { ScreenContext, Screen } from './ScreenProvider';

export default function App() {
  const context = useContext(ScreenContext);

  if (!context) {
    return null;
  }

  const { screenState } = context;

  // Full-screen views (no 70/30 layout)
  if (screenState.currentScreen === Screen.MainMenu) {
    return <MainMenu />;
  }

  // Game layout: 70/30 split
  return (
    <BottomPanelProvider>
      <div className="game-container">
        <VisualArea />
        <BottomPanel />
      </div>
    </BottomPanelProvider>
  );
}
