import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  FileText,
  MessageSquare,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  PenSquare,
  Info,
  Download,
  ArrowLeft,
  UserCheck,
  User,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function DoctorVerificationDetail() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'documentos' | 'notas' | 'historial'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [includeAll, setIncludeAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchDoctors(includeAll);
  }, [includeAll]);

  const fetchDoctors = async (showAll = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/doctor-verification/doctors?include_all=${showAll}`);
      if (!response.ok) {
        throw new Error('Error al cargar la lista de médicos para verificación');
      }
      const data = await response.json();
      setDoctors(data);
      if (data.length > 0) {
        setSelectedDoctorId(data[0].id);
      } else {
        setSelectedDoctorId(null);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const doctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  const handleUpdateStatus = async (newStatus) => {
    if (!doctor) return;
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/doctor-verification/doctors/${doctor.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado de verificación');
      }

      const updated = await response.json();
      
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id ? { ...d, verification_status: newStatus } : d
        )
      );

      alert(`El estado del médico se ha actualizado a '${newStatus === 'verified' ? 'Verificado' : newStatus === 'rejected' ? 'Rechazado' : 'Pendiente'}'.`);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar el estado de verificación.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'verified' || status === 'Verificado') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          <Check size={12} /> Verificado
        </span>
      );
    }
    if (status === 'rejected' || status === 'Rechazado') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
          <X size={12} /> Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
        <Clock size={12} /> Pendiente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-slate-500 gap-3">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="font-semibold text-sm">Cargando médicos para verificación...</p>
      </div>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-slate-600 gap-4 text-center">
        <AlertCircle size={48} className="text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800">No se pudieron cargar los datos</h2>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <button
          onClick={fetchDoctors}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const personalData = [
    { field: 'Nombre completo', value: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'N/A', status: doctor?.verification_status === 'verified' ? 'Verificado' : 'Pendiente', method: 'Documento de identidad', verifiedBy: doctor?.verification_status === 'verified' ? 'Ana García' : '-', date: doctor ? '15 may 2024, 11:25' : '-' },
    { field: 'Fecha de nacimiento', value: '12/04/1986', status: 'Verificado', method: 'Documento de identidad', verifiedBy: 'Ana García', date: '15 may 2024, 11:25' },
    { field: 'Correo electrónico', value: doctor?.email || 'N/A', status: doctor?.verification_status === 'verified' ? 'Verificado' : 'Pendiente', method: 'Confirmación por email', verifiedBy: doctor?.verification_status === 'verified' ? 'Ana García' : '-', date: '15 may 2024, 11:26' },
    { field: 'Teléfono', value: doctor?.phone || '+34 600 123 456', status: 'Verificado', method: 'Confirmación por SMS', verifiedBy: 'Ana García', date: '15 may 2024, 11:26' },
  ];

  const profData = [
    { field: 'Especialidad principal', value: doctor?.specialty || 'Medicina general', status: 'Verificado', method: 'Título profesional', verifiedBy: 'Luis Fernández', date: '15 may 2024, 12:05' },
    { field: 'Nº de colegiado', value: doctor?.medical_license || '12345678', status: 'Verificado', method: 'Consulta en colegio', verifiedBy: 'Luis Fernández', date: '15 may 2024, 12:08' },
    { field: 'Colegio profesional', value: 'Ilustre Colegio Oficial de Médicos de Madrid', status: 'Verificado', method: 'Consulta en colegio', verifiedBy: 'Luis Fernández', date: '15 may 2024, 12:08' },
    { field: 'Años de experiencia', value: '12 años', status: 'Pendiente', method: 'Revisión manual', verifiedBy: '-', date: '-' },
    { field: 'Subespecialidades', value: 'Medicina familiar, Urgencias', status: 'Pendiente', method: 'Revisión de documentos', verifiedBy: '-', date: '-' },
  ];

  const docsData = [
    { field: 'Documento de identidad', value: 'DNI - 12345678A.pdf', status: 'Verificado', method: 'Revisión de documento', verifiedBy: 'Ana García', date: '15 may 2024, 11:20' },
    { field: 'Título universitario', value: 'Titulo_Medicina.pdf', status: 'Verificado', method: 'Revisión de documento', verifiedBy: 'Luis Fernández', date: '15 may 2024, 12:02' },
    { field: 'Certificado de colegiación', value: 'Colegiacion_Madrid.pdf', status: 'Verificado', method: 'Revisión de documento', verifiedBy: 'Luis Fernández', date: '15 may 2024, 12:07' },
    { field: 'Seguro de responsabilidad civil', value: 'Seguro_RCP.pdf', status: 'Pendiente', method: 'Revisión de documento', verifiedBy: '-', date: '-' },
    { field: 'Certificado de antecedentes', value: 'Pendiente de entrega', status: 'Pendiente', method: 'Pendiente de entrega', verifiedBy: '-', date: '-' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-28 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        
        {/* BREADCRUMBS Y SELECTOR DE MÉDICO */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-600">Verificación de médico</span>
            <ChevronRight size={12} />
            <span>Panel de verificación</span>
            <ChevronRight size={12} />
            <span className="text-blue-600 font-semibold">{doctor ? `Detalle de ${doctor.first_name} ${doctor.last_name}` : 'Detalle'}</span>
          </nav>

          {doctors.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Seleccionar médico:</span>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.first_name} {d.last_name} ({d.verification_status || 'pending'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TARJETA SUPERIOR DE INFORMACIÓN DEL MÉDICO */}
        <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl ring-4 ring-blue-50 shrink-0 overflow-hidden">
                {doctor?.avatar_url ? (
                  <img src={doctor.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  doctor ? `${doctor.first_name[0]}${doctor.last_name[0]}` : 'DR'
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">
                    Dr. {doctor?.first_name} {doctor?.last_name}
                  </h1>
                  
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100 flex items-center gap-1">
                    <Clock size={12} /> Pendiente de verificación
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Medicina general</span>
                  <span className="flex items-center gap-1"><Mail size={13} /> {doctor?.email || 'carlos.martinez@email.com'}</span>
                  <span className="flex items-center gap-1"><Phone size={13} /> +34 600 123 456</span>
                  <span className="flex items-center gap-1"><MapPin size={13} /> Madrid, España</span>
                </div>
                <div className="mt-1.5 flex gap-4 text-[11px] text-slate-400">
                  <span>Fecha de registro: 14 may 2024, 10:30</span>
                  <span>ID Registro: MED-2024-0514-0921</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/doctor/profile')}
              className="flex items-center gap-2 self-start rounded-xl border border-blue-100 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/50 cursor-pointer transition-colors"
            >
              <span>Ver perfil del médico</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="mb-6 flex border-b border-slate-200 text-xs font-bold text-slate-500 overflow-x-auto">
          <button
            onClick={() => setActiveTab('datos')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors shrink-0 ${
              activeTab === 'datos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Datos y verificación</span>
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors shrink-0 ${
              activeTab === 'documentos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>Documentos</span>
          </button>
          <button
            onClick={() => setActiveTab('notas')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors shrink-0 ${
              activeTab === 'notas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MessageSquare size={16} />
            <span>Notas internas</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors shrink-0 ${
              activeTab === 'historial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <History size={16} />
            <span>Historial de verificaciones</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* TAB 1: DATOS Y VERIFICACIÓN */}
          {activeTab === 'datos' && (
            <>
              <div className="space-y-6 lg:col-span-8">
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Campo / Documento</th>
                          <th className="px-6 py-3">Valor proporcionado</th>
                          <th className="px-6 py-3">Estado</th>
                          <th className="px-6 py-3">Método de verificación</th>
                          <th className="px-6 py-3">Verificado por</th>
                          <th className="px-6 py-3">Fecha</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* DATOS PERSONALES */}
                        <tr className="bg-slate-50/30 font-bold text-blue-600">
                          <td colSpan={7} className="px-6 py-2.5 text-[10px] uppercase tracking-wider">
                            Datos Personales
                          </td>
                        </tr>
                        {personalData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-medium text-slate-700">{row.field}</td>
                            <td className="px-6 py-3.5 text-slate-600">{row.value}</td>
                            <td className="px-6 py-3.5">{getStatusBadge(row.status)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.method}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.verifiedBy}</td>
                            <td className="px-6 py-3.5 text-slate-400">{row.date}</td>
                            <td className="px-3 py-3.5 text-slate-300 hover:text-slate-600 cursor-pointer">
                              <MoreHorizontal size={16} />
                            </td>
                          </tr>
                        ))}

                        {/* INFORMACIÓN PROFESIONAL */}
                        <tr className="bg-slate-50/30 font-bold text-blue-600">
                          <td colSpan={7} className="px-6 py-2.5 text-[10px] uppercase tracking-wider">
                            Información Profesional
                          </td>
                        </tr>
                        {profData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-medium text-slate-700">{row.field}</td>
                            <td className="px-6 py-3.5 text-slate-600">{row.value}</td>
                            <td className="px-6 py-3.5">{getStatusBadge(row.status)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.method}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.verifiedBy}</td>
                            <td className="px-6 py-3.5 text-slate-400">{row.date}</td>
                            <td className="px-3 py-3.5 text-slate-300 hover:text-slate-600 cursor-pointer">
                              <MoreHorizontal size={16} />
                            </td>
                          </tr>
                        ))}

                        {/* DOCUMENTOS */}
                        <tr className="bg-slate-50/30 font-bold text-blue-600">
                          <td colSpan={7} className="px-6 py-2.5 text-[10px] uppercase tracking-wider">
                            Documentos
                          </td>
                        </tr>
                        {docsData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-medium text-slate-700">{row.field}</td>
                            <td className="px-6 py-3.5 text-blue-600 underline cursor-pointer">{row.value}</td>
                            <td className="px-6 py-3.5">{getStatusBadge(row.status)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.method}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.verifiedBy}</td>
                            <td className="px-6 py-3.5 text-slate-400">{row.date}</td>
                            <td className="px-3 py-3.5 text-slate-300 hover:text-slate-600 cursor-pointer">
                              <MoreHorizontal size={16} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* PANEL LATERAL DERECHO DE DATOS Y VERIFICACIÓN */}
              <div className="space-y-6 lg:col-span-4">
                
                {/* DONUT CHART ESTADO DE VERIFICACIÓN */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Estado de verificación</h3>
                  
                  <div className="flex items-center gap-6 border-b border-slate-100 pb-5">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-600"
                          strokeDasharray="65, 100"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-lg font-extrabold text-slate-800">65%</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-800">Verificación en curso</p>
                      <p className="text-[11px] text-slate-400 leading-tight">Revisando la documentación proporcionada.</p>
                    </div>
                  </div>

                  {/* Leyenda de métricas */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600">Verificados</span>
                      </div>
                      <span className="font-bold text-slate-800">7</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600">Pendientes</span>
                      </div>
                      <span className="font-bold text-slate-800">5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                        <span className="text-slate-600">Rechazados</span>
                      </div>
                      <span className="font-bold text-slate-800">0</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                      <span>Campos totales</span>
                      <span className="font-bold text-slate-800">12</span>
                    </div>
                  </div>
                </div>

                {/* PRÓXIMOS PASOS */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Próximos pasos</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <span>Revisar años de experiencia</span>
                      </div>
                      <span className="font-semibold text-amber-600">Pendiente</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <span>Verificar subespecialidades</span>
                      </div>
                      <span className="font-semibold text-amber-600">Pendiente</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <span>Revisar seguro de RCP</span>
                      </div>
                      <span className="font-semibold text-amber-600">Pendiente</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span>Solicitar certificado de antecedentes</span>
                      </div>
                      <span className="font-semibold text-amber-600">Pendiente</span>
                    </div>

                    <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                      <Mail size={14} />
                      <span>Enviar solicitud de documentos</span>
                    </button>
                  </div>
                </div>

                {/* ACTIVIDAD RECIENTE */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Actividad reciente</h3>
                    <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                      Ver todo el historial <ArrowRight size={12} />
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 text-[10px] shrink-0">
                        AG
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Ana García <span className="font-normal text-slate-500">verificó Datos personales</span></p>
                        <span className="text-[10px] text-slate-400">Hoy, 11:26</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600 text-[10px] shrink-0">
                        LF
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Luis Fernández <span className="font-normal text-slate-500">verificó Información profesional</span></p>
                        <span className="text-[10px] text-slate-400">Hoy, 12:08</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="lg:col-span-12 space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Documentos aportados por el médico</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-blue-600" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Documento de identidad</h4>
                        <p className="text-[11px] text-slate-400">DNI - 12345678A.pdf</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 cursor-pointer underline">Ver archivo</span>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-purple-600" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Certificado de colegiación</h4>
                        <p className="text-[11px] text-slate-400">Colegiacion_Madrid.pdf</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600 cursor-pointer underline">Ver archivo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 & 4: NOTAS E HISTORIAL */}
          {(activeTab === 'notas' || activeTab === 'historial') && (
            <div className="lg:col-span-12 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm text-xs">
              <h3 className="text-base font-bold text-slate-900 mb-2">Notas e Historial del Médico</h3>
              <p className="text-slate-500">Médico: Dr. {doctor?.first_name} {doctor?.last_name} | Licencia: {doctor?.medical_license}</p>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                <p className="font-semibold text-slate-700">Estado actual de verificación: <span className="text-blue-600 capitalize font-bold">{doctor?.verification_status || 'pending'}</span></p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BARRA INFERIOR DE ACCIONES FIJA (EXACTA A LA IMAGEN) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 py-3 px-4 sm:px-6 backdrop-blur-md z-10 shadow-lg">
        <div className="mx-auto flex flex-col sm:flex-row gap-3 sm:gap-0 max-w-7xl items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>

          <div className="flex w-full sm:w-auto justify-center items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => handleUpdateStatus('rejected')}
              disabled={updating}
              className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 rounded-xl border border-red-200 px-2 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <XCircle size={16} />
              <span>Marcar como rechazado</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('pending')}
              disabled={updating}
              className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 rounded-xl border border-blue-200 px-2 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Mail size={16} />
              <span>Solicitar más información</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('verified')}
              disabled={updating}
              className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 px-2 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>Aprobar médico</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}