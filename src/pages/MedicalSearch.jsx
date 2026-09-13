import { useState, useEffect, useRef } from 'react';
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
import AIHeaderImage from '../assets/Imges_Paciente.png';

export default function MedicalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLibrary, setSelectedLibrary] = useState('all');

  // Voz a texto
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const wsRef = useRef(null);

  // Contador de búsquedas gratuitas
  const FREE_SEARCHES = 1;
  const [searchCount, setSearchCount] = useState(0);

  const libraries = [
    { id: 'all', name: 'Todas' },
    { id: 'pubmed', name: 'PubMed' },
    { id: 'cochrane', name: 'Cochrane' },
    { id: 'europepmc', name: 'EuropePMC' },
    { id: 'openfda', name: 'OpenFDA' },
    { id: 'clinicaltrials', name: 'ClinicalTrials' },
  ];

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // ------------------------------------------------------------------
  // Micrófono (WebSocket)
  // ------------------------------------------------------------------
  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'close' }));
        wsRef.current.close();
      }
      setIsListening(false);
      setIsTranscribing(false);
      return;
    }

    setSpeechError(null);
    setQuery('');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setSpeechError('No se pudo acceder al micrófono. Verifica los permisos.');
      return;
    }

    const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
    const wsUrl =
      import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/api$/, '') +
      `/api/transcribe/stream?language=${lang}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let currentTranscript = '';

    ws.onopen = () => {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.transcript) {
          if (data.is_final) {
            currentTranscript += (currentTranscript ? ' ' : '') + data.transcript;
            setQuery(currentTranscript);
          } else {
            setQuery((currentTranscript ? currentTranscript + ' ' : '') + data.transcript);
          }
        }
      } catch (err) {
        console.error('Error parseando WebSocket msg:', err);
      }
    };

    ws.onerror = () => {
      setSpeechError('Se perdió la conexión en tiempo real.');
      setIsListening(false);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    };

    ws.onclose = () => {
      setIsListening(false);
      setIsTranscribing(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  };

  // ------------------------------------------------------------------
  // Búsqueda
  // ------------------------------------------------------------------
  const fetchResults = async (searchQuery = query) => {
    setLoading(true);
    setError(null);

    try {
      setResults([]);
      const url = import.meta.env.VITE_API_URL + '/medical/search';

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
          source: selectedLibrary,
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
              if (data.type === 'results' && data.data?.length > 0) {
                setResults((prev) => sortByDate([...prev, ...data.data]));
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
    if (user && user.role === 'patient') fetchResults('');
  }, [user]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const newCount = searchCount + 1;
    setSearchCount(newCount);

    // Si supera el límite gratuito → llevar a página de planes
    if (newCount > FREE_SEARCHES) {
      navigate('/plans');
      return;
    }

    await fetchResults(query);
  };

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const formatDate = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return date.toLocaleDateString(i18n.language || 'es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const getSource = (doc) =>
    doc.source_type ? String(doc.source_type).toUpperCase() : 'SOURCE';

  const getAuthors = (doc) => {
    if (!doc.authors) return t('searchPage.authorsNotSpecified');
    if (Array.isArray(doc.authors)) {
      if (doc.authors.length === 0) return t('searchPage.authorsNotSpecified');
      const authors = doc.authors.slice(0, 3).join(', ');
      return doc.authors.length > 3 ? `${authors}, et al.` : authors;
    }
    return String(doc.authors);
  };

  const sortByDate = (documents) =>
    [...documents].sort((a, b) => {
      const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
      const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
      return dateB - dateA;
    });

  if (!user) return null;

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const remaining = Math.max(FREE_SEARCHES - searchCount, 0);
  const limitReached = searchCount >= FREE_SEARCHES;

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden p-4 sm:p-8 bg-slate-50/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col animate-in fade-in duration-500">

        {/* ── Encabezado ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight md:text-4xl">
              Evidencia médica
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Pregunta sobre lo que necesitas saber y obtén evidencia científica confiable.
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <img src={AIHeaderImage} alt="Evidencia Médica IA" className="h-28 w-auto object-contain md:h-36" />
          </div>
        </div>

        {/* ── Grid 2 columnas ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* ── Columna izq: búsqueda ── */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="relative rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">

              {/* Badge + contador */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block rounded-md bg-violet-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-violet-700">
                  PRINCIPAL
                </span>

                {/* Pill contador */}
                <button
                  onClick={() => limitReached && navigate('/plans')}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                    limitReached
                      ? 'bg-red-50 border-red-200 text-red-600 cursor-pointer hover:bg-red-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${limitReached ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {limitReached
                    ? '⚠ Límite alcanzado — Ver planes'
                    : `${remaining} búsqueda${remaining !== 1 ? 's' : ''} gratuita${remaining !== 1 ? 's' : ''} disponible${remaining !== 1 ? 's' : ''}`
                  }
                </button>
              </div>

              {/* Título */}
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-indigo-600">
                  <Search size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Consultar avances médicos</h2>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">
                    Pregúntame sobre enfermedades, tratamientos, fármacos, estudios o cualquier tema de tu interés.
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-3 transition-all focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600/10">
                  <textarea
                    rows={3}
                    value={isTranscribing ? '' : query}
                    onChange={(e) => {
                      if (!isListening && !isTranscribing) setQuery(e.target.value);
                    }}
                    maxLength={1000}
                    placeholder={
                      isTranscribing
                        ? '⏳ Transcribiendo con Deepgram...'
                        : 'Escribe aquí qué quieres conocer...'
                    }
                    readOnly={isListening || isTranscribing}
                    className={`w-full resize-none bg-transparent text-sm placeholder-slate-400 outline-none transition-colors ${
                      isListening
                        ? 'text-red-500 font-medium'
                        : isTranscribing
                        ? 'text-indigo-400 font-medium italic'
                        : 'text-slate-800'
                    }`}
                  />
                  <div className="flex justify-end text-[11px] font-medium text-slate-400">
                    {query.length}/1000
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                    <span>Buscar</span>
                  </button>
                </div>

                {/* Micrófono */}
                <div className="flex flex-col items-center justify-center pt-4">
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={loading || isTranscribing}
                    className={`group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                      isTranscribing
                        ? 'bg-indigo-400 shadow-indigo-400/40 cursor-not-allowed'
                        : isListening
                        ? 'bg-red-500 shadow-red-500/40 animate-pulse'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-500/30'
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="animate-spin" size={22} />
                    ) : isListening ? (
                      <span className="flex items-end gap-0.5 h-5">
                        {[0, 150, 300, 450, 600].map((delay, i) => (
                          <span key={i} className="w-1 rounded-full bg-white animate-bounce"
                            style={{ height: ['30%','70%','100%','70%','30%'][i], animationDelay: `${delay}ms` }} />
                        ))}
                      </span>
                    ) : (
                      <Mic size={24} />
                    )}
                  </button>
                  <p className="mt-3 text-xs font-bold text-slate-900">
                    {isListening ? '🔴 Escuchando... pulsa para detener' : 'Pulsa el micrófono para hablar'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isListening ? 'El texto aparecerá arriba en tiempo real.' : 'Puedes explicarle a Vital IA lo que buscas.'}
                  </p>
                  {speechError && (
                    <p className="mt-2 text-[11px] text-red-500 text-center max-w-xs">{speechError}</p>
                  )}
                </div>
              </form>
            </div>

            {/* Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-xs text-violet-900">
              <div className="flex items-center gap-3">
                <Info size={18} className="shrink-0 text-indigo-600" />
                <span>Vital IA busca en fuentes científicas de confianza para ofrecerte información actualizada y de calidad.</span>
              </div>
              <Sparkles size={16} className="shrink-0 text-indigo-500" />
            </div>
          </div>

          {/* ── Columna der: alertas ── */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-5">
            <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-indigo-600">
                  <Bell size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Crear alerta médica</h2>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">
                  Recibe al instante nuevos avances sobre lo que más te interesa.
                </p>

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

        {/* ── Errores ── */}
        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {/* ── Resultados ── */}
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
                      <span className="text-[11px] text-slate-400">{formatDate(doc.publication_date)}</span>
                    )}
                  </div>
                  <h4 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">
                    {doc.title || 'Sin título'}
                  </h4>
                  <p className="mb-4 line-clamp-3 text-xs text-slate-500">
                    {doc.abstract || 'Sin resumen disponible.'}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                    <span className="truncate text-slate-400">{getAuthors(doc)}</span>
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
