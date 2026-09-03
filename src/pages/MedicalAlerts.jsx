import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Bell,
  Search,
  Plus,
  FlaskConical,
  Building2,
  BookOpen,
  Stethoscope,
  Tag,
  Heart,
  Clock,
  Layers,
  CheckCircle2,
  MoreVertical,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function MedicalAlerts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Vistas: 'list' | 'create' | 'success'
  const [currentView, setCurrentView] = useState('list');

  // Estados de carga y error
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros de listado
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'inactive'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [searchTerm, setSearchTerm] = useState('');

  // Notificación recién creada para pantalla de éxito
  const [createdAlert, setCreatedAlert] = useState(null);

  // Formulario de creación
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    infoType: 'Tratamientos',
    frequency: 'En el momento',
    source: 'all', // 'all' o cualquiera de las 6 bibliotecas
  });

  // Lista de las 6 bibliotecas clínicas + Opción de todas
  const libraryOptions = [
    { id: 'all', name: 'Todas las bibliotecas' },
    { id: 'pubmed', name: 'PubMed' },
    { id: 'cochrane', name: 'Cochrane' },
    { id: 'europepmc', name: 'EuropePMC' },
    { id: 'openfda', name: 'OpenFDA' },
    { id: 'whoictrp', name: 'WHO ICTRP' },
    { id: 'clinicaltrials', name: 'ClinicalTrials' },
  ];

  const infoTypeOptions = [
    { id: 'Tratamientos', title: 'Tratamientos', subtitle: 'Nuevos fármacos y terapias', icon: FlaskConical },
    { id: 'Estudios clínicos', title: 'Estudios clínicos', subtitle: 'Nuevos ensayos y resultados', icon: Building2 },
    { id: 'Guías y estudios', title: 'Guías y estudios', subtitle: 'Guías, revisiones y metaanálisis', icon: BookOpen },
    { id: 'Diagnóstico', title: 'Diagnóstico', subtitle: 'Nuevas técnicas y herramientas', icon: Stethoscope },
  ];

  // ==========================================================
  // OBTENER ALERTAS DE LA BASE DE DATOS (medical_notifications)
  // ==========================================================
  const fetchAlerts = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const url = `${import.meta.env.VITE_API_URL}/medical/notifications?user_id=${user.id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las alertas de la base de datos.');
      }

      const data = await response.json();
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching medical_notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  // ==========================================================
  // CREAR ALERTA EN BASE DE DATOS
  // ==========================================================
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${import.meta.env.VITE_API_URL}/medical/notifications`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          name: formData.name,
          topic: formData.topic,
          info_type: formData.infoType,
          frequency: formData.frequency,
          source: formData.source,
          is_active: true,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar la alerta en la base de datos.');
      }

      const newAlertData = await response.json();

      setCreatedAlert(newAlertData);
      setAlerts((prev) => [newAlertData, ...prev]);
      setCurrentView('success');
    } catch (err) {
      console.error('Error creating notification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CAMBIAR ESTADO (ACTIVAR / DESACTIVAR) EN LA BD
  // ==========================================================
  const toggleAlertStatus = async (alertId, currentStatus) => {
    try {
      const newStatus = !currentStatus;

      // Actualización optimista local
      setAlerts((prev) =>
        prev.map((item) =>
          item.id === alertId ? { ...item, is_active: newStatus } : item
        )
      );

      const url = `${import.meta.env.VITE_API_URL}/medical/notifications/${alertId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: newStatus,
        }),
      });

      if (!response.ok) {
        // Revertir si hubo error
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      fetchAlerts();
    }
  };

  // ==========================================================
  // CÁLCULOS Y FILTRADO EN TIEMPO REAL
  // ==========================================================
  const activeAlertsCount = alerts.filter((a) => a.is_active).length;
  const inactiveAlertsCount = alerts.filter((a) => !a.is_active).length;

  const filteredAlerts = alerts.filter((item) => {
    // Filtro por Tab principal
    if (activeTab === 'active' && !item.is_active) return false;
    if (activeTab === 'inactive' && item.is_active) return false;

    // Filtro por Dropdown Estado
    if (statusFilter === 'active' && !item.is_active) return false;
    if (statusFilter === 'inactive' && item.is_active) return false;

    // Filtro Búsqueda por Texto
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(query);
      const matchTopic = item.topic?.toLowerCase().includes(query);
      return matchName || matchTopic;
    }

    return true;
  });

  const getSourceLabel = (src) => {
    const found = libraryOptions.find((l) => l.id === src);
    return found ? found.name : src;
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">

        {/* ========================================================= */}
        {/* PANTALLA 1: FORMULARIO DE CREACIÓN */}
        {/* ========================================================= */}
        {currentView === 'create' && (
          <div className="animate-in fade-in duration-300">
            <button
              onClick={() => setCurrentView('list')}
              className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Volver a Evidencia médica</span>
            </button>

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Bell size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Crear alerta médica</h1>
                <p className="text-xs text-slate-500">Recibe al instante nuevos avances sobre lo que más te interesa.</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-600">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                  <h2 className="mb-6 text-base font-bold text-slate-900">Configuración de la alerta</h2>

                  <form onSubmit={handleCreateAlert} className="space-y-6">
                    {/* NOMBRE DE LA ALERTA */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Nombre de la alerta</label>
                      <input
                        type="text"
                        placeholder="Ej.: Nuevos tratamientos en insuficiencia cardíaca"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white"
                        required
                      />
                    </div>

                    {/* TEMA O CONDICIÓN MÉDICA */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800">Tema o condición médica</label>
                      <p className="text-[11px] text-slate-400 mb-2">¿Sobre qué quieres recibir avances?</p>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ej.: Insuficiencia cardíaca, diabetes tipo 2, cáncer de mama..."
                          value={formData.topic}
                          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white"
                          required
                        />
                        <Search size={16} className="absolute right-3 top-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* TIPO DE INFORMACIÓN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800">Tipo de información</label>
                      <p className="text-[11px] text-slate-400 mb-3">Elige qué tipo de avances quieres recibir.</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {infoTypeOptions.map((opt) => {
                          const IconComp = opt.icon;
                          const isSelected = formData.infoType === opt.id;
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() => setFormData({ ...formData, infoType: opt.id })}
                              className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10'
                                  : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <IconComp size={18} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{opt.title}</h4>
                                <p className="text-[10px] text-slate-400">{opt.subtitle}</p>
                              </div>
                              {isSelected && (
                                <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FRECUENCIA */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800">Frecuencia</label>
                      <p className="text-[11px] text-slate-400 mb-2">¿Con qué frecuencia quieres recibir notificaciones?</p>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white cursor-pointer"
                      >
                        <option value="En el momento">En el momento (alertas inmediatas)</option>
                        <option value="Diario">Resumen diario</option>
                        <option value="Semanal">Resumen semanal</option>
                      </select>
                    </div>

                    {/* FUENTES DE BIBLIOTECA BÚSQUEDA */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800">Fuentes</label>
                      <p className="text-[11px] text-slate-400 mb-2">Selecciona la fuente científica donde buscaremos información.</p>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white cursor-pointer"
                      >
                        {libraryOptions.map((lib) => (
                          <option key={lib.id} value={lib.id}>
                            {lib.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 lg:hidden">
                      <button
                        type="button"
                        onClick={() => setCurrentView('list')}
                        className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-bold text-slate-600"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/20 disabled:bg-slate-300"
                      >
                        {loading ? <Loader2 className="animate-spin" size={14} /> : <Bell size={14} />}
                        <span>Crear alerta</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* COLUMNA DERECHA: RESUMEN */}
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">Resumen de la alerta</h3>
                  <div className="space-y-4 rounded-2xl bg-indigo-50/30 p-4 text-xs">
                    <div className="flex items-start gap-3">
                      <Tag size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Nombre</p>
                        <p className="text-slate-500">{formData.name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Heart size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Tema o condición</p>
                        <p className="text-slate-500">{formData.topic || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FlaskConical size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Tipo de información</p>
                        <p className="text-slate-500">{formData.infoType}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Frecuencia</p>
                        <p className="text-slate-500">{formData.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Layers size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Fuentes</p>
                        <p className="text-slate-500">{getSourceLabel(formData.source)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 hidden lg:flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentView('list')}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-center text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAlert}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:bg-slate-300"
                    >
                      {loading ? <Loader2 className="animate-spin" size={14} /> : <Bell size={14} />}
                      <span>Crear alerta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PANTALLA 2: CONFIRMACIÓN DE ÉXITO */}
        {/* ========================================================= */}
        {currentView === 'success' && createdAlert && (
          <div className="animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-6 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">¡Alerta creada!</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Te notificaremos al instante cuando haya nuevos avances.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-bold text-slate-900">Resumen de tu alerta</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-3 flex items-start gap-3">
                    <Tag size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Nombre</p>
                      <p className="text-slate-500">{createdAlert.name}</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Heart size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Tema o condición</p>
                      <p className="text-slate-500">{createdAlert.topic}</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <FlaskConical size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Tipo de información</p>
                      <p className="text-slate-500">{createdAlert.info_type || createdAlert.infoType}</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Clock size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Frecuencia</p>
                      <p className="text-slate-500">{createdAlert.frequency}</p>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-3">
                    <Layers size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Fuentes</p>
                      <p className="text-slate-500">{getSourceLabel(createdAlert.source)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center text-center py-4">
                  <h3 className="text-lg font-bold text-slate-900">Gestiona todas tus alertas</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    Consulta, edita o crea nuevas alertas para mantenerte siempre actualizado.
                  </p>
                </div>

                <div className="space-y-3 pt-6">
                  <button
                    onClick={() => setCurrentView('list')}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
                  >
                    <span>Ver mis alertas</span>
                    <ArrowLeft size={16} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        name: '',
                        topic: '',
                        infoType: 'Tratamientos',
                        frequency: 'En el momento',
                        source: 'all',
                      });
                      setCurrentView('create');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={16} />
                    <span>Crear nueva alerta</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PANTALLA 3: LISTADO ("MIS ALERTAS") */}
        {/* ========================================================= */}
        {currentView === 'list' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Mis alertas</h1>
                <p className="mt-1 text-xs text-slate-500">Consulta y gestiona todas las alertas de tu base de datos.</p>
              </div>
              <button
                onClick={() => setCurrentView('create')}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
              >
                <Plus size={16} />
                <span>Crear nueva alerta</span>
              </button>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              {/* TABS DE ESTADO (Calculados dinámicamente) */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex gap-6 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 transition-all ${
                      activeTab === 'all'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Todas ({alerts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-2 transition-all ${
                      activeTab === 'active'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Activadas ({activeAlertsCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('inactive')}
                    className={`pb-2 transition-all ${
                      activeTab === 'inactive'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Inactivas ({inactiveAlertsCount})
                  </button>
                </div>
              </div>

              {/* FILTROS SECUNDARIOS */}
              <div className="mb-6 flex flex-wrap items-center gap-3 text-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar alerta..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Estado:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activas</option>
                    <option value="inactive">Inactivas</option>
                  </select>
                </div>
              </div>

              {/* LISTA O CARGANDO */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                  <p className="text-xs font-semibold">Cargando tus alertas...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <Bell size={36} className="mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No se encontraron alertas</p>
                  <p className="text-xs text-slate-400">Crea una nueva alerta o cambia los filtros de búsqueda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:bg-slate-50/80"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <FlaskConical size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                          <p className="text-[11px] text-slate-500">
                            {item.topic} • {item.info_type || item.infoType}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {getSourceLabel(item.source)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right text-xs">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                            <Bell size={10} /> {item.frequency}
                          </p>
                          {item.created_at && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                              <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* TOGGLE EN TIEMPO REAL CON LA BD */}
                        <button
                          onClick={() => toggleAlertStatus(item.id, item.is_active)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.is_active ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              item.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PAGINACIÓN / CONTADOR */}
              <div className="mt-6 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                <span>Mostrando {filteredAlerts.length} de {alerts.length} alertas</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}