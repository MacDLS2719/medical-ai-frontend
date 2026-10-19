import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  ArrowLeft, Search, Star, Loader2, CalendarPlus, 
  MapPin, Phone, Globe, ExternalLink, ShieldCheck, Navigation,
  Building, X, ChevronDown, Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { MEDICAL_SPECIALTIES } from '../../data/specialty';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ----------------------------------------------------------------
// Multi-select de especialidades con tags visibles
// ----------------------------------------------------------------
const MultiSpecialtySelect = ({ selected, onChange, placeholder = 'Buscar especialidad...' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? MEDICAL_SPECIALTIES.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()))
    : MEDICAL_SPECIALTIES;

  const toggle = (spec) => {
    onChange(
      selected.includes(spec) ? selected.filter((s) => s !== spec) : [...selected, spec]
    );
    // Mantiene el dropdown abierto para elegir más
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const remove = (spec, e) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== spec));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Tags de seleccionadas */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selected.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0052FF] text-white text-[11px] font-bold shadow-sm"
            >
              {spec}
              <button
                type="button"
                onClick={(e) => remove(spec, e)}
                className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                aria-label={`Quitar ${spec}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold underline transition-colors self-center ml-1"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Trigger + búsqueda */}
      <div
        className={`flex items-center gap-2 w-full border rounded-xl px-3 py-2 cursor-text bg-white transition-all ${
          open
            ? 'border-[#0052FF] ring-2 ring-blue-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => setOpen(true)}
      >
        <Search size={13} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder={selected.length === 0 ? placeholder : 'Agregar especialidad...'}
          className="flex-1 text-xs outline-none bg-transparent placeholder-slate-400"
          onFocus={() => setOpen(true)}
        />
        <ChevronDown
          size={13}
          className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Sin resultados</p>
            ) : (
              filtered.map((spec) => {
                const isChosen = selected.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggle(spec)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-3.5 py-2 text-xs transition-colors ${
                      isChosen
                        ? 'bg-blue-50 text-[#0052FF] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{spec}</span>
                    {isChosen && <Check size={13} className="text-[#0052FF] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500 font-semibold">
              {selected.length} especialidad{selected.length !== 1 ? 'es' : ''} seleccionada{selected.length !== 1 ? 's' : ''} · Cierra al buscar
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Badges de días disponibles (0 = Lunes … 6 = Domingo)
// ----------------------------------------------------------------
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const jsToBackendDay = (jsDay) => (jsDay + 6) % 7;

const WeekDayBadges = ({ availabilities = [] }) => {
  const recurringDays = new Set(
    availabilities
      .filter((a) => a.day_of_week != null)
      .map((a) => Number(a.day_of_week))
  );

  const dateDays = new Set();
  availabilities
    .filter((a) => a.day_of_week == null && a.start_date)
    .forEach((a) => {
      const start = parseLocalDate(a.start_date);
      const end = a.end_date ? parseLocalDate(a.end_date) : start;
      if (!start || !end) return;
      const cur = new Date(start);
      while (cur <= end) {
        dateDays.add(jsToBackendDay(cur.getDay()));
        cur.setDate(cur.getDate() + 1);
        if (dateDays.size === 7) break;
      }
    });

  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {DAY_LABELS.map((label, idx) => {
        const isRecurring = recurringDays.has(idx);
        const isDate = !isRecurring && dateDays.has(idx);
        return (
          <span
            key={idx}
            title={`${DAY_NAMES[idx]}${isRecurring ? ' (recurrente)' : isDate ? ' (fecha específica)' : ''}`}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
              isRecurring
                ? 'bg-[#0052FF] text-white ring-1 ring-blue-500/30'
                : isDate
                ? 'bg-emerald-500 text-white ring-1 ring-emerald-400/30'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------
// Pines personalizados de Leaflet
// ----------------------------------------------------------------
const createInternalDoctorIcon = () => {
  const html = `
    <div style="position:relative;width:38px;height:46px;filter:drop-shadow(0 4px 8px rgba(0,82,255,0.4));cursor:pointer;">
      <div style="width:36px;height:36px;border-radius:50%;background:#0052FF;border:3px solid #ffffff;display:flex;align-items:center;justify-content:center;color:white;font-size:17px;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
        🩺
      </div>
      <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #0052FF;margin:-2px auto 0;"></div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [38, 46], iconAnchor: [19, 46], popupAnchor: [0, -42] });
};

const createExternalDoctorIcon = () => {
  const html = `
    <div style="position:relative;width:32px;height:40px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25));cursor:pointer;">
      <div style="width:30px;height:30px;border-radius:50%;background:#475569;border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.15);">
        🏥
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #475569;margin:-2px auto 0;"></div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
};

// Componente para recentrar el mapa suavemente
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// ----------------------------------------------------------------
// Componente Principal
// ----------------------------------------------------------------
const EspecialistasVideoSearch = ({ onBack, onSelectDoctor, initialFilters, apiUrl }) => {
  // Filtros de búsqueda
  const [specialties, setSpecialties] = useState(
    initialFilters?.specialty ? [initialFilters.specialty] : []
  );
  const [city, setCity] = useState(initialFilters?.city || 'Cali');
  const [country, setCountry] = useState(initialFilters?.country || 'Colombia');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'internal' | 'external'
  const [searchName, setSearchName] = useState('');

  // Coordenadas del centro del mapa (Cali por defecto)
  const [mapCenter, setMapCenter] = useState([3.4516, -76.5320]);
  const [mapZoom, setMapZoom] = useState(13);

  // Estados de carga y resultados
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Buscando especialistas cercanos...');
  const [error, setError] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const mapRef = useRef(null);

  // Ejecutar búsqueda en el endpoint /doctor-search
  const handleSearch = async (overrideParams = {}) => {
    setIsLoading(true);
    setError('');
    setLoadingMsg('Buscando especialistas cercanos...');

    // Mostrar mensaje de búsqueda Google después de 3s si aún cargando
    const googleMsgTimer = setTimeout(() => {
      setLoadingMsg('Consultando Google y fuentes externas con IA... 🔍');
    }, 3000);

    const targetSpecialties = overrideParams.specialties !== undefined ? overrideParams.specialties : specialties;
    const targetCity = overrideParams.city !== undefined ? overrideParams.city : city;
    const targetCountry = overrideParams.country !== undefined ? overrideParams.country : country;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const targetApi = (apiUrl || API_BASE).replace(/\/+$/, '');
      const res = await fetch(`${targetApi}/doctor-search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          specialty: targetSpecialties.length === 1 ? targetSpecialties[0] : (targetSpecialties.length > 1 ? targetSpecialties[0] : null),
          specialties: targetSpecialties.length > 0 ? targetSpecialties : null,
          city: targetCity || null,
          country: targetCountry || null,
          latitude: overrideParams.latitude || null,
          longitude: overrideParams.longitude || null,
          radius_km: 15,
          limit: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al buscar médicos.');
      }

      const results = data.results || [];
      setDoctors(results);
      clearTimeout(googleMsgTimer);

      // Actualizar centro del mapa si el servidor devolvió coordenadas de la ciudad
      if (data.center_latitude && data.center_longitude) {
        setMapCenter([data.center_latitude, data.center_longitude]);
        setMapZoom(13);
      } else if (results.length > 0 && results[0].latitude && results[0].longitude) {
        setMapCenter([results[0].latitude, results[0].longitude]);
      }
    } catch (err) {
      clearTimeout(googleMsgTimer);
      setError(err.message || 'No fue posible conectar con el servicio de búsqueda.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('Buscando especialistas cercanos...');
    }
  };

  // Cargar búsqueda inicial en el montaje
  useEffect(() => {
    handleSearch();
  }, []);

  // Geolocalización del navegador
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está soportada por tu navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setMapZoom(14);
        handleSearch({ latitude: lat, longitude: lng });
      },
      () => {
        setError('No se pudo acceder a tu ubicación actual.');
      }
    );
  };

  // Filtrar médicos según el tipo y nombre
  const filteredDoctors = doctors.filter((d) => {
    if (filterType === 'internal' && !d.is_our_doctor) return false;
    if (filterType === 'external' && d.is_our_doctor) return false;
    if (searchName.trim()) {
      const q = searchName.toLowerCase().trim();
      const matchName = (d.business_name || '').toLowerCase().includes(q) ||
                        (d.first_name || '').toLowerCase().includes(q) ||
                        (d.last_name || '').toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  const internalCount = doctors.filter((d) => d.is_our_doctor).length;
  const externalCount = doctors.filter((d) => !d.is_our_doctor).length;

  // Manejar acción de agendar en médico propio
  const handleBookAppointment = (doc) => {
    if (onSelectDoctor) {
      const doctorPayload = {
        id: doc.user_id || doc.doctor_id,
        doctor_id: doc.doctor_id,
        user_id: doc.user_id,
        first_name: doc.first_name || '',
        last_name: doc.last_name || '',
        full_name: doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.trim(),
        specialty: doc.specialty || doc.google_category || 'Medicina General',
        address: doc.formatted_address,
        rating: doc.google_rating,
        availabilities: doc.availabilities || [],
      };
      onSelectDoctor(doctorPayload, 'presencial');
    }
  };

  const handleFocusDoctor = (doc) => {
    setSelectedDoctorId(doc.source_place_id || doc.doctor_id || doc.business_name);
    if (doc.latitude && doc.longitude) {
      setMapCenter([doc.latitude, doc.longitude]);
      setMapZoom(15);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 px-3 sm:px-6 pt-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Barra superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
                <MapPin className="text-[#0052FF]" size={19} />
                <span>Especialistas y Consultorios Cercanos</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Visualiza médicos de la plataforma y consultorios en el mapa interactivo
              </p>
            </div>
          </div>

          <button
            onClick={handleUseMyLocation}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Navigation size={13} />
            <span>Usar mi ubicación</span>
          </button>
        </div>

        {/* Barra de Filtros Principales */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            
            {/* Especialidades (multi-select) */}
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Especialidad médica
                {specialties.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#0052FF] text-white text-[10px] font-extrabold rounded-full">
                    {specialties.length}
                  </span>
                )}
              </label>
              <MultiSpecialtySelect
                selected={specialties}
                onChange={setSpecialties}
                placeholder="Buscar y elegir especialidades..."
              />
            </div>

            {/* Ciudad */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Cali, Bogotá, Madrid..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none"
              />
            </div>

            {/* País */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                País
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej: Colombia, España..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none"
              />
            </div>

            {/* Botón Buscar */}
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-xl bg-[#0052FF] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Subfiltro por tipo y texto */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({doctors.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('internal')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                  filterType === 'internal'
                    ? 'bg-[#0052FF] text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <ShieldCheck size={12} />
                <span>De la plataforma ({internalCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('external')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                  filterType === 'external'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building size={12} />
                <span>Externos ({externalCount})</span>
              </button>
            </div>

            {/* Buscar por nombre */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Filtrar por nombre..."
                className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#0052FF] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mensaje de error si ocurre */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Contenido Principal: Mapa + Listado de Médicos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Listado de Médicos (Lado Izquierdo) */}
          <div className="lg:col-span-5 space-y-3 order-2 lg:order-1 max-h-[700px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>{filteredDoctors.length} resultado{filteredDoctors.length !== 1 ? 's' : ''}</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Prioridad: Médicos Vitalia
              </span>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <Loader2 size={28} className="text-[#0052FF] animate-spin" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{loadingMsg}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si no hay resultados locales, buscamos en Google y guardamos automáticamente
                  </p>
                </div>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-2">
                <Building className="mx-auto text-slate-400" size={28} />
                <p className="text-xs font-bold text-slate-700">No se encontraron médicos en esta zona</p>
                <p className="text-[11px] text-slate-500">Prueba cambiando la especialidad o ampliando la ciudad de búsqueda.</p>
              </div>
            ) : (
              filteredDoctors.map((doc, idx) => {
                const isSelected = selectedDoctorId === (doc.source_place_id || doc.doctor_id || doc.business_name);
                return (
                  <div
                    key={doc.source_place_id || doc.doctor_id || idx}
                    onClick={() => handleFocusDoctor(doc)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer relative shadow-2xs hover:shadow-md ${
                      isSelected
                        ? 'border-[#0052FF] ring-2 ring-blue-500/20'
                        : doc.is_our_doctor
                        ? 'border-blue-100 hover:border-blue-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow-xs ${
                          doc.is_our_doctor
                            ? 'bg-[#0052FF] text-white ring-2 ring-blue-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {doc.is_our_doctor ? '🩺' : '🏥'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`}
                          </h3>
                          <p className="text-[11px] font-semibold text-[#0052FF] truncate">
                            {doc.specialty || doc.google_category || 'Especialista'}
                          </p>
                        </div>
                      </div>

                      {/* Tag de médico propio vs externo */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        doc.is_our_doctor
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {doc.is_our_doctor ? 'Médico Plataforma' : 'Externo'}
                      </span>
                    </div>

                    {/* Dirección y teléfono */}
                    <div className="space-y-1 text-[11px] text-slate-600 mb-2.5">
                      {doc.formatted_address && (
                        <p className="flex items-start gap-1.5 truncate">
                          <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{doc.formatted_address}</span>
                        </p>
                      )}
                      {doc.phone_number && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>{doc.phone_number}</span>
                        </p>
                      )}
                    </div>

                    {/* Rating y Reseñas */}
                    <div className="flex items-center gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{doc.google_rating ? Number(doc.google_rating).toFixed(1) : '4.8'}</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        ({doc.google_reviews_count || 30} opiniones)
                      </span>
                    </div>

                    {/* Días disponibles (si es médico de la plataforma) */}
                    {doc.is_our_doctor && doc.availabilities && doc.availabilities.length > 0 && (
                      <div className="mb-3 pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Días con citas disponibles:
                        </span>
                        <WeekDayBadges availabilities={doc.availabilities} />
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {doc.is_our_doctor ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookAppointment(doc);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <CalendarPlus size={14} />
                          <span>Agendar Cita Médica</span>
                        </button>
                      ) : (
                        <div className="w-full flex items-center gap-2">
                          {doc.booking_url ? (
                            <a
                              href={doc.booking_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 py-1.5 px-2.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-[11px] font-bold text-center flex items-center justify-center gap-1"
                            >
                              <span>Cita externa</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : null}

                          {doc.website_url && !doc.booking_url ? (
                            <a
                              href={doc.website_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-bold text-center flex items-center justify-center gap-1"
                            >
                              <Globe size={12} />
                              <span>Sitio web</span>
                            </a>
                          ) : null}

                          {doc.phone_number ? (
                            <a
                              href={`tel:${doc.phone_number}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Phone size={12} />
                              <span>Llamar</span>
                            </a>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mapa Interactivo (Lado Derecho) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[500px] sm:h-[650px] relative order-1 lg:order-2 sticky top-4">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapRecenter center={mapCenter} zoom={mapZoom} />

              {/* Marcadores de médicos */}
              {filteredDoctors.map((doc, idx) => {
                if (!doc.latitude || !doc.longitude) return null;
                const isInternal = doc.is_our_doctor;
                const icon = isInternal ? createInternalDoctorIcon() : createExternalDoctorIcon();

                return (
                  <Marker
                    key={doc.source_place_id || doc.doctor_id || idx}
                    position={[Number(doc.latitude), Number(doc.longitude)]}
                    icon={icon}
                    eventHandlers={{
                      click: () => handleFocusDoctor(doc),
                    }}
                  >
                    <Popup className="doctor-map-popup">
                      <div className="p-1 max-w-[220px] space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isInternal ? 'bg-blue-600' : 'bg-slate-600'}`} />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            {isInternal ? 'Médico Vitalia' : 'Centro Externo'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`}
                        </h4>
                        <p className="text-[11px] font-semibold text-[#0052FF]">
                          {doc.specialty || doc.google_category}
                        </p>
                        {doc.formatted_address && (
                          <p className="text-[10px] text-slate-500 truncate">{doc.formatted_address}</p>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                          <Star size={11} className="fill-amber-400" />
                          <span>{doc.google_rating ? Number(doc.google_rating).toFixed(1) : '4.8'}</span>
                        </div>
                        {isInternal ? (
                          <button
                            type="button"
                            onClick={() => handleBookAppointment(doc)}
                            className="w-full mt-1.5 py-1 px-2 rounded-lg bg-[#0052FF] text-white text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <CalendarPlus size={12} />
                            <span>Agendar Cita</span>
                          </button>
                        ) : doc.booking_url ? (
                          <a
                            href={doc.booking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full mt-1.5 py-1 px-2 rounded-lg bg-slate-800 text-white text-[11px] font-bold text-center"
                          >
                            Ver citas externas
                          </a>
                        ) : null}
                      </div>
                    </Popup>

                    <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                      <span className="text-xs font-bold">
                        {doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`}
                      </span>
                    </Tooltip>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Leyenda del mapa flotante */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-md z-10 text-[11px] space-y-1.5">
              <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">Leyenda</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#0052FF] border border-white" />
                <span className="text-slate-700 font-medium">Médico Vitalia (con agenda)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#475569] border border-white" />
                <span className="text-slate-700 font-medium">Centro / Médico externo</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EspecialistasVideoSearch;