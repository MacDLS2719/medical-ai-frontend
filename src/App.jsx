import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import RoleSelector from './pages/RoleSelector'
import MedicalSearch from './pages/MedicalSearch'
import PatientNotifications from './pages/patient/PatientNotifications'
import ChatAssistant from './pages/ChatAssistant'

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col font-sans">

      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {user && <Sidebar />}

        <main className="flex-1 flex flex-col overflow-y-auto">
          <Routes>

            <Route
              path="/"
              element={<RoleSelector />}
            />

            <Route
              path="/search"
              element={<MedicalSearch />}
            />

            <Route
              path="/patient/notifications"
              element={<PatientNotifications />}
            />

            <Route
              path="/chat"
              element={<ChatAssistant />}
            />

          </Routes>
        </main>
      </div>

    </div>
  )
}

export default App