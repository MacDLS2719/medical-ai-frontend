import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import RoleSelector from './pages/RoleSelector'
import MedicalSearch from './pages/MedicalSearch'
import ChatAssistant from './pages/ChatAssistant'
import MedicalChat from './pages/MedicalChat'
import Profile from './pages/Profile'
import MedicalAlerts from './pages/MedicalAlerts';

// Doctor pages
import DoctorAvailability from './pages/doctor/DoctorAvailability'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorCreate from './pages/doctor/DoctorCreate'

// Patient pages
import PatientAppointments from './pages/patient/PatientAppointments'

// Verification pages
import VerificationDetail from './pages/VerificationDetail'

function App() {
  const { user } = useAuth()
  const location = useLocation()

  /*
   * Rutas donde NO queremos mostrar el Navbar ni el Sidebar
   */
  const isDoctorCreatePage =
    location.pathname === '/doctor/create' ||
    location.pathname === '/doctor/register'

  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* Navbar solamente fuera de creación de médico */}
      {!isDoctorCreatePage && <Navbar />}

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar tampoco aparece en creación de médico */}
        {!isDoctorCreatePage && user && <Sidebar />}

        <main className="flex-1 flex flex-col overflow-y-auto">

          <Routes>

            {/* General */}
            <Route
              path="/"
              element={<RoleSelector />}
            />

            <Route
              path="/search"
              element={<MedicalSearch />}
            />

            <Route path="/notifications" element={<MedicalAlerts />} />

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

            {/* Doctor */}
            <Route
              path="/doctor/create"
              element={<DoctorCreate />}
            />

            <Route
              path="/doctor/register"
              element={<DoctorCreate />}
            />

            <Route
              path="/doctor/availability"
              element={<DoctorAvailability />}
            />

            <Route
              path="/doctor/appointments"
              element={<DoctorAppointments />}
            />

            <Route
              path="/doctor/profile"
              element={<DoctorProfile />}
            />

            {/* Patient */}
            <Route
              path="/patient/appointments"
              element={<PatientAppointments />}
            />

            {/* Verifier */}
            <Route
              path="/verification/detail"
              element={<VerificationDetail />}
            />

          </Routes>

        </main>
      </div>

    </div>
  )
}

export default App