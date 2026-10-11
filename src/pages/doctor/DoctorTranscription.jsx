import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Headphones,
  Loader2,
  Mic,
  Monitor,
  Search,
  Square,
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

function DoctorRecordingPanel({ onProcess, onSaved }) {
  const [source, setSource] = useState('microphone');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const captureRef = useRef({ display: null, microphone: null, audioContext: null });
  const timerRef = useRef(null);

  const releaseCapture = () => {
    captureRef.current.display?.getTracks().forEach((track) => track.stop());
    captureRef.current.microphone?.getTracks().forEach((track) => track.stop());
    captureRef.current.audioContext?.close().catch((closeError) => {
      console.error('No se pudo cerrar el contexto de audio:', closeError);
    });
    captureRef.current = { display: null, microphone: null, audioContext: null };
    recorderRef.current = null;
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    captureRef.current.display?.getTracks().forEach((track) => track.stop());
    captureRef.current.microphone?.getTracks().forEach((track) => track.stop());
    captureRef.current.audioContext?.close().catch((closeError) => {
      console.error('No se pudo cerrar el contexto de audio:', closeError);
    });
  }, []);

  const startRecording = async () => {
    setError('');
    setNotice('');
    setRecordingDuration(0);
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Este navegador no permite grabar audio. Usa Chrome o Edge en HTTPS o localhost.');
      }

      let recordingStream;
      if (source === 'microphone') {
        const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        captureRef.current = { display: null, microphone, audioContext: null };
        recordingStream = microphone;
      } else {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Este navegador no permite compartir audio del computador. Usa Chrome o Edge en HTTPS o localhost.');
        }

        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
          preferCurrentTab: true,
          selfBrowserSurface: 'include',
          systemAudio: 'include',
        });
        captureRef.current = { display, microphone: null, audioContext: null };
        if (!display.getAudioTracks().length) {
          throw new Error('No se compartió audio. Elige una pestaña y activa “Compartir audio” antes de continuar.');
        }

        const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Este navegador no soporta la mezcla de audio del computador y el micrófono.');
        }

        const audioContext = new AudioContextClass();
        captureRef.current = { display, microphone, audioContext };
        await audioContext.resume();
        if (audioContext.state !== 'running') {
          throw new Error('No se pudo activar el audio. Permite la captura de audio y vuelve a intentarlo.');
        }

        const destination = audioContext.createMediaStreamDestination();
        audioContext.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(destination);
        audioContext.createMediaStreamSource(microphone).connect(destination);
        recordingStream = destination.stream;
      }

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        recordingStream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      });
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingDuration((duration) => duration + 1);
      }, 1000);
    } catch (startError) {
      releaseCapture();
      setError(startError.message || 'No se pudo iniciar la grabación.');
    }
  };

  const stopRecording = () => new Promise((resolve, reject) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      resolve(null);
      return;
    }

    recorder.addEventListener('stop', () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      chunksRef.current = [];
      clearInterval(timerRef.current);
      releaseCapture();
      setIsRecording(false);
      resolve(blob.size ? blob : null);
    }, { once: true });
    recorder.addEventListener('error', (event) => {
      clearInterval(timerRef.current);
      releaseCapture();
      setIsRecording(false);
      reject(event.error || new Error('Falló la grabación de audio.'));
    }, { once: true });
    recorder.stop();
  });

  const transcribeRecording = async () => {
    setError('');
    setNotice('');
    try {
      const audio = await stopRecording();
      if (!audio) {
        throw new Error('No se capturó audio. Graba unos segundos e inténtalo de nuevo.');
      }
      setIsProcessing(true);
      await onProcess(audio);
      setNotice('Grabación guardada y transcrita correctamente.');
    } catch (processError) {
      setError(
        processError?.response?.data?.detail
          || processError.message
          || 'No se pudo transcribir la grabación.',
      );
    } finally {
      await onSaved();
      setIsProcessing(false);
    }
  };

  const cancelRecording = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    clearInterval(timerRef.current);
    releaseCapture();
    chunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
    setError('');
  };

  const formattedDuration = `${Math.floor(recordingDuration / 60)}:${String(recordingDuration % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900">Nueva transcripción personal</h3>
          <p className="mt-1 text-sm text-slate-600">
            El audio y el resumen quedan guardados solo en tu historial, sin asociarse a un paciente.
          </p>
        </div>
        {!isRecording && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Fuente de audio">
            <button
              type="button"
              onClick={() => setSource('microphone')}
              disabled={isProcessing}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                source === 'microphone'
                  ? 'border-violet-300 bg-white text-violet-800'
                  : 'border-slate-200 bg-white/70 text-slate-600'
              }`}
            >
              <Mic size={16} /> Micrófono
            </button>
            <button
              type="button"
              onClick={() => setSource('computer')}
              disabled={isProcessing}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                source === 'computer'
                  ? 'border-violet-300 bg-white text-violet-800'
                  : 'border-slate-200 bg-white/70 text-slate-600'
              }`}
            >
              <Monitor size={16} /> Computador + micrófono
            </button>
          </div>
        )}
      </div>

      {source === 'computer' && !isRecording && (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Al comenzar, comparte una pestaña o pantalla y activa “Compartir audio”. Se grabará el audio compartido junto con tu micrófono.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing
              ? <><Loader2 size={17} className="animate-spin" /> Generando transcripción y resumen...</>
              : <><Mic size={17} /> Transcribir ahora</>}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={transcribeRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800"
            >
              <Square size={15} fill="currentColor" /> Detener y transcribir
            </button>
            <button
              type="button"
              onClick={cancelRecording}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              Grabando {formattedDuration}
            </span>
          </>
        )}
      </div>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{notice}</p>}
    </div>
  );
}

export default function DoctorTranscription() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [doctorRecordings, setDoctorRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [loadingDoctorRecordings, setLoadingDoctorRecordings] = useState(true);
  const [approvingRecordingId, setApprovingRecordingId] = useState(null);
  const [downloadingRecordingId, setDownloadingRecordingId] = useState(null);
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

  useEffect(() => {
    let isActive = true;

    const loadDoctorRecordings = async () => {
      if (!user?.id) {
        setLoadingDoctorRecordings(false);
        return;
      }

      setLoadingDoctorRecordings(true);
      try {
        const data = await medicalChatService.getDoctorTranscriptions(user.id);
        if (isActive) {
          setDoctorRecordings(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        console.error('Error al cargar grabaciones personales:', loadError);
        if (isActive) setError('No se pudieron cargar tus grabaciones personales.');
      } finally {
        if (isActive) setLoadingDoctorRecordings(false);
      }
    };

    loadDoctorRecordings();
    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const refreshDoctorRecordings = async () => {
    try {
      const data = await medicalChatService.getDoctorTranscriptions(user?.id);
      setDoctorRecordings(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error('Error al actualizar grabaciones personales:', loadError);
      setError('La grabación se procesó, pero no se pudo actualizar el historial.');
    }
  };

  const downloadReport = async (recordingId) => {
    setDownloadingRecordingId(recordingId);
    setError('');
    try {
      await medicalChatService.downloadCallTranscriptionReport(recordingId, user?.id);
    } catch (downloadError) {
      console.error('Error al descargar el informe PDF:', downloadError);
      setError(downloadError?.response?.data?.detail || 'No se pudo descargar el informe PDF.');
    } finally {
      setDownloadingRecordingId(null);
    }
  };

  const approveRecording = async (recordingId) => {
    setApprovingRecordingId(recordingId);
    setError('');
    try {
      const approved = await medicalChatService.approveCallTranscription(recordingId, user?.id);
      setRecordings((current) => current.map((recording) => (
        recording.id === recordingId ? { ...recording, ...approved } : recording
      )));
    } catch (approvalError) {
      console.error('Error al aprobar el resumen:', approvalError);
      setError(
        approvalError?.response?.data?.detail
          || 'No se pudo aprobar el resumen. Inténtalo de nuevo.',
      );
    } finally {
      setApprovingRecordingId(null);
    }
  };

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
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-slate-900">Grabaciones personales</h2>
              <p className="mt-1 text-sm text-slate-500">
                Graba y transcribe sin iniciar una videollamada ni vincular la sesión a un paciente.
              </p>
            </div>
            <DoctorRecordingPanel
              onProcess={(audio) => medicalChatService.processDoctorTranscription(user?.id, audio)}
              onSaved={refreshDoctorRecordings}
            />

            <div className="mt-5 space-y-4">
              {loadingDoctorRecordings ? (
                <div className="flex min-h-24 items-center justify-center gap-3 text-slate-500">
                  <Loader2 size={21} className="animate-spin text-violet-600" />
                  Cargando tus grabaciones...
                </div>
              ) : doctorRecordings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
                  Aún no tienes grabaciones personales.
                </div>
              ) : (
                doctorRecordings.map((recording, index) => (
                  <article
                    key={recording.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Grabación personal {doctorRecordings.length - index}
                        </h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Calendar size={15} />
                          {formatDate(recording.recorded_at || recording.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
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
                        {recording.status === 'completed' && recording.summary_text && recording.transcript_text && (
                          <button
                            type="button"
                            onClick={() => downloadReport(recording.id)}
                            disabled={downloadingRecordingId === recording.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
                          >
                            {downloadingRecordingId === recording.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Download size={15} />}
                            Descargar informe PDF
                          </button>
                        )}
                      </div>
                    </header>
                    <div className="grid gap-5 p-5 md:grid-cols-2">
                      <section>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                          <Headphones size={17} className="text-violet-600" />
                          Grabación
                        </h4>
                        {recording.recording_url ? (
                          <audio
                            controls
                            preload="none"
                            className="w-full"
                            src={recording.recording_url}
                          >
                            Tu navegador no permite reproducir este audio.
                          </audio>
                        ) : (
                          <p className="text-sm text-slate-500">No hay una URL de grabación disponible.</p>
                        )}
                      </section>
                      <section>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                          <FileText size={17} className="text-blue-600" />
                          Resumen de IA
                        </h4>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {recording.summary_text
                            || recording.error_message
                            || (recording.status === 'processing'
                              ? 'El resumen se está procesando.'
                              : 'No hay un resumen disponible.')}
                        </p>
                      </section>
                      <section className="md:col-span-2">
                        <h4 className="mb-3 text-sm font-bold text-slate-800">
                          Transcripción completa
                        </h4>
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
                      </section>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
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
                    <div className="flex flex-wrap items-center gap-2">
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
                      {recording.summary_approved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle size={14} /> Resumen aprobado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => approveRecording(recording.id)}
                          disabled={
                            recording.status !== 'completed'
                            || !recording.summary_text
                            || approvingRecordingId === recording.id
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {approvingRecordingId === recording.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <CheckCircle size={15} />}
                          Aprobar resumen
                        </button>
                      )}
                      {recording.summary_text && recording.transcript_text && (
                        <button
                          type="button"
                          onClick={() => downloadReport(recording.id)}
                          disabled={downloadingRecordingId === recording.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
                        >
                          {downloadingRecordingId === recording.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Download size={15} />}
                          Informe PDF
                        </button>
                      )}
                    </div>
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
