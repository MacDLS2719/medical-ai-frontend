import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <h1 className="text-2xl font-bold">
            Medical AI
          </h1>

          <nav className="flex gap-6">
            <Link
              to="/paciente"
              className="text-slate-300 hover:text-white"
            >
              Paciente
            </Link>

            <Link
              to="/medico"
              className="text-slate-300 hover:text-white"
            >
              Médico
            </Link>
          </nav>

        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">

        <span className="mb-4 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
          Inteligencia Artificial Médica
        </span>

        <h2 className="max-w-3xl text-5xl font-bold leading-tight">
          Información médica basada en evidencia científica
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Consulta información científica proveniente de PubMed,
          Cochrane y ClinicalTrials.gov.
        </p>

        <div className="mt-10 flex gap-4">

          <Link
            to="/paciente"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700"
          >
            Soy paciente
          </Link>

          <Link
            to="/medico"
            className="rounded-lg border border-slate-700 px-6 py-3 font-medium hover:bg-slate-800"
          >
            Soy médico
          </Link>

        </div>

      </main>

    </div>
  )
}

export default Home