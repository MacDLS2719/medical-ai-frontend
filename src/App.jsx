import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'

import RoleSelector from './pages/RoleSelector'
import MedicalSearch from './pages/MedicalSearch'

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">

      <Navbar />

      <main className="flex-1 flex flex-col">
        <Routes>

          <Route
            path="/"
            element={<RoleSelector />}
          />

          <Route
            path="/search"
            element={<MedicalSearch />}
          />

        </Routes>
      </main>

    </div>
  )
}

export default App