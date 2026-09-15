import React, { useRef, useState } from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    sky: "#e0f2fe",
    turquoise: "#14b8a6",
    green: "#22c55e",
};

export default function MedicalFileUploader({
    colors = DEFAULT_COLORS,
    role,
    disabled = false,
    accept = "*/*",
    maxSize = 20 * 1024 * 1024,
    multiple = false,
    label = "Adjuntar archivo",
    icon = "file",
    onFileSelected,
    onFilesSelected,
}) {
    const inputRef = useRef(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleOpenPicker = () => {
        if (disabled || uploading) return;
        inputRef.current?.click();
    };

    const handleChange = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";

        if (!files.length) return;

        setError(null);

        try {
            const validFiles = [];

            for (const file of files) {
                const validation = validateFile(file, maxSize);
                if (!validation.valid) {
                    setError(validation.error);
                    continue;
                }
                validFiles.push(file);
            }

            if (!validFiles.length) return;

            const file = validFiles[0];
            setSelectedFile(file);

            if (file.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }

            setUploading(true);

            if (multiple) {
                await onFilesSelected?.(validFiles);
            } else {
                await onFileSelected?.(file);
            }
        } catch (err) {
            console.error("Error procesando archivo:", err);
            setError("No fue posible procesar el archivo.");
        } finally {
            setUploading(false);
        }
    };

    const clearSelection = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const fileInfo = selectedFile ? getFileTypeInfo(selectedFile) : null;

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleChange}
            />

            {/* VISTA PREVIA SI HAY ARCHIVO SELECCIONADO */}
            {selectedFile && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {previewUrl ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                                <img
                                    src={previewUrl}
                                    alt="Vista previa"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm"
                                style={{
                                    backgroundColor: fileInfo?.bg,
                                    color: fileInfo?.color,
                                }}
                            >
                                {fileInfo?.label}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800">
                                {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={clearSelection}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                        title="Quitar selección"
                    >
                        ✕
                    </button>
                </div>
            )}

            <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleOpenPicker}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                title={label}
                aria-label={label}
            >
                {uploading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                ) : icon === "image" ? (
                    <ImageIcon />
                ) : (
                    <FileIcon />
                )}
            </button>

            {error && (
                <p className="max-w-xs text-[11px] text-red-500">
                    {error}
                </p>
            )}
        </div>
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

function validateFile(file, maxSize) {
    if (!file) {
        return { valid: false, error: "No se seleccionó ningún archivo." };
    }
    if (file.size <= 0) {
        return { valid: false, error: "El archivo está vacío." };
    }
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `El archivo supera el límite de ${formatFileSize(maxSize)}.`,
        };
    }
    return { valid: true };
}

function ImageIcon() {
    return (
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 17h5" />
        </svg>
    );
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}