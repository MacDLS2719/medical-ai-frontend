import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MedicalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchResults = async (searchQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const url = import.meta.env.VITE_API_URL + '/medical/search';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language,
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 10,
          user_id: user.id
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || t('searchPage.errorTitle'));
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
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
    e.preventDefault();
    if (!query.trim()) return;
    await fetchResults(query);
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="mb-10 text-center mt-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          {user.role === 'patient' ? t('searchPage.patientTitle') : t('searchPage.doctorTitle')}
        </h1>
        <p className="text-slate-500">
          {user.role === 'patient' 
            ? t('searchPage.patientSubtitle') 
            : t('searchPage.doctorSubtitle')}
        </p>
      </div>

      {user.role !== 'patient' && (
        <form onSubmit={handleSearch} className="mb-12 relative w-full max-w-3xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm text-lg"
            placeholder={t('searchPage.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute inset-y-2 right-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-xl px-6 transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : t('searchPage.searchButton')}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-8 flex items-start gap-3 max-w-3xl mx-auto w-full">
          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-red-800 font-semibold">{t('searchPage.errorTitle')}</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-blue-500" />
            {t('searchPage.resultsFound')} ({results.length})
          </h2>
          
          <div className="grid gap-6">
            {results.map((doc, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-6 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {doc.source_type}
                  </span>
                  {doc.publication_date && (
                    <span className="text-sm text-slate-400 font-medium">{doc.publication_date}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-snug">{doc.title}</h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">{doc.abstract}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 truncate max-w-[60%]">
                    {doc.authors && doc.authors.length > 0 ? doc.authors.join(', ') : t('searchPage.authorsNotSpecified')}
                  </p>
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                  >
                    {t('searchPage.viewOriginal')} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && !error && results.length === 0 && (user.role === 'patient' || query) && (
        <div className="text-center text-slate-500 py-12">
          {user.role === 'patient' 
            ? t('searchPage.noPatientResults') 
            : t('searchPage.noDoctorResults')}
        </div>
      )}
      
      {loading && user.role === 'patient' && (
        <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
          <p>{t('searchPage.searching')}</p>
        </div>
      )}
    </div>
  );
}
