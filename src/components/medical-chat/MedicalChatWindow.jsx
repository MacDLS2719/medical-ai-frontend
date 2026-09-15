import React, { useEffect, useRef } from "react";
import MedicalMessageList from "./MedicalMessageList";

const DEFAULT_COLORS = {
    primary: "#172554",
    primaryLight: "#1e3a8a",
    blue: "#2563eb",
    sky: "#e0f2fe",
    turquoise: "#14b8a6",
    green: "#22c55e",
    background: "#f8fafc",
    white: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
};

export default function MedicalChatWindow({
    conversation = null,
    messages = [],
    currentUserId,
    role,
    user,
    colors = DEFAULT_COLORS,
    permissions = {},

    loading = false,
    messagesLoading = false,
    error = null,

    onBack,
    onStartVideoCall,
    onOpenCallHistory,
    onDeleteConversation,

    children,
}) {
    const messagesEndRef = useRef(null);

    const isDoctor = role === "doctor";
    const isPatient = role === "patient";

    /**
     * Persona con la que estamos conversando.
     */
    const contact = isDoctor
        ? conversation?.patient
        : conversation?.doctor;

    const contactName =
        (isDoctor ? conversation?.patient_name : conversation?.doctor_name) ||
        contact?.name ||
        contact?.full_name ||
        contact?.fullName ||
        contact?.email ||
        (isDoctor ? "Paciente" : "Médico");

    const contactInitials = contactName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();

    /**
     * El médico es el único que puede iniciar
     * videollamadas.
     *
     * Aunque el frontend lo controle, el backend
     * también debe validar esta regla.
     */
    const canStartCall =
        isDoctor &&
        permissions?.canStartVideoCall === true &&
        Boolean(conversation?.id);

    /**
     * Scroll al último mensaje.
     */
    useEffect(() => {
        if (!messagesEndRef.current) {
            return;
        }

        messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages]);

    /**
     * Estado: ninguna conversación seleccionada.
     */
    if (!conversation) {
        return (
            <section
                className="flex h-full min-w-0 flex-1 items-center justify-center"
                style={{
                    backgroundColor: colors.background,
                }}
            >
                <div className="px-6 text-center">
                    <div
                        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: colors.sky,
                            color: colors.blue,
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 10h8M8 14h5"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 11.5a7.5 7.5 0 01-7.5 7.5c-1.3 0-2.53-.33-3.6-.92L4 19l.92-3.9A7.5 7.5 0 1119 11.5z"
                            />
                        </svg>
                    </div>

                    <h2
                        className="text-lg font-bold"
                        style={{
                            color: colors.primary,
                        }}
                    >
                        {isDoctor
                            ? "Selecciona un paciente"
                            : "Selecciona una conversación"}
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                        {isDoctor
                            ? "Selecciona una conversación para comunicarte con tu paciente."
                            : "Selecciona una conversación existente para continuar hablando con tu médico."}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section
            className="flex h-full min-w-0 flex-1 flex-col overflow-hidden"
            style={{
                backgroundColor: colors.background,
            }}
        >
            {/* =====================================================
                HEADER DE LA CONVERSACIÓN
            ====================================================== */}
            <div
                className="flex min-h-[70px] shrink-0 items-center justify-between border-b bg-white px-3 py-3 md:px-5"
                style={{
                    borderColor: "#e2e8f0",
                }}
            >
                {/* Persona */}
                <div className="flex min-w-0 items-center gap-3">
                    {/* Volver - visible siempre para cerrar el chat y salir al grid */}
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                            aria-label="Cerrar chat y volver a tarjetas"
                            title="Cerrar chat y volver a tarjetas"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-slate-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            <span>Cerrar chat</span>
                        </button>
                    )}

                    {/* Avatar */}
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm"
                        style={{
                            background:
                                "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                        }}
                    >
                        {contactInitials ||
                            (isDoctor ? "P" : "M")}
                    </div>

                    <div className="min-w-0">
                        <h2
                            className="truncate text-sm font-bold md:text-base"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            {contactName}
                        </h2>

                        <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                    backgroundColor:
                                        colors.green,
                                }}
                            />

                            <span className="text-xs text-slate-500">
                                {isDoctor
                                    ? "Paciente"
                                    : "Médico"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    {/* VIDEOCONFERENCIA (SOLO MÉDICO O SEGÚN PERMISOS) */}
                    {canStartCall && (
                        <button
                            type="button"
                            onClick={() =>
                                onStartVideoCall?.(
                                    conversation
                                )
                            }
                            className="flex h-9 items-center gap-2 rounded-xl px-3.5 text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                            }}
                            title="Iniciar videoconferencia"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10l4.55-2.73A1 1 0 0121 8.13v7.74a1 1 0 01-1.45.86L15 14"
                                />
                                <rect
                                    x="3"
                                    y="6"
                                    width="12"
                                    height="12"
                                    rx="2"
                                    ry="2"
                                />
                            </svg>

                            <span className="hidden text-xs font-semibold sm:inline">
                                Videoconferencia
                            </span>
                        </button>
                    )}

                    {/* ELIMINAR CONVERSACIÓN */}
                    {onDeleteConversation && conversation?.id && (
                        <button
                            type="button"
                            onClick={() => onDeleteConversation(conversation)}
                            className="flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-red-600 shadow-sm transition hover:bg-red-100 hover:text-red-700 active:scale-[0.98]"
                            title="Eliminar conversación"
                            aria-label="Eliminar conversación"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden text-xs font-semibold sm:inline">Eliminar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* =====================================================
                MENSAJES
            ====================================================== */}
            <div className="min-h-0 flex-1 overflow-hidden">
                <MedicalMessageList
                    messages={messages}
                    currentUserId={currentUserId}
                    role={role}
                    user={user}
                    colors={colors}
                    loading={messagesLoading}
                    error={error}
                />

                <div ref={messagesEndRef} />
            </div>

            {/* =====================================================
                INPUT
                Lo conectaremos en MedicalChatInput.jsx
            ====================================================== */}
            {children && (
                <div className="shrink-0">
                    {children}
                </div>
            )}
        </section>
    );
}