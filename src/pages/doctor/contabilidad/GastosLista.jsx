// GastosLista.jsx — Vista de gastos detallada con categorías

import { useState } from 'react';
import {
  Tag, ChevronDown, ChevronUp, Search, ReceiptText,
  CreditCard, Building2, CalendarDays
} from 'lucide-react';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from './accounting.service';

const CATEGORY_COLORS = {
  'Equipos médicos': 'bg-blue-50 text-blue-700',
  'Medicamentos': 'bg-emerald-50 text-emerald-700',
  'Insumos y materiales': 'bg-teal-50 text-teal-700',
  'Arrendamiento': 'bg-orange-50 text-orange-700',
  'Servicios públicos': 'bg-yellow-50 text-yellow-700',
  'Personal y honorarios': 'bg-purple-50 text-purple-700',
  'Marketing': 'bg-pink-50 text-pink-700',
  'Software y tecnología': 'bg-indigo-50 text-indigo-700',
  'Formación y capacitación': 'bg-cyan-50 text-cyan-700',
  'Seguros': 'bg-slate-100 text-slate-700',
  'Impuestos': 'bg-rose-50 text-rose-700',
  'Otros gastos': 'bg-gray-100 text-gray-700',
};

function GastoCard({ expense }) {
  const [open, setOpen] = useState(false);
  const catColor = CATEGORY_COLORS[expense.category] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${catColor}`}>
              <Tag size={10} />
              {expense.category}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium
              ${expense.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : expense.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              {expense.status === 'paid' ? 'Pagado' : expense.status === 'pending' ? 'Pendiente' : 'Cancelado'}
            </span>
          </div>
          <p className="font-semibold text-slate-800 text-sm truncate">{expense.description}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-rose-600 text-sm">
            -{formatCurrency(expense.amount, expense.currency)}
          </span>
          {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-5 pb-4 border-t border-slate-50 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-500">
          {expense.supplier_name && (
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-slate-400" />
              <div>
                <p className="text-slate-400">Proveedor</p>
                <p className="font-medium text-slate-700">{expense.supplier_name}</p>
              </div>
            </div>
          )}
          {expense.expense_date && (
            <div className="flex items-center gap-1.5">
              <CalendarDays size={12} className="text-slate-400" />
              <div>
                <p className="text-slate-400">Fecha gasto</p>
                <p className="font-medium text-slate-700">{formatDate(expense.expense_date)}</p>
              </div>
            </div>
          )}
          {expense.payment_method && (
            <div className="flex items-center gap-1.5">
              <CreditCard size={12} className="text-slate-400" />
              <div>
                <p className="text-slate-400">Método de pago</p>
                <p className="font-medium text-slate-700">{expense.payment_method}</p>
              </div>
            </div>
          )}
          {expense.notes && (
            <div className="col-span-full flex items-start gap-1.5 pt-1">
              <ReceiptText size={12} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400">Notas</p>
                <p className="font-medium text-slate-700">{expense.notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GastosLista({ movements, currency = 'EUR' }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // Extraer sólo los gastos (movimientos tipo expense)
  const expenses = movements
    .filter((m) => m.type === 'expense' || m.type === 'commission')
    .map((m) => ({
      id: m.id,
      category: m.category ?? 'Otros gastos',
      description: m.description || m.external_reference || 'Gasto registrado',
      amount: m.amount,
      currency: m.currency || currency,
      status: m.status,
      supplier_name: m.supplier_name ?? null,
      expense_date: m.occurred_at,
      payment_method: m.payment_method ?? null,
      notes: m.notes ?? null,
    }));

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  // Total por categoría
  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + parseFloat(e.amount);
  }

  return (
    <div className="space-y-4">
      {/* Category summary pills */}
      {Object.entries(byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([cat, total]) => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${catFilter === cat
                    ? (CATEGORY_COLORS[cat] ?? 'bg-slate-100 text-slate-700') + ' border-current'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
              >
                <Tag size={10} />
                {cat}
                <span className="ml-1 opacity-70">{formatCurrency(total, currency)}</span>
              </button>
            ))}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="py-2 px-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
        >
          <option value="all">Todas las categorías</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white/60 rounded-2xl border border-slate-100">
          <ReceiptText size={32} className="mb-3 opacity-30" />
          <p className="text-sm">No hay gastos registrados</p>
          <p className="text-xs mt-1">Registra tu primer gasto desde el botón "Nuevo movimiento"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => <GastoCard key={e.id} expense={e} />)}
        </div>
      )}
    </div>
  );
}
