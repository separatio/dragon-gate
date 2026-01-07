// src/ScreenProvider.tsx
import React, { createContext, useState, ReactNode, useCallback } from 'react'

enum Screen {
  MainMenu,
  Story,
}

interface ScreenState {
  currentScreen: Screen
}

interface ScreenContextType {
  screenState: ScreenState
  setCurrentScreen: (screen: Screen) => void
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined)

export const ScreenProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [screenState, setScreenState] = useState<ScreenState>({
    currentScreen: Screen.MainMenu, // Start with the main menu
  })

  const setCurrentScreen = useCallback((screen: Screen) => {
    setScreenState((prev) => ({ ...prev, currentScreen: screen }))
  }, [])

  const value: ScreenContextType = {
    screenState,
    setCurrentScreen,
  }

  return (
    <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
  )
}

export { ScreenContext, Screen }
