import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import NavbarPaciente from './components/Navbar_Paciente'
import NavbarDoctor from './components/Navbar_Doctor'
import SidebarPaciente from './components/Sidebar_paciente'
import SidebarDoctor from './components/Sidebar_Doctor'
import SidebarVerificador from './components/Sidebar_Verificador'
import RoleSelector from './pages/RoleSelector'
import MedicalSearch from './pages/MedicalSearch'
import ChatAssistant from './pages/ChatAssistant'
import DoctorMedicalChat from './pages/DoctorMedicalChat'
import PatientMedicalChat from './pages/PatientMedicalChat'
import Profile from './pages/Profile'
import MedicalAlerts from './pages/MedicalAlerts';
import Plans from './pages/Plans';

import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorProfileFree from './pages/doctor/DoctorProfileFree'
import DoctorCreate from './pages/doctor/DoctorCreate'
import DoctorCreateFree from './pages/doctor/DoctorCreateFree'
import DoctorUpgradePlan from './pages/doctor/DoctorUpgradePlan'
import ViewPreview from './pages/doctor/ViewPreview'
import FeePayments from './pages/doctor/FeePayments'
import DoctorTranscription from './pages/doctor/DoctorTranscription'
import DoctorGoogleProfilePage from './pages/doctor/DoctorGoogleProfilePage'

// Patient pages
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientTranscription from './pages/patient/PatientTranscription'
import PatientHome from './pages/patient/PatientHome'
import PatientSearchWrapper from './pages/patient/PatientSearchWrapper'

// Verification / Verifier pages
import VerificationDetail from './pages/VerificationDetail'
import VerifierSupportConversations from './pages/VerifierSupportConversations'

function App() {
  const { user } = useAuth()
  const location = useLocation()

  /*
   * Rutas donde NO queremos mostrar el Navbar ni el Sidebar
   */
  const isDoctorCreatePage =
    location.pathname === '/doctor/create' ||
    location.pathname === '/doctor/register' ||
    location.pathname === '/doctor/create-free' ||
    location.pathname === '/doctor/preview'

  return (
    <div className="h-screen w-screen flex flex-col font-sans overflow-hidden">

      {/* Navbar renderizado de forma condicional (el verificador no usa navbar superior) */}
      {!isDoctorCreatePage && user && user.role !== 'verifier' && (
        user.role === 'doctor' ? <NavbarDoctor /> : <NavbarPaciente />
      )}

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar — doctor, paciente o verificador */}
        {!isDoctorCreatePage && user && (
          user.role === 'doctor'
            ? <SidebarDoctor />
            : user.role === 'verifier'
              ? <SidebarVerificador />
              : <SidebarPaciente />
        )}

        <main className="flex-1 flex flex-col overflow-hidden">

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

            <Route path="/plans" element={<Plans />} />

            <Route
              path="/chat"
              element={<ChatAssistant />}
            />

            <Route
              path="/medical-chat"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : user.role === 'doctor' ? (
                  <DoctorMedicalChat />
                ) : (
                  <PatientMedicalChat />
                )
              }
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
              path="/doctor/create-free"
              element={<DoctorCreateFree />}
            />

            <Route
              path="/doctor/register"
              element={<DoctorCreate />}
            />

            <Route
              path="/doctor/appointments"
              element={<DoctorAppointments />}
            />

            <Route
              path="/doctor/profile"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : (!user?.subscription || user?.subscription?.slug === 'free-plan' || user?.subscription?.price === 0) ? (
                  <DoctorProfileFree />
                ) : (
                  <DoctorProfile />
                )
              }
            />

            <Route
              path="/doctor/upgrade-plan"
              element={<DoctorUpgradePlan />}
            />

            <Route
              path="/fee-payments"
              element={<FeePayments />}
            />

            <Route
              path="/transcription"
              element={<DoctorTranscription />}
            />

            <Route
              path="/doctor/preview"
              element={<ViewPreview />}
            />

            <Route
              path="/perfil-google"
              element={<DoctorGoogleProfilePage />}
            />

            <Route
              path="/doctor/perfil-google"
              element={<DoctorGoogleProfilePage />}
            />

            {/* Patient */}
            <Route
              path="/patient/home"
              element={<PatientHome />}
            />
            <Route
              path="/patient/search"
              element={<PatientSearchWrapper />}
            />
            <Route
              path="/patient/appointments"
              element={<PatientAppointments />}
            />
            <Route
              path="/patient/transcriptions"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : user.role === 'patient' ? (
                  <PatientTranscription />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Verifier */}
            <Route
              path="/verification/detail"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : user.role === 'verifier' ? (
                  <VerificationDetail />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/verifier/support-conversations"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : user.role === 'verifier' ? (
                  <VerifierSupportConversations />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Soporte: redirige al home (el soporte es un modal en el Sidebar) */}
            <Route
              path="/support"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </main>
      </div>

    </div>
  )
}

export default App