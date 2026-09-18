import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Briefcase, ShieldCheck, Lock, Edit3, CheckCircle2, 
  Mail, Phone, Clock, Stethoscope, Award, Building2, Globe, 
  Plus, Trash2, UploadCloud, FileText, Camera, Loader2, Check, AlertCircle, Info,
  Eye, CheckSquare, Calendar, Settings, ExternalLink, Heart, Users, Save, MapPin, EyeOff, Circle
} from 'lucide-react';
import DoctorLocationMap from '../../components/common/DoctorLocationMap';
import DatosPersonales from './profile/datepersonal';
import InformacionProfesional from './profile/profesionaldate';
import DocumentosVerificacion from './profile/documentos';
import Disponibilidad from './profile/availability';

export default function DoctorProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); 
  const [isEditing, setIsEditing] = useState(false);

  // Estados de subida multimedia
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('gallery');

  // Formulario Información Personal & Profesional
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    country: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    website: '',
    specialty: '',
    colegiated_number: '',
    years_experience: '',
    professional_college: '',
    subspecialties: '',
    languages: 'Español (nativo)',
    bio: '',
    professional_description: ''
  });

  // Formulario de Educación
  const [eduData, setEduData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: ''
  });
  const [showEduForm, setShowEduForm] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile?user_id=${user.id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          birth_date: data.birth_date || '',
          country: data.country || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          latitude: data.latitude !== null && data.latitude !== undefined ? data.latitude : '',
          longitude: data.longitude !== null && data.longitude !== undefined ? data.longitude : '',
          website: data.website || '',
          specialty: data.specialty || '',
          colegiated_number: data.colegiated_number || data.medical_license || '',
          years_experience: data.years_experience || '',
          professional_college: data.professional_college || '',
          subspecialties: data.subspecialties || '',
          languages: data.languages || 'Español (nativo)',
          bio: data.bio || '',
          professional_description: data.professional_description || ''
        });
      }
    } catch (error) {
      console.error("Error cargando el perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  // URL Base para archivos
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const mediaList = profile?.media || [];
  
  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Obtención dinámica de foto de perfil
  const profilePics = mediaList.filter(m => m.media_type === 'profile_picture');
  const latestProfilePic = profilePics.length > 0 ? profilePics[profilePics.length - 1] : null;
  const avatarUrl = latestProfilePic ? getMediaUrl(latestProfilePic.file_url) : null;

  // Filtrado de documentos
  const identityDoc = mediaList.find(m => m.media_type === 'identity_doc');
  const colegiationCert = mediaList.find(m => m.media_type === 'colegiation_cert');

  // --- CÁLCULO DINÁMICO DE COMPLETITUD DEL PERFIL (%) ---
  const calculateCompletionPercentage = () => {
    const fieldsToTrack = [
      formData.first_name,
      formData.last_name,
      formData.email,
      formData.phone,
      formData.address,
      formData.city,
      formData.country,
      formData.specialty,
      formData.colegiated_number,
      formData.years_experience,
      formData.professional_college,
      formData.subspecialties,
      formData.languages,
      avatarUrl, 
      identityDoc, 
      colegiationCert 
    ];

    const filledFields = fieldsToTrack.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((filledFields / fieldsToTrack.length) * 100);
  };

  const profileCompletion = calculateCompletionPercentage();

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEduChange = (e) => setEduData({ ...eduData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile?user_id=${user.id}`;
      const payload = {
        ...formData,
        latitude: formData.latitude !== '' && formData.latitude !== null && formData.latitude !== undefined 
          ? parseFloat(formData.latitude) 
          : null,
        longitude: formData.longitude !== '' && formData.longitude !== null && formData.longitude !== undefined 
          ? parseFloat(formData.longitude) 
          : null,
        years_of_experience: formData.years_experience 
          ? parseInt(formData.years_experience.toString().replace(/\D/g, '')) || null 
          : null
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
        showMessage('success', 'Perfil actualizado exitosamente');
      } else {
        showMessage('error', 'Error al guardar los datos');
      }
    } catch (error) {
      showMessage('error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Gestión de Educación
  const handleAddEducation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/education?user_id=${user.id}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eduData,
          start_year: eduData.start_year ? parseInt(eduData.start_year) : null,
          end_year: eduData.end_year ? parseInt(eduData.end_year) : null
        })
      });
      if (response.ok) {
        await fetchProfile();
        setShowEduForm(false);
        setEduData({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
        showMessage('success', 'Estudio agregado correctamente');
      }
    } catch (error) {
      showMessage('error', 'Error al agregar estudio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!confirm('¿Deseas eliminar este registro académico?')) return;
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/education/${id}?user_id=${user.id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) await fetchProfile();
    } catch (error) {
      console.error("Error eliminando educación:", error);
    }
  };

  // Subida de archivos
  const uploadMedia = async (file, mediaType, isProfilePic = false) => {
    if (!file) return;
    isProfilePic ? setUploadingImage(true) : setUploadingGallery(true);

    const formDataObj = new FormData();
    formDataObj.append('media_type', mediaType);
    formDataObj.append('file', file);

    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/media?user_id=${user.id}`;
      const response = await fetch(url, {
        method: 'POST',
        body: formDataObj
      });
      if (response.ok) {
        await fetchProfile();
        showMessage('success', 'Archivo subido con éxito');
      }
    } catch (error) {
      showMessage('error', 'Error al subir el archivo');
    } finally {
      isProfilePic ? setUploadingImage(false) : setUploadingGallery(false);
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este archivo?')) return;
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/media/${id}?user_id=${user.id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) await fetchProfile();
    } catch (error) {
      console.error("Error eliminando archivo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 p-3 md:p-5 lg:p-6 font-sans text-slate-800 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4 pb-20">

        {/* TÍTULO PRINCIPAL Y BOTÓN */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Mi perfil</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestiona tu información personal y profesional. Mantén tus datos actualizados para tus pacientes.
            </p>
          </div>
          <button 
            onClick={() => window.open('/doctor/preview', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors">
            <Eye size={15} /> Vista previa del perfil
          </button>
        </div>

        {/* NOTIFICACIÓN */}
        {message && (
          <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* PESTAÑAS */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 border-b border-slate-200 pb-1">
          {[
            { id: 'personal', label: 'Datos personales', icon: User },
            { id: 'professional', label: 'Información profesional', icon: FileText },
            { id: 'documents', label: 'Documentos', icon: CheckSquare },
            { id: 'availability', label: 'Disponibilidad', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id || (activeTab === 'documents' && tab.id === 'documents');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-2 font-bold text-xs border-b-2 transition-colors whitespace-nowrap ${
                  active 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CONTENIDO PRINCIPAL + PANEL DERECHO ALINEADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-4">

            {activeTab === 'personal' && (
              <DatosPersonales
                profile={profile}
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                saving={saving}
                uploadingImage={uploadingImage}
                avatarUrl={avatarUrl}
                uploadMedia={uploadMedia}
              />
            )}

            {activeTab === 'professional' && (
              <InformacionProfesional
                profile={profile}
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                saving={saving}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                eduData={eduData}
                handleEduChange={handleEduChange}
                handleAddEducation={handleAddEducation}
                handleDeleteEducation={handleDeleteEducation}
                showEduForm={showEduForm}
                setShowEduForm={setShowEduForm}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentosVerificacion
                mediaList={mediaList}
                identityDoc={identityDoc}
                colegiationCert={colegiationCert}
                selectedMediaType={selectedMediaType}
                setSelectedMediaType={setSelectedMediaType}
                uploadMedia={uploadMedia}
                handleDeleteMedia={handleDeleteMedia}
                uploadingGallery={uploadingGallery}
                getMediaUrl={getMediaUrl}
              />
            )}

            {activeTab === 'availability' && (
              <Disponibilidad />
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900">Seguridad de la cuenta</h3>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Contraseña actual</label>
                    <input type="password" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Nueva contraseña</label>
                    <input type="password" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" placeholder="••••••••" />
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md">
                    Actualizar contraseña
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* COLUMNA DERECHA: RESUMEN LATERAL (Estilo exacto solicitado) */}
          <div className="lg:col-span-1 space-y-3.5">
            
            {/* COMPLETA TU PERFIL */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Completa tu perfil</h3>
              
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-2 border-blue-100 shrink-0">
                  <svg className="absolute inset-0 w-full h-full text-blue-600 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-blue-100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="text-blue-600"
                      strokeDasharray={`${profileCompletion}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="4"
                    />
                  </svg>
                  <span className="text-[11px] font-extrabold text-blue-900">{profileCompletion}%</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Perfil casi completo</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Añade más información para que los pacientes te conozcan mejor.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700">Datos personales</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700">Información profesional</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700">Especialidades</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle size={14} className="text-slate-300 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-600">Foto de perfil profesional</span>
                  </div>
                  <button onClick={() => setActiveTab('personal')} className="text-[11px] font-bold text-blue-600 hover:underline">Añadir</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle size={14} className="text-slate-300 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-600">Biografía profesional</span>
                  </div>
                  <button onClick={() => setActiveTab('professional')} className="text-[11px] font-bold text-blue-600 hover:underline">Añadir</button>
                </div>
              </div>
            </div>

            {/* TU PERFIL PÚBLICO */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Eye size={18} /></div>
                 <div>
                   <h4 className="text-xs font-bold text-blue-950">Tu perfil público</h4>
                   <p className="text-[10px] text-slate-500">Así te verán los pacientes en MIVOR.ai</p>
                 </div>
              </div>
              {/* Botón en el panel derecho */}
              <button 
                onClick={() => window.open('/doctor/preview', '_blank')}
                className="w-full py-2 border border-blue-200 rounded-xl text-blue-700 bg-blue-50/50 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors">
                Ver mi perfil <ExternalLink size={13} />
              </button>
            </div>

            {/* COMUNIDAD MIVOR */}
            <div className="bg-gradient-to-b from-blue-50/80 to-blue-50/30 rounded-2xl p-4 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100/60 text-blue-600 rounded-xl shrink-0">
                  <Users size={18} />
                </div>
                <h4 className="text-xs font-bold text-blue-950 leading-tight">
                  Una comunidad de médicos que marca la diferencia
                </h4>
              </div>
              
              <p className="text-[10px] text-slate-600 leading-relaxed">
                Gracias por formar parte de MIVOR.ai. Tu experiencia contribuye a una salud más humana y eficiente.
              </p>

              <div className="pt-2 border-t border-blue-100/60 flex items-center gap-2.5">
                <Heart size={14} className="text-rose-500 fill-rose-500 shrink-0" />
                <span className="text-[11px] italic font-serif text-blue-900 font-medium">
                  Juntos por una medicina más humana y eficiente.
                </span>
              </div>
            </div>
            
          </div>

        </div>

      </div>
    </div>
  );
}