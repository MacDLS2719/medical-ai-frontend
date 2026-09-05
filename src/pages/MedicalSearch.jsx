import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  ExternalLink,
  BookOpen,
  AlertCircle,
  Mic,
  Bell,
  BellPlus,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Info,
  Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// IMPORTA AQUÍ TU IMAGEN DESDE LA CARPETA ASSETS
import AIHeaderImage from '../assets/Imges_Paciente.png'; // Reemplaza por la ruta y nombre real de tu imagen

export default function MedicalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para la biblioteca/fuente médica seleccionada
  const [selectedLibrary, setSelectedLibrary] = useState('all');

  // Estado para voz a texto
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useState(null);

  const libraries = [
    { id: 'all', name: 'Todas' },
    { id: 'pubmed', name: 'PubMed' },
    { id: 'cochrane', name: 'Cochrane' },
    { id: 'europepmc', name: 'EuropePMC' },
    { id: 'openfda', name: 'OpenFDA' },
    { id: 'whoictrp', name: 'WHO ICTRP' },
    { id: 'clinicaltrials', name: 'ClinicalTrials' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // ==========================================================
  // VOZ A TEXTO (Web Speech API — 100% nativo del navegador)
  // ==========================================================
  const toggleListening = () => {
    if (isListening) {
      // Detener grabación
      if (recognitionRef[0]) {
        recognitionRef[0].stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    setSpeechError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language?.startsWith('en') ? 'en-US' : 'es-CO';
    recognition.continuous = true;      // Graba continuamente hasta que el usuario detenga
    recognition.interimResults = true;  // Muestra texto provisional mientras habla

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      // Actualizar el textarea en tiempo real
      setQuery(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('[Speech] Error:', event.error);
      if (event.error !== 'no-speech') {
        setSpeechError(`Error de micrófono: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Si capturó algo, buscar automáticamente
      if (finalTranscript.trim()) {
        fetchResults(finalTranscript.trim());
      }
    };

    recognition.start();
    recognitionRef[0] = recognition;
  };

  // ==========================================================
  // BUSCAR
  // ==========================================================
  const fetchResults = async (searchQuery = query) => {
    setLoading(true);
    setError(null);

    try {
      setResults([]);
      const endpoint = '/medical/search';
      const url = import.meta.env.VITE_API_URL + endpoint;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language,
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 100,
          user_id: user?.id,
          source: selectedLibrary, // Envía la biblioteca seleccionada al backend
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || t('searchPage.errorTitle'));
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/x-ndjson')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === 'results' && data.data && data.data.length > 0) {
                setResults(prevResults => sortByDate([...prevResults, ...data.data]));
              } else if (data.type === 'error') {
                console.warn(`Error en fuente ${data.source}: ${data.message}`);
              }
            } catch (e) {
              console.error('Error parseando JSON de streaming:', line, e);
            }
          }
        }
      } else {
        const data = await response.json();
        setResults(sortByDate(data.results || []));
      }
    } catch (err) {
      console.error('Error en búsqueda médica:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchResults("");
    }
  }, [user]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    await fetchResults(query);
  };

  const formatDate = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return date.toLocaleDateString(i18n.language || 'es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return value;
    }
  };

  const getSource = (doc) => doc.source_type ? String(doc.source_type).toUpperCase() : 'SOURCE';

  const getAuthors = (doc) => {
    if (!doc.authors) return t('searchPage.authorsNotSpecified');
    if (Array.isArray(doc.authors)) {
      if (doc.authors.length === 0) return t('searchPage.authorsNotSpecified');
      const authors = doc.authors.slice(0, 3).join(', ');
      return doc.authors.length > 3 ? `${authors}, et al.` : authors;
    }
    return String(doc.authors);
  };

  const sortByDate = (documents) => {
    return [...documents].sort((a, b) => {
      const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
      const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
      return dateB - dateA;
    });
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden p-4 sm:p-8 bg-slate-50/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col animate-in fade-in duration-500">

        {/* ENCABEZADO SUPERIOR CON IMAGEN */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight md:text-4xl">
              Evidencia médica
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Pregunta sobre lo que necesitas saber y obtén evidencia científica confiable.
            </p>
          </div>

          {/* IMAGEN A LA DERECHA DEL ENCABEZADO */}
          <div className="hidden sm:block shrink-0">
            <img
              src={AIHeaderImage}
              alt="Evidencia Médica IA"
              className="h-28 w-auto object-contain md:h-36"
            />
          </div>
        </div>

        {/* GRID PRINCIPAL DE 2 COLUMNAS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* COLUMNA IZQUIERDA: TARJETA DE BÚSQUEDA */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="relative rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
              
              {/* BADGE PRINCIPAL */}
              <div className="mb-6">
                <span className="inline-block rounded-md bg-violet-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-violet-700">
                  PRINCIPAL
                </span>
              </div>

              {/* TÍTULO Y DESCRIPCIÓN CON ICONO */}
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-indigo-600">
                  <Search size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Consultar avances médicos
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">
                    Pregúntame sobre enfermedades, tratamientos, fármacos, estudios o cualquier tema de tu interés.
                  </p>
                </div>
              </div>

              {/* ÁREA DE TEXTO Y BÚSQUEDA */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-3 transition-within focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600/10">
                  <textarea
                    rows={3}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={1000}
                    placeholder="Escribe aquí qué quieres conocer..."
                    className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                  <div className="flex justify-end text-[11px] font-medium text-slate-400">
                    {query.length}/1000
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN DEBAJO DE LA CAJA DE TEXTO */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  
                  {/* SELECTOR DE BIBLIOTECAS MÉDICAS */}
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-indigo-600 shrink-0" />
                    <select
                      value={selectedLibrary}
                      onChange={(e) => setSelectedLibrary(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition-all hover:border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 cursor-pointer"
                    >
                      {libraries.map((lib) => (
                        <option key={lib.id} value={lib.id}>
                          {lib.id === 'all' ? 'Todas las bibliotecas' : lib.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BOTÓN BUSCAR */}
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>Buscar</span>
                  </button>

                </div>

                {/* BOTÓN DE MICRÓFONO */}
                <div className="flex flex-col items-center justify-center pt-4">
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={loading}
                    className={`group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                      isListening
                        ? 'bg-red-500 shadow-red-500/40 animate-pulse'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-500/30'
                    }`}
                  >
                    {isListening ? (
                      // Animación de ondas de voz mientras graba
                      <span className="flex items-end gap-0.5 h-5">
                        <span className="w-1 rounded-full bg-white animate-bounce" style={{ height: '30%', animationDelay: '0ms' }} />
                        <span className="w-1 rounded-full bg-white animate-bounce" style={{ height: '70%', animationDelay: '150ms' }} />
                        <span className="w-1 rounded-full bg-white animate-bounce" style={{ height: '100%', animationDelay: '300ms' }} />
                        <span className="w-1 rounded-full bg-white animate-bounce" style={{ height: '70%', animationDelay: '450ms' }} />
                        <span className="w-1 rounded-full bg-white animate-bounce" style={{ height: '30%', animationDelay: '600ms' }} />
                      </span>
                    ) : (
                      <Mic size={24} />
                    )}
                  </button>
                  <p className="mt-3 text-xs font-bold text-slate-900">
                    {isListening ? '🔴 Escuchando... pulsa para detener' : 'Pulsa el micrófono para hablar'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isListening ? 'El texto aparecerá arriba en tiempo real' : 'Puedes explicarle a Vital IA lo que buscas.'}
                  </p>
                  {speechError && (
                    <p className="mt-2 text-[11px] text-red-500 text-center max-w-xs">{speechError}</p>
                  )}
                </div>
              </form>
            </div>

            {/* BANNER INFORMATIVO INFERIOR */}
            <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-xs text-violet-900">
              <div className="flex items-center gap-3">
                <Info size={18} className="shrink-0 text-indigo-600" />
                <span>
                  Vital IA busca en fuentes científicas de confianza para ofrecerte información actualizada y de calidad.
                </span>
              </div>
              <Sparkles size={16} className="shrink-0 text-indigo-500" />
            </div>
          </div>

          {/* COLUMNA DERECHA: TARJETAS DE CREAR ALERTA */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-5">
            <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-indigo-600">
                  <Bell size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Crear alerta médica
                </h2>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">
                  Recibe al instante nuevos avances sobre lo que más te interesa.
                </p>

                {/* BOTÓN TARJETA SECUNDARIA */}
                <button
                  onClick={() => navigate('/notifications')}
                  className="mt-8 flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-all hover:bg-violet-50/50 hover:border-violet-200"
                >
                  <div className="flex items-center gap-3">
                    <BellPlus size={20} className="text-indigo-600" />
                    <span className="text-xs font-medium text-slate-700">
                      Crea alertas sobre enfermedades, tratamientos o especialidades.
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              </div>

              {/* BOTÓN ACCIÓN PRINCIPAL MORADO/PÚRPURA */}
              <button
                onClick={() => navigate('/notifications')}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-indigo-600 px-5 py-3.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white"
              >
                <span>Crear nueva alerta</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>

        {/* RESULTADOS DE BÚSQUEDA */}
        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">
                Resultados encontrados ({results.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((doc, idx) => (
                <article key={idx} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                      {getSource(doc)}
                    </span>
                    {doc.publication_date && (
                      <span className="text-[11px] text-slate-400">
                        {formatDate(doc.publication_date)}
                      </span>
                    )}
                  </div>
                  <h4 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">
                    {doc.title || 'Sin título'}
                  </h4>
                  <p className="mb-4 line-clamp-3 text-xs text-slate-500">
                    {doc.abstract || 'Sin resumen disponible.'}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                    <span className="truncate text-slate-400">
                      {getAuthors(doc)}
                    </span>
                    <a
                      href={doc.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                    >
                      {t('searchPage.viewOriginal')}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}