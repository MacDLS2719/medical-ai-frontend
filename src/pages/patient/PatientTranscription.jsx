import { useEffect, useMemo, useState } from 'react';
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

function parseClinicalSections(text) {
  if (!text) return null;
  const normalized = text.replace(/\r\n/g, '\n');
  const lower = normalized.toLowerCase();

  const markers = [
    { key: 'motivo', label: 'MOTIVO DE CONSULTA', queries: ['motivo de consulta', 'motivo de la consulta', 'motivo:'] },
    { key: 'exploracion', label: 'EXPLORACIÓN FÍSICA', queries: ['exploración física', 'exploracion fisica', 'examen físico', 'examen fisico'] },
    { key: 'diagnostico', label: 'IMPRESIÓN DIAGNÓSTICA', queries: ['impresión diagnóstica', 'impresion diagnostica', 'diagnóstico', 'diagnostico'] },
    { key: 'plan', label: 'PLAN Y TRATAMIENTO', queries: ['plan y tratamiento', 'plan de tratamiento', 'tratamiento'] },
  ];

  const found = [];
  markers.forEach((m) => {
    for (const q of m.queries) {
      const idx = lower.indexOf(q);
      if (idx !== -1) {
        let endIdx = idx + q.length;
        while (endIdx < normalized.length && [':', ' ', '\t', '-'].includes(normalized[endIdx])) {
          endIdx++;
        }
        found.push({ ...m, pos: idx, contentStart: endIdx });
        break;
      }
    }
  });

  if (found.length === 0) return null;

  found.sort((a, b) => a.pos - b.pos);
  const result = {};
  for (let i = 0; i < found.length; i++) {
    const current = found[i];
    const nextPos = i + 1 < found.length ? found[i + 1].pos : normalized.length;
    result[current.key] = normalized.slice(current.contentStart, nextPos).trim();
  }
  return result;
}

function ClinicalReportCard({ summaryText }) {
  const sections = useMemo(() => parseClinicalSections(summaryText), [summaryText]);

  if (!summaryText) {
    return <p className="text-sm text-slate-500">No hay un informe disponible.</p>;
  }

  if (!sections) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {summaryText}
      </p>
    );
  }

  const items = [
    {
      key: 'motivo',
      title: 'MOTIVO DE CONSULTA',
      content: sections.motivo,
      containerClass: 'border-blue-200/80 bg-blue-50/40',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      key: 'exploracion',
      title: 'EXPLORACIÓN FÍSICA',
      content: sections.exploracion,
      containerClass: 'border-emerald-200/80 bg-emerald-50/40',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      key: 'diagnostico',
      title: 'IMPRESIÓN DIAGNÓSTICA',
      content: sections.diagnostico,
      containerClass: 'border-violet-200/80 bg-violet-50/40',
      badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    },
    {
      key: 'plan',
      title: 'PLAN Y TRATAMIENTO',
      content: sections.plan,
      containerClass: 'border-amber-200/80 bg-amber-50/40',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.key}
          className={`rounded-xl border p-3.5 transition ${item.containerClass}`}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${item.badgeClass}`}>
              {item.title}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {item.content || 'No referido en esta consulta.'}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function PatientTranscription() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingAction, setDownloadingAction] = useState(null); // { id: number, type: 'report' | 'transcript' }
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

  const downloadClinicalReport = async (reportId) => {
    setDownloadingAction({ id: reportId, type: 'report' });
    setError('');
    try {
      await medicalChatService.downloadClinicalReport(reportId, user?.id);
    } catch (downloadError) {
      console.error('Error al descargar el informe médico aprobado:', downloadError);
      setError(downloadError?.response?.data?.detail || 'No se pudo descargar el informe médico PDF.');
    } finally {
      setDownloadingAction(null);
    }
  };

  const downloadTranscript = async (reportId) => {
    setDownloadingAction({ id: reportId, type: 'transcript' });
    setError('');
    try {
      await medicalChatService.downloadTranscriptPdf(reportId, user?.id);
    } catch (downloadError) {
      console.error('Error al descargar la transcripción PDF:', downloadError);
      setError(downloadError?.response?.data?.detail || 'No se pudo descargar la transcripción PDF.');
    } finally {
      setDownloadingAction(null);
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
              Escucha las grabaciones de tus consultas. El informe médico y la transcripción quedan disponibles cuando el médico los aprueba.
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
                      Consulta {reports.length - index}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={15} />
                      {formatDate(report.recorded_at || report.created_at)}
                      {report.doctor_name ? ` · ${report.doctor_name}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Servicio: Videollamada
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      report.summary_approved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {report.summary_approved ? 'Resumen aprobado' : 'Grabación disponible · Resumen pendiente'}
                    </span>
                  </div>
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

                  {report.summary_approved ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadClinicalReport(report.id)}
                        disabled={downloadingAction?.id === report.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Descargar Informe Médico oficial en PDF"
                      >
                        {downloadingAction?.id === report.id && downloadingAction?.type === 'report' ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <FileText size={15} />
                        )}
                        Informe Médico (PDF)
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTranscript(report.id)}
                        disabled={downloadingAction?.id === report.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-50 hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Descargar la Transcripción completa en PDF"
                      >
                        {downloadingAction?.id === report.id && downloadingAction?.type === 'transcript' ? (
                          <Loader2 size={15} className="animate-spin text-violet-600" />
                        ) : (
                          <Download size={15} />
                        )}
                        Transcripción (PDF)
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
                      PDFs disponibles cuando el médico apruebe el resumen
                    </span>
                  )}
                </div>

                {report.summary_approved && (
                  <div className="grid gap-6 border-t border-slate-100 p-5 md:p-6">
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FileText size={17} className="text-blue-600" />
                        Informe Médico Aprobado
                      </h3>
                      <ClinicalReportCard summaryText={report.summary_text} />
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
