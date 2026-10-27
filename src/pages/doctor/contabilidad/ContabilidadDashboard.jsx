import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ChevronRight,
  Calculator,
  FileText,
  Clock,
  ArrowUpRight,
  Receipt,
  FolderOpen,
  Users,
  Video,
  Home,
  ShoppingCart,
  PlusCircle,
  Inbox,
} from 'lucide-react';
import { formatCurrency } from './accounting.service';

export default function ContabilidadDashboard({
  movements = [],
  selectedMonth,
  onMonthChange,
  currency = 'EUR',
  onCurrencyChange,
  onOpenNewMovement,
  onOpenInvoiceModal,
  onSwitchTab,
}) {
  const [chartPeriod, setChartPeriod] = useState('6_months');
  const [expensePeriod, setExpensePeriod] = useState('this_month');
  const [incomePeriod, setIncomePeriod] = useState('this_month');

  // Generar dinámicamente los últimos 6 meses para el selector
  const availableMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const lbl = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      list.push({
        value: val,
        label: lbl.charAt(0).toUpperCase() + lbl.slice(1),
      });
    }
    return list;
  }, []);

  // 1. Filtrar movimientos REALES del mes seleccionado
  const currentMonthMovements = useMemo(() => {
    return movements.filter((m) => {
      const dateStr = m.occurred_at || m.created_at;
      return dateStr ? dateStr.slice(0, 7) === selectedMonth : false;
    });
  }, [movements, selectedMonth]);

  // 2. Totales reales del mes
  const { totalIncome, totalExpense, balance, invoiceCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let invCount = 0;

    for (const m of currentMonthMovements) {
      const amt = parseFloat(m.amount) || 0;
      if (m.type === 'income' || m.type === 'refund') {
        inc += amt;
        invCount++;
      } else if (m.type === 'expense' || m.type === 'commission') {
        exp += amt;
      }
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp,
      invoiceCount: invCount,
    };
  }, [currentMonthMovements]);

  // 3. Evolución mensual REAL (Últimos 6 meses calculados desde la base de datos)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      // Calcular ingresos y gastos reales para este mes
      let mInc = 0;
      let mExp = 0;

      for (const m of movements) {
        const dateStr = m.occurred_at || m.created_at;
        if (dateStr && dateStr.slice(0, 7) === key) {
          const amt = parseFloat(m.amount) || 0;
          if (m.type === 'income' || m.type === 'refund') mInc += amt;
          else if (m.type === 'expense' || m.type === 'commission') mExp += amt;
        }
      }

      months.push({
        month: name.charAt(0).toUpperCase() + name.slice(1),
        income: mInc,
        expense: mExp,
      });
    }
    return months;
  }, [movements]);

  // Máximo para escala del gráfico de barras
  const maxBarValue = useMemo(() => {
    let max = 1000;
    for (const d of monthlyData) {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    }
    return Math.ceil(max * 1.2 / 500) * 500;
  }, [monthlyData]);

  // 4. Distribución REAL de gastos por categoría
  const expenseCategories = useMemo(() => {
    const categoryMap = {};
    const palette = ['#3b82f6', '#a855f7', '#14b8a6', '#f97316', '#0ea5e9', '#eab308', '#ec4899', '#64748b'];

    for (const m of currentMonthMovements) {
      if (m.type === 'expense' || m.type === 'commission') {
        const cat = m.category || 'Otros gastos';
        const amt = parseFloat(m.amount) || 0;
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      }
    }

    const totalExp = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    if (totalExp === 0) return [];

    return Object.entries(categoryMap).map(([label, amt], idx) => ({
      label,
      amount: amt,
      pct: Math.round((amt / totalExp) * 100),
      color: palette[idx % palette.length],
    }));
  }, [currentMonthMovements]);

  // 5. Ingresos REALES por tipo de consulta / categoría
  const incomeCategories = useMemo(() => {
    const categoryMap = {};
    const palette = ['#2563eb', '#9333ea', '#10b981', '#f59e0b', '#64748b', '#06b6d4'];

    for (const m of currentMonthMovements) {
      if (m.type === 'income' || m.type === 'refund') {
        const cat = m.category || (m.source === 'stripe' ? 'Videoconsultas' : 'Consultas presenciales');
        const amt = parseFloat(m.amount) || 0;
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      }
    }

    const totalInc = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    if (totalInc === 0) return [];

    return Object.entries(categoryMap).map(([label, amt], idx) => ({
      label,
      amount: amt,
      pct: Math.round((amt / totalInc) * 100),
      color: palette[idx % palette.length],
    }));
  }, [currentMonthMovements]);

  // 6. Facturas / Cobros pendientes REALES
  const pendingMovements = useMemo(() => {
    return movements
      .filter((m) => m.status === 'pending')
      .slice(0, 5);
  }, [movements]);

  // 7. Últimos movimientos REALES
  const recentMovements = useMemo(() => {
    return movements.slice(0, 5);
  }, [movements]);

  return (
    <div className="space-y-6">
      {/* ─── Encabezado Superior (Banner fiel al diseño) ─── */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Contabilidad
          </h1>
          <p className="text-base font-bold text-slate-800">
            Tu consulta, siempre bajo control
          </p>
          <p className="text-xs text-slate-500 max-w-md">
            Ingresos, gastos y facturación actualizados cada día, de forma sencilla y automática.
          </p>
        </div>

        {/* Tarjeta Informativa Central */}
        <div className="flex-1 max-w-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-100/90 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
            <Calculator size={26} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-blue-950">
              Tu contabilidad, actualizada cada día
            </h4>
            <p className="text-xs text-slate-600 leading-snug mt-0.5">
              Una visión clara de la evolución de tu consulta para que tomes mejores decisiones.
            </p>
          </div>
        </div>

        {/* Selectores de Mes y Moneda */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-end flex-wrap">
          {/* Selector de Moneda (EUR / USD) */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => onCurrencyChange?.('EUR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currency === 'EUR'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EUR €
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange?.('USD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currency === 'USD'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              USD $
            </button>
          </div>

          {/* Selector de Mes dinámico */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 px-4 py-2 rounded-2xl shadow-xs text-xs font-bold transition-colors">
              <Calendar size={15} className="text-blue-600" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange?.(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-4 font-bold text-xs"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 Tarjetas Métricas Principales (Totales Reales) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Ingresos este mes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Ingresos este mes</p>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(totalIncome, currency)}
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span className="inline-flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                {totalIncome > 0 ? '✓ Al día' : '0 movimientos'}
              </span>
              <span className="text-slate-400 text-[11px]">en este mes</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* 2. Gastos este mes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Gastos este mes</p>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(totalExpense, currency)}
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span className="inline-flex items-center font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                {totalExpense > 0 ? 'Controlado' : 'Sin gastos'}
              </span>
              <span className="text-slate-400 text-[11px]">en este mes</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-400 text-white flex items-center justify-center shadow-md shadow-rose-400/20 shrink-0">
            <TrendingDown size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* 3. Resultado este mes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Resultado este mes</p>
            <p className={`text-2xl font-black ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(balance, currency)}
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span
                className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full text-[11px] ${
                  balance >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}
              >
                {balance >= 0 ? 'Superávit neto' : 'Déficit'}
              </span>
              <span className="text-slate-400 text-[11px]">balance</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BarChart3 size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* 4. Facturación emitida */}
        <div
          onClick={() => onSwitchTab?.('movimientos')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">Facturación emitida</p>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(totalIncome, currency)}
            </p>
            <p className="text-xs font-medium text-slate-400 pt-1">
              {invoiceCount} transacciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── Fila 1: Evolución mensual + Distribución de gastos + Facturas pendientes ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolución mensual REAL (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-6">
            <h3 className="font-bold text-slate-900 text-sm">Evolución mensual</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Ingresos
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  Gastos
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras con escala dinámica real */}
          <div className="relative h-56 flex items-end">
            {/* Eje Y horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 pr-2">
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>{formatCurrency(maxBarValue, currency)}</span>
              </div>
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>{formatCurrency(Math.round(maxBarValue * 0.75), currency)}</span>
              </div>
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>{formatCurrency(Math.round(maxBarValue * 0.5), currency)}</span>
              </div>
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>{formatCurrency(Math.round(maxBarValue * 0.25), currency)}</span>
              </div>
              <div className="border-b border-slate-200 w-full flex justify-between">
                <span>{formatCurrency(0, currency)}</span>
              </div>
            </div>

            {/* Barras dinámicas */}
            <div className="w-full pl-12 pr-2 h-44 flex items-end justify-between z-10">
              {monthlyData.map((d) => {
                const incomeH = maxBarValue > 0 ? (d.income / maxBarValue) * 100 : 0;
                const expenseH = maxBarValue > 0 ? (d.expense / maxBarValue) * 100 : 0;

                return (
                  <div key={d.month} className="flex flex-col items-center gap-2 group flex-1">
                    <div className="flex items-end gap-1.5 h-36">
                      {/* Barra Ingresos */}
                      <div
                        style={{ height: `${Math.max(incomeH, d.income > 0 ? 5 : 2)}%` }}
                        className={`w-3.5 rounded-t-md transition-all group-hover:brightness-110 relative ${
                          d.income > 0 ? 'bg-emerald-500' : 'bg-slate-100'
                        }`}
                        title={`Ingresos ${d.month}: ${formatCurrency(d.income, currency)}`}
                      />
                      {/* Barra Gastos */}
                      <div
                        style={{ height: `${Math.max(expenseH, d.expense > 0 ? 5 : 2)}%` }}
                        className={`w-3.5 rounded-t-md transition-all group-hover:brightness-110 relative ${
                          d.expense > 0 ? 'bg-rose-400' : 'bg-slate-100'
                        }`}
                        title={`Gastos ${d.month}: ${formatCurrency(d.expense, currency)}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfico 2: Distribución REAL de gastos (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Distribución de gastos</h3>
            <span className="text-xs font-semibold text-slate-400">Este mes</span>
          </div>

          {expenseCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
              <Receipt size={32} strokeWidth={1.5} className="text-slate-300" />
              <p className="text-xs font-medium">Sin gastos registrados este mes</p>
              <button
                type="button"
                onClick={() => onOpenNewMovement?.('expense')}
                className="text-xs font-bold text-rose-600 hover:underline pt-1"
              >
                + Registrar gasto
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              {/* Donut Chart SVG con datos reales */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                  {expenseCategories.map((cat, idx) => {
                    const circumference = 2 * Math.PI * 38; // ~238.7
                    const strokeLen = (cat.pct / 100) * circumference;
                    const prevPcts = expenseCategories.slice(0, idx).reduce((a, b) => a + b.pct, 0);
                    const strokeOffset = -((prevPcts / 100) * circumference);

                    return (
                      <circle
                        key={cat.label}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="14"
                        strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-sm font-black text-slate-900 leading-tight">
                    {formatCurrency(totalExpense, currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Total gastos</span>
                </div>
              </div>

              {/* Leyenda real */}
              <div className="space-y-1.5 w-full text-xs">
                {expenseCategories.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-slate-700 text-[11px] font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-[11px] shrink-0 text-slate-800">
                      <span className="text-slate-400 font-normal">{item.pct}%</span>
                      <span>{formatCurrency(item.amount, currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Facturas pendientes REALES (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Facturas / Cobros pendientes</h3>
            <button
              type="button"
              onClick={() => onSwitchTab?.('movimientos')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowUpRight size={13} />
            </button>
          </div>

          {pendingMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-1">
              <Clock size={28} strokeWidth={1.5} className="text-slate-300" />
              <p className="text-xs font-medium">No hay cobros pendientes</p>
              <p className="text-[11px] text-slate-400">Todos los movimientos están al día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMovements.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <FileText size={15} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {inv.description || inv.external_reference || 'Movimiento pendiente'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {inv.occurred_at ? new Date(inv.occurred_at).toLocaleDateString('es-ES') : 'Fecha pendiente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(inv.amount, currency)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      Pendiente
                    </span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Fila 2: Últimos movimientos + Ingresos por tipo + Accesos rápidos ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabla: Últimos movimientos REALES (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Últimos movimientos</h3>
            <button
              type="button"
              onClick={() => onSwitchTab?.('movimientos')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Ver todos <ArrowUpRight size={13} />
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
              <Inbox size={32} strokeWidth={1.5} className="text-slate-300" />
              <p className="text-xs font-medium">Aún no tienes movimientos registrados</p>
              <button
                type="button"
                onClick={() => onOpenNewMovement?.('income')}
                className="text-xs font-bold text-blue-600 hover:underline pt-1"
              >
                + Registrar primer movimiento
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Descripción</th>
                    <th className="pb-2 font-medium">Categoría</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentMovements.map((m) => {
                    const isPositive = m.type === 'income' || m.type === 'refund';
                    const IconComp = isPositive ? Users : ShoppingCart;
                    const dateFormatted = m.occurred_at
                      ? new Date(m.occurred_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                      : '—';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">{dateFormatted}</td>
                        <td className="py-2.5 font-bold text-slate-800 max-w-[140px] truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <IconComp size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{m.description || m.external_reference || 'Movimiento'}</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                            {m.category || (isPositive ? 'Consultas' : 'General')}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {m.type === 'income' ? 'Ingreso' : m.type === 'expense' ? 'Gasto' : m.type}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 text-right font-black ${
                            isPositive ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isPositive ? '+' : '-'}{formatCurrency(m.amount, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gráfico 3: Ingresos REALES por tipo de consulta (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Ingresos por tipo de consulta</h3>
            <span className="text-xs font-semibold text-slate-400">Este mes</span>
          </div>

          {incomeCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
              <Users size={32} strokeWidth={1.5} className="text-slate-300" />
              <p className="text-xs font-medium">Sin ingresos registrados este mes</p>
              <button
                type="button"
                onClick={() => onOpenNewMovement?.('income')}
                className="text-xs font-bold text-blue-600 hover:underline pt-1"
              >
                + Registrar ingreso
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              {/* Donut Chart SVG con datos reales */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                  {incomeCategories.map((cat, idx) => {
                    const circumference = 2 * Math.PI * 38; // ~238.7
                    const strokeLen = (cat.pct / 100) * circumference;
                    const prevPcts = incomeCategories.slice(0, idx).reduce((a, b) => a + b.pct, 0);
                    const strokeOffset = -((prevPcts / 100) * circumference);

                    return (
                      <circle
                        key={cat.label}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="14"
                        strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-sm font-black text-slate-900 leading-tight">
                    {formatCurrency(totalIncome, currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Total ingresos</span>
                </div>
              </div>

              {/* Leyenda real */}
              <div className="space-y-1.5 w-full text-xs">
                {incomeCategories.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-slate-700 text-[11px] font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-[11px] shrink-0 text-slate-800">
                      <span className="text-slate-400 font-normal">{item.pct}%</span>
                      <span>{formatCurrency(item.amount, currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Accesos rápidos (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Accesos rápidos</h3>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Emitir factura */}
            <button
              type="button"
              onClick={() => onOpenInvoiceModal ? onOpenInvoiceModal() : onOpenNewMovement?.('income')}
              className="p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 rounded-2xl flex flex-col justify-between text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-slate-800 leading-tight">Emitir factura</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>

            {/* Ver informes */}
            <button
              type="button"
              onClick={() => onSwitchTab?.('movimientos')}
              className="p-3.5 bg-slate-50 hover:bg-indigo-50/70 border border-slate-100 hover:border-indigo-200 rounded-2xl flex flex-col justify-between text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-slate-800 leading-tight">Ver informes</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </button>

            {/* Gestionar gastos */}
            <button
              type="button"
              onClick={() => onOpenNewMovement?.('expense')}
              className="p-3.5 bg-slate-50 hover:bg-rose-50/70 border border-slate-100 hover:border-rose-200 rounded-2xl flex flex-col justify-between text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
                <Receipt size={18} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-slate-800 leading-tight">Gestionar gastos</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
            </button>

            {/* Documentos */}
            <button
              type="button"
              onClick={() => onSwitchTab?.('gastos')}
              className="p-3.5 bg-slate-50 hover:bg-teal-50/70 border border-slate-100 hover:border-teal-200 rounded-2xl flex flex-col justify-between text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center">
                <FolderOpen size={18} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-slate-800 leading-tight">Documentos</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
