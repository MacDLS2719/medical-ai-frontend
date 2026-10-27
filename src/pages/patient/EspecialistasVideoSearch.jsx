import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, Search, Star, Loader2, CalendarPlus, 
  MapPin, Phone, Globe, ExternalLink, ShieldCheck, Navigation,
  Building, Building2, X, ChevronDown, Check, Clock, Image as ImageIcon,
  ChevronLeft, ChevronRight, Navigation2, Info, Eye, Sparkles, Database,
  Stethoscope
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { MEDICAL_SPECIALTIES } from '../../data/specialty';
import InternalDoctorModal, { WeekDayBadges } from './components/InternalDoctorModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ----------------------------------------------------------------
// Función auxiliar para determinar si es Clínica/Hospital o Doctor
// ----------------------------------------------------------------
export const isClinicOrHospital = (doc) => {
  if (!doc) return false;
  if (doc.is_our_doctor) return false;
  if (doc.is_clinic === true) return true;
  if (doc.place_type === 'clinic' || doc.place_type === 'hospital') return true;

  const name = (doc.business_name || '').toLowerCase().trim();
  const cat = (doc.google_category || '').toLowerCase().trim();
  const spec = (doc.specialty || '').toLowerCase().trim();

  // Si contiene "centro", "clínica", "hospital", "instituto", "fundación", "ips", "unidad", etc. -> SIEMPRE ES CLÍNICA / HOSPITAL
  const clinicPattern = /centro|cl[íi]nica|hospital|instituto|fundaci[óo]n|sanatorio|ips\b|eps\b|laboratorio|unidad|complejo|sede|policl[íi]nic|diagn[óo]stic|sociedad m[ée]dica|grupo m[ée]dico|salud/i;

  if (clinicPattern.test(name) || clinicPattern.test(cat) || clinicPattern.test(spec)) {
    return true;
  }

  return false;
};

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
                className="hover:bg-blue-700 rounded-full p-0.5 transition-colors cursor-pointer"
                aria-label={`Quitar ${spec}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold underline transition-colors self-center ml-1 cursor-pointer"
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selected.length === 0 ? placeholder : 'Agregar otra especialidad...'}
          className="text-xs w-full outline-none text-slate-800 placeholder-slate-400 bg-transparent"
        />
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 text-center">No se encontraron especialidades</p>
          ) : (
            filtered.map((spec) => {
              const isSelected = selected.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggle(spec)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-blue-50 text-[#0052FF] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{spec}</span>
                  {isSelected && <Check size={14} className="text-[#0052FF]" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Modal de detalle para Centros Externos, Clínicas y Hospitales
// ----------------------------------------------------------------
const ExternalDoctorOrClinicModal = ({ doc, onClose, onBookInternal }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const images = (doc?.images || []).filter(i => i.image_url);
  const hasImages = images.length > 0;

  if (!doc) return null;

  const isClinic = isClinicOrHospital(doc);
  const hours = doc.opening_hours;
  const hoursRaw = hours?.raw || (typeof hours === 'string' ? hours : null);
  const hoursParsed = hours?.periods || hours?.weekday_text || null;

  const prevImg = (e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative border border-slate-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con diferenciación visual */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-3 ${
          isClinic
            ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 border-emerald-100/60'
            : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-slate-100'
        }`}>
          <div className="flex items-start gap-3.5 min-w-0">
            {isClinic ? (
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex flex-col items-center justify-center shrink-0 shadow-xs">
                <Building2 size={24} />
                <span className="text-[8px] font-black uppercase mt-0.5">Clínica</span>
              </div>
            ) : hasImages ? (
              <img
                src={images[0].image_url}
                alt={doc.business_name || 'Especialista'}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-1 ring-slate-200 shadow-xs"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                🩺
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isClinic
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {isClinic ? '🏥 Clínica / Hospital' : '👨‍⚕️ Especialista Externo'}
                </span>
                {doc.distance_km != null && (
                  <span className="text-[10px] text-slate-500 font-semibold">
                    📍 {doc.distance_km} km
                  </span>
                )}
              </div>

              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-snug mt-1">
                {doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.trim()}
              </h2>

              <p className="text-xs font-bold text-[#0052FF] mt-0.5">
                {doc.specialty || doc.google_category || 'Centro de Salud'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Galería de imágenes (sólo si no es clínica con solo placeholder o si tiene fotos reales de Google) */}
        {!isClinic && hasImages && (
          <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
            <img
              src={images[imgIdx].image_url}
              alt={`Imagen ${imgIdx + 1}`}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="p-5 space-y-4 flex-1">
          {/* Rating */}
          {(doc.google_rating || doc.google_reviews_count) && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                {[1,2,3,4,5].map(star => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= Math.round(doc.google_rating || 5)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 fill-slate-200'
                    }
                  />
                ))}
                <span className="ml-1 text-sm font-extrabold text-slate-800">
                  {doc.google_rating ? Number(doc.google_rating).toFixed(1) : '4.8'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">
                ({doc.google_reviews_count || 30} opiniones en Google)
              </span>
            </div>
          )}

          {/* Contacto y ubicación */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs">
            {doc.formatted_address && (
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin size={14} className="text-[#0052FF] shrink-0 mt-0.5" />
                <span>{doc.formatted_address}</span>
              </div>
            )}
            {doc.phone_number && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone size={14} className="text-emerald-600 shrink-0" />
                <a href={`tel:${doc.phone_number}`} className="hover:text-[#0052FF] transition-colors font-bold">
                  {doc.phone_number}
                </a>
              </div>
            )}
            {doc.website_url && (
              <div className="flex items-center gap-2 text-slate-700">
                <Globe size={14} className="text-blue-600 shrink-0" />
                <a
                  href={doc.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0052FF] transition-colors font-medium truncate"
                >
                  {doc.website_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              </div>
            )}
            {doc.google_maps_url && (
              <div className="flex items-center gap-2 text-slate-700 pt-1">
                <Navigation2 size={14} className="text-[#0052FF] shrink-0" />
                <a
                  href={doc.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0052FF] hover:underline font-bold"
                >
                  Ver ubicación en Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Horarios */}
          {(hoursRaw || hoursParsed) && (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={13} className="text-slate-500" />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Horario de atención</span>
              </div>
              {hoursParsed && Array.isArray(hoursParsed) ? (
                <ul className="space-y-0.5">
                  {hoursParsed.map((line, i) => (
                    <li key={i} className="text-xs text-slate-600">{line}</li>
                  ))}
                </ul>
              ) : hoursRaw ? (
                <p className="text-xs text-slate-600 leading-relaxed">{hoursRaw}</p>
              ) : null}
            </div>
          )}
        </div>

        {/* Acciones del footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center gap-2">
          {doc.booking_url ? (
            <a
              href={doc.booking_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <ExternalLink size={14} />
              <span>Agendar cita en su portal</span>
            </a>
          ) : doc.phone_number ? (
            <a
              href={`tel:${doc.phone_number}`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Phone size={14} />
              <span>Llamar al establecimiento</span>
            </a>
          ) : null}

          {doc.google_maps_url && (
            <a
              href={doc.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Navigation size={13} />
              <span>Cómo llegar</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// Pines personalizados de Leaflet (Interno, Externo, Clínica)
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
      <div style="width:30px;height:30px;border-radius:50%;background:#3b82f6;border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.15);">
        🩺
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #3b82f6;margin:-2px auto 0;"></div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
};

const createClinicIcon = () => {
  const html = `
    <div style="position:relative;width:34px;height:42px;filter:drop-shadow(0 3px 6px rgba(16,185,129,0.35));cursor:pointer;">
      <div style="width:32px;height:32px;border-radius:10px;background:#059669;border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
        🏥
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #059669;margin:-2px auto 0;"></div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -38] });
};

// Componente para recentrar el mapa suavemente
function MapRecenter({ center, zoom, doctors }) {
  const map = useMap();
  useEffect(() => {
    const validPositions = (doctors || [])
      .filter((d) => d.latitude && d.longitude && !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude)))
      .map((d) => [Number(d.latitude), Number(d.longitude)]);

    if (validPositions.length > 1) {
      const bounds = L.latLngBounds(validPositions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (validPositions.length === 1) {
      map.setView(validPositions[0], 14, { animate: true });
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, doctors, map]);
  return null;
}

// ----------------------------------------------------------------
// Componente Principal de Búsqueda y Mapa
// ----------------------------------------------------------------
const EspecialistasVideoSearch = ({ onBack, onSelectDoctor, initialFilters, apiUrl }) => {
  // Filtros de búsqueda
  const [specialties, setSpecialties] = useState(
    initialFilters?.specialty ? [initialFilters.specialty] : []
  );
  const [city, setCity] = useState(initialFilters?.city || '');
  const [country, setCountry] = useState(initialFilters?.country || '');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'internal' | 'clinics' | 'external_doctors'
  const [searchName, setSearchName] = useState('');

  // Coordenadas del centro del mapa (Cali por defecto)
  const [mapCenter, setMapCenter] = useState([3.4516, -76.5320]);
  const [mapZoom, setMapZoom] = useState(13);

  // Estados de carga y resultados
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Buscando especialistas...');
  const [error, setError] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  // Modales separados para médico interno y doctores externos/clínicas
  const [internalModalDoc, setInternalModalDoc] = useState(null);
  const [externalModalDoc, setExternalModalDoc] = useState(null);

  // Estados de control para modos: BD vs Web Mivor
  const [noDatabaseResults, setNoDatabaseResults] = useState(false);
  const [lastSearchMode, setLastSearchMode] = useState('database');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const mapRef = useRef(null);

  // Ejecutar búsqueda en el endpoint /doctor-search con modo 'database' o 'external'
  const handleSearch = async (overrideParams = {}) => {
    const searchMode = overrideParams.mode || 'database';
    setIsLoading(true);
    setError('');
    setSyncSuccessMsg('');
    setLastSearchMode(searchMode);

    if (searchMode === 'database') {
      setLoadingMsg('Consultando especialistas en la base de datos...');
    } else {
      setLoadingMsg('Buscando especialistas reales en Google Maps y la web con Mivor AI... 🔍');
    }

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
          search_mode: searchMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al buscar médicos.');
      }

      const results = data.results || [];
      setDoctors(results);

      if (searchMode === 'database') {
        if (results.length === 0) {
          setNoDatabaseResults(true);
        } else {
          setNoDatabaseResults(false);
        }
      } else {
        setNoDatabaseResults(false);
        if (results.length > 0) {
          setSyncSuccessMsg(`¡${results.length} especialistas y centros médicos encontrados y registrados con éxito!`);
        }
      }

      // Actualizar centro del mapa si el servidor devolvió coordenadas de la ciudad
      if (data.center_latitude && data.center_longitude) {
        setMapCenter([data.center_latitude, data.center_longitude]);
        setMapZoom(13);
      } else if (results.length > 0 && results[0].latitude && results[0].longitude) {
        setMapCenter([results[0].latitude, results[0].longitude]);
      }
    } catch (err) {
      setError(err.message || 'No fue posible conectar con el servicio de búsqueda.');
    } finally {
      setIsLoading(false);
    }
  };

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
    const isClinic = isClinicOrHospital(d);

    if (filterType === 'internal' && !d.is_our_doctor) return false;
    if (filterType === 'clinics' && !isClinic) return false;
    if (filterType === 'external_doctors' && (d.is_our_doctor || isClinic)) return false;

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
  const clinicsCount = doctors.filter((d) => isClinicOrHospital(d)).length;
  const externalDoctorsCount = doctors.filter((d) => !d.is_our_doctor && !isClinicOrHospital(d)).length;

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

  const handleOpenDetail = (doc) => {
    if (doc.is_our_doctor) {
      setInternalModalDoc(doc);
    } else {
      setExternalModalDoc(doc);
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
    <>
    <div className="min-h-screen bg-slate-50 font-sans pb-24 px-3 sm:px-6 pt-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Barra superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
                <MapPin className="text-[#0052FF]" size={19} />
                <span>Especialistas, Consultorios y Clínicas Cercanas</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Visualiza médicos de la plataforma, especialistas y clínicas en el mapa interactivo
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

            {/* Botones de Búsqueda */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoDatabaseResults(false);
                  handleSearch({ mode: 'database' });
                }}
                disabled={isLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  noDatabaseResults
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-[#0052FF] hover:bg-blue-700 text-white cursor-pointer'
                } flex-1`}
                title={noDatabaseResults ? "No hay registros en la base de datos. Usa 'Buscar Web Mivor'" : "Buscar en base de datos"}
              >
                {isLoading && lastSearchMode === 'database' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span>Buscar</span>
              </button>

              {noDatabaseResults && (
                <button
                  type="button"
                  onClick={() => handleSearch({ mode: 'external' })}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-[#0052FF] hover:from-violet-700 hover:to-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md animate-pulse cursor-pointer flex-1"
                >
                  {isLoading && lastSearchMode === 'external' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>Buscar Web Mivor</span>
                </button>
              )}
            </div>
          </div>

          {/* Subfiltro por tipo y texto — SOLO SE MUESTRA DESPUÉS DE BUSCAR SI HAY RESULTADOS */}
          {doctors.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs animate-fadeIn">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({doctors.length})
                </button>

                {internalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterType('internal')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === 'internal'
                        ? 'bg-[#0052FF] text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <ShieldCheck size={12} />
                    <span>De la plataforma ({internalCount})</span>
                  </button>
                )}

                {clinicsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterType('clinics')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === 'clinics'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                    }`}
                  >
                    <Building2 size={12} />
                    <span>Clínicas y Hospitales ({clinicsCount})</span>
                  </button>
                )}

                {externalDoctorsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterType('external_doctors')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === 'external_doctors'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Stethoscope size={12} />
                    <span>Especialistas externos ({externalDoctorsCount})</span>
                  </button>
                )}
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
          )}
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {syncSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
            <span className="flex items-center gap-2 font-bold">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </span>
            <button
              onClick={() => setSyncSuccessMsg('')}
              className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Contenido Principal: Listado + Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Listado de Médicos y Clínicas (Lado Izquierdo) */}
          <div className="lg:col-span-5 space-y-3 order-2 lg:order-1 max-h-[700px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>{filteredDoctors.length} resultado{filteredDoctors.length !== 1 ? 's' : ''}</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Prioridad: Médicos de la Plataforma
              </span>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                <Loader2 size={28} className="text-[#0052FF] animate-spin" />
                <div>
                  <p className="text-xs font-bold text-slate-700">{loadingMsg}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lastSearchMode === 'database'
                      ? 'Consultando registros locales de la base de datos...'
                      : 'Consultando Google Maps y guardando los resultados reales en la base de datos...'}
                  </p>
                </div>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 bg-blue-50 text-[#0052FF] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                  <Database size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    No se encontraron resultados con los filtros actuales
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Puedes activar la búsqueda web con Mivor AI para encontrar especialistas y clínicas reales en Google Maps e integrarlos al sistema.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch({ mode: 'external' })}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-[#0052FF] hover:from-violet-700 hover:to-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  {isLoading && lastSearchMode === 'external' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>Buscar Web Mivor</span>
                </button>
              </div>
            ) : (
              filteredDoctors.map((doc, idx) => {
                const isSelected = selectedDoctorId === (doc.source_place_id || doc.doctor_id || doc.business_name);
                const isClinic = isClinicOrHospital(doc);

                return (
                  <div
                    key={doc.source_place_id || doc.doctor_id || idx}
                    onClick={() => handleFocusDoctor(doc)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer relative shadow-2xs hover:shadow-md ${
                      isSelected
                        ? 'border-[#0052FF] ring-2 ring-blue-500/20'
                        : doc.is_our_doctor
                        ? 'border-blue-100 hover:border-blue-300'
                        : isClinic
                        ? 'border-emerald-100 hover:border-emerald-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* DIFERENCIACIÓN VISUAL: Clínica/Hospital vs Doctor */}
                        {isClinic ? (
                          // Si es Clínica u Hospital: Icono distintivo de edificio/hospital
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                            <Building2 size={20} />
                            <span className="text-[8px] font-black uppercase mt-0.5 tracking-tight">Clínica</span>
                          </div>
                        ) : (
                          // Si es Doctor o Especialista: Se muestran las imágenes/fotos
                          doc.images && doc.images[0]?.image_url ? (
                            <img
                              src={doc.images[0].image_url}
                              alt={doc.business_name || 'Médico'}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 shadow-2xs"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-base shadow-2xs ${
                              doc.is_our_doctor
                                ? 'bg-[#0052FF] text-white ring-2 ring-blue-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              🩺
                            </div>
                          )
                        )}

                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`}
                          </h3>
                          <p className="text-[11px] font-semibold text-[#0052FF] truncate">
                            {doc.specialty || doc.google_category || (isClinic ? 'Centro Médico' : 'Especialista')}
                          </p>
                        </div>
                      </div>

                      {/* Tag distintivo */}
                      {doc.is_our_doctor ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          Médico Plataforma
                        </span>
                      ) : isClinic ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                          <Building2 size={10} />
                          <span>Clínica</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Especialista
                        </span>
                      )}
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
                      {!isClinic && doc.images && doc.images.length > 0 && (
                        <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <ImageIcon size={11} /> {doc.images.length} fotos
                        </span>
                      )}
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
                    <div className="pt-2 border-t border-slate-100">
                      {doc.is_our_doctor ? (
                        <div className="w-full flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookAppointment(doc);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <CalendarPlus size={14} />
                            <span>Agendar Cita</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(doc);
                            }}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                            title="Ver información completa"
                          >
                            <Eye size={13} />
                            <span>Ver info</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full space-y-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(doc);
                            }}
                            className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                              isClinic
                                ? 'bg-emerald-700 hover:bg-emerald-800'
                                : 'bg-slate-900 hover:bg-[#0052FF]'
                            }`}
                          >
                            <Eye size={13} />
                            <span>{isClinic ? 'Ver información de la clínica' : 'Ver información del especialista'}</span>
                          </button>

                          {(doc.booking_url || doc.website_url || doc.phone_number) && (
                            <div className="flex items-center gap-1.5 w-full">
                              {doc.booking_url ? (
                                <a
                                  href={doc.booking_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 py-1.5 px-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-[10px] font-bold text-center flex items-center justify-center gap-1"
                                >
                                  <span>Cita externa</span>
                                  <ExternalLink size={11} />
                                </a>
                              ) : null}

                              {doc.website_url && !doc.booking_url ? (
                                <a
                                  href={doc.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-[10px] font-bold text-center flex items-center justify-center gap-1"
                                >
                                  <Globe size={11} />
                                  <span>Web</span>
                                </a>
                              ) : null}

                              {doc.phone_number ? (
                                <a
                                  href={`tel:${doc.phone_number}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Phone size={11} />
                                  <span>Llamar</span>
                                </a>
                              ) : null}
                            </div>
                          )}
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

              <MapRecenter center={mapCenter} zoom={mapZoom} doctors={filteredDoctors} />

              {/* Marcadores de médicos y clínicas */}
              {filteredDoctors.map((doc, idx) => {
                if (!doc.latitude || !doc.longitude) return null;
                const isInternal = doc.is_our_doctor;
                const isClinic = isClinicOrHospital(doc);
                
                // Icono diferenciado: Interno (Azul), Clínica (Verde Esmeralda), Especialista externo (Azul/Gris)
                const icon = isInternal
                  ? createInternalDoctorIcon()
                  : isClinic
                  ? createClinicIcon()
                  : createExternalDoctorIcon();

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
                      <div className="p-1.5 max-w-[210px] space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isInternal ? 'bg-blue-600' : isClinic ? 'bg-emerald-600' : 'bg-slate-600'}`} />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            {isInternal ? 'Médico Plataforma' : isClinic ? 'Clínica / Hospital' : 'Especialista Externo'}
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
                        {doc.google_rating && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                            <Star size={11} className="fill-amber-400" />
                            <span>{Number(doc.google_rating).toFixed(1)}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(doc)}
                          className="w-full mt-1.5 py-1.5 px-2 rounded-lg bg-[#0052FF] text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Info size={11} />
                          <span>Ver detalle</span>
                        </button>
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

            {/* Leyenda del mapa */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-md z-10 text-[11px] space-y-1.5">
              <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">Leyenda</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#0052FF] border border-white" />
                <span className="text-slate-700 font-medium">Médico de la Plataforma (con agenda)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#059669] border border-white" />
                <span className="text-slate-700 font-medium">Clínica u Hospital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] border border-white" />
                <span className="text-slate-700 font-medium">Especialista externo</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* Modal para Médico Interno de la plataforma */}
    {internalModalDoc && (
      <InternalDoctorModal
        doc={internalModalDoc}
        onClose={() => setInternalModalDoc(null)}
        onBook={handleBookAppointment}
      />
    )}

    {/* Modal para Doctores Externos, Clínicas y Hospitales */}
    {externalModalDoc && (
      <ExternalDoctorOrClinicModal
        doc={externalModalDoc}
        onClose={() => setExternalModalDoc(null)}
        onBookInternal={handleBookAppointment}
      />
    )}
  </>);
};

export default EspecialistasVideoSearch;