// MovimientosLista.jsx — Tabla/lista de movimientos contables

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, ArrowDownUp, RefreshCw, RotateCcw,
  Sliders, ChevronLeft, ChevronRight, Search, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import {
  TRANSACTION_TYPES,
  TRANSACTION_SOURCES,
  formatCurrency,
  formatDatetime,
} from './accounting.service';

const TYPE_ICONS = {
  income:     TrendingUp,
  expense:    TrendingDown,
  commission: ArrowDownUp,
  refund:     RefreshCw,
  adjustment: Sliders,
};

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
};

const STATUS_ICONS = {
  completed: CheckCircle2,
  pending: Clock,
  cancelled: XCircle,
};

const TYPE_COLOR = {
  income:     'text-emerald-600 bg-emerald-50',
  expense:    'text-rose-600 bg-rose-50',
  commission: 'text-amber-600 bg-amber-50',
  refund:     'text-sky-600 bg-sky-50',
  adjustment: 'text-violet-600 bg-violet-50',
};

const PAGE_SIZE = 10;

export default function MovimientosLista({ movements, loading, onRefresh, currency = 'EUR' }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);

  // Filtrar
  const filtered = movements.filter((m) => {
    const matchSearch =
      !search ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.external_reference?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-bold text-slate-700 text-sm">Movimientos</h3>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(TRANSACTION_TYPES).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw size={13} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Cargando movimientos...</p>
          </div>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <ArrowDownUp size={32} className="mb-3 opacity-30" />
          <p className="text-sm">No se encontraron movimientos</p>
          <p className="text-xs mt-1">Registra tu primer ingreso o gasto</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-semibold">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold">Descripción</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Fuente</th>
                <th className="text-right px-4 py-3 font-semibold">Monto</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Estado</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((m) => {
                const TypeIcon = TYPE_ICONS[m.type] ?? ArrowDownUp;
                const typeInfo = TRANSACTION_TYPES[m.type];
                const StatusIcon = STATUS_ICONS[m.status] ?? Clock;
                const isPositive = m.type === 'income' || m.type === 'refund';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Tipo */}
                    <td className="px-5 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLOR[m.type] ?? 'text-slate-600 bg-slate-100'}`}>
                        <TypeIcon size={12} />
                        {typeInfo?.label ?? m.type}
                      </div>
                    </td>

                    {/* Descripción */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="font-medium text-slate-700 truncate">{m.description || '—'}</p>
                      {m.external_reference && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{m.external_reference}</p>
                      )}
                    </td>

                    {/* Fuente */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {TRANSACTION_SOURCES[m.source] ?? m.source}
                      </span>
                    </td>

                    {/* Monto */}
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : '-'}{formatCurrency(m.amount, m.currency)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_STYLES[m.status] ?? STATUS_STYLES.pending}`}>
                        <StatusIcon size={11} />
                        {m.status === 'completed' ? 'Completado' : m.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{formatDatetime(m.occurred_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {filtered.length} resultados · página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
