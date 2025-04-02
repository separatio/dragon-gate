// src/ScreenProvider.tsx
import React, { createContext, useState, ReactNode, useCallback } from 'react'

enum Screen {
  MainMenu,
  CharacterCreation,
  Story,
}

enum Modal {
  LoadGame,
  SaveGame,
}

interface ScreenState {
  currentScreen: Screen
  activeModal: Modal | null
}

interface ScreenContextType {
  screenState: ScreenState
  setCurrentScreen: (screen: Screen) => void
  setActiveModal: (modal: Modal | null) => void
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined)

export const ScreenProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [screenState, setScreenState] = useState<ScreenState>({
    currentScreen: Screen.MainMenu, // Start with the main menu
    activeModal: null,
  })

  const setCurrentScreen = useCallback((screen: Screen) => {
    setScreenState((prev) => ({ ...prev, currentScreen: screen }))
  }, [])

  const setActiveModal = useCallback((modal: Modal | null) => {
    setScreenState((prev) => ({ ...prev, activeModal: modal }))
  }, [])

  const value: ScreenContextType = {
    screenState,
    setCurrentScreen,
    setActiveModal,
  }

  return (
    <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
  )
}

export { ScreenContext, Screen }
