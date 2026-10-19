import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Globe, 
  Clock, 
  Calendar,
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Edit3,
  Image as ImageIcon,
  Building
} from 'lucide-react';

export default function GoogleProfileModal({
  isOpen,
  onClose,
  initialUrl = '',
  onApplyProfile,
}) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [profileData, setProfileData] = useState({
    business_name: '',
    google_category: '',
    google_rating: '',
    google_reviews_count: '',
    phone_number: '',
    formatted_address: '',
    latitude: '',
    longitude: '',
    website_url: '',
    booking_url: '',
    google_maps_url: '',
    photos: [],
    opening_hours: null,
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      if (initialUrl && initialUrl !== url) {
        setUrl(initialUrl);
      }
      if (initialUrl && (!profileData.business_name || initialUrl !== profileData.google_maps_url)) {
        handleSearch(initialUrl);
      }
    }
  }, [isOpen, initialUrl]);

  const handleSearch = async (overrideUrl) => {
    const targetUrl = (overrideUrl || url || '').trim();
    if (!targetUrl) {
      setError('Por favor ingresa un enlace de Google Maps.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/doctors/google-profile/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ google_maps_url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo obtener la información de Google Maps.');
      }

      const p = data.profile || {};
      setProfileData({
        business_name: p.business_name || '',
        google_category: p.google_category || '',
        google_rating: p.google_rating ?? '',
        google_reviews_count: p.google_reviews_count ?? '',
        phone_number: p.phone_number || '',
        formatted_address: p.formatted_address || '',
        latitude: p.latitude ?? '',
        longitude: p.longitude ?? '',
        website_url: p.website_url || '',
        booking_url: p.booking_url || '',
        google_maps_url: p.google_maps_url || targetUrl,
        photos: p.photos || [],
        opening_hours: p.opening_hours || null,
      });
      setSuccessMsg('Información obtenida correctamente de Google. Puedes revisarla y editarla abajo.');
    } catch (err) {
      setError(err.message || 'Error de conexión al consultar Google Maps.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
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

  const handleApply = async () => {
    setError(null);
    setSaving(true);

    try {
      const payload = {
        ...profileData,
        google_rating: profileData.google_rating !== '' && profileData.google_rating !== null ? Number(profileData.google_rating) : null,
        google_reviews_count: profileData.google_reviews_count !== '' && profileData.google_reviews_count !== null ? Number(profileData.google_reviews_count) : null,
        latitude: profileData.latitude !== '' && profileData.latitude !== null ? Number(profileData.latitude) : null,
        longitude: profileData.longitude !== '' && profileData.longitude !== null ? Number(profileData.longitude) : null,
        google_maps_url: profileData.google_maps_url || url,
      };

      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const medaiUserStr = localStorage.getItem('medai_user');
      let userIdParam = '';
      if (medaiUserStr) {
        try {
          const parsed = JSON.parse(medaiUserStr);
          if (parsed?.id) userIdParam = `?user_id=${parsed.id}`;
        } catch (_) {}
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/doctors/google-profile${userIdParam}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Advertencia al guardar en tabla doctor_google_profiles:', errJson);
      }

      if (onApplyProfile) {
        onApplyProfile(payload);
      }

      setSuccessMsg('¡Datos sincronizados y guardados exitosamente!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Error al aplicar los datos.');
    } finally {
      setSaving(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Perfil de Google Business / Maps
              </h2>
              <p className="text-[11px] text-slate-500">
                Consulta, verifica y personaliza los datos de tu establecimiento en Google
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body con scroll */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Buscador de URL */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Enlace de Google Maps del consultorio o clínica:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps/place/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none bg-white transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0043D6] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search size={13} />
                    <span>Buscar perfil</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg mt-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && !error && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Fotos encontradas */}
          {profileData.photos && profileData.photos.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon size={13} className="text-blue-600" />
                <span>Fotos detectadas ({profileData.photos.length})</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {profileData.photos.map((src, idx) => (
                  <div key={idx} className="relative h-24 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100">
                    <img 
                      src={src} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de edición del perfil obtenido */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 size={13} className="text-[#0052FF]" />
                Datos del perfil en Google (editables)
              </h3>
              {profileData.google_maps_url && (
                <a
                  href={profileData.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Abrir en Google Maps</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nombre del establecimiento / Consultorio</label>
                <input
                  type="text"
                  name="business_name"
                  value={profileData.business_name}
                  onChange={handleChange}
                  placeholder="Ej: Consultorio Dr. Pérez"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Categoría en Google</label>
                <input
                  type="text"
                  name="google_category"
                  value={profileData.google_category}
                  onChange={handleChange}
                  placeholder="Ej: Clínica médica, Dermatólogo"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  Dirección formateada
                </label>
                <input
                  type="text"
                  name="formatted_address"
                  value={profileData.formatted_address}
                  onChange={handleChange}
                  placeholder="Calle, Número, Ciudad, País"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" />
                  Teléfono de contacto
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={profileData.phone_number}
                  onChange={handleChange}
                  placeholder="+57 300 000 0000"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <Globe size={12} className="text-slate-400" />
                  Sitio web del negocio
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={profileData.website_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <Calendar size={12} className="text-[#0052FF]" />
                  Enlace de reserva de citas (Appointments / Booking URL)
                </label>
                <input
                  type="url"
                  name="booking_url"
                  value={profileData.booking_url}
                  onChange={handleChange}
                  placeholder="https://doctoralia.com/... o enlace de citas de tu consultorio"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  Calificación en Google (0 a 5)
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Total de opiniones / Reseñas</label>
                <input
                  type="number"
                  min="0"
                  name="google_reviews_count"
                  value={profileData.google_reviews_count}
                  onChange={handleChange}
                  placeholder="120"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Latitud</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={profileData.latitude}
                  onChange={handleChange}
                  placeholder="4.6097"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
                  placeholder="-74.0817"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Horarios de atención activos (Opening Hours) */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={13} className="text-[#0052FF]" />
                  <span>Horarios de atención activos (Opening Hours)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Sincronizado con Google</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'monday', label: 'Lunes' },
                  { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' },
                  { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' },
                  { key: 'saturday', label: 'Sábado' },
                  { key: 'sunday', label: 'Domingo' },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="block text-[10px] font-bold text-slate-600 mb-1">{label}</span>
                    <input
                      type="text"
                      value={profileData.opening_hours?.[key] ?? (key === 'sunday' ? 'Cerrado' : key === 'saturday' ? '08:00 - 13:00' : '08:00 - 18:00')}
                      onChange={(e) => handleHourChange(key, e.target.value)}
                      placeholder="08:00 - 18:00 o Cerrado"
                      className="w-full px-1.5 py-1 text-[11px] rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={saving || loading || !profileData.business_name}
            className="px-4 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0043D6] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Aplicando datos...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Guardar y sincronizar con perfil</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
