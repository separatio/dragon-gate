import { useContext } from 'react'
import BottomSection from './components/BottomSection'
import CenterSection from './components/CenterSection'
import MainMenu from './screens/full/MainMenuScreen'
import { ScreenContext, Screen } from './ScreenProvider'

export default function App() {
  const context = useContext(ScreenContext)

  if (!context) {
    // Handle the case where the context is undefined
    return <div>ScreenContext is not available.</div>
  }

  const { screenState } = context

  if (screenState.currentScreen === Screen.MainMenu) {
    return <MainMenu />
  }

  return (
    <div className="h-screen flex flex-col w-full mx-auto">
      <CenterSection />
      <BottomSection />
    </div>
  )
}
