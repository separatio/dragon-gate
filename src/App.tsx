import { useContext } from 'react';
import VisualArea from './components/VisualArea';
import { BottomPanelProvider, BottomPanel } from './components/BottomPanel';
import MainMenu from './screens/full/MainMenuScreen';
import StoryScreen from './screens/game/StoryScreen';
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

  // Story mode: 70/30 split with scene engine
  if (screenState.currentScreen === Screen.Story) {
    return (
      <BottomPanelProvider>
        <div className="game-container">
          <VisualArea />
          <BottomPanel />
          <StoryScreen />
        </div>
      </BottomPanelProvider>
    );
  }

  // Default game layout: 70/30 split
  return (
    <BottomPanelProvider>
      <div className="game-container">
        <VisualArea />
        <BottomPanel />
      </div>
    </BottomPanelProvider>
  );
}
