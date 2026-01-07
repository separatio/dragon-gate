import { useContext } from 'react';
import VisualArea from './components/VisualArea';
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
    <div className="game-container">
      <VisualArea />
      {/* BottomPanel will be added in Plan 009 */}
      <div className="bottom-panel">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted font-ui">Bottom Panel (Plan 009)</p>
        </div>
      </div>
    </div>
  );
}
