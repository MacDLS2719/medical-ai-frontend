import { Link } from 'react-router-dom'

function DoctorHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <main className="mx-auto max-w-6xl px-6 py-16">

        <h1 className="text-4xl font-bold">
          Área médica
        </h1>

        <p className="mt-4 text-slate-400">
          Consulta evidencia científica y ensayos clínicos.
        </p>

        <Link
          to="/medico/busqueda"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 hover:bg-blue-700"
        >
          Buscar evidencia científica
        </Link>

      </main>

    </div>
  )
}

export default DoctorHome