import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AccessibilityProvider, ThemeProvider } from './theme'
import { GameProvider } from './GameProvider.tsx'
import { ScreenProvider } from './ScreenProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <ThemeProvider>
        <GameProvider>
          <ScreenProvider>
            <App />
          </ScreenProvider>
        </GameProvider>
      </ThemeProvider>
    </AccessibilityProvider>
  </StrictMode>
)
