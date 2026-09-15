import React, { useState } from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    turquoise: "#14b8a6",
    green: "#22c55e",
    muted: "#64748b",
};

export default function MedicalImagePreview({
    file = null,
    imageUrl = null,
    colors = DEFAULT_COLORS,
    onConfirm,
    onCancel,
    onClose,
    mode = "preview",
    title = "Vista previa",
}) {
    const [loading, setLoading] = useState(false);

    const previewUrl = getPreviewUrl(file, imageUrl);

    const handleConfirm = async () => {
        if (!onConfirm || loading) {
            return;
        }

        try {
            setLoading(true);
            await onConfirm(file);
        } catch (error) {
            console.error(
                "Error procesando imagen:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (loading) {
            return;
        }

        if (onCancel) {
            onCancel();
            return;
        }

        onClose?.();
    };

    if (!previewUrl) {
        return null;
    }

    const isPreviewMode =
        mode === "preview";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
            onClick={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose?.();
                }
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b px-4 py-3 md:px-5">
                    <div>
                        <h2
                            className="text-sm font-bold"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            {title}
                        </h2>

                        {file && (
                            <p className="mt-0.5 max-w-[300px] truncate text-xs text-slate-500">
                                {file.name}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                {/* IMAGEN */}
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-4 md:p-8">
                    <img
                        src={previewUrl}
                        alt={
                            file?.name ||
                            "Imagen médica"
                        }
                        className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-sm"
                    />
                </div>

                {/* FOOTER */}
                {isPreviewMode && (
                    <div className="flex items-center justify-end gap-2 border-t bg-white px-4 py-3 md:px-5">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            style={{
                                borderColor:
                                    "#e2e8f0",
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={
                                handleConfirm
                            }
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                            }}
                        >
                            {loading ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
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
                                        d="M22 2L11 13"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M22 2l-7-4"
                                    />
                                </svg>
                            )}

                            Enviar imagen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function getPreviewUrl(file, imageUrl) {
    if (imageUrl) {
        return imageUrl;
    }

    if (file instanceof File) {
        return URL.createObjectURL(file);
    }

    if (
        file instanceof Blob
    ) {
        return URL.createObjectURL(file);
    }

    return null;
}