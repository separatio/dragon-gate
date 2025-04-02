import { useEffect, useRef, useState } from 'react'
import { useGame } from '../hooks/useGame'
import introScene from '../scenes/story/intro.json'
import { GameMode } from '../GameProvider'

interface IntroScene {
  text: string[]
}

export default function CenterSection() {
  const { gameState, setDisplayedText, setSceneFinished, setGameMode } =
    useGame()
  const [sceneText, setSceneText] = useState<string[]>([])
  const [currentStartIndex, setCurrentStartIndex] = useState(0)
  const maxParagraphs = 6
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const loadedScene = introScene as IntroScene
    setSceneText(loadedScene.text)
    setDisplayedText(loadedScene.text[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = () => {
    if (currentStartIndex + maxParagraphs < sceneText.length) {
      setCurrentStartIndex(currentStartIndex + maxParagraphs)
      setDisplayedText(sceneText[currentStartIndex])
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    } else {
      setSceneFinished(true)
    }
  }

  useEffect(() => {
    if (gameState.sceneFinished) {
      setGameMode(GameMode.Free)
    }
  }, [gameState.sceneFinished, setGameMode])

  if (gameState.sceneFinished) {
    return (
      <main className="flex-grow p-4 overflow-y-auto md:w-3/4 mx-auto flex flex-col justify-between">
        <p>What would you like to do next?</p>
      </main>
    )
  }

  const visibleText = sceneText.slice(
    currentStartIndex,
    currentStartIndex + maxParagraphs
  )

  return (
    <main
      ref={containerRef}
      className="flex-grow p-4 overflow-y-auto md:w-3/4 mx-auto flex flex-col justify-between"
    >
      <div>
        {visibleText.map((text, index) => (
          <p key={index + currentStartIndex}>{text}</p>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <button
          className="btn btn-secondary btn-soft btn-md"
          onClick={handleClick}
        >
          Next
        </button>
      </div>
    </main>
  )
}
