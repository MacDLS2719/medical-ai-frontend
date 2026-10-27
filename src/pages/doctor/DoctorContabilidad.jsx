import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingDown,
  PlusCircle,
  RefreshCw,
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  FileText,
} from 'lucide-react';

import ContabilidadDashboard from './contabilidad/ContabilidadDashboard';
import MovimientosLista from './contabilidad/MovimientosLista';
import GastosLista from './contabilidad/GastosLista';
import NuevoMovimientoModal from './contabilidad/NuevoMovimientoModal';
import EmitirFacturaModal from './contabilidad/EmitirFacturaModal';
import { listMovements } from './contabilidad/accounting.service';

export default function DoctorContabilidad() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'movimientos' | 'gastos'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [currency, setCurrency] = useState('EUR'); // 'EUR' | 'USD'
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('income');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalInitialMovement, setInvoiceModalInitialMovement] = useState(null);

  useEffect(() => {
    // Si no hay usuario o no es doctor, redirigir
    if (!user || (user.role && user.role !== 'doctor')) {
      navigate('/');
    }
  }, [user, navigate]);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMovements({ limit: 100 });
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando movimientos contables:', err);
      // No bloqueamos la vista, simplemente mostramos el error si ocurre
      setError(err.message || 'No se pudieron cargar los datos contables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadMovements();
    }
  }, [user, loadMovements]);

  const handleOpenModal = (type = 'income') => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleOpenInvoiceModal = (movement = null) => {
    setInvoiceModalInitialMovement(movement);
    setIsInvoiceModalOpen(true);
  };

  const handleMovementCreated = () => {
    loadMovements();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 md:p-8 pb-32 md:pb-36 space-y-6 h-full">
      {/* Botones de acción / Barra superior rápida */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-2xl border border-slate-200/80 shadow-xs backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard Principal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('movimientos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'movimientos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>Movimientos</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full font-bold">
              {movements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gastos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gastos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <Receipt size={14} />
            <span>Gastos Detallados</span>
          </button>
        </div>

        {/* Acciones de creación y emisión */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadMovements}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenInvoiceModal()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
            title="Emitir y descargar factura en PDF para ingresos o gastos"
          >
            <FileText size={15} />
            <span>Emitir Factura</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <TrendingDown size={15} />
            <span>Registrar Gasto</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal('income')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
          >
            <PlusCircle size={15} />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={loadMovements}
            className="ml-auto underline font-bold hover:text-rose-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido según pestaña activa */}
      {activeTab === 'dashboard' && (
        <ContabilidadDashboard
          movements={movements}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          currency={currency}
          onCurrencyChange={setCurrency}
          onOpenNewMovement={handleOpenModal}
          onOpenInvoiceModal={handleOpenInvoiceModal}
          onSwitchTab={setActiveTab}
        />
      )}

      {activeTab === 'movimientos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Historial completo de movimientos</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenInvoiceModal()}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <FileText size={13} />
                <span>Emitir Factura</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handleOpenModal('income')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Añadir movimiento
              </button>
            </div>
          </div>
          <MovimientosLista
            movements={movements}
            loading={loading}
            onRefresh={loadMovements}
            currency={currency}
            onGenerateInvoice={handleOpenInvoiceModal}
          />
        </div>
      )}

      {activeTab === 'gastos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Control de gastos por categoría</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenInvoiceModal()}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <FileText size={13} />
                <span>Facturar Gasto</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handleOpenModal('expense')}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                + Añadir gasto
              </button>
            </div>
          </div>
          <GastosLista movements={movements} currency={currency} />
        </div>
      )}

      {/* Modal interactivo para Registrar Movimiento o Gasto */}
      {isModalOpen && (
        <NuevoMovimientoModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleMovementCreated}
          defaultType={modalDefaultType}
          defaultCurrency={currency}
        />
      )}

      {/* Modal interactivo para Emitir Factura y Descargar en PDF */}
      {isInvoiceModalOpen && (
        <EmitirFacturaModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          movements={movements}
          initialMovement={invoiceModalInitialMovement}
          currency={currency}
          doctorUser={user}
        />
      )}
    </div>
  );
}
