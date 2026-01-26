import { useState } from 'react'
import KosanManagement from './pages/KosanManagement'
import Login from './components/Login'

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('currentUser')
  })

  const handleLogin = (username: string) => {
    setCurrentUser(username)
    localStorage.setItem('currentUser', username)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <>
      {currentUser ? (
        <KosanManagement username={currentUser} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  )
}

export default App
