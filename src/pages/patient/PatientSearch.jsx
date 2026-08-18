function PatientSearch() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <main className="mx-auto max-w-5xl px-6 py-16">

        <h1 className="text-4xl font-bold">
          Consulta médica
        </h1>

        <p className="mt-3 text-slate-400">
          Busca información sobre una enfermedad o patología.
        </p>

        <div className="mt-8 flex gap-3">

          <input
            type="text"
            placeholder="Ej: diabetes tipo 2"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
          />

          <button
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700"
          >
            Buscar
          </button>

        </div>

      </main>

    </div>
  )
}

export default PatientSearch