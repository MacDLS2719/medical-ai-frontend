import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, Headphones, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { medicalChatService } from '../../services/medicalChatService';

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PatientTranscription() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadReports = async () => {
      if (!user?.id || user.role !== 'patient') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await medicalChatService.getPatientApprovedTranscriptions(user.id);
        if (isActive) setReports(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error('Error al cargar grabaciones vinculadas:', loadError);
        if (isActive) setError('No se pudieron cargar tus grabaciones. Inténtalo de nuevo.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadReports();
    return () => {
      isActive = false;
    };
  }, [user?.id, user?.role]);

  const downloadReport = async (reportId) => {
    setDownloadingId(reportId);
    setError('');
    try {
      await medicalChatService.downloadCallTranscriptionReport(reportId, user?.id);
    } catch (downloadError) {
      console.error('Error al descargar el informe aprobado:', downloadError);
      setError(downloadError?.response?.data?.detail || 'No se pudo descargar el informe PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/70 p-5 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Transcripciones Mivor
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Escucha las grabaciones de tus consultas. El resumen y la transcripción aparecen cuando el médico los aprueba.
            </p>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            Cargando informes...
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText size={36} className="mx-auto mb-3 text-slate-300" />
            <h2 className="font-bold text-slate-800">Aún no tienes grabaciones vinculadas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Las grabaciones de tus consultas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {reports.map((report, index) => (
              <article
                key={report.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 md:px-6">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Informe de consulta {reports.length - index}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={15} />
                      {formatDate(report.recorded_at || report.created_at)}
                      {report.doctor_name ? ` · ${report.doctor_name}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    report.summary_approved
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {report.summary_approved ? 'Resumen aprobado' : 'Grabación disponible · Resumen pendiente'}
                  </span>
                </header>

                <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Headphones size={17} className="text-blue-600" />
                      Grabación de audio
                    </h3>
                    {report.recording_url ? (
                      <audio controls preload="none" className="w-full" src={report.recording_url}>
                        Tu navegador no permite reproducir este audio.
                      </audio>
                    ) : (
                      <p className="text-sm text-slate-500">No hay una grabación disponible.</p>
                    )}
                  </section>

                  <button
                    type="button"
                    onClick={() => downloadReport(report.id)}
                    disabled={!report.summary_approved || downloadingId === report.id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingId === report.id
                      ? <Loader2 size={17} className="animate-spin" />
                      : <Download size={17} />}
                    {report.summary_approved ? 'Descargar informe PDF' : 'PDF disponible al aprobar'}
                  </button>
                </div>
                {report.summary_approved && (
                  <div className="grid gap-6 border-t border-slate-100 p-5 md:p-6">
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FileText size={17} className="text-blue-600" />
                        Resumen de IA aprobado
                      </h3>
                      {report.summary_text ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {report.summary_text}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">No hay un resumen disponible.</p>
                      )}
                    </section>
                    <section>
                      <h3 className="mb-3 text-sm font-bold text-slate-800">
                        Transcripción completa
                      </h3>
                      {report.transcript_text ? (
                        <div className="max-h-80 overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                          <p className="whitespace-pre-wrap">{report.transcript_text}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No hay una transcripción disponible.</p>
                      )}
                    </section>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
