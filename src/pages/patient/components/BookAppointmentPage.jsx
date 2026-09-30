import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Loader2, Video, Building2, Calendar, Star } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function BookAppointmentPage({ doctor, modality, onBack, onDone }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actualRates, setActualRates] = useState([]);

  // Fetch actual doctor rates
  useEffect(() => {
    // Assuming doctor.id or doctor.user_id is the reference for the user table
    const targetId = doctor.user_id || doctor.id;
    fetch(`${API_BASE}/doctor-payments/settings/public/${targetId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setActualRates(data))
      .catch(err => console.error('Error fetching rates', err));
  }, [doctor]);

  // Determine applicable rates based on modality
  const applicableRates = actualRates.filter(rate => {
    const type = rate.consultation_type.toLowerCase();
    if (modality === 'video' && (type.includes('video') || type.includes('virtual'))) return true;
    if (modality !== 'video' && (type.includes('presencial') || type.includes('general'))) return true;
    return false;
  });

  // Fallback to show all rates if none strictly match, just in case
  const ratesToShow = applicableRates.length > 0 ? applicableRates : actualRates;

  // ── Fetch calendar for the current month ────────────────────
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    setLoadingCalendar(true);
    setSelectedDay(null);
    setSelectedSlot(null);

    fetch(
      `${API_BASE}/appointments/doctor/${doctor.id}/calendar?year=${year}&month=${month}&consultation_type=${modality}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCalendarData(data))
      .catch(() => setCalendarData(null))
      .finally(() => setLoadingCalendar(false));
  }, [currentDate, doctor.id, modality]);

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // ── Book the selected slot ───────────────────────────────────
  const handleBook = async () => {
    if (!selectedSlot || !user) {
      if (!user) alert('Debe iniciar sesión para agendar.');
      return;
    }
    setIsBooking(true);
    try {
      const payload = {
        patient_id: user.id,
        doctor_id: doctor.id,
        appointment_date: selectedSlot.date,
        appointment_time: selectedSlot.time,
        consultation_type: modality,
      };
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setBookingSuccess(true);
      } else {
        alert('El horario ya no está disponible o hubo un error. Inténtalo de nuevo.');
      }
    } catch {
      alert('Error de conexión al reservar.');
    }
    setIsBooking(false);
  };

  // Removed early return for success screen to show it as a modal instead

  const paddingCells = calendarData?.days?.length > 0 ? calendarData.days[0].day_of_week : 0;

  return (
    <div className="min-h-screen bg-base font-sans pb-24 overflow-y-auto">
      {/* Botón de volver */}
      <div className="max-w-7xl mx-auto px-5 pt-5 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors bg-white px-3.5 py-2 rounded-2xl border border-gray-100 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      </div>

      {/* Contenedor principal adaptable */}
      <div className="max-w-7xl mx-auto px-5 pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── COLUMNA IZQUIERDA: Información del médico más pequeña (ancho 3) ── */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-soft p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue font-extrabold flex items-center justify-center text-xl shrink-0">
                {(doctor.full_name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-extrabold text-brand-dark text-sm leading-tight">
                  {doctor.full_name || 'Médico'}
                </h1>
                <p className="text-[11px] text-gray-500 mt-0.5">{doctor.specialty || 'Especialidad no informada'}</p>
                {doctor.rating && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{doctor.rating}</span>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-2">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  modality === 'video' ? 'bg-blue-50 text-brand-blue' : 'bg-purple-50 text-purple-600'
                }`}
              >
                {modality === 'video' ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                {modality === 'video' ? 'Videollamada' : 'Presencial'}
              </span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Selecciona una fecha en el calendario y tu horario preferido.
              </p>
            </div>
          </div>

          {/* ── COLUMNA CENTRAL: Calendario grande con números gruesos y días no disponibles visibles (ancho 5) ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-extrabold text-brand-dark text-lg capitalize">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-3">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-black text-brand-blue uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loadingCalendar ? (
              <div className="flex flex-col items-center justify-center py-16 text-brand-blue">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-medium">Cargando disponibilidad...</p>
              </div>
            ) : !calendarData || calendarData.days?.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                No hay disponibilidad este mes.
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: paddingCells }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {calendarData.days.map((day, i) => {
                  const isSel = selectedDay?.date === day.date;
                  const dateObj = new Date(day.date + 'T12:00:00');
                  return (
                    <button
                      key={i}
                      disabled={!day.available}
                      onClick={() => {
                        setSelectedDay(day);
                        setSelectedSlot(null);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-2xl text-base font-black transition-all
                        ${
                          !day.available
                            ? 'cursor-not-allowed text-gray-500 bg-gray-100 opacity-60 border border-gray-200'
                            : isSel
                            ? 'bg-blue-600 text-white shadow-md scale-105'
                            : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 cursor-pointer'
                        }
                      `}
                    >
                      {dateObj.getDate()}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── COLUMNA DERECHA: Horarios disponibles y confirmación (ancho 4) ── */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-soft p-6 flex flex-col justify-between space-y-6">
            <div>
              <h3 className="font-extrabold text-brand-dark text-sm mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                Horarios disponibles
              </h3>
              <p className="text-[11px] text-gray-400 mb-4">
                {selectedDay
                  ? new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('es', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Selecciona un día del calendario'}
              </p>

              {!selectedDay ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl text-xs text-gray-400">
                  Haz clic en un día disponible para ver las horas.
                </div>
              ) : selectedDay.slots.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-12">No hay horarios disponibles este día.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {selectedDay.slots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black border-2 transition-all
                        ${
                          selectedSlot === slot
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                            : 'bg-blue-50/50 border-blue-100 text-blue-900 hover:border-blue-300 hover:bg-blue-100'
                        }
                      `}
                    >
                      {slot.time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Confirm buttons ── */}
            <div className="space-y-3">
              <button
                disabled={!selectedSlot || isBooking}
                onClick={handleBook}
                className={`w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md
                  ${
                    !selectedSlot || isBooking
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }
                `}
              >
                {isBooking && <Loader2 className="w-4 h-4 animate-spin" />}
                {isBooking
                  ? 'Reservando...'
                  : selectedSlot
                  ? `Guardado directo • ${selectedSlot.time.substring(0, 5)}`
                  : 'Selecciona horario'}
              </button>

              {ratesToShow.length > 0 && (
                <button
                  disabled={!selectedSlot || isBooking}
                  onClick={() => setShowPaymentModal(true)}
                  className={`w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md
                    ${
                      !selectedSlot || isBooking
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    }
                  `}
                >
                  Pagar y agendar
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Payment Gateway Modal Simulator */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-brand-dark text-lg">Resumen de Pago</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 bg-gray-50/50">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Cita con</p>
                <p className="font-bold text-brand-dark">{doctor.full_name}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedSlot?.date} • {selectedSlot?.time.substring(0, 5)}</p>
              </div>

              <h4 className="text-sm font-bold text-gray-700 mb-3">Tarifas del especialista</h4>
              <div className="space-y-2">
                {ratesToShow.map(rate => (
                  <label key={rate.id} className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/30 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="rate" className="text-blue-600 w-4 h-4" defaultChecked={rate.consultation_type.toLowerCase().includes(modality === 'video' ? 'video' : 'presencial')} />
                      <span className="text-sm font-bold text-brand-dark">{rate.consultation_type}</span>
                    </div>
                    <span className="font-black text-blue-700">
                      ${rate.price} <span className="text-xs">{rate.currency}</span>
                    </span>
                  </label>
                ))}
              </div>

              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  handleBook(); // Simular el pago completado exitosamente
                }}
                className="w-full mt-6 py-3.5 rounded-2xl bg-brand-dark text-white font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                Simular Pago y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-center p-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-brand-dark mb-2">¡Cita confirmada!</h2>
            <p className="text-sm text-gray-500 mb-1">
              Tu cita con <span className="font-bold text-brand-dark">{doctor.full_name}</span> ha sido
              agendada exitosamente.
            </p>
            <p className="text-xs text-gray-400 mb-8">
              {selectedSlot?.date} a las {selectedSlot?.time?.substring(0, 5)} •{' '}
              {modality === 'video' ? 'Videollamada' : 'Presencial'}
            </p>
            <button
              onClick={() => {
                if (onDone) onDone();
                navigate('/patient/appointments');
              }}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
            >
              Ver mis citas
            </button>
            <button
              onClick={() => {
                setBookingSuccess(false);
                if (onBack) onBack();
              }}
              className="w-full mt-3 py-3 rounded-2xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Buscar otro médico
            </button>
          </div>
        </div>
      )}
    </div>
  );
}