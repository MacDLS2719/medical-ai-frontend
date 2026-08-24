import { useState } from 'react'
import { BookOpen, ExternalLink, Calendar, Users, Search, AlertCircle } from 'lucide-react'

function DoctorSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // ==========================================================
  // BUSCAR
  // ==========================================================
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      let userStr = localStorage.getItem('user')
      if (userStr === 'undefined' || !userStr) {
        userStr = '{}'
      }

      const user = JSON.parse(userStr)
      const userId = user.id || 1
      const lang = localStorage.getItem('language') || 'es'

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/medical/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': lang
          },
          body: JSON.stringify({
            query: query.trim(),
            max_results: 15,
            user_id: userId
          })
        }
      )

      if (!res.ok) {
        throw new Error('Error al conectar con el servicio de búsqueda de evidencia.')
      }

      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Ocurrió un error inesperado al procesar la búsqueda.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // FORMATEAR FECHA
  // ==========================================================
  const formatDate = (value) => {
    if (!value) return 'Fecha n/a'
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return value
    }
  }

  const getDate = (doc) => {
    return (
      doc.publication_date ||
      doc.published_date ||
      doc.publicationDate ||
      doc.date ||
      doc.study_start_date ||
      null
    )
  }

  // ==========================================================
  // AUTORES Y FUENTE
  // ==========================================================
  const getAuthors = (doc) => {
    if (!doc.authors) return 'No especificados'
    if (Array.isArray(doc.authors)) {
      if (doc.authors.length === 0) return 'No especificados'
      return `${doc.authors.slice(0, 2).join(', ')}${
        doc.authors.length > 2 ? ' et al.' : ''
      }`
    }
    return doc.authors
  }

  const getSource = (doc) => {
    if (!doc.source_type) return 'EVIDENCIA'
    return String(doc.source_type).toUpperCase()
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* ENCABEZADO */}
        <div className="mb-8 max-w-2xl">
          <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Búsqueda de Evidencia Médica
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Explora literatura científica indexada en PubMed, Cochrane y ensayos de ClinicalTrials.
          </p>
        </div>

        {/* BUSCADOR */}
        <form onSubmit={handleSearch} className="flex w-full flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Glucocorticoids in severe asthma exacerbation..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* ERROR */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* RESULTADOS - GRID DE 3 COLUMNAS */}
        {results.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <BookOpen size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                Artículos encontrados ({results.length})
              </h2>
            </div>

            {/* Grid responsive: 1 col (móvil), 2 col (tablet), 3 col (pantallas medianas/grandes >= 1024px) */}
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((doc, i) => (
                <a
                  key={doc.id || doc.doi || i}
                  href={doc.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                        {getSource(doc)}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={13} />
                        <span>{formatDate(getDate(doc))}</span>
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="mb-2.5 line-clamp-2 text-base font-semibold leading-snug text-slate-100 transition-colors group-hover:text-blue-400">
                      {doc.title || 'Sin título'}
                    </h3>

                    {/* Abstract / Resumen */}
                    <p className="line-clamp-4 text-xs leading-relaxed text-slate-400">
                      {doc.abstract || 'Sin resumen disponible para esta publicación.'}
                    </p>
                  </div>

                  {/* Footer de la tarjeta */}
                  <div className="mt-5 border-t border-slate-800/60 pt-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <Users size={14} className="shrink-0 text-slate-500" />
                      <span className="truncate">
                        {getAuthors(doc)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1 text-xs font-medium text-blue-400 transition-colors group-hover:text-blue-300">
                      <span>Ver fuente</span>
                      <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* SPINNER DE CARGA */}
        {loading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
            <span className="text-sm text-slate-400">Recuperando evidencia médica...</span>
          </div>
        )}

        {/* SIN RESULTADOS */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="mt-12 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-10 text-center">
            <p className="text-sm text-slate-400">
              No se encontraron estudios o artículos para "<span className="text-slate-200">{query}</span>".
            </p>
          </div>
        )}

      </main>
    </div>
  )
}

export default DoctorSearch