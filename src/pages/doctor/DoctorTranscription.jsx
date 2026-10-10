import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Headphones,
  Loader2,
  Search,
  UserRound,
  Video,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { medicalChatService } from '../../services/medicalChatService';

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function DoctorTranscription() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadPatients = async () => {
      if (!user?.id) {
        setLoadingPatients(false);
        return;
      }

      setLoadingPatients(true);
      setError('');
      try {
        const data = await medicalChatService.getCallTranscriptionPatients(user.id);
        if (isActive) {
          setPatients(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        console.error('Error al cargar pacientes con grabaciones:', loadError);
        if (isActive) {
          setError('No se pudieron cargar los pacientes. Inténtalo de nuevo.');
        }
      } finally {
        if (isActive) setLoadingPatients(false);
      }
    };

    loadPatients();
    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const openPatientHistory = async (patient) => {
    setSelectedPatient(patient);
    setRecordings([]);
    setLoadingRecordings(true);
    setError('');

    try {
      const data = await medicalChatService.getPatientCallTranscriptions(
        patient.patient_id,
        user?.id,
      );
      const ordered = Array.isArray(data)
        ? [...data].sort(
            (first, second) =>
              new Date(second.recorded_at || second.created_at).getTime()
              - new Date(first.recorded_at || first.created_at).getTime(),
          )
        : [];
      setRecordings(ordered);
    } catch (loadError) {
      console.error('Error al cargar grabaciones del paciente:', loadError);
      setError('No se pudieron cargar las grabaciones de este paciente.');
    } finally {
      setLoadingRecordings(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');
    if (!query) return patients;
    return patients.filter((patient) =>
      (patient.patient_name || '').toLocaleLowerCase('es').includes(query),
    );
  }, [patients, searchQuery]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/70 p-5 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {selectedPatient && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setRecordings([]);
                  setError('');
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                aria-label="Volver a pacientes"
              >
                <ArrowLeft size={19} />
              </button>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              {selectedPatient ? <Headphones size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                {selectedPatient
                  ? `Grabaciones de ${selectedPatient.patient_name}`
                  : 'Grabaciones y transcripciones'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {selectedPatient
                  ? 'Historial de videollamadas ordenado del más reciente al más antiguo.'
                  : 'Selecciona un paciente para revisar sus videollamadas.'}
              </p>
            </div>
          </div>
          {!selectedPatient && (
            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar paciente..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>
          )}
        </header>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!selectedPatient && (
          loadingPatients ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-violet-600" />
              Cargando pacientes...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <UserRound size={36} className="mx-auto mb-3 text-slate-300" />
              <h2 className="font-bold text-slate-800">No hay pacientes con grabaciones</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cuando haya grabaciones de videollamadas, aparecerán aquí agrupadas por paciente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPatients.map((patient) => (
                <button
                  type="button"
                  key={patient.patient_id}
                  onClick={() => openPatientHistory(patient)}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-900/5"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 transition group-hover:bg-violet-100">
                      <UserRound size={27} />
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                      {patient.recording_count}{' '}
                      {patient.recording_count === 1 ? 'grabación' : 'grabaciones'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {patient.patient_name || 'Paciente sin nombre'}
                  </h2>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={15} />
                    Última consulta: {formatDate(patient.latest_recorded_at)}
                  </p>
                  <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-700">
                    <Video size={16} />
                    Ver historial
                  </p>
                </button>
              ))}
            </div>
          )
        )}

        {selectedPatient && (
          loadingRecordings ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-violet-600" />
              Cargando grabaciones...
            </div>
          ) : recordings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <FileText size={36} className="mx-auto mb-3 text-slate-300" />
              <h2 className="font-bold text-slate-800">No hay grabaciones para mostrar</h2>
            </div>
          ) : (
            <div className="space-y-5">
              {recordings.map((recording, index) => (
                <article
                  key={recording.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 md:px-6">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        Videollamada {recordings.length - index}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={15} />
                        {formatDate(recording.recorded_at || recording.created_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      recording.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : recording.status === 'processing' || recording.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}>
                      {recording.status === 'completed'
                        ? 'Completada'
                        : recording.status === 'processing' || recording.status === 'pending'
                          ? 'Procesando'
                          : 'Transcripción no disponible'}
                    </span>
                  </header>

                  <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:p-6">
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Headphones size={17} className="text-violet-600" />
                        Grabación
                      </h3>
                      {recording.recording_url ? (
                        <>
                          <audio
                            controls
                            preload="none"
                            className="w-full"
                            src={recording.recording_url}
                          >
                            Tu navegador no permite reproducir este audio.
                          </audio>
                          <a
                            href={recording.recording_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900"
                          >
                            Abrir grabación en otra pestaña
                          </a>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">No hay una URL de grabación disponible.</p>
                      )}
                    </section>

                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FileText size={17} className="text-blue-600" />
                        Resumen de IA
                      </h3>
                      {recording.summary_text ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {recording.summary_text}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {recording.status === 'processing' || recording.status === 'pending'
                            ? 'El resumen se está procesando.'
                            : 'No hay un resumen disponible.'}
                        </p>
                      )}
                    </section>

                    <section className="md:col-span-2">
                      <h3 className="mb-3 text-sm font-bold text-slate-800">
                        Transcripción completa
                      </h3>
                      {recording.transcript_text ? (
                        <div className="max-h-80 overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                          <p className="whitespace-pre-wrap">{recording.transcript_text}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {recording.status === 'processing' || recording.status === 'pending'
                            ? 'La transcripción se está procesando.'
                            : recording.error_message || 'No hay una transcripción disponible.'}
                        </p>
                      )}
                      {recording.transcript_file_url && (
                        <a
                          href={recording.transcript_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                        >
                          <FileText size={16} />
                          Abrir archivo TXT de resumen y transcripción
                        </a>
                      )}
                    </section>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
