import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock, Plus, Trash2, Calendar, CheckCircle, Loader2, AlertCircle, ChevronDown
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const getDayColor = (dayIndex) => {
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-teal-50 text-teal-700 border-teal-200',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-blue-50 text-blue-800 border-blue-200',
    'bg-slate-100 text-slate-700 border-slate-200',
  ];
  return colors[dayIndex] || colors[0];
};

export default function DoctorAvailability() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const DAYS = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    value: i,
    label: t(`availability.days.${i}`),
  }));

  const getDayLabel = (dayIndex) => {
    return DAYS.find((d) => d.value === dayIndex)?.label || t('availability.unknown');
  };

  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  const [form, setForm] = useState({
    mode: 'weekly',
    day_of_week: 0,
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '17:00',
    slot_duration: 30,
    location_source: 'profile',
    custom_location: '',
    consultation_type: 'presencial',
  });

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchAvailability();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/doctor-profile?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile for address', err);
    }
  };

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/doctor-availability/${user.id}`);
      if (!res.ok) throw new Error(t('availability.errorLoad'));
      const data = await res.json();
      setAvailabilities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        doctor_id: user.id,
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
        slot_duration: parseInt(form.slot_duration),
        consultation_type: form.consultation_type,
      };

      if (form.location_source === 'profile' && doctorProfile?.address) {
        payload.location = doctorProfile.address;
      } else if (form.location_source === 'custom' && form.custom_location) {
        payload.location = form.custom_location;
      }

      if (form.mode === 'weekly') {
        payload.day_of_week = parseInt(form.day_of_week);
      } else {
        payload.start_date = form.start_date;
        payload.end_date = form.end_date;
      }

      const res = await fetch(`${API_URL}/doctor-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t('availability.errorSave'));
      }
      setSuccess(t('availability.successAdd'));
      setShowForm(false);
      setForm({ mode: 'weekly', day_of_week: 0, start_date: '', end_date: '', start_time: '08:00', end_time: '17:00', slot_duration: 30, location_source: 'profile', custom_location: '', consultation_type: 'presencial' });
      await fetchAvailability();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('availability.confirmDelete'))) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/doctor-availability/${id}?doctor_id=${user.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(t('availability.errorDelete'));
      setSuccess(t('availability.successDelete'));
      await fetchAvailability();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return null;

  const weeklyAvailabilities = availabilities.filter((a) => a.day_of_week !== null);
  const exactAvailabilities = availabilities.filter((a) => a.start_date && a.end_date);

  const grouped = DAYS.map((day) => ({
    ...day,
    slots: weeklyAvailabilities.filter((a) => a.day_of_week === day.value),
  })).filter((d) => d.slots.length > 0);

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-sm space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={15} className="text-blue-600" />
            {t('availability.title')}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {t('availability.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
          id="btn-add-availability"
        >
          <Plus size={15} />
          {t('availability.addSchedule')}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs shadow-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">{t('common.error')}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs shadow-sm">
          <CheckCircle size={16} className="shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-slate-50/80 rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
            <Plus size={14} className="text-blue-600" />
            {t('availability.newBlock')}
          </h4>
          
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Mode selection */}
            <div className="md:col-span-2 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="mode"
                  value="weekly"
                  checked={form.mode === 'weekly'}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                />
                Por día de la semana (Recurrente)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="mode"
                  value="exact"
                  checked={form.mode === 'exact'}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                />
                Por rango de fechas exactas
              </label>
            </div>

            {/* Tipo de consulta */}
            <div className="md:col-span-2 flex flex-col gap-2 pt-1 border-t border-slate-200/60">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Consulta</label>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="consultation_type"
                    value="presencial"
                    checked={form.consultation_type === 'presencial'}
                    onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                  />
                  Presencial
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="consultation_type"
                    value="videoconsulta"
                    checked={form.consultation_type === 'videoconsulta'}
                    onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                  />
                  Videoconsulta
                </label>
              </div>
            </div>

            {/* Location selection */}
            <div className="md:col-span-2 flex flex-col gap-2 pt-1 border-t border-slate-200/60">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ubicación de Atención</label>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="location_source"
                    value="profile"
                    checked={form.location_source === 'profile'}
                    onChange={(e) => setForm({ ...form, location_source: e.target.value })}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                  />
                  Usar dirección del perfil
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="location_source"
                    value="custom"
                    checked={form.location_source === 'custom'}
                    onChange={(e) => setForm({ ...form, location_source: e.target.value })}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                  />
                  Ingresar otra dirección
                </label>
              </div>

              {form.location_source === 'profile' && (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                  {doctorProfile?.address ? (
                    <><span className="font-semibold text-slate-800">Dirección actual:</span> {doctorProfile.address}</>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1.5 font-medium">
                      <AlertCircle size={14} /> No tienes una dirección configurada en tu perfil.
                    </span>
                  )}
                </div>
              )}

              {form.location_source === 'custom' && (
                <input
                  type="text"
                  placeholder="Ej: Consultorio 204, Clínica del Sol"
                  value={form.custom_location}
                  onChange={(e) => setForm({ ...form, custom_location: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              )}
            </div>

            {form.mode === 'weekly' ? (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('availability.dayOfWeek')}</label>
                <div className="relative">
                  <select
                    id="select-day"
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer pr-8"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Slot duration */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('availability.slotDuration')}</label>
              <div className="relative">
                <select
                  id="select-slot-duration"
                  value={form.slot_duration}
                  onChange={(e) => setForm({ ...form, slot_duration: e.target.value })}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer pr-8"
                >
                  {[15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>{m} {t('availability.slotMinutes')}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Start time */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('availability.startTime')}</label>
              <input
                id="input-start-time"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* End time */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('availability.endTime')}</label>
              <input
                id="input-end-time"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                id="btn-save-availability"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {saving ? t('availability.saving') : t('availability.saveSchedule')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs font-medium">{t('availability.loadingAvailability')}</p>
        </div>
      ) : grouped.length === 0 && exactAvailabilities.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
            <Calendar size={32} className="text-slate-400" />
          </div>
          <div>
            <p className="text-slate-800 font-bold text-xs">{t('availability.noSchedules')}</p>
            <p className="text-slate-400 text-[10px] mt-0.5">
              {t('availability.noSchedulesHint')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {grouped.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibilidad Semanal (Recurrente)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped.map((day) => (
                  <div key={day.value} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${getDayColor(day.value)}`}>
                        {getDayLabel(day.value)}
                      </span>
                    </div>
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 shadow-sm group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock size={14} className="text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800">
                              {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {slot.slot_duration} {t('availability.slotMinutes')} {slot.location && <span className="ml-1.5 font-medium text-slate-600">📍 {slot.location}</span>}
                            </p>
                          </div>
                        </div>
                        <button
                          id={`btn-delete-availability-${slot.id}`}
                          onClick={() => handleDelete(slot.id)}
                          disabled={deletingId === slot.id}
                          title={t('availability.deleteTitle')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed shrink-0 ml-2"
                        >
                          {deletingId === slot.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {exactAvailabilities.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibilidad por Fechas Exactas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exactAvailabilities.map((slot) => (
                  <div key={slot.id} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 inline-block">
                        {slot.start_date} al {slot.end_date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 shadow-sm group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock size={14} className="text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">
                            {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {slot.slot_duration} {t('availability.slotMinutes')} {slot.location && <span className="ml-1.5 font-medium text-slate-600">📍 {slot.location}</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={deletingId === slot.id}
                        title={t('availability.deleteTitle')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed shrink-0 ml-2"
                      >
                        {deletingId === slot.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}