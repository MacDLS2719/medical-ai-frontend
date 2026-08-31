import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  ExternalLink,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MedicalSearch() {

  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchCategory, setSearchCategory] = useState('literature'); // 'literature' or 'drugs'


  // ==========================================================
  // REDIRECCIÓN SI NO HAY USUARIO
  // ==========================================================

  useEffect(() => {

    if (!user) {
      navigate('/');
    }

  }, [user, navigate]);


  // ==========================================================
  // BUSCAR
  // ==========================================================

  const fetchResults = async (searchQuery = query) => {

    setLoading(true);
    setError(null);

    try {

      // Limpiar resultados anteriores
      setResults([]);

      // Seleccionar endpoint basado en la categoría
      let endpoint = '/medical/search';
      if (searchCategory === 'drugs') {
        endpoint = '/medical/search/drugs';
      }

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
          user_id: user.id
        }),
      });


      if (!response.ok) {

        const errData = await response.json();

        throw new Error(
          errData.detail ||
          t('searchPage.errorTitle')
        );

      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/x-ndjson')) {
        // Manejar Streaming (NDJSON)
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // El último elemento puede estar incompleto, lo devolvemos al buffer
          buffer = lines.pop(); 

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'results' && data.data && data.data.length > 0) {
                // Agregar los nuevos resultados a la lista y re-ordenar
                setResults(prevResults => sortByDate([...prevResults, ...data.data]));
              } else if (data.type === 'error') {
                console.warn(`Error en fuente ${data.source}: ${data.message}`);
              } else if (data.type === 'done') {
                console.log('Streaming finalizado.');
              }
            } catch (e) {
              console.error('Error parseando JSON de streaming:', line, e);
            }
          }
        }
      } else {
        // Manejar Respuesta Normal (JSON)
        const data = await response.json();
        console.log('RESULTADOS MÉDICOS:', data);
        setResults(sortByDate(data.results || []));
      }

    } catch (err) {

      console.error('Error en búsqueda médica:', err);

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };


  // ==========================================================
  // CARGA AUTOMÁTICA PARA PACIENTES
  // ==========================================================

  useEffect(() => {

    if (user && user.role === 'patient') {

      fetchResults("");

    }

  }, [user]);


  // ==========================================================
  // BUSCAR MANUALMENTE
  // ==========================================================

  const handleSearch = async (e) => {

    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    await fetchResults(query);

  };


  // ==========================================================
  // FORMATEAR FECHA
  // ==========================================================

  const formatDate = (value) => {

    if (!value) {
      return null;
    }

    try {

      const date = new Date(value);

      if (isNaN(date.getTime())) {
        return value;
      }

      return date.toLocaleDateString(
        i18n.language || 'es-CO',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      );

    } catch {

      return value;

    }
  };


  // ==========================================================
  // FUENTE
  // ==========================================================

  const getSource = (doc) => {

    if (!doc.source_type) {
      return 'SOURCE';
    }

    return String(doc.source_type).toUpperCase();

  };


    // ==========================================================
  // AUTORES
  // ==========================================================

  const getAuthors = (doc) => {

    if (!doc.authors) {

      return t(
        'searchPage.authorsNotSpecified'
      );

    }

    if (Array.isArray(doc.authors)) {

      if (doc.authors.length === 0) {

        return t(
          'searchPage.authorsNotSpecified'
        );

      }

      const authors = doc.authors
        .slice(0, 3)
        .join(', ');

      return doc.authors.length > 3
        ? `${authors}, et al.`
        : authors;

    }

    return String(doc.authors);

  };


  const sortByDate = (documents) => {

    return [...documents].sort((a, b) => {
      const dateA = a.publication_date
        ? new Date(a.publication_date).getTime()
        : 0;
      const dateB = b.publication_date
        ? new Date(b.publication_date).getTime()
        : 0;

      return dateB - dateA;

    });

  };

  if (!user) {
    return null;
  }

  


  // ==========================================================
  // SI NO HAY USUARIO
  // ==========================================================

  if (!user) {
    return null;
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="
      flex
      min-h-screen
      w-full
      flex-col
      overflow-x-hidden
      p-4
      sm:p-6
    ">

      <div className="
        mx-auto
        flex
        w-full
        max-w-7xl
        flex-col
        animate-in
        fade-in
        slide-in-from-bottom-8
        duration-500
      ">


        {/* =====================================================
            TITULO
        ===================================================== */}

        <div className="
          mb-8
          mt-4
          text-center
          sm:mb-10
          sm:mt-6
        ">

          <h1 className="
            text-3xl
            font-bold
            text-slate-800
            md:text-4xl
          ">

            {user.role === 'patient'
              ? t('searchPage.patientTitle')
              : t('searchPage.doctorTitle')
            }

          </h1>


          <p className="
            mt-2
            text-sm
            text-slate-500
            sm:text-base
          ">

            {user.role === 'patient'
              ? t('searchPage.patientSubtitle')
              : t('searchPage.doctorSubtitle')
            }

          </p>

        </div>


        {/* =====================================================
            BUSCADOR MÉDICO
        ===================================================== */}

        {user.role !== 'patient' && (

          <form
            onSubmit={handleSearch}
            className="
              group
              relative
              mx-auto
              mb-10
              w-full
              max-w-4xl
            "
          >
            
            {/* TABS DE CATEGORÍA */}
            <div className="mb-4 flex justify-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setSearchCategory('literature')}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  searchCategory === 'literature'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm'
                }`}
              >
                <BookOpen size={18} />
                Evidencia y Ensayos
              </button>
              <button
                type="button"
                onClick={() => setSearchCategory('drugs')}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  searchCategory === 'drugs'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm'
                }`}
              >
                <span className="text-lg">💊</span>
                Medicamentos
              </button>
            </div>


            <div className="relative">
              {/* ICONO */}
              <div className="
                pointer-events-none
                absolute
                inset-y-0
                left-0
                flex
                items-center
                pl-4
              ">

                <Search
                  className={`
                    h-5
                    w-5
                    transition-colors
                    ${searchCategory === 'drugs' ? 'text-emerald-400 group-focus-within:text-emerald-500' : 'text-slate-400 group-focus-within:text-blue-500'}
                  `}
                />

              </div>


              {/* INPUT */}

              <input
                type="text"
                className={`
                  block
                  w-full
                  rounded-2xl
                  border-2
                  border-slate-200
                  bg-white/70
                  py-4
                  pl-12
                  pr-32
                  text-base
                  text-slate-900
                  shadow-sm
                  backdrop-blur-sm
                  outline-none
                  transition-all
                  placeholder:text-slate-400
                  focus:ring-4
                  sm:text-lg
                  ${searchCategory === 'drugs' 
                    ? 'focus:border-emerald-500 focus:ring-emerald-500/10' 
                    : 'focus:border-blue-500 focus:ring-blue-500/10'}
                `}
                placeholder={searchCategory === 'drugs' ? 'Ej: Ibuprofeno, Metformina, Amoxicilina...' : t('searchPage.searchPlaceholder')}
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
              />


              {/* BOTON */}

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`
                  absolute
                  inset-y-2
                  right-2
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  px-4
                  font-medium
                  text-white
                  shadow-md
                  transition-colors
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                  sm:px-6
                  ${searchCategory === 'drugs'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >

                {loading && (
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
                )}

                <span>
                  {t('searchPage.searchButton')}
                </span>

              </button>
            </div>

          </form>

        )}


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div className="
            mx-auto
            mb-8
            flex
            w-full
            max-w-4xl
            items-start
            gap-3
            rounded-r-xl
            border-l-4
            border-red-500
            bg-red-50
            p-4
            shadow-sm
          ">

            <AlertCircle
              className="
                mt-0.5
                shrink-0
                text-red-500
              "
              size={20}
            />

            <div className="min-w-0">

              <h3 className="
                font-semibold
                text-red-800
              ">
                {t('searchPage.errorTitle')}
              </h3>

              <p className="
                mt-1
                break-words
                text-sm
                text-red-600
              ">
                {error}
              </p>

            </div>

          </div>

        )}


        {/* =====================================================
            RESULTADOS
        ===================================================== */}

        {results.length > 0 && (

          <section className="
            mx-auto
            w-full
          ">


            {/* =================================================
                CABECERA RESULTADOS
            ================================================= */}

            <div className="
              mb-6
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-blue-100
              ">

                <BookOpen
                  size={20}
                  className="text-blue-500"
                />

              </div>


              <h2 className="
                text-lg
                font-bold
                text-slate-700
                sm:text-xl
              ">

                {t('searchPage.resultsFound')}

                {' '}

                ({results.length})

              </h2>

            </div>


            {/* =================================================
                GRID
                3 TARJETAS POR FILA
            ================================================= */}

            <div className="
              grid
              w-full
              grid-cols-1
              gap-5
              sm:gap-6
              md:grid-cols-2
              xl:grid-cols-3
            ">


              {results.map((doc, idx) => (

                <article
                  key={idx}
                  className="
                    glass-card
                    group
                    flex
                    min-w-0
                    w-full
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-2xl
                    hover:shadow-blue-500/10
                  "
                >


                  {/* =========================================
                      FUENTE + FECHA
                  ========================================= */}

                  <div className="
                    flex
                    min-w-0
                    items-center
                    justify-between
                    gap-3
                    border-b
                    border-slate-100
                    pb-3
                  ">


                    {/* FUENTE */}

                    <span className="
                      inline-flex
                      max-w-[55%]
                      shrink-0
                      truncate
                      rounded-full
                      bg-blue-100
                      px-3
                      py-1
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-blue-700
                    ">

                      {getSource(doc)}

                    </span>


                    {/* FECHA */}

                    {doc.publication_date && (

                      <span className="
                        min-w-0
                        truncate
                        text-xs
                        font-medium
                        text-slate-400
                      ">

                        {formatDate(
                          doc.publication_date
                        )}

                      </span>

                    )}

                  </div>


                  {/* =========================================
                      CONTENIDO
                  ========================================= */}

                  <div className="
                    flex
                    min-w-0
                    flex-1
                    flex-col
                    pt-4
                  ">


                    {/* TITULO */}

                    <h3 className="
                      mb-3
                      line-clamp-2
                      min-w-0
                      break-words
                      text-base
                      font-bold
                      leading-snug
                      text-slate-800
                      transition-colors
                      group-hover:text-blue-600
                      sm:text-lg
                    ">

                      {doc.title ||
                        'Sin título'
                      }

                    </h3>


                    {/* ABSTRACT */}

                    <p className="
                      mb-4
                      line-clamp-4
                      min-w-0
                      flex-1
                      break-words
                      text-sm
                      leading-relaxed
                      text-slate-600
                    ">

                      {doc.abstract ||
                        'Sin resumen disponible.'
                      }

                    </p>


                    {/* =========================================
                        PIE TARJETA
                    ========================================= */}

                    <div className="
                      mt-auto
                      border-t
                      border-slate-100
                      pt-4
                    ">


                      {/* AUTORES */}

                      <div className="
                        mb-4
                        flex
                        min-w-0
                        items-start
                        gap-2
                      ">

                        <span className="
                          shrink-0
                          text-xs
                          font-semibold
                          text-slate-700
                        ">
                          Autores:
                        </span>

                        <span className="
                          line-clamp-1
                          min-w-0
                          break-words
                          text-xs
                          text-slate-400
                        ">

                          {getAuthors(doc)}

                        </span>

                      </div>


                      {/* VER ORIGINAL */}

                      <a
                        href={doc.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        className="
                          flex
                          items-center
                          justify-end
                          gap-1.5
                          text-sm
                          font-semibold
                          text-blue-600
                          transition-colors
                          hover:text-blue-800
                        "
                      >

                        {t(
                          'searchPage.viewOriginal'
                        )}

                        <ExternalLink
                          size={14}
                          className="
                            transition-transform
                            group-hover:translate-x-0.5
                          "
                        />

                      </a>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          </section>

        )}


        {/* =====================================================
            SIN RESULTADOS
        ===================================================== */}

        {!loading &&
          !error &&
          results.length === 0 &&
          (user.role === 'patient' || query) && (

            <div className="
              py-12
              text-center
              text-slate-500
            ">

              {user.role === 'patient'
                ? t(
                    'searchPage.noPatientResults'
                  )
                : t(
                    'searchPage.noDoctorResults'
                  )
              }

            </div>

          )}


        {/* =====================================================
            CARGANDO PACIENTE
        ===================================================== */}

        {loading &&
          user.role === 'patient' && (

            <div className="
              flex
              flex-col
              items-center
              gap-3
              py-12
              text-center
              text-slate-500
            ">

              <Loader2
                className="
                  mx-auto
                  animate-spin
                  text-blue-500
                "
                size={32}
              />

              <p>
                {t(
                  'searchPage.searching'
                )}
              </p>

            </div>

          )}

      </div>

    </div>

  );

}