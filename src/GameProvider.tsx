import React, { createContext, useState, ReactNode, useCallback, useMemo } from 'react'

enum GameMode {
  CreateCharacter,
  Story,
  Free,
  Battle,
}

interface GameState {
  displayedText: string
  sceneFinished: boolean
  gameMode: GameMode
}

interface GameContextType {
  gameState: GameState
  setDisplayedText: (text: string) => void
  setSceneFinished: (finished: boolean) => void
  setGameMode: (mode: GameMode) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    displayedText: '',
    sceneFinished: false,
    gameMode: GameMode.Story,
  })

  const setDisplayedText = useCallback((text: string) => {
    setGameState((prev) => ({ ...prev, displayedText: text }))
  }, [])

  const setSceneFinished = useCallback((finished: boolean) => {
    setGameState((prev) => ({ ...prev, sceneFinished: finished }))
  }, [])

  const setGameMode = useCallback((mode: GameMode) => {
    setGameState((prev) => ({ ...prev, gameMode: mode }))
  }, [])

  const value = useMemo<GameContextType>(
    () => ({
      gameState,
      setDisplayedText,
      setSceneFinished,
      setGameMode,
    }),
    [gameState, setDisplayedText, setSceneFinished, setGameMode]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export { GameContext, GameMode }
