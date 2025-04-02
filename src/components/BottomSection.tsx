import { useGame } from '../hooks/useGame'
import { GameMode } from '../GameProvider'

function BottomSection() {
  const { gameState } = useGame()

  const getButtonsForMode = () => {
    switch (gameState.gameMode) {
      case GameMode.CreateCharacter:
        return []
      case GameMode.Story:
        return []
      case GameMode.Free:
        return [
          <button key="explore" className="btn btn-secondary m-1">
            Explore
          </button>,
          <button key="inventory" className="btn btn-secondary m-1">
            Inventory
          </button>,
          <button key="skills" className="btn btn-secondary m-1">
            Skills
          </button>,
        ]
      case GameMode.Battle:
        return [
          <button key="attack" className="btn btn-error m-1">
            Attack
          </button>,
          <button key="defend" className="btn btn-info m-1">
            Defend
          </button>,
        ]
      default:
        return []
    }
  }

  const buttons = getButtonsForMode()

  return (
    <footer className="p-4 border-t-2 flex justify-center">
      <div className="flex justify-center flex-wrap md:w-3/4 ">{buttons}</div>
    </footer>
  )
}

export default BottomSection
