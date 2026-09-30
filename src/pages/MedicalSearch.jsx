import React, { useState } from 'react';
import { Search, Loader2, Sparkles, BookOpen, ArrowRight, AlertCircle, CheckCircle, GraduationCap, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AIHeaderImage from '../assets/imgs/buscador.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Devuelve el nombre real de la fuente basado en el dominio de _final_url.
 * Si no reconoce el dominio, usa ref.source como fallback.
 */
const DOMAIN_NAMES = {
  'nejm.org': 'NEJM',
  'thelancet.com': 'The Lancet',
  'jamanetwork.com': 'JAMA',
  'bmj.com': 'BMJ',
  'nature.com': 'Nature',
  'science.org': 'Science',
  'annals.org': 'Annals of Internal Medicine',
  'pubmed.ncbi.nlm.nih.gov': 'PubMed',
  'ncbi.nlm.nih.gov': 'PubMed / NIH',
  'pmc.ncbi.nlm.nih.gov': 'PubMed Central',
  'europepmc.org': 'Europe PMC',
  'cochranelibrary.com': 'Cochrane Library',
  'who.int': 'OMS / WHO',
  'cdc.gov': 'CDC',
  'nih.gov': 'NIH',
  'fda.gov': 'FDA',
  'ema.europa.eu': 'EMA',
  'clinicaltrials.gov': 'ClinicalTrials.gov',
  'medrxiv.org': 'medRxiv',
  'biorxiv.org': 'bioRxiv',
  'scielo.org': 'SciELO',
  'scielo.br': 'SciELO Brasil',
  'scielo.cl': 'SciELO Chile',
  'scielo.conicyt.cl': 'SciELO Chile',
  'scielo.isciii.es': 'SciELO España',
  'redalyc.org': 'Redalyc',
  'researchgate.net': 'ResearchGate',
  'semanticscholar.org': 'Semantic Scholar',
  'springer.com': 'Springer',
  'springerlink.com': 'SpringerLink',
  'link.springer.com': 'Springer',
  'wiley.com': 'Wiley',
  'onlinelibrary.wiley.com': 'Wiley Online Library',
  'elsevier.com': 'Elsevier',
  'sciencedirect.com': 'ScienceDirect',
  'cell.com': 'Cell',
  'jci.org': 'Journal of Clinical Investigation',
  'ahajournals.org': 'AHA Journals',
  'academic.oup.com': 'Oxford Academic',
  'karger.com': 'Karger',
  'mdpi.com': 'MDPI',
  'frontiersin.org': 'Frontiers',
  'plos.org': 'PLOS',
  'plosone.org': 'PLOS ONE',
  'plosmedicine.org': 'PLOS Medicine',
  'doi.org': null,  // doi.org se resuelve más abajo por el path
  'dx.doi.org': null,
};

function getSourceFromUrl(finalUrl, fallback) {
  if (!finalUrl) return fallback || 'Medical Journal';
  try {
    const { hostname, pathname } = new URL(finalUrl);
    const host = hostname.replace(/^www\./, '');

    // Para doi.org intentamos leer el publisher del DOI prefix
    if (host === 'doi.org' || host === 'dx.doi.org') {
      // DOI prefix conocidos: 10.1056 = NEJM, 10.1016 = Elsevier, etc.
      const doiPrefixes = {
        '10.1056': 'NEJM',
        '10.1016': 'Elsevier / ScienceDirect',
        '10.1001': 'JAMA',
        '10.1136': 'BMJ',
        '10.1038': 'Nature',
        '10.1126': 'Science',
        '10.7326': 'Annals of Internal Medicine',
        '10.1182': 'Blood (ASH)',
        '10.1200': 'JCO (ASCO)',
        '10.1093': 'Oxford University Press',
        '10.1002': 'Wiley',
        '10.1007': 'Springer',
        '10.3389': 'Frontiers',
        '10.1371': 'PLOS',
        '10.3390': 'MDPI',
      };
      const prefix = pathname.split('/').filter(Boolean)[0]?.split('/')[0];
      if (prefix && doiPrefixes[prefix]) return doiPrefixes[prefix];
      return fallback || 'DOI';
    }

    // Buscar coincidencia exacta o parcial en el mapa de dominios
    if (DOMAIN_NAMES[host] !== undefined && DOMAIN_NAMES[host] !== null) {
      return DOMAIN_NAMES[host];
    }
    // Buscar coincidencia por sufijo (ej: subdomain.nature.com → Nature)
    const matchedKey = Object.keys(DOMAIN_NAMES).find(k => host.endsWith(k));
    if (matchedKey && DOMAIN_NAMES[matchedKey]) return DOMAIN_NAMES[matchedKey];

    // Fallback: capitalizar el dominio base
    const parts = host.split('.');
    const base = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return fallback || 'Medical Journal';
  }
}

function parseSimpleMarkdown(text) {
  if (!text) return { __html: '' };
  
  // Escapar HTML básico
  let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">$1 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>');
  
  // Negritas: **texto**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  
  // Encabezados
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-800 mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-[#0052FF] mt-6 mb-3 border-b border-slate-100 pb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-slate-900 mt-6 mb-4">$1</h1>');
  
  // Listas
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-5 list-disc text-slate-700 mb-1">$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-5 list-decimal text-slate-700 mb-1">$1</li>');
  
  // Referencias: [1], [2]
  html = html.replace(/\[(\d+)\]/g, '<button onclick="document.getElementById(\'ref-$1\')?.scrollIntoView({behavior: \'smooth\', block: \'center\'})" class="inline-flex items-center justify-center min-w-[20px] h-5 px-1 mx-0.5 text-[10px] font-bold text-white bg-[#0052FF] rounded-full hover:bg-blue-700 transition-all cursor-pointer align-super shadow-sm hover:-translate-y-0.5" title="Ver referencia $1">$1</button>');
  
  // Saltos de línea (doble para <p>, simple ignorado o manejado en prose)
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = '<p class="mb-4">' + html + '</p>';
  
  return { __html: html };
}

export default function MedicalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [searchMode, setSearchMode] = useState('standard'); // 'standard' | 'university'

  const fetchUsage = async () => {
    try {
      const url = new URL(`${API_URL}/advanced-search/usage`);
      if (user?.id) url.searchParams.append('user_id', user.id);
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (err) {
      console.error("Error al obtener usage:", err);
    }
  };

  React.useEffect(() => {
    fetchUsage();
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearchedQuery(query);

    try {
      const url = new URL(`${API_URL}/advanced-search/query`);
      if (user?.id) url.searchParams.append('user_id', user.id);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({ query: query, max_results_per_source: 2 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al realizar la búsqueda avanzada.');
      }

      const data = await response.json();
      setResult(data);
      setSearchMode('standard');
      await fetchUsage();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversitySearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchedQuery(query);
    setSearchMode('university');
    try {
      const url = new URL(`${API_URL}/advanced-search/university-query`);
      if (user?.id) url.searchParams.append('user_id', user.id);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({ query: query, max_results_per_source: 2 }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al realizar la búsqueda universitaria.');
      }
      const data = await response.json();
      setResult(data);
      await fetchUsage();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewThread = () => {
    setQuery('');
    setSearchedQuery('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col min-h-full">
        
        {/* ── Encabezado de página estándar (siempre visible y alineado) ── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-100 shadow-sm px-6 py-6 sm:px-8 sm:py-7 bg-white w-full shrink-0">
          {/* Imagen de fondo del banner superior */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
            style={{ backgroundImage: `url(${AIHeaderImage})` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Buscador <span className="text-[#008080]">Mivor.ai</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-700 font-medium">
                Busca y accede a la información científica más reciente y fiable.<br />
                Avances en enfermedades, tratamientos, fármacos, ensayos clínicos y más.
              </p>

              {/* ── Contador de búsquedas diarias (SIEMPRE visible si es plan gratuito) ── */}
              {usage && !usage.is_pro && (
                <div className="mt-3 flex items-center gap-3">
                  {/* Barra de progreso */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold ${
                        usage.searches_used >= usage.searches_limit
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}>
                        {usage.searches_used >= usage.searches_limit
                          ? '⚠️ Límite alcanzado'
                          : `🔍 Búsquedas hoy`}
                      </span>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        usage.searches_used >= usage.searches_limit
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {usage.searches_used} / {usage.searches_limit}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usage.searches_used >= usage.searches_limit
                            ? 'bg-rose-500'
                            : usage.searches_used >= usage.searches_limit * 0.7
                            ? 'bg-amber-400'
                            : 'bg-[#0052FF]'
                        }`}
                        style={{ width: `${Math.min(100, (usage.searches_used / usage.searches_limit) * 100)}%` }}
                      />
                    </div>
                    {usage.searches_used >= usage.searches_limit && (
                      <p className="text-[10px] text-rose-500 font-medium">
                        Actualiza a PRO para búsquedas ilimitadas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-5">
              <div className="text-right">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                  Conocimiento global<br />para una mejor salud
                </h4>
                <p className="text-[10px] text-slate-600 mt-0.5 max-w-[210px] ml-auto">
                  Accede a la evidencia científica más relevante del mundo, verificada y actualizada con IA.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                {['Investigación', 'Tratamientos', 'Fármacos', 'Ensayos clínicos', 'Publicaciones científicas'].map((badge, idx) => (
                  <span key={idx} className="bg-white/95 backdrop-blur-xs text-slate-800 text-[9px] px-2 py-0.5 rounded-md font-semibold text-right shadow-2xs border border-white/60">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Estado Inicial (Buscador centrado cuando no hay búsqueda) */}
        {!searchedQuery && !loading && !result && (
          <div className="w-full flex flex-col items-center justify-center p-6 max-w-4xl mx-auto my-auto">
            
            <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0052FF] transition-colors">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Haz una pregunta clínica, ej: ¿El magnesio ayuda con las migrañas?"
                className="w-full pl-14 pr-16 py-5 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 text-lg shadow-lg focus:outline-none focus:border-[#0052FF] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!query.trim() || (usage && !usage.is_pro && usage.searches_used >= usage.searches_limit)}
                className="absolute inset-y-2 right-2 px-4 bg-[#0052FF] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                <ArrowRight size={20} />
              </button>
            </form>

            {/* Botón de Búsqueda Universal */}
            <button
              onClick={handleUniversitySearch}
              disabled={!query.trim() || (usage && !usage.is_pro && usage.searches_used >= usage.searches_limit)}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            >
              <GraduationCap size={17} />
              Búsqueda Universal
              <span className="text-[10px] font-normal text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-full">Universidades &amp; Centros de investigación</span>
            </button>
            

            {/* Fuentes médicas soportadas */}
            <div className="mt-8 flex gap-3 text-xs font-medium text-slate-500 flex-wrap justify-center">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"><BookOpen size={14}/> PubMed</span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"><BookOpen size={14}/> Cochrane</span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"><BookOpen size={14}/> OpenFDA</span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"><BookOpen size={14}/> ClinicalTrials</span>
            </div>
          </div>
        )}

        {/* Resultados o Carga */}
        {(loading || result || error) && (
          <div className="w-full flex flex-col flex-1">
            
            {/* Header Compacto del Buscador y Nuevo Hilo */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full mb-4 shrink-0 max-w-4xl mx-auto">
              <button
                onClick={handleNewThread}
                type="button"
                className="flex items-center justify-center gap-2 px-5 bg-white border-2 border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-xl font-bold transition-all whitespace-nowrap shadow-sm group"
                title="Nueva búsqueda"
              >
                <Plus size={18} className="group-hover:scale-110 transition-transform" />
                <span>Nuevo hilo</span>
              </button>

              <form onSubmit={handleSearch} className="w-full relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0052FF] transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pregunta clínica..."
                  className="w-full pl-12 pr-14 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 shadow-sm focus:outline-none focus:border-[#0052FF] focus:ring-4 focus:ring-blue-500/10 transition-all font-medium h-full"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim() || (usage && !usage.is_pro && usage.searches_used >= usage.searches_limit)}
                  className="absolute inset-y-1.5 right-1.5 px-3 bg-[#0052FF] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Botón universal compacto */}
            <div className="w-full max-w-4xl mx-auto mb-8 flex justify-end">
              <button
                onClick={handleUniversitySearch}
                disabled={loading || !query.trim() || (usage && !usage.is_pro && usage.searches_used >= usage.searches_limit)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <GraduationCap size={13} />
                Búsqueda Universal
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse"></div>
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center relative border border-slate-100">
                    <Loader2 size={32} className="animate-spin text-[#0052FF]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Investigando la evidencia...</h3>
                <p className="text-slate-500 max-w-md text-center text-sm leading-relaxed">
                  Nuestra IA está buscando en múltiples bases de datos científicas, leyendo abstracts y sintetizando un consenso médico para tu pregunta.
                </p>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl text-center max-w-md shadow-sm">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-rose-800 font-bold text-lg mb-1">Ocurrió un error</h3>
                  <p className="text-rose-600 text-sm">{error}</p>
                </div>
              </div>
            ) : result && (
              <div className="flex-1 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Columna Izquierda: Consenso (crece según el contenido) */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white ${
                            searchMode === 'university'
                              ? 'bg-gradient-to-br from-violet-500 to-violet-700'
                              : 'bg-gradient-to-br from-blue-500 to-[#0052FF]'
                          }`}>
                            {searchMode === 'university' ? <GraduationCap size={20} /> : <Sparkles size={20} />}
                          </div>
                          <div>
                            <h2 className="text-xl font-extrabold text-slate-900">
                              {searchMode === 'university' ? 'Investigación Universal' : 'Consenso de la IA'}
                            </h2>
                            <p className="text-xs text-slate-500">
                              {searchMode === 'university'
                                ? 'Síntesis de universidades y centros de investigación'
                                : 'Síntesis basada en evidencia científica'}
                            </p>
                          </div>
                      </div>
                      
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                          <div 
                            className="text-slate-700 text-[15px] leading-relaxed prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={parseSimpleMarkdown(typeof result === 'string' ? result : (result.summary || ''))}
                          />
                      </div>
                    </div>

                    {/* Columna Derecha: Referencias (con su propio scroll independiente y fluido) */}
                    <div className="space-y-6 lg:sticky lg:top-6">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner text-slate-600">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <h2 className="text-xl font-extrabold text-slate-900">Referencias</h2>
                            <p className="text-xs text-slate-500">{result.references?.length || 0} artículos analizados</p>
                          </div>
                      </div>

                      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                      {result.references?.filter(ref => ref._final_url).map((ref, idx) => (
                            <div key={idx} id={`ref-${idx + 1}`} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-colors group scroll-mt-24">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-bold text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider" title={ref.source}>
                                      {getSourceFromUrl(ref._final_url, ref.source)}
                                  </span>
                                  <div className="flex flex-col items-end gap-1">
                                      {ref.year && (
                                        <span className="text-xs font-medium text-slate-400">{ref.year}</span>
                                      )}
                                      {ref.verified ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            <CheckCircle size={10} /> FUENTE VERIFICADA
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            FUENTE EXTERNA
                                        </span>
                                      )}
                                  </div>
                                </div>
                                
                                <h3 className="font-bold text-slate-900 text-sm leading-snug mb-3 group-hover:text-[#0052FF] transition-colors">
                                  {ref.title}
                                </h3>
                                
                                {ref.abstract && (
                                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-4">
                                      {ref.abstract}
                                  </p>
                                )}
                                
                                <a 
                                    href={ref._final_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052FF] hover:text-blue-700 transition-colors"
                                >
                                    Leer original <ArrowRight size={14} />
                                </a>
                            </div>
                          ))}
                          
                          {(!result.references || result.references.length === 0) && (
                            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                                <p className="text-sm text-slate-500">No se encontraron referencias detalladas.</p>
                            </div>
                          )}
                      </div>
                    </div>
                    
                </div>
                
                <div className="mt-12 text-center border-t border-slate-200 pt-6">
                    <p className="text-xs text-slate-400 max-w-lg mx-auto">
                      Esta es una síntesis generada por Inteligencia Artificial y no reemplaza el criterio médico profesional. Verifica siempre las fuentes originales.
                    </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}