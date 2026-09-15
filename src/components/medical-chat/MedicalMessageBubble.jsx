import React, { useState, useRef } from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    turquoise: "#14b8a6",
    green: "#22c55e",
    text: "#0f172a",
    muted: "#64748b",
};

export default function MedicalMessageBubble({
    message,
    currentUserId,
    role,
    colors = DEFAULT_COLORS,
    onAttachmentClick,
}) {
    const senderId =
        message?.sender_id ??
        message?.senderId ??
        message?.sender?.id;

    const isMine =
        Number(senderId) === Number(currentUserId);

    const messageText =
        message?.message ??
        message?.content ??
        "";

    const createdAt =
        message?.created_at ??
        message?.createdAt;

    const attachments =
        message?.attachments || [];

    const isAudio =
        message?.attachment_type === "audio" ||
        attachments.some(
            (attachment) =>
                attachment?.attachment_type === "audio" ||
                attachment?.mime_type?.startsWith("audio/")
        );

    const time = formatMessageTime(createdAt);

    const isCallEvent =
        message?.attachment_type === "video_call" ||
        messageText.startsWith("[Videollamada") ||
        messageText.startsWith("[Videoconferencia") ||
        messageText.startsWith("[Llamada");

    if (isCallEvent) {
        const cleanText = messageText.replace(/^\[|\]$/g, "");
        const isEnded = cleanText.toLowerCase().includes("finalizada") || cleanText.toLowerCase().includes("terminada") || cleanText.toLowerCase().includes("cancelada");
        return (
            <div className="flex w-full justify-center my-3 animate-in fade-in duration-200">
                <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2 text-xs font-semibold shadow-xs backdrop-blur ${
                    isEnded
                        ? "bg-slate-100/90 border-slate-200 text-slate-700"
                        : "bg-teal-50/90 border-teal-200 text-teal-900"
                }`}>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full shadow-xs ${
                        isEnded ? "bg-slate-600 text-white" : "bg-teal-600 text-white"
                    }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.73A1 1 0 0121 8.13v7.74a1 1 0 01-1.45.86L15 14" />
                            <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
                        </svg>
                    </div>
                    <span>{cleanText}</span>
                    <span className="text-[10px] opacity-70 font-normal ml-1">{time}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex w-full ${
                isMine
                    ? "justify-end"
                    : "justify-start"
            }`}
        >
            <div
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 shadow-sm md:max-w-[70%] ${
                    isMine
                        ? "rounded-br-md"
                        : "rounded-bl-md"
                }`}
                style={{
                    backgroundColor: isMine
                        ? colors.blue
                        : "#ffffff",

                    color: isMine
                        ? "#ffffff"
                        : colors.text,

                    border: isMine
                        ? "none"
                        : "1px solid #e2e8f0",
                }}
            >
                {/* ==================================================
                    TEXTO
                ================================================== */}
                {messageText && messageText !== "[Mensaje de Voz]" && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-5">
                        {messageText}
                    </p>
                )}

                {/* ==================================================
                    ADJUNTOS
                ================================================== */}
                {attachments.length > 0 && (
                    <div
                        className={`${
                            messageText
                                ? "mt-2"
                                : ""
                        } space-y-2`}
                    >
                        {attachments.map(
                            (attachment, index) => (
                                <MessageAttachment
                                    key={
                                        attachment?.id ??
                                        `attachment-${index}`
                                    }
                                    attachment={
                                        attachment
                                    }
                                    isMine={isMine}
                                    colors={colors}
                                    onClick={() =>
                                        onAttachmentClick?.(
                                            attachment
                                        )
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {/* ==================================================
                    MENSAJE DE AUDIO
                ================================================== */}
                {isAudio &&
                    attachments.length === 0 && (
                        <div className="mt-1 flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    isMine
                                        ? "bg-white/20"
                                        : "bg-blue-50"
                                }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
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
                            </div>

                            <span className="text-xs">
                                Mensaje de voz
                            </span>
                        </div>
                    )}

                {/* ==================================================
                    HORA / ESTADO
                ================================================== */}
                <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isMine
                            ? "text-blue-100"
                            : "text-slate-400"
                    }`}
                >
                    <span>{time}</span>

                    {isMine && (
                        <MessageStatus
                            message={message}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   ADJUNTO
================================================================ */

function MessageAttachment({
    attachment,
    isMine,
    colors,
}) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const mimeType = attachment?.mime_type || "";
    const fileUrl = attachment?.file_url || attachment?.url || null;
    const fileName = attachment?.file_name || "Archivo";

    const isImage = mimeType.startsWith("image/") || attachment?.attachment_type === "image";
    const isAudio = mimeType.startsWith("audio/") || attachment?.attachment_type === "audio";
    const isVideo = mimeType.startsWith("video/") || attachment?.attachment_type === "video";

    const fileTypeInfo = getFileTypeInfoByName(fileName, mimeType);

    /* Imagen */
    if (isImage && fileUrl) {
        return (
            <>
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 shadow-sm max-w-xs transition-all hover:shadow-md">
                    <img
                        src={fileUrl}
                        alt={fileName}
                        onClick={() => setIsLightboxOpen(true)}
                        className="max-h-72 w-full rounded-2xl object-cover cursor-pointer transition-opacity hover:opacity-95"
                    />

                    {/* Acciones en overlay al pasar mouse */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-between text-white">
                        <span className="truncate max-w-[140px] text-[11px] font-medium">{fileName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur text-white transition cursor-pointer"
                                title="Abrir en pestaña nueva"
                            >
                                <ExternalLinkIcon />
                            </a>
                            <a
                                href={fileUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur text-white transition cursor-pointer"
                                title="Descargar imagen"
                            >
                                <DownloadIcon />
                            </a>
                        </div>
                    </div>
                </div>

                {/* MODAL LIGHTBOX PARA IMAGEN FULL RESOLUTION */}
                {isLightboxOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
                            {/* Barra superior de controles */}
                            <div className="absolute -top-12 right-0 flex items-center gap-3">
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium backdrop-blur transition"
                                >
                                    <ExternalLinkIcon />
                                    <span>Abrir en otra pestaña</span>
                                </a>
                                <a
                                    href={fileUrl}
                                    download={fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-md transition"
                                >
                                    <DownloadIcon />
                                    <span>Descargar</span>
                                </a>
                                <button
                                    onClick={() => setIsLightboxOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                                    title="Cerrar vista previa"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Imagen principal */}
                            <img
                                src={fileUrl}
                                alt={fileName}
                                className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
                            />
                        </div>
                    </div>
                )}
            </>
        );
    }

    /* Audio */
    if (isAudio && fileUrl) {
        return <CustomAudioPlayer src={fileUrl} isMine={isMine} colors={colors} />;
    }

    /* Video */
    if (isVideo && fileUrl) {
        return (
            <div className="flex flex-col gap-1.5 max-w-xs">
                <video controls preload="metadata" src={fileUrl} className="max-h-72 max-w-full rounded-2xl border border-slate-200/50 shadow-sm" />
                <div className="flex items-center justify-end gap-2 text-xs">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                        <ExternalLinkIcon /> Abrir
                    </a>
                </div>
            </div>
        );
    }

    /* Archivo / Documento (PDF, DOCX, XLS, ZIP, etc.) */
    return (
        <div
            className={`flex w-full min-w-[260px] max-w-md items-center justify-between gap-3 rounded-2xl p-3 transition border ${
                isMine
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs shadow-sm border border-slate-200/50"
                    style={{
                        backgroundColor: isMine ? "rgba(255,255,255,0.2)" : fileTypeInfo.bg,
                        color: isMine ? "#ffffff" : fileTypeInfo.color,
                    }}
                >
                    {fileTypeInfo.label}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-snug">
                        {fileName}
                    </p>
                    {attachment?.file_size && (
                        <p className={`text-[11px] ${isMine ? "text-blue-100" : "text-slate-400"}`}>
                            {formatFileSize(attachment.file_size)}
                        </p>
                    )}
                </div>
            </div>

            {/* Acciones: Abrir en pestaña nueva y Descargar directo */}
            <div className="flex items-center gap-1.5 shrink-0">
                {fileUrl && (
                    <>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer ${
                                isMine
                                    ? "bg-white/20 hover:bg-white/35 text-white"
                                    : "bg-slate-200/70 hover:bg-slate-300 text-slate-700"
                            }`}
                            title="Abrir en otra pestaña"
                        >
                            <ExternalLinkIcon />
                        </a>
                        <a
                            href={fileUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer ${
                                isMine
                                    ? "bg-white/20 hover:bg-white/35 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            }`}
                            title="Descargar archivo"
                        >
                            <DownloadIcon />
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

function ExternalLinkIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14L21 3" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l4 4 4-4" />
        </svg>
    );
}

function getFileTypeInfoByName(fileName, mimeType) {
    const name = fileName || "";
    const ext = name.split(".").pop().toLowerCase();
    const mime = mimeType || "";

    if (mime.startsWith("image/")) return { label: "IMG", color: "#06b6d4", bg: "#ecfeff" };
    if (ext === "pdf" || mime === "application/pdf") return { label: "PDF", color: "#ef4444", bg: "#fef2f2" };
    if (["doc", "docx"].includes(ext)) return { label: "DOC", color: "#2563eb", bg: "#eff6ff" };
    if (["xls", "xlsx", "csv"].includes(ext)) return { label: "XLS", color: "#16a34a", bg: "#f0fdf4" };
    if (["zip", "rar", "7z"].includes(ext)) return { label: "ZIP", color: "#d97706", bg: "#fffbeb" };
    return { label: ext.toUpperCase().slice(0, 4) || "FILE", color: "#6366f1", bg: "#eef2ff" };
}

/* ================================================================
   ESTADO DEL MENSAJE
================================================================ */

function MessageStatus({ message }) {
    if (message?.is_read) {
        return (
            <span
                className="font-bold tracking-[-3px]"
                title="Leído"
            >
                ✓✓
            </span>
        );
    }

    return (
        <span
            className="font-semibold"
            title="Enviado"
        >
            ✓
        </span>
    );
}

/* ================================================================
   HELPERS
================================================================ */

function formatMessageTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatFileSize(bytes) {
    if (!bytes) {
        return "";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ================================================================
   REPRODUCTOR DE AUDIO PERSONALIZADO (NOTAS DE VOZ)
================================================================ */

function CustomAudioPlayer({ src, isMine, colors }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleSeek = (e) => {
        const val = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = val;
            setCurrentTime(val);
        }
    };

    const formatTime = (secs) => {
        if (isNaN(secs) || secs <= 0) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`flex items-center gap-3 py-1.5 px-3 rounded-2xl min-w-[230px] my-1 ${
            isMine ? "bg-white/15 text-white" : "bg-slate-100 text-slate-800"
        }`}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                preload="metadata"
            />
            {/* Botón Play/Pausa */}
            <button
                type="button"
                onClick={togglePlay}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md transition transform active:scale-95 ${
                    isMine
                        ? "bg-white text-blue-600 hover:bg-slate-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
            >
                {isPlaying ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            {/* Barra de progreso y tiempos */}
            <div className="flex flex-1 flex-col gap-1 min-w-[120px]">
                <div className="relative flex items-center h-2 w-full">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isMine ? "bg-white/30" : "bg-slate-300"}`}>
                        <div
                            className={`h-full transition-all ${isMine ? "bg-white" : "bg-blue-600"}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium opacity-90 tracking-wide">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}