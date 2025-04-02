// src/screens/full/MainMenu.tsx
import { useContext } from 'react'
import { ScreenContext, Screen } from '../../ScreenProvider'
import { invoke } from '@tauri-apps/api/core'

function MainMenuScreen() {
  const context = useContext(ScreenContext)

  if (!context) {
    return <div>ScreenContext is not available.</div>
  }

  const { setCurrentScreen } = context

  const handleNewGame = () => {
    setCurrentScreen(Screen.CharacterCreation)
  }

  const handleLoadGame = () => {
    alert('Load Game is not implemented yet.')
  }

  const handleOptions = () => {
    alert('Options are not implemented yet.')
  }

  const handleQuit = () => {
    invoke('exit_app')
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-base-200">
      <h1 className="text-4xl font-bold mb-10">Battle Game</h1>
      <div className="space-y-4">
        <button
          className="btn btn-secondary btn-soft w-64"
          onClick={handleNewGame}
        >
          New Game
        </button>
        <button
          className="btn btn-secondary btn-soft w-64"
          onClick={handleLoadGame}
        >
          Load Game
        </button>
        <button
          className="btn btn-secondary btn-soft w-64"
          onClick={handleOptions}
        >
          Options
        </button>
        <button className="btn btn-error w-64" onClick={handleQuit}>
          Quit
        </button>
      </div>
    </div>
  )
}

export default MainMenuScreen
