import React, { useEffect, useRef, useState } from "react";
import { medicalChatService } from "../../services/medicalChatService";

// ─── Estrella interactiva ─────────────────────────────────────────────────────
function Star({ filled, hovered, onClick, onMouseEnter, onMouseLeave }) {
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                lineHeight: 0,
                transition: "transform 0.15s ease",
                transform: filled || hovered ? "scale(1.2)" : "scale(1)",
            }}
        >
            <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill={filled || hovered ? "#f59e0b" : "none"}
                stroke={filled || hovered ? "#f59e0b" : "#cbd5e1"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    transition: "all 0.15s ease",
                    filter: filled ? "drop-shadow(0 0 4px #fbbf2480)" : "none",
                }}
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        </button>
    );
}

const LABEL_MAP = { 1: "Muy malo", 2: "Regular", 3: "Bueno", 4: "Muy bueno", 5: "Excelente" };

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function DoctorReviewModal({
    isOpen,
    onClose,
    doctorName,
    doctorId,
    patientId,
    colors = {},
}) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingExisting, setFetchingExisting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const backdropRef = useRef(null);

    const primary = colors.primary || "#172554";
    const blue = colors.blue || "#2563eb";
    const turquoise = colors.turquoise || "#14b8a6";

    // Cargar reseña existente si la hay
    useEffect(() => {
        if (!isOpen || !patientId || !doctorId) return;
        setSuccess(false);
        setError(null);
        setFetchingExisting(true);
        medicalChatService
            .getPatientReview(patientId, doctorId)
            .then((data) => {
                if (data) {
                    setRating(data.rating);
                    setComment(data.comment || "");
                } else {
                    setRating(0);
                    setComment("");
                }
            })
            .catch(() => { setRating(0); setComment(""); })
            .finally(() => setFetchingExisting(false));
    }, [isOpen, patientId, doctorId]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setError("Por favor selecciona una calificación."); return; }
        setLoading(true);
        setError(null);
        try {
            await medicalChatService.submitReview({ doctorId, patientId, rating, comment: comment.trim() || null });
            setSuccess(true);
        } catch (err) {
            setError(err?.response?.data?.detail || "Ocurrió un error. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={backdropRef}
            onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
                animation: "drm-fadeIn 0.2s ease",
            }}
        >
            <div style={{
                background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
                margin: "0 16px", boxShadow: "0 24px 64px rgba(15,23,42,0.22)",
                overflow: "hidden", animation: "drm-slideUp 0.25s ease",
            }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${primary} 0%, #1e3a8a 100%)`, padding: "24px 28px 20px", position: "relative" }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)",
                            border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 18, transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                    >×</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${blue} 0%, ${turquoise} 100%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, fontWeight: 700, color: "#fff", flexShrink: 0,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                        }}>
                            {doctorName?.charAt(0)?.toUpperCase() || "M"}
                        </div>
                        <div>
                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, fontWeight: 500 }}>
                                Calificar al médico
                            </p>
                            <p style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "2px 0 0" }}>
                                {doctorName || "Médico"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: "28px" }}>
                    {fetchingExisting ? (
                        <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
                            <svg style={{ animation: "drm-spin 1s linear infinite", display: "inline-block", width: 28, height: 28 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                        </div>
                    ) : success ? (
                        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 18px", boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                                animation: "drm-popIn 0.4s ease",
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>¡Gracias por tu opinión!</h3>
                            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 }}>
                                Tu calificación de <strong>{rating} {rating === 1 ? "estrella" : "estrellas"}</strong> fue guardada exitosamente.
                            </p>
                            <button
                                onClick={onClose}
                                style={{
                                    width: "100%", padding: "12px",
                                    background: `linear-gradient(135deg, ${primary} 0%, #1e3a8a 100%)`,
                                    color: "#fff", border: "none", borderRadius: 12,
                                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                                }}
                            >Cerrar</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Estrellas */}
                            <div style={{ textAlign: "center", marginBottom: 6 }}>
                                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, fontWeight: 500 }}>
                                    ¿Cómo calificarías tu experiencia?
                                </p>
                                <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            filled={star <= rating}
                                            hovered={star <= hovered}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHovered(star)}
                                            onMouseLeave={() => setHovered(0)}
                                        />
                                    ))}
                                </div>
                                <div style={{ height: 28, marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    {(hovered || rating) ? (
                                        <span style={{
                                            fontSize: 13, fontWeight: 600, color: "#d97706",
                                            background: "#fef3c7", padding: "3px 14px", borderRadius: 99,
                                        }}>
                                            {LABEL_MAP[hovered || rating]}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* Comentario */}
                            <div style={{ marginTop: 12 }}>
                                <label htmlFor="drm-comment" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                    Comentario <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <textarea
                                    id="drm-comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Cuéntanos tu experiencia con este médico..."
                                    style={{
                                        width: "100%", padding: "12px 14px",
                                        border: "1.5px solid #e2e8f0", borderRadius: 12,
                                        fontSize: 14, color: "#0f172a", resize: "vertical",
                                        outline: "none", boxSizing: "border-box",
                                        fontFamily: "inherit", lineHeight: 1.5,
                                        background: "#f8fafc", transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = blue)}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                                />
                                <p style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
                                    {comment.length}/500
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    marginTop: 12, padding: "10px 14px",
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    borderRadius: 10, fontSize: 13, color: "#dc2626",
                                    display: "flex", alignItems: "center", gap: 8,
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Botones */}
                            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                <button
                                    type="button" onClick={onClose}
                                    style={{
                                        flex: 1, padding: "12px", background: "#f1f5f9",
                                        color: "#64748b", border: "none", borderRadius: 12,
                                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                                >Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={loading || rating === 0}
                                    style={{
                                        flex: 2, padding: "12px",
                                        background: rating > 0 ? `linear-gradient(135deg, ${primary} 0%, ${blue} 100%)` : "#e2e8f0",
                                        color: rating > 0 ? "#fff" : "#94a3b8",
                                        border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
                                        cursor: rating > 0 ? "pointer" : "not-allowed",
                                        opacity: loading ? 0.75 : 1,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <svg style={{ animation: "drm-spin 1s linear infinite", width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            Enviar calificación
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes drm-fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes drm-slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes drm-popIn { 0% { transform: scale(0.6); opacity: 0 } 80% { transform: scale(1.1) } 100% { transform: scale(1); opacity: 1 } }
                @keyframes drm-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
            `}</style>
        </div>
    );
}
