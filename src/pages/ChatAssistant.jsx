import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquareText, ExternalLink, BookOpen, FlaskConical, Beaker } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function SourcesSection({ documents }) {
  const { t } = useTranslation();

  // Configuración por tipo de fuente
  const SOURCE_CONFIG = {
    pubmed: {
      label: '🧬 PubMed',
      color: 'blue',
      icon: <BookOpen size={15} />,
      linkLabel: t('chat.viewArticle'),
      classes: {
        header: 'bg-blue-50 text-blue-700 border-blue-200',
        border: 'border-blue-100 hover:border-blue-300',
        link: 'text-blue-600 hover:text-blue-800',
        badge: 'bg-blue-100 text-blue-700',
      }
    },
    clinical_trials: {
      label: '🧪 ClinicalTrials.gov',
      color: 'purple',
      icon: <FlaskConical size={15} />,
      linkLabel: t('chat.viewTrial'),
      classes: {
        header: 'bg-purple-50 text-purple-700 border-purple-200',
        border: 'border-purple-100 hover:border-purple-300',
        link: 'text-purple-600 hover:text-purple-800',
        badge: 'bg-purple-100 text-purple-700',
      }
    },
    cochrane: {
      label: '📚 Cochrane',
      color: 'teal',
      icon: <Beaker size={15} />,
      linkLabel: t('chat.viewReview'),
      classes: {
        header: 'bg-teal-50 text-teal-700 border-teal-200',
        border: 'border-teal-100 hover:border-teal-300',
        link: 'text-teal-600 hover:text-teal-800',
        badge: 'bg-teal-100 text-teal-700',
      }
    },
  };

  if (!documents || documents.length === 0) return null;

  const getSourceKey = (sourceType) => {
    const st = (sourceType || '').toLowerCase();
    if (st.includes('pubmed')) return 'pubmed';
    if (st.includes('clinical')) return 'clinical_trials';
    if (st.includes('cochrane')) return 'cochrane';
    return null;
  };

  // Agrupar por fuente
  const grouped = { pubmed: [], clinical_trials: [], cochrane: [] };
  documents.forEach(doc => {
    const key = getSourceKey(doc.source_type);
    if (key) grouped[key].push(doc);
  });

  const hasAny = Object.values(grouped).some(arr => arr.length > 0);
  if (!hasAny) return null;

  return (
    <div className="mt-5 pt-4 border-t border-slate-100">
      <div className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
        <BookOpen size={15} className="text-indigo-500" />
        {t('chat.sources')}
        <span className="ml-1 text-xs font-normal text-slate-400">({documents.length} {t('chat.documentsFound')})</span>
      </div>

      <div className="space-y-4">
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
          const docs = grouped[key];
          if (!docs || docs.length === 0) return null;

          return (
            <div key={key} className={`rounded-2xl border overflow-hidden ${cfg.classes.border} transition-colors`}>
              {/* Header de la fuente */}
              <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${cfg.classes.header} text-sm font-bold`}>
                {cfg.icon}
                {cfg.label}
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${cfg.classes.badge} font-semibold`}>
                  {docs.length}
                </span>
              </div>

              {/* Documentos de esa fuente */}
              <div className="divide-y divide-slate-50 bg-white">
                {docs.map((doc, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                        {doc.title || t('chat.noTitle')}
                      </p>
                      {doc.authors && doc.authors.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {doc.authors.slice(0, 2).join(', ')}{doc.authors.length > 2 ? ' et al.' : ''}
                        </p>
                      )}
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold ${cfg.classes.link} transition-colors whitespace-nowrap`}
                      >
                        {cfg.linkLabel} <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize the initial message using t() after component mounts
  useEffect(() => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: t('chat.initialMessage'),
        documents: []
      }
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const url = import.meta.env.VITE_API_URL + '/ai/chat';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, user_id: user.id }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || data.reply || t('chat.errorResponse'),
        documents: data.documents || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: t('chat.errorConnection'),
        documents: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl shadow-sm">
          <MessageSquareText size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('chat.title')}</h1>
          <p className="text-slate-500 mt-1">{t('chat.subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden border border-white/60 shadow-xl relative min-h-[500px]">

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse max-w-[70%]' : 'flex-row w-full max-w-[90%]'}`}>

                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={22} />}
                </div>

                {/* Bubble */}
                <div className={`px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm w-full'
                }`}>

                  {/* Label de respuesta IA (solo si no es el saludo inicial) */}
                  {msg.role === 'assistant' && msg.id !== 1 && (
                    <div className="mb-3 pb-2 border-b border-slate-100 font-semibold text-slate-700 flex items-center gap-2 text-sm">
                      <Bot size={15} className="text-indigo-500" /> {t('chat.aiResponse')}
                    </div>
                  )}

                  {/* Texto */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Fuentes agrupadas por biblioteca */}
                  <SourcesSection documents={msg.documents} />

                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 flex-row">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-indigo-100 text-indigo-600 border border-indigo-200">
                  <Bot size={22} />
                </div>
                <div className="px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-500 rounded-tl-sm flex items-center gap-3 shadow-sm">
                  <Loader2 size={18} className="animate-spin text-indigo-500" />
                  <span className="animate-pulse">{t('chat.searching')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/80 border-t border-slate-100 backdrop-blur-md">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all shadow-inner"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 placeholder-slate-400 h-12"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md cursor-pointer"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-center mt-2 text-xs text-slate-400 font-medium tracking-wide">
            {t('chat.disclaimer')}
          </p>
        </div>

      </div>
    </div>
  );
}
