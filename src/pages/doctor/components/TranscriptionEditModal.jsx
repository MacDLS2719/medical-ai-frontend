import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileUp,
  Headphones,
  Loader2,
  Save,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { medicalChatService } from '../../../services/medicalChatService';

function parseClinicalSections(text) {
  if (!text) return { motivo: '', exploracion: '', diagnostico: '', plan: '' };
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

  if (found.length === 0) {
    return {
      motivo: text.trim(),
      exploracion: '',
      diagnostico: '',
      plan: '',
    };
  }

  found.sort((a, b) => a.pos - b.pos);
  const result = { motivo: '', exploracion: '', diagnostico: '', plan: '' };
  for (let i = 0; i < found.length; i++) {
    const current = found[i];
    const nextPos = i + 1 < found.length ? found[i + 1].pos : normalized.length;
    result[current.key] = normalized.slice(current.contentStart, nextPos).trim();
  }
  return result;
}

export default function TranscriptionEditModal({
  isOpen,
  onClose,
  recording,
  userId,
  patients = [],
  onSaved,
}) {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'transcript' | 'upload'
  const [motivo, setMotivo] = useState('');
  const [exploracion, setExploracion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [plan, setPlan] = useState('');
  const [transcript, setTranscript] = useState('');
  const [patientId, setPatientId] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [uploadingDocx, setUploadingDocx] = useState(false);
  const [downloadingType, setDownloadingType] = useState(null); // 'report-docx' | 'transcript-docx' | 'report-pdf' | 'transcript-pdf'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  // Inicializar campos con datos del recording seleccionado
  useEffect(() => {
    if (!isOpen || !recording) return;

    const parsed = parseClinicalSections(recording.summary_text || '');
    setMotivo(parsed.motivo || '');
    setExploracion(parsed.exploracion || '');
    setDiagnostico(parsed.diagnostico || '');
    setPlan(parsed.plan || '');
    setTranscript(recording.transcript_text || '');
    setPatientId(recording.patient_id ? String(recording.patient_id) : '');
    setIsApproved(Boolean(recording.summary_approved));
    setActiveTab('clinical');
    setError('');
    setSuccessMsg('');
  }, [isOpen, recording]);

  if (!isOpen || !recording) return null;

  const isPresencial = !recording.conversation_id;

  const handleSave = async (shouldApprove = false) => {
    setError('');
    setSuccessMsg('');
    if (shouldApprove) {
      setApproving(true);
    } else {
      setSaving(true);
    }

    try {
      const payload = {
        motivo,
        exploracion,
        diagnostico,
        plan,
        transcript_text: transcript,
        patient_id: patientId ? Number(patientId) : null,
        summary_approved: shouldApprove ? true : isApproved,
      };

      const updated = await medicalChatService.updateCallTranscription(
        recording.id,
        payload,
        userId
      );

      setIsApproved(Boolean(updated.summary_approved));
      setSuccessMsg(
        shouldApprove
          ? '¡Informe aprobado y guardado con éxito! Ahora está disponible y visible para el paciente.'
          : 'Borrador guardado exitosamente.'
      );

      if (onSaved) {
        onSaved(updated);
      }
    } catch (saveError) {
      console.error('Error al guardar cambios de la transcripción:', saveError);
      setError(
        saveError?.response?.data?.detail ||
          'No se pudieron guardar los cambios. Inténtalo nuevamente.'
      );
    } finally {
      setSaving(false);
      setApproving(false);
    }
  };

  const handleDocxUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');
    setUploadingDocx(true);

    try {
      const res = await medicalChatService.uploadDocxTranscription(
        recording.id,
        file,
        false,
        userId
      );

      const data = res?.data;
      if (data) {
        if (data.summary_text) {
          const parsed = parseClinicalSections(data.summary_text);
          setMotivo(parsed.motivo || '');
          setExploracion(parsed.exploracion || '');
          setDiagnostico(parsed.diagnostico || '');
          setPlan(parsed.plan || '');
        }
        if (data.transcript_text) {
          setTranscript(data.transcript_text);
        }
        setSuccessMsg(
          `Archivo Word "${file.name}" cargado y procesado correctamente. Revisa el contenido y haz clic en "Aprobar y Guardar".`
        );
        setActiveTab('clinical');
        if (onSaved) {
          onSaved(data);
        }
      }
    } catch (uploadError) {
      console.error('Error al subir archivo Word:', uploadError);
      setError(
        uploadError?.response?.data?.detail ||
          'No se pudo leer el archivo Word. Asegúrate de que sea un archivo .docx válido.'
      );
    } finally {
      setUploadingDocx(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (type) => {
    setDownloadingType(type);
    setError('');
    try {
      if (type === 'report-docx') {
        await medicalChatService.downloadClinicalReportDocx(recording.id, userId);
      } else if (type === 'transcript-docx') {
        await medicalChatService.downloadTranscriptDocx(recording.id, userId);
      } else if (type === 'report-pdf') {
        await medicalChatService.downloadClinicalReport(recording.id, userId);
      } else if (type === 'transcript-pdf') {
        await medicalChatService.downloadTranscriptPdf(recording.id, userId);
      }
    } catch (downloadErr) {
      console.error('Error al descargar documento:', downloadErr);
      setError(
        downloadErr?.response?.data?.detail ||
          'No se pudo descargar el archivo solicitado.'
      );
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {isPresencial ? 'Gestionar Consulta Presencial' : 'Gestionar Videollamada'}
                </h2>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                  {isPresencial ? 'Presencial' : 'Videollamada'}
                </span>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <CheckCircle size={12} /> Aprobado
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                    Pendiente de aprobación
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Edita las secciones clínicas, descarga o sube en Word (.docx) y aprueba el informe para el paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || approving || uploadingDocx}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              title="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Notificaciones de Éxito / Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 animate-in fade-in">
            <Check size={16} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Barra de Pestañas y Acciones de Descarga */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-2.5 bg-white">
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('clinical')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'clinical'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText size={14} />
              Informe Médico (4 Secciones)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transcript')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'transcript'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Headphones size={14} />
              Transcripción de Audio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileUp size={14} />
              Cargar Archivo Word (.docx)
            </button>
          </nav>

          {/* Menú de Descarga Rápida en Word y PDF */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Descargar:</span>
            {/* Word Informe */}
            <button
              type="button"
              onClick={() => handleDownload('report-docx')}
              disabled={downloadingType !== null}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
              title="Descargar informe médico en Word editable (.docx)"
            >
              {downloadingType === 'report-docx' ? (
                <Loader2 size={12} className="animate-spin text-blue-600" />
              ) : (
                <FileText size={12} className="text-blue-600" />
              )}
              Informe (Word)
            </button>

            {/* Word Transcripción */}
            <button
              type="button"
              onClick={() => handleDownload('transcript-docx')}
              disabled={downloadingType !== null}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
              title="Descargar transcripción en Word editable (.docx)"
            >
              {downloadingType === 'transcript-docx' ? (
                <Loader2 size={12} className="animate-spin text-violet-600" />
              ) : (
                <Download size={12} className="text-violet-600" />
              )}
              Transcripción (Word)
            </button>

            {/* PDF Informe */}
            <button
              type="button"
              onClick={() => handleDownload('report-pdf')}
              disabled={downloadingType !== null}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              title="Descargar informe en PDF oficial"
            >
              {downloadingType === 'report-pdf' ? (
                <Loader2 size={12} className="animate-spin text-slate-600" />
              ) : (
                <FileDown size={12} className="text-slate-600" />
              )}
              Informe (PDF)
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Asignación de paciente si es consulta presencial */}
          {isPresencial && patients.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <label htmlFor="patient-select" className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
                <User size={14} className="text-violet-600" />
                Vincular Paciente (Opcional para que aparezca en el portal del paciente):
              </label>
              <select
                id="patient-select"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none"
              >
                <option value="">-- Sin paciente asignado (Consulta personal interna) --</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_name || `Paciente #${p.patient_id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 1: INFORME MÉDICO ESTRUCTURADO */}
          {activeTab === 'clinical' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Edita cada una de las 4 secciones del informe clínico oficial.
                </p>
                <span className="text-[11px] text-slate-400">
                  Formato compatible con Mivor Salud Digital
                </span>
              </div>

              {/* 1. Motivo de consulta */}
              <div className="rounded-2xl border border-blue-200/90 bg-blue-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-extrabold tracking-wide text-blue-800">
                    MOTIVO DE CONSULTA
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {motivo.length} caracteres
                  </span>
                </div>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  placeholder="Síntomas principales, motivo o razón de la consulta médica..."
                  className="w-full rounded-xl border border-blue-200 bg-white p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* 2. Exploración física */}
              <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-extrabold tracking-wide text-emerald-800">
                    EXPLORACIÓN FÍSICA
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {exploracion.length} caracteres
                  </span>
                </div>
                <textarea
                  value={exploracion}
                  onChange={(e) => setExploracion(e.target.value)}
                  rows={3}
                  placeholder="Signos vitales, hallazgos físicos observados o indicados por el paciente..."
                  className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 3. Impresión diagnóstica */}
              <div className="rounded-2xl border border-violet-200/90 bg-violet-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-extrabold tracking-wide text-violet-800">
                    IMPRESIÓN DIAGNÓSTICA
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {diagnostico.length} caracteres
                  </span>
                </div>
                <textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  rows={3}
                  placeholder="Diagnóstico presuntivo, diferencial o confirmado..."
                  className="w-full rounded-xl border border-violet-200 bg-white p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {/* 4. Plan y tratamiento */}
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-extrabold tracking-wide text-amber-800">
                    PLAN Y TRATAMIENTO
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {plan.length} caracteres
                  </span>
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={3}
                  placeholder="Medicamentos, dosis prescritas, pautas terapéuticas, cuidados y próxima cita..."
                  className="w-full rounded-xl border border-amber-200 bg-white p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TRANSCRIPCIÓN COMPLETA DE AUDIO */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Texto de la Transcripción de Audio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Puedes corregir términos médicos, nombres o detalles de la transcripción antes de aprobarla.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {transcript.length} caracteres
                </span>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={16}
                placeholder="Escribe o corrige la transcripción completa de la consulta..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-mono leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          )}

          {/* TAB 3: CARGA DE ARCHIVO WORD (.DOCX) */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Upload size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Cargar Informe o Transcripción en Word (.docx)
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  Descarga previamente el archivo en Word, haz los cambios necesarios en tu editor preferido (Microsoft Word, Google Docs) y súbelo aquí. El sistema detectará automáticamente las secciones.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,.txt"
                  onChange={handleDocxUpload}
                  className="hidden"
                  id="docx-file-upload"
                />

                <div className="mt-5 flex justify-center">
                  <label
                    htmlFor="docx-file-upload"
                    className={`inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 cursor-pointer ${
                      uploadingDocx ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingDocx ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        Procesando archivo Word...
                      </>
                    ) : (
                      <>
                        <FileUp size={16} />
                        Seleccionar archivo Word (.docx)
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Guía rápida */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-emerald-600" />
                  Estructura recomendada en el documento Word:
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li><strong className="text-blue-700">MOTIVO DE CONSULTA:</strong> Síntomas o motivo principal.</li>
                  <li><strong className="text-emerald-700">EXPLORACIÓN FÍSICA:</strong> Hallazgos físicos o signos vitales.</li>
                  <li><strong className="text-violet-700">IMPRESIÓN DIAGNÓSTICA:</strong> Diagnósticos clínicos.</li>
                  <li><strong className="text-amber-700">PLAN Y TRATAMIENTO:</strong> Medicamentos, dosis y pautas.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Botones de Guardado y Aprobación */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || approving || uploadingDocx}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Cerrar
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Guardar Borrador */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || approving || uploadingDocx}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>

            {/* Aprobar y Guardar */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || approving || uploadingDocx}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 disabled:opacity-50"
            >
              {approving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Aprobando informe...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  {isApproved ? 'Guardar y mantener aprobado' : 'Aprobar y Guardar'}
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
