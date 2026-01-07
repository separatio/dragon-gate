import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AccessibilityProvider, ThemeProvider } from './theme'
import { GameProvider } from './GameProvider.tsx'
import { ScreenProvider } from './ScreenProvider.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <ThemeProvider>
        <GameProvider>
          <ScreenProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ScreenProvider>
        </GameProvider>
      </ThemeProvider>
    </AccessibilityProvider>
  </StrictMode>
)
