// EmitirFacturaModal.jsx — Modal completo para selección de movimientos y emisión de facturas en PDF

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Building,
  User,
  CreditCard,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { downloadInvoicePdf, printInvoice } from './invoicePdfGenerator';
import { formatCurrency, TRANSACTION_SOURCES, getDoctorInvoiceProfile } from './accounting.service';

/** Generador de código único de factura */
function generateInvoiceCode(type = 'income') {
  const prefix = type === 'expense' ? 'GAS' : 'FAC';
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${randomNum}`;
}

/** Valida si una referencia es un código formal de factura o si debe generarse uno por el sistema */
function getValidInvoiceCode(ref, type = 'income') {
  if (ref && typeof ref === 'string') {
    const trimmed = ref.trim();
    // Solo si es un código corto sin espacios (ej: FAC-001, GAS-123, B-49) se respeta
    if (trimmed.length >= 3 && trimmed.length <= 22 && !trimmed.includes(' ') && /^[A-Za-z0-9\-_/]+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return generateInvoiceCode(type);
}

/** Formatea montos con EUR limpio sin el símbolo € para evitar errores de renderizado â‚¬ */
function formatPrice(amount, curr = 'EUR') {
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  const c = (curr || 'EUR').toUpperCase();
  const formatted = num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (c === 'USD') return `$ ${formatted}`;
  return `${formatted} EUR`;
}

/** Mapeo de fuente de nuevo movimiento a etiqueta legible de forma de pago */
function mapSourceToPaymentMethod(source) {
  const map = {
    cash: 'Efectivo',
    bank_transfer: 'Transferencia bancaria',
    stripe: 'Stripe',
    external: 'Externo',
    other: 'Otro',
  };
  return map[source] || 'Transferencia bancaria';
}

export default function EmitirFacturaModal({
  isOpen,
  onClose,
  movements = [],
  initialMovement = null,
  currency = 'EUR',
  doctorUser = null,
}) {
  if (!isOpen) return null;

  // Pestaña activa del modal: 'config' | 'preview'
  const [activeTab, setActiveTab] = useState('config');

  // Filtro de movimientos disponibles
  const [movementTypeFilter, setMovementTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovementIds, setSelectedMovementIds] = useState(() => {
    return initialMovement?.id ? [initialMovement.id] : [];
  });

  // Tipo de factura: 'income' (por defecto) o 'expense' (solo si es gasto)
  const isInitialExpense = initialMovement?.type === 'expense' || initialMovement?.type === 'commission';
  const [invoiceType, setInvoiceType] = useState(() => {
    return isInitialExpense ? 'expense' : 'income';
  });

  // Código de Factura (Generado por el sistema, nunca texto de descripción)
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    return getValidInvoiceCode(initialMovement?.external_reference, isInitialExpense ? 'expense' : 'income');
  });

  // Fechas (se adaptan si el movimiento tiene fecha registrada en Nuevo Movimiento)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dueDefaultStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [issueDate, setIssueDate] = useState(() => {
    const rawDate = initialMovement?.expense_date || initialMovement?.occurred_at || initialMovement?.created_at;
    return rawDate ? String(rawDate).slice(0, 10) : todayStr;
  });
  const [dueDate, setDueDate] = useState(dueDefaultStr);

  // Emisor (Médico / Clínica Mivor) — poblado con datos reales del perfil del médico
  const defaultDocName = doctorUser?.name
    ? doctorUser.name
    : (doctorUser?.first_name || doctorUser?.last_name)
      ? `${doctorUser.first_name || ''} ${doctorUser.last_name || ''}`.trim()
      : 'Dr. Médico Especialista';
  const [issuerName, setIssuerName] = useState(defaultDocName);
  const [issuerNif, setIssuerNif] = useState('');          // NIF/CIF real del billing_profile
  const [issuerLicense, setIssuerLicense] = useState(''); // Nº Colegiado — editable manualmente
  const [issuerAddress, setIssuerAddress] = useState('');
  const [issuerEmail, setIssuerEmail] = useState(doctorUser?.email || '');

  // Carga de datos reales del médico desde el backend
  useEffect(() => {
    getDoctorInvoiceProfile()
      .then((profile) => {
        if (!profile) return;
        if (profile.full_name) setIssuerName(profile.full_name);
        if (profile.nif)       setIssuerNif(profile.nif);
        if (profile.address)   setIssuerAddress(profile.address);
        if (profile.email)     setIssuerEmail(profile.email);
      })
      .catch(() => { /* silencioso: se usan los valores por defecto editables */ });
  }, []);

  useEffect(() => {
    if (doctorUser?.email && !issuerEmail) {
      setIssuerEmail(doctorUser.email);
    }
  }, [doctorUser?.email]);

  // DATOS PARA INGRESO (Paciente / Cliente) — NUNCA Proveedor en Ingresos
  const [patientName, setPatientName] = useState('');
  const [patientNif, setPatientNif] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

  // DATOS PARA GASTO (Proveedor / Acreedor) — Solo se usa cuando invoiceType === 'expense'
  const [supplierName, setSupplierName] = useState(() => {
    if (initialMovement?.type === 'expense') {
      return initialMovement.supplier_name || '';
    }
    return '';
  });
  const [supplierNif, setSupplierNif] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  // Items / Conceptos (inicializados a partir del movimiento seleccionado o datos del formulario)
  const [items, setItems] = useState(() => {
    if (initialMovement) {
      return [{
        id: '1',
        description: initialMovement.description || (isInitialExpense ? 'Gasto operativo / Suministros' : 'Consulta médica especializada'),
        quantity: 1,
        unit_price: parseFloat(initialMovement.amount) || 0,
        amount: parseFloat(initialMovement.amount) || 0,
      }];
    }
    return [{
      id: '1',
      description: 'Consulta médica especializada y valoración diagnóstica',
      quantity: 1,
      unit_price: 80,
      amount: 80,
    }];
  });

  // Impuestos y retenciones
  const [taxRate, setTaxRate] = useState(0); // 0% exención sanitaria, 4%, 10%, 21%
  const [retentionRate, setRetentionRate] = useState(0); // 0%, 7%, 15%
  
  // Forma y estado de pago (sincronizados con fuente y estado de Nuevo Movimiento)
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (initialMovement?.payment_method) return initialMovement.payment_method;
    if (initialMovement?.source) return mapSourceToPaymentMethod(initialMovement.source);
    return 'Transferencia bancaria';
  });
  
  const [paymentStatus, setPaymentStatus] = useState(() => {
    if (initialMovement?.status === 'completed') return 'PAGADA';
    if (initialMovement?.status === 'pending') return 'PENDIENTE';
    return 'PAGADA';
  });

  const [notes, setNotes] = useState(() => {
    if (isInitialExpense) {
      return initialMovement?.notes || (initialMovement?.category ? `Categoría: ${initialMovement.category}` : 'Comprobante de gasto operativo');
    }
    return 'Servicio asistencial sanitario exento de IVA en aplicación del artículo 20.Uno.3º de la Ley 37/1992 del IVA.';
  });

  // Estados de descarga
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sincronización completa cuando se selecciona un movimiento de la lista
  const handleToggleMovement = (mov) => {
    setSelectedMovementIds((prev) => {
      const exists = prev.includes(mov.id);
      const next = exists ? prev.filter((id) => id !== mov.id) : [...prev, mov.id];

      // Reconstruir factura con los movimientos seleccionados
      const selMovements = movements.filter((m) => next.includes(m.id));
      if (selMovements.length > 0) {
        // Si hay solo un movimiento o el último seleccionado
        const targetMov = !exists ? mov : selMovements[0];
        const isExp = targetMov.type === 'expense' || targetMov.type === 'commission';
        
        // Cambiar el tipo de factura según el movimiento
        setInvoiceType(isExp ? 'expense' : 'income');
        setInvoiceNumber(getValidInvoiceCode(targetMov.external_reference, isExp ? 'expense' : 'income'));

        // Sincronizar fecha según ocurrió el movimiento
        const rawDate = targetMov.expense_date || targetMov.occurred_at || targetMov.created_at;
        if (rawDate) {
          setIssueDate(String(rawDate).slice(0, 10));
        }

        // Sincronizar forma de pago desde la fuente del movimiento
        setPaymentMethod(targetMov.payment_method || mapSourceToPaymentMethod(targetMov.source));
        setPaymentStatus(targetMov.status === 'completed' ? 'PAGADA' : 'PENDIENTE');

        // Sincronizar Proveedor SOLO si es Gasto
        if (isExp) {
          setSupplierName(targetMov.supplier_name || 'Proveedor / Suministros');
          setNotes(targetMov.notes || (targetMov.category ? `Categoría contable: ${targetMov.category}` : 'Comprobante de gasto operativo'));
        } else {
          // Si es ingreso, NUNCA mostrar proveedor
          setSupplierName('');
          setNotes('Servicio asistencial sanitario exento de IVA en aplicación del artículo 20.Uno.3º de la Ley 37/1992 del IVA.');
        }

        // Sincronizar líneas de conceptos
        setItems(
          selMovements.map((m, idx) => ({
            id: String(idx + 1),
            description: m.description || (m.type === 'expense' ? 'Gasto operativo' : `Consulta médica #${idx + 1}`),
            quantity: 1,
            unit_price: parseFloat(m.amount) || 0,
            amount: parseFloat(m.amount) || 0,
          }))
        );
      }
      return next;
    });
  };

  // Manejo de items dinámicos
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: invoiceType === 'expense' ? 'Nuevo insumo / servicio adquirido' : 'Nuevo servicio o consulta médica',
        quantity: 1,
        unit_price: 50,
        amount: 50,
      },
    ]);
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const q = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
          const p = parseFloat(field === 'unit_price' ? value : item.unit_price) || 0;
          updated.amount = q * p;
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Cálculos financieros
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * parseFloat(taxRate || 0)) / 100;
  }, [subtotal, taxRate]);

  const retentionAmount = useMemo(() => {
    return (subtotal * parseFloat(retentionRate || 0)) / 100;
  }, [subtotal, retentionRate]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount - retentionAmount;
  }, [subtotal, taxAmount, retentionAmount]);

  // Construir objeto de factura según sea INGRESO o GASTO
  const invoicePayload = useMemo(() => {
    const isExpense = invoiceType === 'expense';

    return {
      invoice_number: invoiceNumber,
      invoice_type: invoiceType,
      issue_date: issueDate,
      due_date: dueDate,
      currency: currency,
      // Si es gasto: Emisor = Proveedor, Receptor = Médico
      // Si es ingreso: Emisor = Médico, Receptor = Paciente
      issuer: isExpense
        ? {
            name: supplierName || 'Proveedor / Acreedor',
            nif: supplierNif || 'B-99887766',
            address: supplierAddress || 'Domicilio fiscal del proveedor',
            email: supplierEmail || 'contacto@proveedor.com',
          }
        : {
            name: issuerName,
            nif: issuerNif,
            license: issuerLicense,
            address: issuerAddress,
            email: issuerEmail,
          },
      recipient: isExpense
        ? {
            name: issuerName,
            nif: issuerNif,
            address: issuerAddress,
            email: issuerEmail,
          }
        : {
            name: patientName || 'Paciente / Cliente Particular',
            nif: patientNif || '',
            address: patientAddress || '',
            email: patientEmail || '',
          },
      items: items.map((it) => ({
        description: it.description,
        quantity: parseFloat(it.quantity) || 1,
        unit_price: parseFloat(it.unit_price) || 0,
        amount: parseFloat(it.amount) || 0,
      })),
      subtotal,
      tax_rate: parseFloat(taxRate) || 0,
      tax_amount: taxAmount,
      retention_rate: parseFloat(retentionRate) || 0,
      retention_amount: retentionAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      notes: notes,
    };
  }, [
    invoiceNumber,
    invoiceType,
    issueDate,
    dueDate,
    currency,
    issuerName,
    issuerNif,
    issuerLicense,
    issuerAddress,
    issuerEmail,
    patientName,
    patientNif,
    patientAddress,
    patientEmail,
    supplierName,
    supplierNif,
    supplierAddress,
    supplierEmail,
    items,
    subtotal,
    taxRate,
    taxAmount,
    retentionRate,
    retentionAmount,
    totalAmount,
    paymentMethod,
    paymentStatus,
    notes,
  ]);

  // Descargar PDF
  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadInvoicePdf(invoicePayload);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generando factura PDF:', err);
      alert('Hubo un error al generar el PDF. Por favor reintenta.');
    } finally {
      setDownloading(false);
    }
  };

  // Imprimir
  const handlePrint = () => {
    printInvoice(invoicePayload);
  };

  // Filtrado de movimientos
  const filteredMovements = movements.filter((m) => {
    const matchType =
      movementTypeFilter === 'all' ||
      (movementTypeFilter === 'income' && (m.type === 'income' || m.type === 'refund')) ||
      (movementTypeFilter === 'expense' && (m.type === 'expense' || m.type === 'commission'));
    const matchSearch =
      !searchQuery ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.external_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              invoiceType === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-800">
                  Emitir Factura Médica
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  invoiceType === 'expense'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {invoiceType === 'expense' ? 'Factura de Gasto' : 'Factura de Ingreso'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {invoiceType === 'expense'
                  ? 'Facturación de compra o proveedor con datos de gastos registrados'
                  : 'Factura oficial para el paciente por servicios y honorarios médicos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Configuración vs Vista Previa */}
            <div className="bg-slate-200/60 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye size={13} />
                <span>Vista Previa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'config' ? (
            <>
              {/* SECCIÓN 1: Selección de Movimientos Registrados */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Elegir Movimiento(s) Registrado(s) ({selectedMovementIds.length} seleccionados)
                    </h3>
                  </div>

                  {/* Filtro rápido */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMovementTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        movementTypeFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Todos ({movements.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementTypeFilter('income')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        movementTypeFilter === 'income'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200'
                      }`}
                    >
                      Ingresos
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementTypeFilter('expense')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        movementTypeFilter === 'expense'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
                      }`}
                    >
                      Gastos
                    </button>
                  </div>
                </div>

                {/* Buscador de movimientos */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por concepto, proveedor o referencia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  />
                </div>

                {/* Lista compacta seleccionable de movimientos */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredMovements.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No se encontraron movimientos registrados con ese filtro.
                    </div>
                  ) : (
                    filteredMovements.map((m) => {
                      const isSelected = selectedMovementIds.includes(m.id);
                      const isExpense = m.type === 'expense' || m.type === 'commission';
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMovement(m)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400'
                              : 'bg-white border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                                isExpense ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {isExpense ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-700 leading-tight">
                                  {m.description || 'Sin descripción'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {m.occurred_at ? new Date(m.occurred_at).toLocaleDateString('es-ES') : 'Fecha no reg.'} 
                                  {isExpense && m.supplier_name ? ` · Proveedor: ${m.supplier_name}` : ''}
                                  {` · ${TRANSACTION_SOURCES[m.source] || m.source || 'General'}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-extrabold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isExpense ? '-' : '+'}{formatPrice(m.amount, m.currency || currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: Código, Tipo y Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Tipo de Factura */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Factura
                  </label>
                  <select
                    value={invoiceType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setInvoiceType(newType);
                      setInvoiceNumber(generateInvoiceCode(newType));
                      if (newType === 'income') {
                        setSupplierName('');
                        setNotes('Servicio asistencial sanitario exento de IVA en aplicación del artículo 20.Uno.3º de la Ley 37/1992 del IVA.');
                      } else {
                        setNotes('Comprobante de gasto operativo y suministros médicos.');
                      }
                    }}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="income">Factura de Ingreso (Honorarios / Paciente)</option>
                    <option value="expense">Factura de Gasto (Proveedor / Compra)</option>
                  </select>
                </div>

                {/* Código de Factura */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Código / Nº Factura
                    </label>
                    <button
                      type="button"
                      onClick={() => setInvoiceNumber(generateInvoiceCode(invoiceType))}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Generar nuevo código"
                    >
                      <RefreshCw size={10} /> Nuevo
                    </button>
                  </div>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Fecha Emisión */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Fecha Vencimiento */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* SECCIÓN 3: Datos de Emisor y Receptor (PROVEEDOR SOLO SE MUESTRA EN GASTO) */}
              {invoiceType === 'income' ? (
                /* ─── CASO INGRESO: Emisor = Médico | Receptor = Paciente / Cliente ─── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emisor (Médico) */}
                  <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                      <User size={14} className="text-blue-600" />
                      <span>Emisor (Profesional Médico / Clínica)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nombre del Médico o Clínica</label>
                      <input
                        type="text"
                        value={issuerName}
                        onChange={(e) => setIssuerName(e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Correo Electrónico</label>
                      <input
                        type="email"
                        value={issuerEmail}
                        onChange={(e) => setIssuerEmail(e.target.value)}
                        placeholder="doctor@ejemplo.com"
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dirección del Consultorio</label>
                      <input
                        type="text"
                        value={issuerAddress}
                        onChange={(e) => setIssuerAddress(e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Receptor (Paciente / Cliente) — NUNCA Proveedor en Ingresos */}
                  <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      <User size={14} className="text-emerald-600" />
                      <span>Datos del Paciente / Cliente (Receptor)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nombre del Paciente *</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ej: Juan Pérez (o Paciente Particular)"
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">DNI / NIF</label>
                        <input
                          type="text"
                          value={patientNif}
                          onChange={(e) => setPatientNif(e.target.value)}
                          placeholder="DNI o NIE del paciente"
                          className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Email / Teléfono</label>
                        <input
                          type="text"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="email@ejemplo.com"
                          className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dirección del Paciente</label>
                      <input
                        type="text"
                        value={patientAddress}
                        onChange={(e) => setPatientAddress(e.target.value)}
                        placeholder="Calle, ciudad o domicilio"
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── CASO GASTO: SOLO AQUÍ SE MUESTRA EL PROVEEDOR / ACREEDOR ─── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Proveedor / Acreedor (Emisor del Gasto) */}
                  <div className="bg-rose-50/40 border border-rose-200/70 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wide">
                      <Building size={14} className="text-rose-600" />
                      <span>Proveedor / Acreedor (Emisor del Gasto)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nombre del Proveedor o Empresa *</label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Ej: Suministros Médicos S.L."
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-rose-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">CIF / NIF</label>
                        <input
                          type="text"
                          value={supplierNif}
                          onChange={(e) => setSupplierNif(e.target.value)}
                          placeholder="CIF del proveedor"
                          className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Email / Teléfono</label>
                        <input
                          type="text"
                          value={supplierEmail}
                          onChange={(e) => setSupplierEmail(e.target.value)}
                          placeholder="contacto@proveedor.com"
                          className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dirección del Proveedor</label>
                      <input
                        type="text"
                        value={supplierAddress}
                        onChange={(e) => setSupplierAddress(e.target.value)}
                        placeholder="Dirección fiscal del proveedor"
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Cliente / Pagador (Médico / Clínica que paga el gasto) */}
                  <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                      <User size={14} className="text-blue-600" />
                      <span>Cliente / Pagador (Profesional / Clínica)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nombre o Razón Social</label>
                      <input
                        type="text"
                        value={issuerName}
                        onChange={(e) => setIssuerName(e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Correo Electrónico</label>
                      <input
                        type="email"
                        value={issuerEmail}
                        onChange={(e) => setIssuerEmail(e.target.value)}
                        placeholder="doctor@ejemplo.com"
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dirección Fiscal</label>
                      <input
                        type="text"
                        value={issuerAddress}
                        onChange={(e) => setIssuerAddress(e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: Conceptos / Líneas de Factura */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Conceptos y Líneas de la Factura
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Añadir línea</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="text-left px-3.5 py-2.5">Descripción / Concepto</th>
                        <th className="text-center px-2 py-2.5 w-16">Cant.</th>
                        <th className="text-right px-3 py-2.5 w-28">Precio Unit.</th>
                        <th className="text-right px-3 py-2.5 w-28">Total</th>
                        <th className="w-10 px-2 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                              className="w-full py-1 px-2 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-400"
                              placeholder={invoiceType === 'expense' ? 'Ej: Compra de material médico o instrumental' : 'Ej: Consulta de medicina especializada'}
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={it.quantity}
                              onChange={(e) => handleUpdateItem(it.id, 'quantity', e.target.value)}
                              className="w-14 text-center py-1 px-1 border border-slate-200 rounded-lg text-slate-700"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.unit_price}
                              onChange={(e) => handleUpdateItem(it.id, 'unit_price', e.target.value)}
                              className="w-24 text-right py-1 px-2 border border-slate-200 rounded-lg text-slate-700 font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800 font-mono">
                            {formatPrice(it.amount, currency)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(it.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md"
                                title="Eliminar línea"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECCIÓN 5: Impuestos, Condiciones y Resumen Total */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Opciones de pago y notas */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Forma de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia bancaria">Transferencia bancaria</option>
                        <option value="Tarjeta débito/crédito">Tarjeta débito/crédito</option>
                        <option value="Stripe">Stripe</option>
                        <option value="Bizum">Bizum</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Estado de Cobro / Pago
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
                      >
                        <option value="PAGADA">Pagada</option>
                        <option value="PENDIENTE">Pendiente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notas legales / Exención fiscal
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Desglose de Totales e Impuestos */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Base imponible */}
                    <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                      <span>Base Imponible (Subtotal):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatPrice(subtotal, currency)}
                      </span>
                    </div>

                    {/* Selector de IVA */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">IVA:</span>
                        <select
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="text-[11px] font-bold py-0.5 px-1.5 bg-white border border-slate-200 rounded-md text-slate-700"
                        >
                          <option value={0}>0% (Exento Médico)</option>
                          <option value={4}>4% (Superreducido)</option>
                          <option value={10}>10% (Reducido)</option>
                          <option value={21}>21% (General)</option>
                        </select>
                      </div>
                      <span className="font-mono text-slate-800">
                        +{formatPrice(taxAmount, currency)}
                      </span>
                    </div>

                    {/* Selector de Retención IRPF */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">Retención IRPF:</span>
                        <select
                          value={retentionRate}
                          onChange={(e) => setRetentionRate(Number(e.target.value))}
                          className="text-[11px] font-bold py-0.5 px-1.5 bg-white border border-slate-200 rounded-md text-slate-700"
                        >
                          <option value={0}>0% (Sin retención)</option>
                          <option value={7}>7% (Inicio actividad)</option>
                          <option value={15}>15% (Profesional general)</option>
                        </select>
                      </div>
                      <span className="font-mono text-rose-600">
                        {retentionRate > 0 ? `-${formatPrice(retentionAmount, currency)}` : '0,00 EUR'}
                      </span>
                    </div>
                  </div>

                  {/* TOTAL FINAL DESTACADO */}
                  <div className="border-t border-slate-200/80 pt-3 mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Total Factura
                      </span>
                      <p className="text-[10px] text-slate-400">Impuestos y retenciones incluidos</p>
                    </div>
                    <span className={`text-xl font-black font-mono ${
                      invoiceType === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {formatPrice(totalAmount, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* VISTA PREVIA ELEGANTE DE LA FACTURA */
            <div className="bg-slate-100/60 p-4 rounded-2xl flex justify-center">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 w-full max-w-2xl space-y-6">
                
                {/* Barra superior de acento */}
                <div className={`h-1.5 rounded-full ${
                  invoiceType === 'expense' ? 'bg-rose-500' : 'bg-blue-600'
                }`} />

                {/* Header de la factura vista previa */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase">
                      Mivor Salud Digital · Factura Oficial
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      {invoiceType === 'expense' ? 'FACTURA DE COMPRA / GASTO' : 'FACTURA DE INGRESO'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Fecha emisión: {issueDate} · Vencimiento: {dueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nº Factura</span>
                    <p className="text-base font-black font-mono text-blue-600">
                      {invoiceNumber}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      paymentStatus === 'PAGADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Tarjetas Emisor y Receptor según el tipo */}
                {invoiceType === 'income' ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">
                        Emisor (Profesional Médico)
                      </span>
                      <p className="font-extrabold text-slate-800">{issuerName}</p>
                      {issuerEmail && <p className="text-slate-500 text-[11px]">{issuerEmail}</p>}
                      <p className="text-slate-500 text-[11px]">{issuerAddress}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide block mb-1">
                        Receptor (Paciente / Cliente)
                      </span>
                      <p className="font-extrabold text-slate-800">{patientName || 'Paciente Particular'}</p>
                      <p className="text-slate-500 text-[11px]">DNI/NIF: {patientNif || 'No especificado'}</p>
                      <p className="text-slate-500 text-[11px]">{patientAddress || 'Consulta médica particular'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wide block mb-1">
                        Proveedor / Acreedor (Emisor)
                      </span>
                      <p className="font-extrabold text-slate-800">{supplierName || 'Proveedor de Servicios'}</p>
                      <p className="text-slate-500 text-[11px]">CIF/NIF: {supplierNif || 'B-99887766'}</p>
                      <p className="text-slate-500 text-[11px]">{supplierAddress || 'Dirección fiscal'}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">
                        Cliente / Pagador (Médico / Clínica)
                      </span>
                      <p className="font-extrabold text-slate-800">{issuerName}</p>
                      {issuerEmail && <p className="text-slate-500 text-[11px]">{issuerEmail}</p>}
                      <p className="text-slate-500 text-[11px]">{issuerAddress}</p>
                    </div>
                  </div>
                )}

                {/* Tabla de Conceptos */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="text-left py-2">Concepto</th>
                      <th className="text-center py-2 w-16">Cant.</th>
                      <th className="text-right py-2 w-24">Precio</th>
                      <th className="text-right py-2 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 font-medium text-slate-700">{it.description}</td>
                        <td className="py-2.5 text-center text-slate-500">{it.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {formatPrice(it.unit_price, currency)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          {formatPrice(it.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totales y Pago */}
                <div className="border-t border-slate-100 pt-4 flex justify-between items-start text-xs">
                  <div className="max-w-[280px]">
                    <p className="font-bold text-slate-700">Forma de Pago: {paymentMethod}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{notes}</p>
                  </div>

                  <div className="w-48 space-y-1.5 text-right">
                    <div className="flex justify-between text-slate-500">
                      <span>Base:</span>
                      <span className="font-mono">{formatPrice(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IVA ({taxRate}%):</span>
                      <span className="font-mono">+{formatPrice(taxAmount, currency)}</span>
                    </div>
                    {retentionRate > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Retención ({retentionRate}%):</span>
                        <span className="font-mono">-{formatPrice(retentionAmount, currency)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-black text-slate-900">
                      <span>Total:</span>
                      <span className={`font-mono ${invoiceType === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatPrice(totalAmount, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie de página con verificación */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-blue-500" />
                    <span>Factura electrónica certificada · Mivor Health Cloud</span>
                  </div>
                  <span>Código de verificación: {invoiceNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {downloadSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold animate-in fade-in">
                <CheckCircle2 size={14} /> Factura descargada en PDF con éxito
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Descargar Factura PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
