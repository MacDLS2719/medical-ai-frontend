// NuevoMovimientoModal.jsx — Modal para registrar ingresos y gastos

import { useState } from 'react';
import {
  X, TrendingUp, TrendingDown, Calendar, DollarSign,
  Tag, FileText, User, CreditCard, StickyNote, Loader2, CheckCircle,
  Paperclip, UploadCloud
} from 'lucide-react';
import {
  createMovement,
  uploadAttachment,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_SOURCES,
} from './accounting.service';

const TYPES = [
  { value: 'income',     label: 'Ingreso',   icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300' },
  { value: 'expense',    label: 'Gasto',     icon: TrendingDown, color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-300' },
  { value: 'commission', label: 'Comisión',  icon: DollarSign,  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-300' },
  { value: 'refund',     label: 'Reembolso', icon: TrendingUp,  color: 'text-sky-600',    bg: 'bg-sky-50 border-sky-300' },
];

const initialForm = {
  type: 'income',
  source: 'cash',
  amount: '',
  currency: 'EUR',
  description: '',
  occurred_at: new Date().toISOString().slice(0, 16),
  status: 'completed',
  external_reference: '',
  // expense fields
  category: '',
  supplier_name: '',
  expense_date: new Date().toISOString().slice(0, 10),
  payment_method: '',
  notes: '',
};

export default function NuevoMovimientoModal({
  onClose,
  onCreated,
  defaultType = 'income',
  defaultCurrency = 'EUR',
}) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    type: defaultType,
    currency: defaultCurrency || 'EUR',
  }));
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isExpense = form.type === 'expense';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        type: form.type,
        source: form.source,
        amount: parseFloat(form.amount),
        currency: form.currency.toUpperCase(),
        description: form.description,
        occurred_at: new Date(form.occurred_at).toISOString(),
        status: form.status,
        external_reference: form.external_reference || null,
        ...(isExpense && {
          category: form.category,
          supplier_name: form.supplier_name || null,
          expense_date: form.expense_date,
          payment_method: form.payment_method || null,
          notes: form.notes || null,
        }),
      };

      const movement = await createMovement(payload);

      // Si seleccionó un soporte/archivo, subirlo
      if (selectedFile && movement?.id) {
        try {
          await uploadAttachment(movement.id, selectedFile);
        } catch (uploadErr) {
          console.warn("No se pudo subir el adjunto:", uploadErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onCreated?.(movement);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Nuevo movimiento</h2>
            <p className="text-xs text-slate-500">Registra un ingreso, gasto u otro movimiento</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo de movimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPES.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: value }))}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-sm font-medium
                    ${form.type === value ? `${bg} ${color}` : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Monto y moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Monto *
              </label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Moneda
              </label>
              <select
                name="currency"
                required
                value={form.currency}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Descripción *
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                name="description"
                required
                minLength={2}
                maxLength={500}
                rows={2}
                placeholder="Ej: Consulta particular Dr. García, Compra de guantes..."
                value={form.description}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
          </div>

          {/* Fecha y hora del movimiento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Fecha y hora *
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="occurred_at"
                  type="datetime-local"
                  required
                  value={form.occurred_at}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Fuente
              </label>
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {Object.entries(TRANSACTION_SOURCES).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Estado
            </label>
            <div className="flex gap-2">
              {['completed', 'pending', 'cancelled'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize
                    ${form.status === s
                      ? s === 'completed' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : s === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-rose-50 border-rose-300 text-rose-600'
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                >
                  {s === 'completed' ? 'Completado' : s === 'pending' ? 'Pendiente' : 'Cancelado'}
                </button>
              ))}
            </div>
          </div>

          {/* Referencia externa */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Referencia externa <span className="font-normal normal-case">(opcional)</span>
            </label>
            <input
              name="external_reference"
              maxLength={255}
              placeholder="Ej: FAC-001, TXN-789..."
              value={form.external_reference}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* ─── Campos extra para GASTO ─────────────────────────────── */}
          {isExpense && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Detalles del gasto</p>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  <Tag size={12} className="inline mr-1" />Categoría *
                </label>
                <select
                  name="category"
                  required={isExpense}
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Selecciona una categoría</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Proveedor y fecha del gasto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                    <User size={12} className="inline mr-1" />Proveedor
                  </label>
                  <input
                    name="supplier_name"
                    maxLength={255}
                    placeholder="Nombre del proveedor"
                    value={form.supplier_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                    <Calendar size={12} className="inline mr-1" />Fecha del gasto *
                  </label>
                  <input
                    name="expense_date"
                    type="date"
                    required={isExpense}
                    value={form.expense_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  <CreditCard size={12} className="inline mr-1" />Método de pago
                </label>
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Seleccionar...</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  <StickyNote size={12} className="inline mr-1" />Notas adicionales
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Observaciones, número de factura..."
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>
          )}

          {/* Soporte o comprobante adjunto */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              <Paperclip size={12} className="inline mr-1" /> Soporte o Comprobante (opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                <UploadCloud size={15} className="text-blue-500" />
                <span>{selectedFile ? 'Cambiar archivo' : 'Seleccionar PDF o imagen'}</span>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>
              {selectedFile && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate max-w-xs">
                  <span className="truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-rose-500 hover:text-rose-700 ml-1"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <X size={15} className="text-rose-500 shrink-0" />
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
              ${success
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Guardando...</>
            ) : success ? (
              <><CheckCircle size={17} /> ¡Guardado!</>
            ) : (
              'Registrar movimiento'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
