import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DoctorLocationMap from '../../components/common/DoctorLocationMap';
import { MEDICAL_SPECIALTIES } from '../../data/specialty';
import {
  Building,
  MapPin,
  Globe,
  Star,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Save,
  Image as ImageIcon,
  Cloud,
  UploadCloud,
  Search,
  Sparkles,
  Navigation,
  Info,
  Trash2,
  Edit3,
  PlusCircle,
  Users,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const BROKEN_IMG_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Cg fill='%23cbd5e1'%3E%3Crect x='160' y='100' width='80' height='60' rx='8'/%3E%3Ccircle cx='200' cy='130' r='18' fill='%23e2e8f0'/%3E%3Cpolygon points='160,160 200,115 240,160' fill='%23e2e8f0'/%3E%3C/g%3E%3Ctext x='200' y='200' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='13'%3ESin imagen%3C/text%3E%3C/svg%3E`;

const INITIAL_PROFILE_STATE = {
  business_name: '',
  google_category: '',
  google_rating: 4.8,
  google_reviews_count: 24,
  phone_number: '',
  formatted_address: '',
  latitude: 4.6097,
  longitude: -74.0817,
  website_url: '',
  booking_url: '',
  google_maps_url: '',
  google_place_id: '',
  photos: [null, null, null],
  opening_hours: {
    monday: '08:00 - 18:00',
    tuesday: '08:00 - 18:00',
    wednesday: '08:00 - 18:00',
    thursday: '08:00 - 18:00',
    friday: '08:00 - 18:00',
    saturday: '08:00 - 13:00',
    sunday: 'Cerrado',
    weekday_text: [
      'Lunes: 08:00 - 18:00',
      'Martes: 08:00 - 18:00',
      'Miércoles: 08:00 - 18:00',
      'Jueves: 08:00 - 18:00',
      'Viernes: 08:00 - 18:00',
      'Sábado: 08:00 - 13:00',
      'Domingo: Cerrado',
    ],
  },
};

export default function CargarMedicos() {
  const { user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  // Estados de proceso
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Mensajes y alertas
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Búsqueda y formulario
  const [searchUrl, setSearchUrl] = useState('');
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [profileData, setProfileData] = useState(INITIAL_PROFILE_STATE);

  // Lista de médicos externos cargados
  const [externalDoctors, setExternalDoctors] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');

  // Headers de autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Cargar lista de médicos externos al montar
  useEffect(() => {
    fetchExternalDoctors();
  }, []);

  const fetchExternalDoctors = async (query = '') => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (user?.id) params.set('user_id', user.id);
      const qParam = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiUrl}/doctors/google-profile/external${qParam}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setExternalDoctors(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error al obtener lista de médicos externos:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // 1. Extraer datos exclusivamente desde Google Places API
  const handleSearch = async (overrideUrl) => {
    const targetUrl = (overrideUrl || searchUrl || '').trim();
    if (!targetUrl) {
      setError('Por favor ingresa un enlace de Google Maps o el nombre del médico/consultorio.');
      return;
    }

    setSearching(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/doctors/google-profile/search`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ google_maps_url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo obtener la información de Google Places.');
      }

      const p = data.profile || {};
      let searchPhotos = [];
      if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
        p.photos.forEach((x) => {
          const u = typeof x === 'string' ? x : x?.image_url || x?.url;
          if (u && typeof u === 'string' && u.trim().startsWith('http')) {
            searchPhotos.push(u.trim());
          }
        });
      }

      const realPhotosCount = searchPhotos.length;

      // Mantener exactamente 3 slots en la interfaz para permitir subir fotos faltantes
      while (searchPhotos.length < 3) {
        searchPhotos.push(null);
      }

      setProfileData({
        business_name: p.business_name || '',
        google_category: p.google_category || '',
        google_rating: p.google_rating ?? 4.8,
        google_reviews_count: p.google_reviews_count ?? 30,
        phone_number: p.phone_number || '',
        formatted_address: p.formatted_address || '',
        latitude: p.latitude ? Number(p.latitude) : 4.6097,
        longitude: p.longitude ? Number(p.longitude) : -74.0817,
        website_url: p.website_url || '',
        booking_url: p.booking_url || '',
        google_maps_url: p.google_maps_url || targetUrl,
        google_place_id: p.google_place_id || '',
        photos: searchPhotos.slice(0, 3),
        opening_hours: p.opening_hours || INITIAL_PROFILE_STATE.opening_hours,
      });

      if (p.google_maps_url) setSearchUrl(p.google_maps_url);

      if (realPhotosCount > 0) {
        setSuccessMsg(
          `¡Información y ${realPhotosCount} ${
            realPhotosCount === 1 ? 'imagen real' : 'imágenes reales'
          } de Google Places extraídas exitosamente! Revisa los datos y haz clic en "Guardar Médico en BD".`
        );
      } else {
        setSuccessMsg(
          '¡Información extraída de Google Places exitosamente! (Este establecimiento no tiene fotos públicas registradas en Google Places; puedes subir fotos manualmente).'
        );
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con Google Places API.');
    } finally {
      setSearching(false);
    }
  };

  // 2. Modificaciones de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (index, newUrl) => {
    setProfileData((prev) => {
      const photos = [...(prev.photos || [])];
      photos[index] = newUrl;
      return { ...prev, photos };
    });
  };

  const handlePhotoUpload = (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      handlePhotoChange(index, event.target.result);
      setSuccessMsg(`Foto #${index + 1} cargada con éxito en vista previa.`);
    };
    reader.readAsDataURL(file);
  };

  const handleHourChange = (dayKey, val) => {
    setProfileData((prev) => {
      const currentHours = prev.opening_hours || {};
      const updated = { ...currentHours, [dayKey]: val };
      const daysLabels = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo',
      };
      const wt = Object.keys(daysLabels).map((k) => `${daysLabels[k]}: ${updated[k] || 'Cerrado'}`);
      updated.weekday_text = wt;
      return { ...prev, opening_hours: updated };
    });
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    setProfileData((prev) => ({
      ...prev,
      latitude: Number(latitude),
      longitude: Number(longitude),
    }));
  };

  // 3. Guardar en doctor_google_profiles y doctor_google_images SIN doctor_id
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileData.business_name || !profileData.business_name.trim()) {
      setError('El nombre del establecimiento o consultorio es obligatorio.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...profileData,
        google_rating:
          profileData.google_rating !== '' && profileData.google_rating !== null
            ? Number(profileData.google_rating)
            : null,
        google_reviews_count:
          profileData.google_reviews_count !== '' && profileData.google_reviews_count !== null
            ? Number(profileData.google_reviews_count)
            : null,
        latitude:
          profileData.latitude !== '' && profileData.latitude !== null
            ? Number(profileData.latitude)
            : null,
        longitude:
          profileData.longitude !== '' && profileData.longitude !== null
            ? Number(profileData.longitude)
            : null,
        google_maps_url: profileData.google_maps_url || searchUrl,
        photos: (profileData.photos || []).filter(Boolean).slice(0, 3),
      };

      const params = new URLSearchParams();
      if (editingProfileId) params.set('profile_id', editingProfileId);
      if (user?.id) params.set('user_id', user.id);
      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiUrl}/doctors/google-profile/external${queryParam}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.detail || 'No se pudo guardar el médico externo en la base de datos.');
      }

      setSuccessMsg(
        editingProfileId
          ? '¡Médico externo actualizado correctamente en la base de datos!'
          : '¡Médico externo guardado exitosamente en doctor_google_profiles y doctor_google_images (doctor_id: null)!'
      );

      // Si Cloudinary devolvió las imágenes clonadas
      if (resData.images && Array.isArray(resData.images) && resData.images.length > 0) {
        const savedPhotos = resData.images
          .map((img) => (typeof img === 'string' ? img : img?.image_url))
          .filter(Boolean);
        while (savedPhotos.length < 3) savedPhotos.push(null);
        setProfileData((prev) => ({ ...prev, photos: savedPhotos }));
      }

      // Recargar lista de médicos externos
      fetchExternalDoctors(filterQuery);

      if (!editingProfileId) {
        // Dejar listo para agregar otro
        setEditingProfileId(null);
      }
    } catch (err) {
      setError(err.message || 'Error al persistir el perfil de Google.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Limpiar formulario
  const handleResetForm = () => {
    setProfileData(INITIAL_PROFILE_STATE);
    setSearchUrl('');
    setEditingProfileId(null);
    setError(null);
    setSuccessMsg(null);
  };

  // 5. Cargar médico existente en el formulario para editar
  const handleEditDoctor = (doc) => {
    setEditingProfileId(doc.id);
    setSearchUrl(doc.google_maps_url || '');

    let loadedPhotos = [];
    if (doc.images && Array.isArray(doc.images)) {
      doc.images.forEach((img) => {
        const u = typeof img === 'string' ? img : img?.image_url;
        if (u) loadedPhotos.push(u);
      });
    }
    if (doc.photos && Array.isArray(doc.photos)) {
      doc.photos.forEach((u) => {
        if (u && !loadedPhotos.includes(u)) loadedPhotos.push(u);
      });
    }
    while (loadedPhotos.length < 3) loadedPhotos.push(null);

    setProfileData({
      business_name: doc.business_name || '',
      google_category: doc.google_category || '',
      google_rating: doc.google_rating ?? 4.8,
      google_reviews_count: doc.google_reviews_count ?? 25,
      phone_number: doc.phone_number || '',
      formatted_address: doc.formatted_address || '',
      latitude: doc.latitude ? Number(doc.latitude) : 4.6097,
      longitude: doc.longitude ? Number(doc.longitude) : -74.0817,
      website_url: doc.website_url || '',
      booking_url: doc.booking_url || '',
      google_maps_url: doc.google_maps_url || '',
      google_place_id: doc.google_place_id || '',
      photos: loadedPhotos.slice(0, 3),
      opening_hours: doc.opening_hours || INITIAL_PROFILE_STATE.opening_hours,
    });

    setError(null);
    setSuccessMsg(`Editando al médico: "${doc.business_name}". Puedes modificar los campos y guardar los cambios.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. Eliminar médico externo
  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar el perfil externo de "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const params = new URLSearchParams();
      if (user?.id) params.set('user_id', user.id);
      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiUrl}/doctors/google-profile/external/${id}${queryParam}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setSuccessMsg(`El médico "${name}" fue eliminado exitosamente.`);
        if (editingProfileId === id) handleResetForm();
        fetchExternalDoctors(filterQuery);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo eliminar el médico.');
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar el médico externo.');
    } finally {
      setDeletingId(null);
    }
  };

  const daysLabelsList = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const photosList = [...(profileData.photos || []).slice(0, 3)];
  while (photosList.length < 3) photosList.push(null);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/70 p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">

        {/* Encabezado Principal */}
        <header className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Building size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Cargar Médicos Externos (Google Maps)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <CheckCircle2 size={12} />
                  <span>doctor_id = null</span>
                </span>
                {editingProfileId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <Edit3 size={12} />
                    <span>Modo Edición</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Extrae médicos desde Google Maps y guárdalos en <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">doctor_google_profiles</code> y <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">doctor_google_images</code> sin vincularlos a ningún doctor de nuestra plataforma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center flex-wrap">
            {editingProfileId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>Cargar nuevo</span>
              </button>
            )}

            {profileData.google_maps_url && (
              <a
                href={profileData.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Ver en Maps</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving || searching}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando y clonando imágenes...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{editingProfileId ? 'Actualizar médico' : 'Guardar Médico en BD'}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Notificaciones */}
        {error && (
          <div className="flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl shadow-2xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Ocurrió un inconveniente</strong>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl shadow-2xs">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1">
              <strong className="block font-bold">Operación completada</strong>
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Caja de Búsqueda y Extracción en Google Maps */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Search size={15} className="text-indigo-600" />
                <span>Buscar y extraer datos desde Google Maps</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Pega el enlace de Google Maps o escribe el nombre del consultorio/médico para autocompletar automáticamente el nombre, especialidad, rating, dirección, teléfono, coordenadas y 3 fotos.
              </p>
            </div>
            {editingProfileId && (
              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                Editando ID: {editingProfileId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles size={13} className="text-indigo-600" />
              <span>Servicio exclusivo: Google Places API</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Extracción directa de datos e imágenes reales vinculadas al establecimiento en Google Places.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Pega un enlace de Google Maps (https://maps.app.goo.gl/...) o escribe el nombre (ej: Clínica Imbanaco Cali)"
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
              <Globe size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={searching || !searchUrl.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Consultando servicio...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Extraer información</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sección: Galería de Fotos de Google Places (para clonar a Cloudinary) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-indigo-600" />
                <span>Fotografías de Google Places (doctor_google_images)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Solo se traen las fotos reales que Google Places tiene vinculadas con este lugar. Si hay menos de 3 fotos públicas en Google, puedes completar los espacios subiendo una foto o ingresando una URL.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <UploadCloud size={12} />
                <span>Cloudinary Sync</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {photosList.map((src, idx) => {
              const hasReal = src && typeof src === 'string' && src.startsWith('http');
              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col group hover:border-indigo-400 transition-all"
                >
                  <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                    {hasReal ? (
                      <img
                        src={src}
                        alt={`Foto Google Places ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = BROKEN_IMG_PLACEHOLDER;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                        <ImageIcon size={30} strokeWidth={1.5} className="text-slate-300" />
                        <span className="text-[11px] font-semibold text-slate-500">Sin foto en Google Places</span>
                        <span className="text-[10px] text-slate-400">Pega una URL o sube una imagen</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-[#0B1E48]/85 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <span>Posición #{idx + 1}</span>
                      {idx === 0 && <span className="text-amber-300 font-extrabold">★ Principal</span>}
                    </div>

                    {hasReal && (
                      <a
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver imagen en tamaño completo"
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-white space-y-1.5 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Foto #{idx + 1}:</span>
                      {hasReal && src.includes('cloudinary.com') ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Clonada en Cloudinary
                        </span>
                      ) : hasReal ? (
                        <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                          <Cloud size={11} /> Foto real Google Places
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Slot disponible</span>
                      )}
                    </div>
                    <div className="space-y-1.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={src && !src.startsWith('data:') ? src : ''}
                          onChange={(e) => handlePhotoChange(idx, e.target.value)}
                          placeholder="URL de foto o Google Maps"
                          className="flex-1 px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50/50 min-w-0"
                        />
                        <label className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all">
                          <UploadCloud size={13} />
                          <span>Subir</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(idx, e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección: Información General y Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Columna Izquierda: Datos Principales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Building size={15} className="text-indigo-600" />
              <span>Información del Establecimiento / Médico</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del médico o consultorio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={profileData.business_name}
                  onChange={handleChange}
                  placeholder="Ej: Dr. Carlos Pérez - Cardiólogo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Especialidad / Categoría
                  </label>
                  <input
                    type="text"
                    name="google_category"
                    list="specialties-list"
                    value={profileData.google_category}
                    onChange={handleChange}
                    placeholder="Ej: Cardiólogo, Pediatra..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                  <datalist id="specialties-list">
                    {MEDICAL_SPECIALTIES.map((esp, i) => (
                      <option key={i} value={esp} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono de consulta
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="phone_number"
                      value={profileData.phone_number}
                      onChange={handleChange}
                      placeholder="+57 300 1234567"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                    />
                    <Phone size={13} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Star size={13} className="text-amber-500 fill-amber-400" />
                    <span>Calificación Google (0 - 5)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="google_rating"
                    value={profileData.google_rating ?? ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de Reseñas
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="google_reviews_count"
                    value={profileData.google_reviews_count ?? ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dirección Formateada
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="formatted_address"
                    value={profileData.formatted_address}
                    onChange={handleChange}
                    placeholder="Calle 100 # 15-20, Bogotá, Colombia"
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                  <MapPin size={13} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sitio Web Oficial
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    value={profileData.website_url}
                    onChange={handleChange}
                    placeholder="https://miconsultorio.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enlace de Agendamiento / Citas
                  </label>
                  <input
                    type="url"
                    name="booking_url"
                    value={profileData.booking_url}
                    onChange={handleChange}
                    placeholder="https://doctoralia.co/... o whatsapp"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Horarios Semanales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Clock size={15} className="text-indigo-600" />
              <span>Horarios de Atención Semanal</span>
            </h2>

            <div className="space-y-2 text-xs">
              {daysLabelsList.map((d) => (
                <div key={d.key} className="flex items-center justify-between gap-3 bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 w-24 shrink-0 flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{d.label}</span>
                  </span>
                  <input
                    type="text"
                    value={profileData.opening_hours?.[d.key] || ''}
                    onChange={(e) => handleHourChange(d.key, e.target.value)}
                    placeholder="08:00 - 18:00 o Cerrado"
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección: Ubicación Geográfica y Mapa */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Navigation size={15} className="text-indigo-600" />
                <span>Geolocalización en el Mapa (Coordenadas)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Haz clic o arrastra el marcador en el mapa para ajustar con precisión la latitud y longitud del médico externo.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold">
                Lat: {Number(profileData.latitude || 0).toFixed(5)}
              </span>
              <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold">
                Lng: {Number(profileData.longitude || 0).toFixed(5)}
              </span>
            </div>
          </div>

          <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <DoctorLocationMap
              latitude={Number(profileData.latitude) || 4.6097}
              longitude={Number(profileData.longitude) || -74.0817}
              onLocationChange={handleLocationChange}
            />
          </div>
        </div>

        {/* Botón de Guardado Flotante / Acciones del formulario */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {editingProfileId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar Edición
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving || searching}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Guardando y sincronizando con Cloudinary...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{editingProfileId ? 'Actualizar Médico Externo' : 'Guardar Médico en Base de Datos'}</span>
              </>
            )}
          </button>
        </div>

        {/* ── SECCIÓN: Médicos Externos ya Registrados en la Base de Datos ── */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Médicos Externos en Base de Datos
                </h3>
                <p className="text-xs text-slate-500">
                  Registros en <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">doctor_google_profiles</code> con <code className="text-indigo-600 font-mono">doctor_id = null</code> ({externalDoctors.length} registrados)
                </p>
              </div>
            </div>

            {/* Buscador de la lista */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => {
                    setFilterQuery(e.target.value);
                    fetchExternalDoctors(e.target.value);
                  }}
                  placeholder="Filtrar por nombre, ciudad o especialidad..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-64 text-slate-700"
                />
                <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={() => fetchExternalDoctors(filterQuery)}
                disabled={loadingList}
                title="Recargar lista"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-all"
              >
                <RefreshCw size={14} className={loadingList ? 'animate-spin text-indigo-600' : ''} />
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs">Cargando médicos externos...</span>
            </div>
          ) : externalDoctors.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Building size={20} />
              </div>
              <p className="text-xs font-bold text-slate-700">No se encontraron médicos externos</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Pega un enlace de Google Maps arriba para extraer y guardar el primer médico externo en la plataforma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {externalDoctors.map((doc) => {
                const firstImg =
                  (doc.images && doc.images[0]?.image_url) ||
                  (doc.photos && doc.photos[0]) ||
                  null;

                return (
                  <div
                    key={doc.id}
                    className={`bg-slate-50/60 rounded-xl border ${
                      editingProfileId === doc.id
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                        : 'border-slate-200/90'
                    } p-3.5 flex flex-col justify-between gap-3 hover:shadow-xs transition-all`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                          {firstImg ? (
                            <img
                              src={firstImg}
                              alt={doc.business_name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = BROKEN_IMG_PLACEHOLDER;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Building size={20} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.business_name}>
                            {doc.business_name}
                          </h4>
                          {doc.google_category && (
                            <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-full">
                              {doc.google_category}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                            <span className="flex items-center text-amber-500 font-bold">
                              <Star size={11} className="fill-amber-400 mr-0.5" />
                              {doc.google_rating ?? '4.8'}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              ({doc.google_reviews_count ?? 0} reseñas)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                        {doc.formatted_address && (
                          <p className="flex items-start gap-1.5 line-clamp-2" title={doc.formatted_address}>
                            <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                            <span>{doc.formatted_address}</span>
                          </p>
                        )}
                        {doc.phone_number && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={12} className="shrink-0 text-slate-400" />
                            <span>{doc.phone_number}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 mt-1">
                      <div className="flex items-center gap-1">
                        {doc.google_maps_url && (
                          <a
                            href={doc.google_maps_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver en Google Maps"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        {doc.website_url && (
                          <a
                            href={doc.website_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver sitio web"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                          >
                            <Globe size={13} />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditDoctor(doc)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit3 size={11} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDoctor(doc.id, doc.business_name)}
                          disabled={deletingId === doc.id}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                          title="Eliminar médico externo"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 size={13} className="animate-spin text-rose-600" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
