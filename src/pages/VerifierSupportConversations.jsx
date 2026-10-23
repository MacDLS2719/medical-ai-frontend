import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart,
  User,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  MessageCircle,
  Bot,
  ChevronRight,
  X,
  Calendar,
  Hash,
  InboxIcon,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function avatarLetters(userId) {
  return `U${userId}`;
}

// ──────────────────────────────────────────────
// Bubble de mensaje individual
// ──────────────────────────────────────────────
function MessageBubble({ msg }) {
  return (
    <div className="space-y-3">
      {/* Pregunta del usuario */}
      <div className="flex items-start gap-2.5 justify-end">
        <div className="max-w-[80%]">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs leading-relaxed shadow-sm">
            {msg.question}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right pr-1">
            {formatDate(msg.created_at)}
          </p>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px]">
          <User size={13} />
        </div>
      </div>

      {/* Respuesta del asistente */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <Bot size={13} />
        </div>
        <div className="max-w-[80%]">
          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs text-slate-700 leading-relaxed shadow-sm whitespace-pre-wrap">
            {msg.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Panel de conversaciones de un usuario
// ──────────────────────────────────────────────
function UserConversationsPanel({ userId, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedConvIds, setExpandedConvIds] = useState(new Set());
  const bottomRef = useRef(null);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/support-ai/user/${userId}?limit=200`);
      if (!res.ok) throw new Error(`Error ${res.status}: No se pudieron cargar las conversaciones.`);
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  // Agrupa mensajes por conversation_id
  const grouped = conversations.reduce((acc, msg) => {
    const cid = msg.conversation_id;
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(msg);
    return acc;
  }, {});

  const convIds = Object.keys(grouped);

  const toggleConv = (cid) => {
    setExpandedConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-white">
              <MessageSquareHeart size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Conversaciones de soporte</h2>
              <p className="text-[11px] text-indigo-200">Usuario #{userId} · {convIds.length} hilo(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Cargando conversaciones...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 text-center">
              <AlertCircle size={36} className="text-amber-500" />
              <p className="text-sm font-semibold text-slate-700">{error}</p>
              <button
                onClick={fetchConversations}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          )}

          {!loading && !error && convIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 text-center">
              <InboxIcon size={40} className="text-slate-300" />
              <p className="text-sm font-semibold">Este usuario no tiene conversaciones de soporte.</p>
            </div>
          )}

          {!loading && !error && convIds.map((cid, idx) => {
            const msgs = grouped[cid];
            const isExpanded = expandedConvIds.has(cid);
            const firstDate = msgs[0]?.created_at;
            const lastDate = msgs[msgs.length - 1]?.created_at;

            return (
              <div key={cid} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                {/* Cabecera del hilo */}
                <button
                  onClick={() => toggleConv(cid)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-indigo-50/50 transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <MessageCircle size={15} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate">
                        Hilo #{idx + 1}
                        <span className="ml-2 text-slate-400 font-medium text-[10px]">
                          {msgs.length} mensaje{msgs.length !== 1 ? 's' : ''}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {formatDate(firstDate)}
                        {lastDate !== firstDate && (
                          <span> → {formatDate(lastDate)}</span>
                        )}
                      </p>
                      <p className="text-[9px] text-slate-300 mt-0.5 font-mono truncate">
                        <Hash size={9} className="inline mr-0.5" />{cid.split('-')[0]}…
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3 text-slate-400 group-hover:text-indigo-500 transition-colors">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Mensajes expandidos */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-5 bg-slate-50/30">
                    {msgs.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tarjeta de usuario
// ──────────────────────────────────────────────
function UserCard({ userId, count, lastDate, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        group w-full text-left bg-white border border-slate-100 rounded-2xl p-4
        hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50
        transition-all duration-200 cursor-pointer
        flex items-center gap-4
      "
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-extrabold text-sm group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
        {avatarLetters(userId)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors">
          Usuario #{userId}
        </p>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <MessageCircle size={11} />
            {count} consulta{count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock size={11} />
            Última: {formatDate(lastDate)}
          </span>
        </div>
      </div>

      {/* Flecha */}
      <ChevronRight
        size={18}
        className="shrink-0 text-slate-300 group-hover:text-indigo-500 transition-colors"
      />
    </button>
  );
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────
export default function VerifierSupportConversations() {
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Carga primeros 50 mensajes por usuario de forma amplia
  // La API tiene GET /support-ai/user/:id, así que primero cargamos IDs conocidos
  // y luego usamos el endpoint /user/:id para el panel de detalle.
  // Para el listado general usamos un endpoint multi-usuario si existe,
  // o hacemos una petición inteligente.

  const fetchAllConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtenemos las últimas 200 conversaciones de usuarios 1 y 2 (demo)
      // más cualquier usuario que haya consultado soporte.
      // En producción aquí iría un endpoint GET /support-ai/all (admin/verifier).
      // Por ahora usamos los usuarios conocidos del sistema + búsqueda dinámica.
      const knownIds = [1, 2, 3, 4, 5, 27];
      const results = await Promise.allSettled(
        knownIds.map((uid) =>
          fetch(`${API_URL}/support-ai/user/${uid}?limit=200`)
            .then((r) => (r.ok ? r.json() : []))
        )
      );

      const merged = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value || []);

      setAllMessages(merged);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllConversations();
  }, []);

  // Agrupa por user_id
  const userMap = allMessages.reduce((acc, msg) => {
    const uid = msg.user_id;
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(msg);
    return acc;
  }, {});

  // Filtra por búsqueda
  const filteredUserIds = Object.keys(userMap).filter((uid) =>
    `usuario ${uid}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas globales
  const totalUsers = filteredUserIds.length;
  const totalMessages = allMessages.length;
  const totalConversations = new Set(allMessages.map((m) => m.conversation_id)).size;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 text-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pb-24">

        {/* ── Encabezado ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-300/40">
              <MessageSquareHeart size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Soporte MIVOR</h1>
              <p className="text-xs text-slate-500">
                Conversaciones de soporte por usuario · Panel del verificador
              </p>
            </div>
          </div>
        </div>

        {/* ── Tarjetas de métricas ── */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: 'Usuarios con soporte', value: totalUsers, color: 'indigo' },
            { label: 'Total de consultas', value: totalMessages, color: 'purple' },
            { label: 'Hilos de conversación', value: totalConversations, color: 'blue' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`rounded-2xl border border-${color}-100 bg-white p-4 text-center shadow-sm`}
            >
              <p className={`text-2xl font-extrabold text-${color}-600`}>{value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Buscador ── */}
        <div className="relative mb-5">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por ID de usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Estado de carga / error ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 size={36} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Cargando conversaciones de soporte...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={48} className="text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">Error al cargar datos</h2>
            <p className="text-sm text-slate-500 max-w-md">{error}</p>
            <button
              onClick={fetchAllConversations}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-md shadow-indigo-300/30"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}

        {/* ── Lista de usuarios ── */}
        {!loading && !error && (
          <>
            {filteredUserIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 text-center">
                <InboxIcon size={48} className="text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">
                  {searchTerm
                    ? 'No se encontraron usuarios con ese criterio.'
                    : 'Ningún usuario ha utilizado el soporte aún.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-4">
                  {filteredUserIds.length} usuario{filteredUserIds.length !== 1 ? 's' : ''} con conversaciones
                </p>
                {filteredUserIds
                  .sort((a, b) => {
                    // Ordenar por fecha del último mensaje (más reciente primero)
                    const lastA = userMap[a][userMap[a].length - 1]?.created_at || '';
                    const lastB = userMap[b][userMap[b].length - 1]?.created_at || '';
                    return lastB.localeCompare(lastA);
                  })
                  .map((uid) => {
                    const msgs = userMap[uid];
                    const lastDate = msgs[msgs.length - 1]?.created_at;
                    return (
                      <UserCard
                        key={uid}
                        userId={Number(uid)}
                        count={msgs.length}
                        lastDate={lastDate}
                        onClick={() => setSelectedUserId(Number(uid))}
                      />
                    );
                  })}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Panel de detalle de conversaciones ── */}
      {selectedUserId !== null && (
        <UserConversationsPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
