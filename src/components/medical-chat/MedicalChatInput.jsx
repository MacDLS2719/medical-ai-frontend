import React, {
    useEffect,
    useRef,
    useState,
} from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    sky: "#e0f2fe",
    turquoise: "#14b8a6",
    green: "#22c55e",
    text: "#0f172a",
    muted: "#64748b",
};

export default function MedicalChatInput({
    conversation = null,
    role,
    colors = DEFAULT_COLORS,
    permissions = {},

    value = "",
    onChange,

    onSendMessage,
    onSendAudio,
    onSendFile,
    onSendImage,

    disabled = false,
    sending = false,
}) {
    const [localValue, setLocalValue] = useState(value);

    // Archivo o Imagen en vista previa antes de enviar
    const [stagedFile, setStagedFile] = useState(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    const canReply = permissions?.canReply !== false;
    const canSendAudio = permissions?.canSendAudio === true;
    const canSendFiles = permissions?.canSendFiles === true;
    const canSendImages = permissions?.canSendImages === true;

    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (stagedFile?.previewUrl) {
                URL.revokeObjectURL(stagedFile.previewUrl);
            }
        };
    }, []);

    const updateValue = (newValue) => {
        setLocalValue(newValue);
        onChange?.(newValue);
    };

    const clearStagedFile = () => {
        if (stagedFile?.previewUrl) {
            URL.revokeObjectURL(stagedFile.previewUrl);
        }
        setStagedFile(null);
    };

    /* ============================================================
       SELECCIONAR ARCHIVO PARA VISTA PREVIA
    ============================================================ */
    const handleFileSelected = (event, type) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (type === "file" && !canSendFiles) return;
        if (type === "image" && !canSendImages) return;

        // Limpiar archivo anterior si existía
        if (stagedFile?.previewUrl) {
            URL.revokeObjectURL(stagedFile.previewUrl);
        }

        const isImg = file.type.startsWith("image/") || type === "image";
        let previewUrl = null;

        if (isImg) {
            try {
                previewUrl = URL.createObjectURL(file);
            } catch (e) {
                console.error("Error creando preview:", e);
            }
        }

        setStagedFile({
            file,
            type: isImg ? "image" : "file",
            previewUrl,
        });
    };

    /* ============================================================
       ENVIAR MENSAJE (TEXTO Y/O ARCHIVO ADJUNTO EN VISTA PREVIA)
    ============================================================ */
    const handleSubmit = async (event) => {
        event?.preventDefault();

        if (disabled || sending || !canReply) {
            return;
        }

        const messageText = localValue.trim();

        if (!messageText && !stagedFile) {
            return;
        }

        try {
            // 1. Enviar el archivo staged si existe
            if (stagedFile) {
                const targetFile = stagedFile.file;
                const fileType = stagedFile.type;

                if (fileType === "image") {
                    await onSendImage?.(targetFile);
                } else {
                    await onSendFile?.(targetFile);
                }

                clearStagedFile();
            }

            // 2. Enviar texto si había algo escrito
            if (messageText) {
                await onSendMessage?.(messageText);
                updateValue("");
            }
        } catch (error) {
            console.error("Error enviando mensaje/adjunto:", error);
        }
    };

    /* ============================================================
       AUDIO
    ============================================================ */
    const startRecording = async () => {
        if (!canSendAudio || disabled || sending || isRecording) {
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: recorder.mimeType || "audio/webm",
                });

                stream.getTracks().forEach((track) => track.stop());

                if (blob.size > 0) {
                    try {
                        await onSendAudio?.(blob, recordingTime);
                    } catch (error) {
                        console.error("Error enviando audio:", error);
                    }
                }
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("No se pudo acceder al micrófono:", error);
        }
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        setIsRecording(false);
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
    };

    const hasText = localValue.trim().length > 0;
    const canSubmit = (hasText || !!stagedFile) && !disabled && !sending && canReply;

    if (!conversation) {
        return null;
    }

    const fileInfo = stagedFile ? getFileTypeInfo(stagedFile.file) : null;

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t bg-white px-3 py-3 md:px-5 relative"
            style={{ borderColor: "#e2e8f0" }}
        >
            {/* ==================================================
                VISTA PREVIA MEJORADA DE ARCHIVO / IMAGEN (PRE-SEND)
            ================================================== */}
            {stagedFile && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-2.5 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {stagedFile.previewUrl ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                                <img
                                    src={stagedFile.previewUrl}
                                    alt="Vista previa"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs shadow-sm border border-slate-200/60"
                                style={{
                                    backgroundColor: fileInfo?.bg,
                                    color: fileInfo?.color,
                                }}
                            >
                                {fileInfo?.label}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="truncate text-xs font-semibold text-slate-800">
                                    {stagedFile.file.name}
                                </span>
                                <span
                                    className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                    style={{
                                        backgroundColor: fileInfo?.bg || "#f1f5f9",
                                        color: fileInfo?.color || "#475569",
                                    }}
                                >
                                    {stagedFile.type === "image" ? "Imagen" : "Archivo"}
                                </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span>{formatFileSize(stagedFile.file.size)}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-teal-600 font-medium">Listo para enviar</span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={clearStagedFile}
                        disabled={sending}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                        title="Quitar archivo adjunto"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ==================================================
                GRABANDO AUDIO
            ================================================== */}
            {isRecording ? (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={cancelRecording}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                        title="Cancelar grabación"
                    >
                        ✕
                    </button>

                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-red-50 px-4 py-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                        <span className="text-sm font-medium text-red-600">
                            Grabando {formatDuration(recordingTime)}
                        </span>
                        <div className="flex flex-1 items-center gap-1">
                            {[3, 6, 4, 8, 5, 7, 3, 6].map((height, index) => (
                                <span
                                    key={index}
                                    className="w-1 rounded-full bg-red-300"
                                    style={{ height: `${height * 2}px` }}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={stopRecording}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm cursor-pointer"
                        style={{ backgroundColor: colors.blue }}
                        title="Enviar audio"
                    >
                        ✓
                    </button>
                </div>
            ) : (
                <div className="flex items-end gap-2">
                    {/* ==================================================
                        BOTÓN IMAGEN
                    ================================================== */}
                    {canSendImages && (
                        <>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => handleFileSelected(event, "image")}
                            />

                            <button
                                type="button"
                                disabled={disabled || sending}
                                onClick={() => imageInputRef.current?.click()}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                title="Seleccionar imagen para enviar"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 15l-5-5L5 21"
                                    />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* ==================================================
                        BOTÓN ARCHIVO
                    ================================================== */}
                    {canSendFiles && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.txt,image/*,video/*"
                                className="hidden"
                                onChange={(event) => handleFileSelected(event, "file")}
                            />

                            <button
                                type="button"
                                disabled={disabled || sending}
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                title="Adjuntar documento o archivo"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                                    />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* ==================================================
                        INPUT TEXTO
                    ================================================== */}
                    <textarea
                        value={localValue}
                        onChange={(event) => updateValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSubmit();
                            }
                        }}
                        disabled={disabled || sending || !canReply}
                        rows={1}
                        placeholder={
                            canReply
                                ? stagedFile
                                    ? "Añadir un comentario (opcional)..."
                                    : "Escribe un mensaje..."
                                : "No puedes responder esta conversación"
                        }
                        className="max-h-28 min-h-[42px] min-w-0 flex-1 resize-none rounded-2xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                            borderColor: "#e2e8f0",
                            color: colors.text,
                        }}
                    />

                    {/* ==================================================
                        AUDIO
                    ================================================== */}
                    {canSendAudio && !stagedFile && (
                        <button
                            type="button"
                            disabled={disabled || sending}
                            onClick={startRecording}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            title="Grabar mensaje de voz"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"
                                />
                            </svg>
                        </button>
                    )}

                    {/* ==================================================
                        BOTÓN ENVIAR
                    ================================================== */}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        style={{
                            background: "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                        }}
                        title={stagedFile ? "Enviar archivo" : "Enviar mensaje"}
                    >
                        {sending ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </form>
    );
}

function getFileTypeInfo(file) {
    if (!file) return { label: "FILE", color: "#2563eb", bg: "#eff6ff" };
    const name = file.name || "";
    const ext = name.split(".").pop().toLowerCase();
    const mime = file.type || "";

    if (mime.startsWith("image/")) {
        return { label: "IMG", color: "#06b6d4", bg: "#ecfeff" };
    }
    if (ext === "pdf" || mime === "application/pdf") {
        return { label: "PDF", color: "#ef4444", bg: "#fef2f2" };
    }
    if (["doc", "docx"].includes(ext)) {
        return { label: "DOC", color: "#2563eb", bg: "#eff6ff" };
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return { label: "XLS", color: "#16a34a", bg: "#f0fdf4" };
    }
    if (["zip", "rar", "7z"].includes(ext)) {
        return { label: "ZIP", color: "#d97706", bg: "#fffbeb" };
    }
    return { label: ext.toUpperCase().slice(0, 4) || "FILE", color: "#6366f1", bg: "#eef2ff" };
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}