import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import RoleSelector from './pages/RoleSelector'
import MedicalSearch from './pages/MedicalSearch'
import ChatAssistant from './pages/ChatAssistant'
import MedicalChat from './pages/MedicalChat'
import Profile from './pages/Profile'

// Doctor pages
import DoctorAvailability from './pages/doctor/DoctorAvailability'
import DoctorAppointments from './pages/doctor/DoctorAppointments'

// Patient pages
import PatientAppointments from './pages/patient/PatientAppointments'

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
              path="/chat"
              element={<ChatAssistant />}
            />

            <Route
              path="/medical-chat"
              element={<MedicalChat />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            {/* Doctor routes */}
            <Route
              path="/doctor/availability"
              element={<DoctorAvailability />}
            />

            <Route
              path="/doctor/appointments"
              element={<DoctorAppointments />}
            />

            {/* Patient routes */}
            <Route
              path="/patient/appointments"
              element={<PatientAppointments />}
            />

          </Routes>
        </main>
      </div>

    </div>
  )
}

export default App