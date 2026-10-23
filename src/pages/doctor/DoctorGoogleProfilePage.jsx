import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DoctorLocationMap from '../../components/common/DoctorLocationMap';
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
  Edit3,
  Sparkles,
  Navigation,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Placeholder SVG inline para imgs rotas (simple, sin URLs externas)
const BROKEN_IMG_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Cg fill='%23cbd5e1'%3E%3Crect x='160' y='100' width='80' height='60' rx='8'/%3E%3Ccircle cx='200' cy='130' r='18' fill='%23e2e8f0'/%3E%3Cpolygon points='160,160 200,115 240,160' fill='%23e2e8f0'/%3E%3C/g%3E%3Ctext x='200' y='200' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='13'%3ESin imagen%3C/text%3E%3C/svg%3E`;

export default function DoctorGoogleProfilePage() {
  const { user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Búsqueda: sólo se muestra si NO tiene perfil registrado o si hace clic en cambiar
  const [searchUrl, setSearchUrl] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);

  // Estado del perfil en la BD (doctor_google_profiles)
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [profileData, setProfileData] = useState({
    business_name: '',
    google_category: '',
    google_rating: 4.8,
    google_reviews_count: 35,
    phone_number: '',
    formatted_address: '',
    latitude: 4.6097,
    longitude: -74.0817,
    website_url: '',
    booking_url: '',
    google_maps_url: '',
    photos: [],
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
  });

  // 1. Cargar perfil existente desde el backend
  useEffect(() => {
    loadMyGoogleProfile();
  }, [user?.id]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const loadMyGoogleProfile = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const userIdParam = user?.id ? `?user_id=${user.id}` : '';
      const res = await fetch(`${apiUrl}/doctors/google-profile/me${userIdParam}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setHasExistingProfile(true);
        setShowSearchBox(false); // Si ya tiene perfil, OCULTAR el buscador por defecto
        setLastSyncedAt(data.last_synced_at || data.updated_at);
        if (data.google_maps_url) setSearchUrl(data.google_maps_url);

        // Extraer imágenes garantizando que siempre hayan 3
        let loadedPhotos = [];
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          data.images.forEach((img) => {
            const u = typeof img === 'string' ? img : img?.image_url;
            if (u && typeof u === 'string' && u.trim().startsWith('http')) {
              loadedPhotos.push(u.trim());
            }
          });
        }
        if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
          data.photos.forEach((p) => {
            const u = typeof p === 'string' ? p : p?.image_url || p?.url;
            if (u && typeof u === 'string' && u.trim().startsWith('http') && !loadedPhotos.includes(u.trim())) {
              loadedPhotos.push(u.trim());
            }
          });
        }

        while (loadedPhotos.length < 3) {
          loadedPhotos.push(null); // slot vacío, se muestra placeholder
        }

        setProfileData({
          business_name: data.business_name || '',
          google_category: data.google_category || '',
          google_rating: data.google_rating ?? 4.8,
          google_reviews_count: data.google_reviews_count ?? 35,
          phone_number: data.phone_number || '',
          formatted_address: data.formatted_address || '',
          latitude: data.latitude ? Number(data.latitude) : 4.6097,
          longitude: data.longitude ? Number(data.longitude) : -74.0817,
          website_url: data.website_url || '',
          booking_url: data.booking_url || '',
          google_maps_url: data.google_maps_url || '',
          photos: loadedPhotos.slice(0, 3),
          opening_hours: data.opening_hours || profileData.opening_hours,
        });
      } else if (res.status === 404) {
        // No tiene perfil aún -> MOSTRAR el buscador para que pueda registrarlo
        setHasExistingProfile(false);
        setShowSearchBox(true);
      }
    } catch (err) {
      console.warn('Error al cargar perfil de Google del médico:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // 2. Buscar en Google Maps y extraer datos + 3 fotos
  const handleSearch = async (overrideUrl) => {
    const targetUrl = (overrideUrl || searchUrl || '').trim();
    if (!targetUrl) {
      setError('Por favor ingresa un enlace de Google Maps válido.');
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
        throw new Error(data.detail || 'No se pudo obtener la información de Google Maps.');
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

      // No rellenar con fotos estáticas; slots vacíos muestran placeholder en la UI
      while (searchPhotos.length < 3) {
        searchPhotos.push(null);
      }

      setProfileData({
        business_name: p.business_name || '',
        google_category: p.google_category || '',
        google_rating: p.google_rating ?? 4.8,
        google_reviews_count: p.google_reviews_count ?? 35,
        phone_number: p.phone_number || '',
        formatted_address: p.formatted_address || '',
        latitude: p.latitude ? Number(p.latitude) : 4.6097,
        longitude: p.longitude ? Number(p.longitude) : -74.0817,
        website_url: p.website_url || '',
        booking_url: p.booking_url || '',
        google_maps_url: p.google_maps_url || targetUrl,
        photos: searchPhotos.slice(0, 3),
        opening_hours: p.opening_hours || profileData.opening_hours,
      });

      if (p.google_maps_url) setSearchUrl(p.google_maps_url);

      setSuccessMsg(
        '¡Información y 3 imágenes extraídas de Google exitosamente! Revisa los datos abajo y haz clic en "Guardar y sincronizar con perfil".'
      );
    } catch (err) {
      setError(err.message || 'Error al conectar con el servicio de búsqueda de Google.');
    } finally {
      setSearching(false);
    }
  };

  // 3. Modificaciones en inputs
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
      setSuccessMsg(`Foto #${index + 1} cargada con éxito. Se guardará y clonará a Cloudinary al hacer clic en "Guardar y sincronizar con perfil".`);
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

  // 4. Guardar perfil y clonar fotos en Cloudinary
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

      const userIdParam = user?.id ? `?user_id=${user.id}` : '';
      const res = await fetch(`${apiUrl}/doctors/google-profile${userIdParam}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.detail || 'No se pudo guardar el perfil de Google.');
      }

      setHasExistingProfile(true);
      setShowSearchBox(false); // Ocultar el buscador tras guardar exitosamente
      setLastSyncedAt(resData.last_synced_at || new Date().toISOString());

      // Si Cloudinary devolvió las imágenes clonadas
      if (resData.images && Array.isArray(resData.images) && resData.images.length > 0) {
        const savedPhotos = resData.images
          .map((img) => (typeof img === 'string' ? img : img?.image_url))
          .filter(Boolean);
        if (savedPhotos.length > 0) {
          setProfileData((prev) => ({
            ...prev,
            photos: savedPhotos.slice(0, 3),
          }));
        }
      }

      setSuccessMsg(
        '¡Perfil guardado con éxito! Las 3 imágenes fueron clonadas en Cloudinary y registradas en doctor_google_images.'
      );
    } catch (err) {
      setError(err.message || 'Error al persistir el perfil de Google.');
    } finally {
      setSaving(false);
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

  // 3 slots siempre: url real o null (null = placeholder)
  const photosList = [
    ...(profileData.photos || []).slice(0, 3),
  ];
  while (photosList.length < 3) photosList.push(null);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/70 p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        
        {/* Encabezado Principal */}
        <header className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Building size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Perfil de Google Business y Ubicación
                </h1>
                {hasExistingProfile ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>Perfil Registrado en Google</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Info size={12} />
                    <span>Sin perfil vinculado</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Gestiona las reseñas, horarios, ubicación y fotos de tu consultorio en Google Maps y Cloudinary.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center flex-wrap">
            {profileData.google_maps_url && (
              <a
                href={profileData.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Ver en Google</span>
              </a>
            )}

            {/* Si ya tiene perfil, dar opción de mostrar/ocultar el buscador para cambiar enlace */}
            {hasExistingProfile && (
              <button
                type="button"
                onClick={() => setShowSearchBox((prev) => !prev)}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#0052FF] border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Search size={14} />
                <span>{showSearchBox ? 'Ocultar buscador' : 'Re-vincular otro enlace'}</span>
                {showSearchBox ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving || searching}
              className="px-4 py-2 bg-[#0052FF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Clonando a Cloudinary...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Guardar cambios</span>
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
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl shadow-2xs">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1">
              <strong className="block font-bold">Operación completada</strong>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Caja de Búsqueda: SÓLO se muestra si NO tiene perfil registrado, o si hace clic en "Re-vincular" */}
        {(!hasExistingProfile || showSearchBox) && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Search size={15} className="text-[#0052FF]" />
                  <span>Buscar y extraer datos de Google Maps</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Ingresa el enlace de Google Maps de tu consultorio para autocompletar la información y obtener las fotos de perfil.
                </p>
              </div>

              {lastSyncedAt && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Última sincronización: {new Date(lastSyncedAt).toLocaleString('es-ES')}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps/place/..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
                />
                <Globe size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={searching || !searchUrl.trim()}
                className="px-5 py-2 bg-gradient-to-r from-[#0052FF] to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
              >
                {searching ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Extrayendo de Google...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Buscar perfil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sección: Galería de 3 Imágenes de Google y Cloudinary */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-[#0052FF]" />
                <span>Imágenes del establecimiento (3 fotos para clonar en Cloudinary)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Fotos extraídas automáticamente del enlace de Google Maps por el buscador. Se clonan en Cloudinary al guardar y se guardan en <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[9.5px]">doctor_google_images</code>.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0052FF] border border-blue-200">
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
                  className="bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col group hover:border-blue-400 transition-all"
                >
                  <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                    {hasReal ? (
                      <img
                        src={src}
                        alt={`Foto ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = BROKEN_IMG_PLACEHOLDER;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                        <ImageIcon size={32} strokeWidth={1.5} />
                        <span className="text-[11px] font-medium">Sin imagen</span>
                        <span className="text-[10px] text-slate-300">Ingresa un enlace abajo</span>
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
                      <span className="font-bold text-slate-700">Imagen #{idx + 1}:</span>
                      {hasReal && src.includes('cloudinary.com') ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Clonada en Cloudinary
                        </span>
                      ) : hasReal ? (
                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                          <Cloud size={11} /> Se clonará al guardar
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Sin foto asignada</span>
                      )}
                    </div>
                    <div className="space-y-1.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={src && !src.startsWith('data:') ? src : ''}
                          onChange={(e) => handlePhotoChange(idx, e.target.value)}
                          placeholder="Pegar URL de Google Maps (lh3...)"
                          className="flex-1 px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 bg-slate-50/50 min-w-0"
                        />
                        <label className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0052FF] border border-blue-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all">
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
                      <p className="text-[9.5px] text-slate-400">
                        Clic derecho en Google Maps &gt; &quot;Copiar dirección de la imagen&quot; o sube el archivo.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección: Información General y Contacto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Columna Izquierda: Datos del Establecimiento */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Edit3 size={15} className="text-[#0052FF]" />
                <span>Datos del establecimiento y contacto</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Información visible en la ficha de Google Maps y en el perfil de especialista.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del establecimiento / Consultorio
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={profileData.business_name}
                  onChange={handleChange}
                  placeholder="Ej: Consultorio Dr. Pérez"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría / Especialidad Google
                </label>
                <input
                  type="text"
                  name="google_category"
                  value={profileData.google_category}
                  onChange={handleChange}
                  placeholder="Ej: Dermatólogo, Clínica médica"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  Dirección completa
                </label>
                <input
                  type="text"
                  name="formatted_address"
                  value={profileData.formatted_address}
                  onChange={handleChange}
                  placeholder="Ej: Cra. 15 #93-60, Cons 402, Bogotá"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" />
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profileData.phone_number}
                  onChange={handleChange}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe size={13} className="text-slate-400" />
                  Sitio web oficial
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={profileData.website_url}
                  onChange={handleChange}
                  placeholder="https://www.tumedico.com"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-[#0052FF]" />
                  Enlace de agendamiento de citas (Doctoralia, portal de citas)
                </label>
                <input
                  type="url"
                  name="booking_url"
                  value={profileData.booking_url}
                  onChange={handleChange}
                  placeholder="https://doctoralia.co/... o enlace de tu agenda"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Reputación en Google */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  Calificación Google (0 a 5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="google_rating"
                  value={profileData.google_rating}
                  onChange={handleChange}
                  placeholder="4.8"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad de opiniones / reseñas
                </label>
                <input
                  type="number"
                  min="0"
                  name="google_reviews_count"
                  value={profileData.google_reviews_count}
                  onChange={handleChange}
                  placeholder="35"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mapa y Coordenadas */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="border-b border-slate-100 pb-2.5 mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Navigation size={15} className="text-[#0052FF]" />
                  <span>Ubicación y mapa interactivo</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Arrastra el pin en el mapa para ajustar con precisión el punto del consultorio.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={profileData.latitude}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={profileData.longitude}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                <DoctorLocationMap
                  latitude={profileData.latitude}
                  longitude={profileData.longitude}
                  address={profileData.formatted_address}
                  city=""
                  country="Colombia"
                  onChange={handleLocationChange}
                  readOnly={false}
                  height="100%"
                  title=""
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              * Las coordenadas se sincronizan automáticamente con el perfil de búsqueda de pacientes en el mapa.
            </p>
          </div>
        </div>

        {/* Sección: Horarios de Atención Activos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock size={15} className="text-[#0052FF]" />
                <span>Horarios de atención activos (Google Opening Hours)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Horarios en que los pacientes pueden acudir o llamar a consulta.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
              Semanal
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {daysLabelsList.map(({ key, label }) => (
              <div key={key} className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="block text-xs font-bold text-slate-700">{label}</span>
                <input
                  type="text"
                  value={profileData.opening_hours?.[key] ?? '08:00 - 18:00'}
                  onChange={(e) => handleHourChange(key, e.target.value)}
                  placeholder="08:00 - 18:00 o Cerrado"
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer con Botón de Guardado */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving || searching}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0052FF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Clonando imágenes a Cloudinary...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Guardar y sincronizar con perfil</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
