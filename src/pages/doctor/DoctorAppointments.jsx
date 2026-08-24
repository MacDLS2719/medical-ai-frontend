import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck, Clock, User, Loader2, AlertCircle, CheckCircle,
  XCircle, RefreshCw, ClipboardList
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const formatDate = (dateStr, lang) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function DoctorAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const STATUS_CONFIG = {
    scheduled: {
      label: t('doctorAppointments.statusLabels.scheduled'),
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-400',
    },
    confirmed: {
      label: t('doctorAppointments.statusLabels.confirmed'),
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      dot: 'bg-green-500',
    },
    cancelled: {
      label: t('doctorAppointments.statusLabels.cancelled'),
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      dot: 'bg-red-400',
    },
    completed: {
      label: t('doctorAppointments.statusLabels.completed'),
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
    },
  };

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'doctor') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/appointments/doctor/${user.id}`);
      if (!res.ok) throw new Error(t('doctorAppointments.errorLoad'));
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setActionLoading(`${appointmentId}-${newStatus}`);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changed_by: user.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t('doctorAppointments.errorUpdate'));
      }
      const label = STATUS_CONFIG[newStatus]?.label || newStatus;
      setActionSuccess(`${t('doctorAppointments.markedAs')} "${label}".`);
      await fetchAppointments();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  const filters = [
    { key: 'all', label: t('doctorAppointments.filterAll') },
    { key: 'scheduled', label: t('doctorAppointments.filterPending') },
    { key: 'confirmed', label: t('doctorAppointments.filterConfirmed') },
    { key: 'completed', label: t('doctorAppointments.filterCompleted') },
    { key: 'cancelled', label: t('doctorAppointments.filterCancelled') },
  ];

  const filtered = appointments.filter((a) => {
    if (activeFilter === 'all') return true;
    return a.status === activeFilter;
  });

  const countByStatus = (s) => appointments.filter((a) => a.status === s).length;

  const statsData = [
    { label: t('doctorAppointments.statPending'), count: countByStatus('scheduled'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: t('doctorAppointments.statConfirmed'), count: countByStatus('confirmed'), color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { label: t('doctorAppointments.statCompleted'), count: countByStatus('completed'), color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
    { label: t('doctorAppointments.statCancelled'), count: countByStatus('cancelled'), color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-teal-600 p-2.5 rounded-xl text-white shadow-lg shadow-teal-500/30">
              <ClipboardList size={22} />
            </div>
            {t('doctorAppointments.title')}
          </h1>
          <p className="text-slate-500 mt-1.5 ml-1">
            {t('doctorAppointments.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          title={t('doctorAppointments.refresh')}
          id="btn-refresh-doctor-appointments"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {t('doctorAppointments.refresh')}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 shadow-sm">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl mb-6 shadow-sm">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{actionSuccess}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statsData.map((s) => (
          <div key={s.label} className={`glass-card rounded-2xl p-4 border ${s.border} flex flex-col`}>
            <span className={`text-2xl font-extrabold ${s.color}`}>{s.count}</span>
            <span className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
              activeFilter === f.key
                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
          <Loader2 size={40} className="animate-spin text-teal-500" />
          <p className="text-sm font-medium">{t('doctorAppointments.loadingAppointments')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
          <div className="bg-slate-100 p-6 rounded-full">
            <CalendarCheck size={40} className="text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-bold text-lg">{t('doctorAppointments.noAppointments')}</p>
            <p className="text-slate-400 text-sm mt-1">
              {t('doctorAppointments.noAppointmentsHint')} {activeFilter !== 'all' ? `${t('doctorAppointments.withStatus')} "${filters.find(f => f.key === activeFilter)?.label}"` : ''}.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((apt) => {
            const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
            return (
              <div
                key={apt.id}
                className={`glass-card rounded-2xl p-5 border ${cfg.border} flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-xl`}
              >
                {/* Left: date/time */}
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
                      {t('doctorAppointments.patient')} #{apt.patient_id}
                    </p>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                      <Clock size={13} className="text-slate-400" />
                      {apt.appointment_time?.slice(0, 5)} hrs · {formatDate(apt.appointment_date, i18n.language)}
                    </p>
                  </div>
                </div>

                {/* Right: actions */}
                {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {apt.status === 'scheduled' && (
                      <button
                        id={`btn-confirm-apt-${apt.id}`}
                        onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionLoading === `${apt.id}-confirmed`
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CheckCircle size={14} />
                        }
                        {t('doctorAppointments.confirm')}
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button
                        id={`btn-complete-apt-${apt.id}`}
                        onClick={() => handleUpdateStatus(apt.id, 'completed')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionLoading === `${apt.id}-completed`
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CalendarCheck size={14} />
                        }
                        {t('doctorAppointments.complete')}
                      </button>
                    )}
                    <button
                      id={`btn-cancel-apt-${apt.id}`}
                      onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-300 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading === `${apt.id}-cancelled`
                        ? <Loader2 size={14} className="animate-spin" />
                        : <XCircle size={14} />
                      }
                      {t('doctorAppointments.cancel')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
