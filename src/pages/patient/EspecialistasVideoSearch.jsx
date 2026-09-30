import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Star, ChevronRight, Video, Loader2, CalendarPlus, Building2 } from 'lucide-react';
import SearchableSelect from './components/SearchableSelect';
import { MEDICAL_SPECIALTIES } from '../../data/specialty';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Convert local specialty list to {id, name} objects for SearchableSelect
const SPECIALTY_OPTIONS = MEDICAL_SPECIALTIES.map((name) => ({ id: name, name }));

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------
const EspecialistasVideoSearch = ({ onBack, onSelectDoctor }) => {
  const [allDoctors, setAllDoctors] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [modality, setModality] = useState('video');
  const [specialtyIds, setSpecialtyIds] = useState([]);
  const [name, setName] = useState('');

  // ── Load doctors once ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/doctor-availability/doctors`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((docs) => {
        const normalised = docs.map((d) => ({
          id: d.user_id,
          full_name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
          specialty: d.specialty,
          rating: d.rating ?? null,
          availabilities: d.availabilities || [],
        }));
        setAllDoctors(normalised);
      })
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => { setLoadingCatalogs(false); setIsLoading(false); });
  }, []);

  // ── Client-side filtering ─────────────────────────────────────
  const doctors = allDoctors.filter((d) => {
    const hasModality = d.availabilities.some((a) => a.consultation_type === modality);
    if (!hasModality) return false;

    if (specialtyIds.length > 0) {
      if (!specialtyIds.some((sName) => d.specialty === sName)) return false;
    }

    if (name.trim()) {
      if (!d.full_name.toLowerCase().includes(name.trim().toLowerCase())) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-base pb-24 font-sans px-5 pt-4">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Especialistas
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Video className="text-brand-blue" size={22} />
        <h2 className="text-xl font-extrabold text-brand-dark">Búsqueda de especialistas</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">Encuentra a tu médico ideal y reserva al instante.</p>

      {/* ── Filters ── */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft mb-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Filtros de búsqueda</h3>

        {loadingCatalogs ? (
          <div className="flex items-center justify-center py-6 text-brand-blue">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Modality toggle */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                Tipo de Cita
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setModality('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${modality === 'video' ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  <Video className="w-4 h-4" /> Video
                </button>
                <button
                  onClick={() => setModality('presencial')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${modality === 'presencial' ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  <Building2 className="w-4 h-4" /> Presencial
                </button>
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                Especialidad
              </label>
              <SearchableSelect
                items={SPECIALTY_OPTIONS}
                value={specialtyIds}
                onChange={setSpecialtyIds}
                multiple
                placeholder="Cualquier especialidad"
                renderLabel={(s) => s.name}
              />
            </div>

            {/* Name search */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                Nombre del médico
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-brand-blue">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm font-medium">Buscando médicos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4 text-center">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
          No hay médicos disponibles para los filtros seleccionados.
        </div>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
            {doctors.length} médico{doctors.length !== 1 ? 's' : ''} disponible{doctors.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {doctors.map((d) => (
              <div
                key={d.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDoctor(d, modality)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelectDoctor(d, modality); }}
                className="group w-full text-left bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center shrink-0 text-lg">
                  {(d.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {d.full_name || 'Médico sin nombre'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {d.specialty || 'Especialidad no informada'}
                  </p>
                  {d.rating != null && (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500 mt-0.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> {d.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[13px] font-bold text-brand-blue whitespace-nowrap flex items-center gap-0.5">
                    Reservar <ChevronRight className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                    <CalendarPlus className="w-3.5 h-3.5" /> Agendar cita
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EspecialistasVideoSearch;
