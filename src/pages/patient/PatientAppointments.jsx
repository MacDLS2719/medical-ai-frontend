import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarPlus, Clock, Loader2, AlertCircle, CheckCircle,
  XCircle, ChevronRight, CalendarCheck, ChevronLeft, X, User, MapPin
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = import.meta.env.VITE_API_URL;

const getTodayISO = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export default function PatientAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const STATUS_CONFIG = {
    scheduled: { label: t('patientAppointments.statusLabels.scheduled'), bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
    confirmed: { label: t('patientAppointments.statusLabels.confirmed'), bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
    cancelled: { label: t('patientAppointments.statusLabels.cancelled'), bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
    completed: { label: t('patientAppointments.statusLabels.completed'), bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(i18n.language === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // My appointments
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [activeFilter, setActiveFilter] = useState('upcoming');

  // Booking modal
  const [showBooking, setShowBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1=select doctor, 2=select date+slots, 3=confirm
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState(null); // full doctor object
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [bookingDate, setBookingDate] = useState(getTodayISO());
  const [bookingSlots, setBookingSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Map modal
  const [showMap, setShowMap] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'patient') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchMyAppointments();
      fetchPatientProfile();
    }
  }, [user]);

  const fetchPatientProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPatientProfile(data);
      }
    } catch (err) {
      console.error('Error fetching patient profile', err);
    }
  };

  const [doctorsError, setDoctorsError] = useState(null);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    setDoctorsError(null);
    try {
      const res = await fetch(`${API_URL}/appointments/doctors`);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      setDoctorsError(err.message);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchMyAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/appointments/patient/${user.id}`);
      if (!res.ok) throw new Error(t('patientAppointments.loadError'));
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm(t('patientAppointments.cancelConfirm'))) return;
    setCancelLoading(appointmentId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t('patientAppointments.cancelError'));
      }
      setCancelSuccess(t('patientAppointments.cancelSuccess'));
      await fetchMyAppointments();
      setTimeout(() => setCancelSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelLoading(null);
    }
  };

  const handleFetchSlots = async () => {
    if (!bookingDoctorId) {
      setSlotsError(t('patientAppointments.booking.doctorIdRequired'));
      return;
    }
    setLoadingSlots(true);
    setSlotsError(null);
    setBookingSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `${API_URL}/appointments/available-slots/${bookingDoctorId}?appointment_date=${bookingDate}`
      );
      if (!res.ok) throw new Error(t('patientAppointments.booking.errorSlots'));
      const data = await res.json();
      if (!data.slots || data.slots.length === 0) {
        setSlotsError(t('patientAppointments.booking.noSlotsAvailable'));
        return;
      }
      setBookingSlots(data.slots);
      setBookingStep(2);
    } catch (err) {
      setSlotsError(err.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setBookingSuccess(null);
    setSlotsError(null);
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user.id,
          doctor_id: parseInt(bookingDoctorId),
          appointment_date: bookingDate,
          appointment_time: selectedSlot.time,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t('patientAppointments.booking.bookingError'));
      }
      setBookingSuccess(t('patientAppointments.booking.successBooking'));
      setBookingStep(3);
      await fetchMyAppointments();
    } catch (err) {
      setSlotsError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const closeBooking = () => {
    setShowBooking(false);
    setBookingStep(1);
    setBookingDoctorId('');
    setBookingDoctor(null);
    setBookingDate(getTodayISO());
    setBookingSlots([]);
    setSelectedSlot(null);
    setBookingSuccess(null);
    setSlotsError(null);
  };

  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleSelectDoctor = (doctor) => {
    setBookingDoctor(doctor);
    setBookingDoctorId(String(doctor.user_id));
    setBookingStep(2);
    setSlotsError(null);
    setBookingSlots([]);
    setSelectedSlot(null);
  };

  if (!user) return null;

  const today = getTodayISO();
  const filteredApts = appointments.filter((a) => {
    if (activeFilter === 'upcoming') return a.appointment_date >= today && a.status !== 'cancelled' && a.status !== 'completed';
    if (activeFilter === 'past') return a.appointment_date < today || a.status === 'completed';
    if (activeFilter === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const upcomingCount = appointments.filter(
    (a) => a.appointment_date >= today && a.status !== 'cancelled' && a.status !== 'completed'
  ).length;

  const filters = [
    { key: 'upcoming', label: t('patientAppointments.filterUpcoming') },
    { key: 'past', label: t('patientAppointments.filterHistory') },
    { key: 'cancelled', label: t('patientAppointments.filterCancelled') },
    { key: 'all', label: t('patientAppointments.filterAll') },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <CalendarCheck size={22} />
            </div>
            {t('patientAppointments.title')}
          </h1>
          <p className="text-slate-500 mt-1.5 ml-1">
            {upcomingCount > 0
              ? (upcomingCount > 1
                  ? t('patientAppointments.upcoming_plural', { count: upcomingCount })
                  : t('patientAppointments.upcoming', { count: upcomingCount }))
              : t('patientAppointments.noUpcoming')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-open-map"
            onClick={() => { setShowMap(true); fetchDoctors(); }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <MapPin size={18} className="text-red-500" />
            Encontrar médicos cerca
          </button>
          <button
            id="btn-open-booking"
            onClick={() => { setShowBooking(true); fetchDoctors(); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <CalendarPlus size={18} />
            {t('patientAppointments.bookAppointment')}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 shadow-sm">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {cancelSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl mb-6 shadow-sm">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{cancelSuccess}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            id={`patient-filter-${f.key}`}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
              activeFilter === f.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">{t('patientAppointments.loadingAppointments')}</p>
        </div>
      ) : filteredApts.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
          <div className="bg-slate-100 p-6 rounded-full">
            <CalendarCheck size={40} className="text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-bold text-lg">{t('patientAppointments.noAppointments')}</p>
            <p className="text-slate-400 text-sm mt-1">{t('patientAppointments.noAppointmentsHint')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredApts.map((apt) => {
            const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
            const isPast = apt.appointment_date < today || apt.status === 'completed' || apt.status === 'cancelled';
            return (
              <div
                key={apt.id}
                className={`glass-card rounded-2xl p-5 border ${cfg.border} flex flex-col md:flex-row md:items-center gap-4 transition-all ${!isPast ? 'hover:shadow-xl hover:shadow-blue-500/5' : 'opacity-75'}`}
              >
                {/* Date box */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="bg-white border-2 border-slate-100 shadow-sm rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString(i18n.language === 'es' ? 'es-MX' : 'en-US', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-800 leading-none">
                      {new Date(apt.appointment_date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(apt.appointment_date + 'T00:00:00').getFullYear()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                        {cfg.label}
                      </span>
                      {apt.location && (
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                          📍 {apt.location}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-bold text-base flex items-center gap-2">
                      <User size={14} className="text-slate-400 flex-shrink-0" />
                      {t('patientAppointments.doctor')} #{apt.doctor_id}
                    </p>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                      <Clock size={13} className="text-slate-400" />
                      {apt.appointment_time?.slice(0, 5)} hrs · {formatDate(apt.appointment_date)}
                    </p>
                  </div>
                </div>

                {/* Cancel */}
                {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                  <button
                    id={`btn-patient-cancel-${apt.id}`}
                    onClick={() => handleCancel(apt.id)}
                    disabled={!!cancelLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-300 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {cancelLoading === apt.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <XCircle size={14} />
                    }
                    {t('patientAppointments.cancel')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================
          BOOKING MODAL
      ============================================================ */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {bookingStep > 1 && bookingStep < 3 && (
                  <button
                    onClick={() => { setBookingStep(bookingStep - 1); setSlotsError(null); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {bookingStep === 1 && 'Seleccionar Médico'}
                    {bookingStep === 2 && 'Elegir Fecha y Hora'}
                    {bookingStep === 3 && t('patientAppointments.booking.stepTitle3')}
                  </h2>
                  {bookingStep < 3 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('patientAppointments.booking.step')} {bookingStep} {t('patientAppointments.booking.of')} 2
                    </p>
                  )}
                </div>
              </div>
              <button
                id="btn-close-booking"
                onClick={closeBooking}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Select Doctor */}
              {bookingStep === 1 && (
                <div className="flex flex-col gap-4">
                  {loadingDoctors ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                      <p className="text-sm">Cargando médicos disponibles...</p>
                    </div>
                  ) : doctorsError ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <AlertCircle size={36} className="text-red-400" />
                      <p className="text-sm font-medium text-red-600">No se pudieron cargar los médicos.</p>
                      <p className="text-xs text-slate-400">{doctorsError}</p>
                      <button onClick={fetchDoctors} className="text-xs text-blue-600 underline cursor-pointer">Intentar de nuevo</button>
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-slate-400 text-center">
                      <User size={36} className="text-slate-300" />
                      <p className="text-sm font-medium">No hay médicos registrados en el sistema.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {doctors.map((doc) => (
                        <button
                          key={doc.user_id}
                          onClick={() => handleSelectDoctor(doc)}
                          className="text-left w-full border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-4 transition-all group hover:shadow-md hover:shadow-blue-500/10 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 text-blue-600 rounded-xl p-2.5 flex-shrink-0">
                                <User size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                                  Dr. {doc.first_name} {doc.last_name}
                                </p>
                                <p className="text-xs text-blue-600 font-semibold mt-0.5">{doc.specialty}</p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                          </div>

                          {doc.availabilities.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Horarios disponibles</p>
                              {doc.availabilities.map((av) => (
                                <div key={av.id} className="flex items-center gap-2 text-xs text-slate-600">
                                  <Clock size={11} className="text-blue-400 flex-shrink-0" />
                                  <span className="font-semibold text-slate-700">
                                    {av.day_of_week !== null
                                      ? DAY_NAMES[av.day_of_week]
                                      : `${av.start_date} al ${av.end_date}`
                                    }
                                  </span>
                                  <span className="text-slate-400">{av.start_time} – {av.end_time}</span>
                                  <span className="ml-auto text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{av.slot_duration} min</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Date + Slots */}
              {bookingStep === 2 && (
                <div className="flex flex-col gap-5">
                  {/* Doctor summary */}
                  {bookingDoctor && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 rounded-xl p-2 flex-shrink-0">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Médico seleccionado</p>
                        <p className="text-slate-800 font-bold text-sm">Dr. {bookingDoctor.first_name} {bookingDoctor.last_name}</p>
                        <p className="text-xs text-slate-500">{bookingDoctor.specialty}</p>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t('patientAppointments.booking.appointmentDate')}
                    </label>
                    <input
                      id="input-booking-date"
                      type="date"
                      value={bookingDate}
                      min={getTodayISO()}
                      onChange={(e) => { setBookingDate(e.target.value); setBookingSlots([]); setSelectedSlot(null); setSlotsError(null); }}
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <button
                    id="btn-search-slots"
                    onClick={handleFetchSlots}
                    disabled={loadingSlots}
                    className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
                  >
                    {loadingSlots
                      ? <><Loader2 size={14} className="animate-spin" /> Buscando horarios...</>
                      : <><Clock size={14} /> Ver horarios disponibles</>
                    }
                  </button>

                  {slotsError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {slotsError}
                    </div>
                  )}

                  {bookingSlots.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        {t('patientAppointments.booking.availableSlots')} ({bookingSlots.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                      {bookingSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          id={`slot-${slot.time?.replace(':', '-')}`}
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                            selectedSlot?.time === slot.time
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {slot.time?.slice(0, 5)}
                          </div>
                          {slot.location && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[90%] ${
                              selectedSlot?.time === slot.time ? 'bg-blue-500/30' : 'bg-slate-100 text-slate-500'
                            }`}>
                              📍 {slot.location}
                            </span>
                          )}
                        </button>
                      ))}
                      </div>
                    </div>
                  )}

                  <button
                    id="btn-confirm-booking"
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || bookingLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {bookingLoading
                      ? <><Loader2 size={16} className="animate-spin" /> {t('patientAppointments.booking.booking')}</>
                      : <><CheckCircle size={16} /> {t('patientAppointments.booking.confirmBooking')}</>
                    }
                  </button>
                </div>
              )}

              {/* Step 3: Success */}
              {bookingStep === 3 && (
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <div className="bg-green-100 p-5 rounded-full">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{t('patientAppointments.booking.confirmedTitle')}</h3>
                    <p className="text-slate-500 text-sm mt-2">
                      {t('patientAppointments.booking.confirmedMessage', {
                        doctorId: bookingDoctorId,
                        date: formatDate(bookingDate),
                        time: selectedSlot?.time?.slice(0, 5)
                      })}
                    </p>
                  </div>
                  <button
                    id="btn-booking-done"
                    onClick={closeBooking}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {t('patientAppointments.booking.done')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MAP MODAL
      ============================================================ */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 text-red-600 rounded-xl p-2.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Médicos Cercanos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Encuentra y agenda con médicos cerca de tu ubicación</p>
                </div>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 w-full p-4 relative min-h-0">
              {!patientProfile?.latitude || !patientProfile?.longitude ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="bg-amber-100 p-4 rounded-full mb-4">
                    <AlertCircle size={40} className="text-amber-500" />
                  </div>
                  <p className="font-bold text-slate-700 text-lg">Ubicación no configurada</p>
                  <p className="text-sm mt-1 mb-5">Para buscar médicos cercanos, necesitas guardar tu ubicación en tu perfil.</p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all"
                  >
                    Ir a mi perfil
                  </button>
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner">
                  {loadingDoctors ? (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-3">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                      <p className="text-sm font-medium text-slate-500">Buscando médicos...</p>
                    </div>
                  ) : (
                    <MapContainer
                      center={[patientProfile.latitude, patientProfile.longitude]}
                      zoom={12}
                      style={{ height: '100%', width: '100%', zIndex: 10 }}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />
                      
                      {/* Patient Marker */}
                      <Marker position={[patientProfile.latitude, patientProfile.longitude]}>
                        <Popup>
                          <div className="text-center">
                            <span className="font-bold text-slate-700">Tu Ubicación</span>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Doctor Markers */}
                      {doctors.filter(d => d.latitude && d.longitude).map(doc => (
                        <Marker key={doc.user_id} position={[doc.latitude, doc.longitude]}>
                          <Popup className="doctor-popup">
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                  <User size={16} />
                                </div>
                                <div>
                                  <strong className="block text-slate-800 text-sm leading-tight">Dr. {doc.first_name} {doc.last_name}</strong>
                                  <span className="text-[11px] text-blue-600 font-bold uppercase">{doc.specialty}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 flex items-start gap-1">
                                <MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                                {doc.address || 'Sin dirección específica'}
                              </p>
                              
                              {doc.availabilities.length > 0 ? (
                                <div className="mt-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Próximos horarios</p>
                                  <div className="max-h-[60px] overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                                    {doc.availabilities.slice(0, 3).map(av => (
                                      <div key={av.id} className="text-[11px] bg-slate-50 px-2 py-1 rounded text-slate-600 flex justify-between">
                                        <span className="font-semibold">{av.day_of_week !== null ? DAY_NAMES[av.day_of_week] : `${av.start_date}`}</span>
                                        <span>{av.start_time?.slice(0,5)}</span>
                                      </div>
                                    ))}
                                    {doc.availabilities.length > 3 && <span className="text-[10px] text-center text-slate-400 mt-1">+{doc.availabilities.length - 3} más</span>}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-red-500 font-medium my-1">Sin horarios disponibles</p>
                              )}

                              <button
                                onClick={() => {
                                  setShowMap(false);
                                  setShowBooking(true);
                                  handleSelectDoctor(doc);
                                }}
                                disabled={doc.availabilities.length === 0}
                                className="mt-2 w-full bg-blue-600 disabled:bg-slate-300 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                {doc.availabilities.length === 0 ? 'No disponible' : 'Agendar aquí'}
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
