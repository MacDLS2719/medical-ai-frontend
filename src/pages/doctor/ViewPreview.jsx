import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, MapPin, Star, Clock, Calendar as CalendarIcon, 
  Award, HeartPulse, Video, FileText, ChevronLeft, Heart, Share2, 
  Building2, Globe, Stethoscope, ChevronRight, User, Image as ImageIcon
} from 'lucide-react';

// Importar los componentes hijos de las pestañas centrales
import DoctorInfoTab from './viewPreview/DoctorInfoTab';
import DoctorLocationTab from './viewPreview/DoctorLocationTab';
import DoctorReviewsTab from './viewPreview/DoctorReviewsTab';
import DoctorAvailabilityTab from './viewPreview/DoctorAvailabilityTab';

export default function ViewPreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informacion');
  const [consultType, setConsultType] = useState('presencial');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile?user_id=${user.id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
      
      const availUrl = import.meta.env.VITE_API_URL + `/doctor-availability/${user.id}`;
      const availResponse = await fetch(availUrl);
      if (availResponse.ok) {
        const availData = await availResponse.json();
        setAvailabilities(availData);
      }

      const reviewsUrl = import.meta.env.VITE_API_URL + `/reviews/${user.id}`;
      const reviewsResponse = await fetch(reviewsUrl);
      if (reviewsResponse.ok) {
        const rData = await reviewsResponse.json();
        setReviewsData(rData);
      }
    } catch (error) {
      console.error("Error cargando la vista previa:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const avatarUrl = profile?.media?.find(m => m.media_type === 'profile_picture')?.file_url;
  const mediaFiles = profile?.media || [];
  
  const firstName = profile?.first_name || user?.first_name || '';
  const lastName = profile?.last_name || user?.last_name || '';
  let fullName = 'Médico';
  if (firstName || lastName) {
    fullName = `Dr. ${firstName} ${lastName}`.trim();
  } else if (user?.name) {
    fullName = user.name;
  }
  
  const verificationStatus = profile?.verification_status || 'pending';
  const isVerified = verificationStatus === 'approved' || verificationStatus === 'verified';
  
  const specialty = profile?.specialty || 'Especialidad no configurada';
  const city = profile?.city || '';
  const country = profile?.country || '';
  const address = profile?.address || '';
  const bio = profile?.bio || profile?.professional_description || 'Este profesional aún no ha proporcionado una descripción sobre su trayectoria.';
  
  // Use address if available, otherwise city/country
  const locationText = address || [city, country].filter(Boolean).join(', ') || '';
  
  const collegiatedNumber = profile?.professional_registration_number || profile?.medical_license || '';
  const professionalCollege = profile?.professional_college || '';

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 pb-20">
      
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y MIGA DE PAN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => window.close()} className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all">
            <ChevronLeft size={15} /> Volver a la búsqueda
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Resultados</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">{fullName}</span>
        </div>

        <div className="bg-blue-600/10 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
          MODO VISTA PREVIA
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: FILTROS DE BÚSQUEDA */}
          <div className="lg:col-span-1 space-y-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={14} className="text-blue-600" /> Especialidad
              </label>
              <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                <option>{specialty}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-600" /> Ubicación
              </label>
              <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                <option>{locationText || "Selecciona una ciudad"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Video size={14} className="text-blue-600" /> Consulta
              </label>
              <div className="space-y-1.5 text-xs font-medium text-slate-700 pl-1">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="rounded text-blue-600" /> Presencial</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="rounded text-blue-600" /> Videoconsulta</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="rounded text-blue-600" /> Ambas</label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" /> Disponibilidad
              </label>
              <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                <option>Selecciona una fecha</option>
              </select>
            </div>

            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-xs">
              Buscar médicos →
            </button>

            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center text-red-500 shrink-0 border border-pink-100">
                <Heart size={16} className="fill-pink-100 text-red-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Tu salud en buenas manos</p>
                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Profesionales verificados, información fiable y atención personalizada.</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="font-serif italic text-sm text-slate-700 tracking-wide font-medium">
                Juntos por una medicina<br />más humana y eficiente.
              </p>
              <div className="w-24 h-1 bg-emerald-500/60 mx-auto mt-1 rounded-full"></div>
            </div>
          </div>

          {/* COLUMNA CENTRAL: PERFIL Y PESTAÑAS */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* TARJETA SUPERIOR DEL DOCTOR (COMPACTA Y OPTIMIZADA) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 relative">
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-50 transition-colors">
                  <Heart size={13} className="text-slate-400" /> Guardar
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-50 transition-colors">
                  <Share2 size={13} className="text-slate-400" /> Compartir
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left pr-0 sm:pr-32">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-2xl font-bold text-slate-400">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{fullName}</h1>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200/60">
                        <CheckCircle2 size={11} /> Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200/60">
                        <Clock size={11} /> Pendiente de verificación
                      </span>
                    )}
                  </div>


                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{specialty}</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-3 text-[11px] text-slate-500 pt-0.5">
                    {locationText && (
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{locationText}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Stethoscope size={13} className="text-slate-400" />
                      <span>Presencial y online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PESTAÑAS DE NAVEGACIÓN INTERNA */}
              <div className="flex items-center gap-5 border-t border-slate-100 mt-5 pt-3 overflow-x-auto">
                {[
                  { id: 'informacion', label: 'Información', icon: FileText },
                  { id: 'ubicacion', label: 'Ubicación y contacto', icon: MapPin },
                  { id: 'opiniones', label: 'Opiniones', icon: Star },
                  { id: 'disponibilidad', label: 'Disponibilidad', icon: Clock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold pb-1 border-b-2 transition-colors whitespace-nowrap ${
                        isActive 
                          ? 'border-blue-600 text-blue-700' 
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTENIDO DINÁMICO DE LAS PESTAÑAS */}
            {activeTab === 'informacion' && (
              <DoctorInfoTab 
                profile={profile}
                bio={bio}
                specialty={specialty}
                professionalCollege={professionalCollege}
                collegiatedNumber={collegiatedNumber}
                locationText={locationText}
                mediaFiles={mediaFiles}
              />
            )}

            {activeTab === 'ubicacion' && (
              <DoctorLocationTab profile={profile} locationText={locationText} />
            )}

            {activeTab === 'opiniones' && (
              <DoctorReviewsTab reviewsData={reviewsData} />
            )}

            {activeTab === 'disponibilidad' && (
              <DoctorAvailabilityTab availabilities={availabilities} />
            )}

          </div>

          {/* COLUMNA DERECHA: PANEL DE RESERVA Y ACCIONES */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200/85 sticky top-6 space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Solicita una consulta</h3>

              {availabilities && availabilities.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setConsultType('presencial')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        consultType === 'presencial' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Presencial
                    </button>
                    <button 
                      onClick={() => setConsultType('videoconsulta')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        consultType === 'videoconsulta' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Videoconsulta
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <CalendarIcon size={12} /> Selecciona una fecha
                    </label>
                    <div className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Lun, 22 sep 2026</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} /> Selecciona una hora
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'].map((time, idx) => (
                        <button 
                          key={idx} 
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            idx === 1 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-xs">
                    Continuar →
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <span>🔒 Tu información está protegida y es confidencial</span>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <CalendarIcon size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Agenda cerrada por el momento</p>
                  <p className="text-[10px] text-slate-500">Este profesional no tiene horarios disponibles configurados actualmente.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Disponibilidad actual</h4>
                  <p className="text-[10px] text-slate-500">Primeras citas disponibles esta semana.</p>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Ver →</button>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Perfil verificado</h4>
                  <p className="text-[10px] text-slate-500">Este profesional ha verificado su titulación.</p>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Saber más →</button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}