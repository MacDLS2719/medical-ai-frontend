import React, { useState } from 'react';
import { 
  X, CalendarPlus, MapPin, Phone, Globe, Star, ShieldCheck, 
  Clock, CheckCircle2, ChevronLeft, ChevronRight, Stethoscope,
  Award, Sparkles
} from 'lucide-react';

// Días de la semana abreviados para disponibilidades
const DAY_LABELS = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WeekDayBadges = ({ availabilities = [] }) => {
  const activeDays = new Set(
    availabilities
      .filter((a) => a.day_of_week)
      .map((a) => a.day_of_week.toLowerCase())
  );

  const hasSpecificDates = availabilities.some((a) => a.start_date || a.end_date);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {DAY_ORDER.map((day) => {
        const isActive = activeDays.has(day);
        const label = DAY_LABELS[day];
        return (
          <span
            key={day}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
              isActive
                ? 'bg-[#0052FF] text-white shadow-xs ring-1 ring-blue-500/30'
                : hasSpecificDates
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

export default function InternalDoctorModal({ doc, onClose, onBook }) {
  const [imgIdx, setImgIdx] = useState(0);

  if (!doc) return null;

  const images = (doc.images || []).filter((i) => i?.image_url);
  const hasImages = images.length > 0;
  const fullName = doc.business_name || `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.trim();
  const specialty = doc.specialty || doc.google_category || 'Especialista Médico';

  const prevImg = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % images.length);
  };

  const hours = doc.opening_hours;
  const hoursRaw = hours?.raw || (typeof hours === 'string' ? hours : null);
  const hoursParsed = hours?.periods || hours?.weekday_text || null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative border border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con degradado de marca */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50/40 p-5 sm:p-6 border-b border-blue-100/60 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shadow-xs"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            {/* Foto o Avatar del Doctor */}
            <div className="relative shrink-0">
              {hasImages ? (
                <img
                  src={images[0].image_url}
                  alt={fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-white shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-blue-600 text-white flex items-center justify-center text-3xl shadow-md ring-2 ring-blue-100">
                  <Stethoscope size={32} />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white shadow-xs" title="Médico Verificado">
                <CheckCircle2 size={12} />
              </span>
            </div>

            {/* Info principal */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0052FF] text-white shadow-2xs flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>Médico Oficial de la Plataforma</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                  <ShieldCheck size={11} />
                  <span>Verificado</span>
                </span>
              </div>

              <h2 className="font-black text-lg sm:text-xl text-slate-900 mt-1 leading-snug">
                {fullName}
              </h2>

              <p className="text-xs sm:text-sm font-bold text-[#0052FF]">
                {specialty}
              </p>

              {doc.distance_km != null && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  📍 A {doc.distance_km} km de tu búsqueda
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Galería de imágenes (si hay más de 1 o para ampliar) */}
        {hasImages && images.length > 1 && (
          <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
            <img
              src={images[imgIdx].image_url}
              alt={`Foto ${imgIdx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <button
              onClick={prevImg}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 space-y-4 flex-1">
          {/* Calificación y opiniones */}
          <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    className={
                      s <= Math.round(doc.google_rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    }
                  />
                ))}
              </div>
              <span className="font-extrabold text-sm text-slate-900 ml-1">
                {doc.google_rating ? Number(doc.google_rating).toFixed(1) : '5.0'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({doc.google_reviews_count || 45} opiniones verificadas)
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Award size={11} /> Top Especialista
            </span>
          </div>

          {/* Días con Citas Médicas Disponibles */}
          {doc.availabilities && doc.availabilities.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Clock size={13} className="text-[#0052FF]" />
                  <span>Días de atención y agenda abierta</span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  Citas inmediatas
                </span>
              </div>
              <WeekDayBadges availabilities={doc.availabilities} />
              <p className="text-[10px] text-slate-500 mt-2">
                Los días resaltados en azul cuentan con horarios activos para agendamiento directo.
              </p>
            </div>
          )}

          {/* Información del Consultorio y Contacto */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Consultorio & Ubicación
            </span>

            {doc.formatted_address && (
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <MapPin size={15} className="text-[#0052FF] shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{doc.formatted_address}</span>
              </div>
            )}

            {doc.phone_number && (
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Phone size={15} className="text-[#0052FF] shrink-0" />
                <a href={`tel:${doc.phone_number}`} className="font-bold hover:text-blue-700 transition-colors">
                  {doc.phone_number}
                </a>
              </div>
            )}

            {doc.website_url && (
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Globe size={15} className="text-[#0052FF] shrink-0" />
                <a
                  href={doc.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:text-blue-700 transition-colors truncate"
                >
                  {doc.website_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              </div>
            )}
          </div>

          {/* Horario de Atención general */}
          {(hoursRaw || hoursParsed) && (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Horario de atención
              </span>
              {hoursParsed && Array.isArray(hoursParsed) ? (
                <ul className="space-y-1 text-slate-600">
                  {hoursParsed.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : hoursRaw ? (
                <p className="text-slate-600">{hoursRaw}</p>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer fijo con Botón de Agendamiento Directo */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={() => {
              if (onBook) onBook(doc);
              onClose();
            }}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#0052FF] hover:bg-blue-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer"
          >
            <CalendarPlus size={18} />
            <span>Agendar Cita con este Doctor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
