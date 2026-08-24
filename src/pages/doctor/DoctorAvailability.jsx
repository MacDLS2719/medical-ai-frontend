import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock, Plus, Trash2, Calendar, CheckCircle, XCircle, Loader2, AlertCircle, ChevronDown
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const getDayColor = (dayIndex) => {
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-orange-100 text-orange-700 border-orange-200',
  ];
  return colors[dayIndex] || colors[0];
};

export default function DoctorAvailability() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Build DAYS array from translations
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

  const [form, setForm] = useState({
    day_of_week: 0,
    start_time: '08:00',
    end_time: '17:00',
    slot_duration: 30,
  });

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/appointments/availability/${user.id}`);
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
      const res = await fetch(`${API_URL}/appointments/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: user.id,
          day_of_week: parseInt(form.day_of_week),
          start_time: form.start_time + ':00',
          end_time: form.end_time + ':00',
          slot_duration: parseInt(form.slot_duration),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t('availability.errorSave'));
      }
      setSuccess(t('availability.successAdd'));
      setShowForm(false);
      setForm({ day_of_week: 0, start_time: '08:00', end_time: '17:00', slot_duration: 30 });
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
        `${API_URL}/appointments/availability/${id}?doctor_id=${user.id}`,
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

  // Group availabilities by day
  const grouped = DAYS.map((day) => ({
    ...day,
    slots: availabilities.filter((a) => a.day_of_week === day.value),
  })).filter((d) => d.slots.length > 0);

  return (
    <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-purple-500/30">
              <Calendar size={22} />
            </div>
            {t('availability.title')}
          </h1>
          <p className="text-slate-500 mt-1.5 ml-1">
            {t('availability.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          id="btn-add-availability"
        >
          <Plus size={18} />
          {t('availability.addSchedule')}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 shadow-sm">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">{t('common.error')}</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl mb-6 shadow-sm">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="glass-card rounded-3xl p-6 mb-8 border border-purple-100 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <h2 className="text-lg font-bold text-slate-700 mb-5 flex items-center gap-2">
            <Plus size={18} className="text-purple-600" />
            {t('availability.newBlock')}
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Day of week */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('availability.dayOfWeek')}</label>
              <div className="relative">
                <select
                  id="select-day"
                  value={form.day_of_week}
                  onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                  className="w-full appearance-none border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all cursor-pointer pr-10"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Slot duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('availability.slotDuration')}</label>
              <div className="relative">
                <select
                  id="select-slot-duration"
                  value={form.slot_duration}
                  onChange={(e) => setForm({ ...form, slot_duration: e.target.value })}
                  className="w-full appearance-none border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all cursor-pointer pr-10"
                >
                  {[15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>{m} {t('availability.slotMinutes')}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Start time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('availability.startTime')}</label>
              <input
                id="input-start-time"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
                className="border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
            </div>

            {/* End time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('availability.endTime')}</label>
              <input
                id="input-end-time"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
                className="border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                id="btn-save-availability"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {saving ? t('availability.saving') : t('availability.saveSchedule')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
          <Loader2 size={40} className="animate-spin text-purple-500" />
          <p className="text-sm font-medium">{t('availability.loadingAvailability')}</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
          <div className="bg-slate-100 p-6 rounded-full">
            <Calendar size={40} className="text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-bold text-lg">{t('availability.noSchedules')}</p>
            <p className="text-slate-400 text-sm mt-1">
              {t('availability.noSchedulesHint')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {grouped.map((day) => (
            <div key={day.value} className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${getDayColor(day.value)}`}>
                  {getDayLabel(day.value)}
                </span>
              </div>
              {day.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between bg-white/80 border border-slate-100 rounded-xl px-4 py-3 shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {slot.slot_duration} {t('availability.slotMinutes')}
                      </p>
                    </div>
                  </div>
                  <button
                    id={`btn-delete-availability-${slot.id}`}
                    onClick={() => handleDelete(slot.id)}
                    disabled={deletingId === slot.id}
                    title={t('availability.deleteTitle')}
                    className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {deletingId === slot.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Trash2 size={16} />
                    }
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
