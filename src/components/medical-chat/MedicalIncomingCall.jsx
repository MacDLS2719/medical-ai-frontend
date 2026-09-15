import React, { useEffect, useState } from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    turquoise: "#14b8a6",
    green: "#22c55e",
    muted: "#64748b",
};

export default function MedicalIncomingCall({
    call = null,
    colors = DEFAULT_COLORS,

    onAccept,
    onReject,

    visible = true,
}) {
    const [processing, setProcessing] =
        useState(false);

    const [ringing, setRinging] =
        useState(true);

    useEffect(() => {
        if (!visible || !call) {
            return;
        }

        setRinging(true);

        /*
         * Aquí posteriormente podremos conectar
         * un sonido real de llamada.
         *
         * No usamos audio automáticamente por ahora
         * porque los navegadores pueden bloquear
         * reproducción sin interacción del usuario.
         */
    }, [visible, call]);

    if (!visible || !call || !ringing) {
        return null;
    }

    const caller =
        call?.caller ||
        call?.doctor ||
        {};

    const callerName =
        caller?.name ||
        caller?.full_name ||
        caller?.fullName ||
        call?.caller_name ||
        call?.callerName ||
        "Médico";

    const initials = callerName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) =>
            word.charAt(0)
        )
        .join("")
        .toUpperCase();

    const handleAccept = async () => {
        if (processing) {
            return;
        }

        try {
            setProcessing(true);

            await onAccept?.(call);
        } catch (error) {
            console.error(
                "Error aceptando videollamada:",
                error
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (processing) {
            return;
        }

        try {
            setProcessing(true);

            await onReject?.(call);

            setRinging(false);
        } catch (error) {
            console.error(
                "Error rechazando videollamada:",
                error
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/50 p-4 pt-8 backdrop-blur-sm md:items-center md:pt-4">
            <div
                className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
                style={{
                    animation:
                        "medicalCallAppear 180ms ease-out",
                }}
            >
                {/* =================================================
                    PARTE SUPERIOR
                ================================================== */}
                <div
                    className="relative overflow-hidden px-6 pb-8 pt-8 text-center"
                    style={{
                        background:
                            "linear-gradient(135deg, #172554 0%, #1e3a8a 55%, #14b8a6 100%)",
                    }}
                >
                    {/* círculos decorativos */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/10" />

                    <p className="relative text-xs font-medium uppercase tracking-[0.18em] text-blue-100">
                        Videollamada entrante
                    </p>

                    {/* Avatar */}
                    <div className="relative mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white text-2xl font-bold shadow-xl">
                        <span
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                                WebkitBackgroundClip:
                                    "text",
                                WebkitTextFillColor:
                                    "transparent",
                            }}
                        >
                            {initials ||
                                "M"}
                        </span>

                        {/* Indicador de llamada */}
                        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
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
                                    d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.78.64 2.62a2 2 0 01-.45 2.11L8 9.73a16 16 0 006 6l1.28-1.28a2 2 0 012.11-.45c.84.31 1.72.52 2.62.64A2 2 0 0122 16.92z"
                                />
                            </svg>
                        </span>
                    </div>

                    <h2 className="relative mt-4 text-xl font-bold text-white">
                        {callerName}
                    </h2>

                    <p className="relative mt-1 text-sm text-blue-100">
                        Te está llamando
                    </p>
                </div>

                {/* =================================================
                    ACCIONES
                ================================================== */}
                <div className="px-6 py-5">
                    <div className="flex items-center justify-center gap-8">
                        {/* RECHAZAR */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={
                                    handleReject
                                }
                                disabled={
                                    processing
                                }
                                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Rechazar llamada"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 rotate-[135deg]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.78.64 2.62a2 2 0 01-.45 2.11L8 9.73a16 16 0 006 6l1.28-1.28a2 2 0 012.11-.45c.84.31 1.72.52 2.62.64A2 2 0 0122 16.92z"
                                    />
                                </svg>
                            </button>

                            <span className="mt-2 block text-xs font-medium text-slate-500">
                                Rechazar
                            </span>
                        </div>

                        {/* ACEPTAR */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={
                                    handleAccept
                                }
                                disabled={
                                    processing
                                }
                                className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md transition hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    backgroundColor:
                                        colors.green,
                                }}
                                aria-label="Aceptar llamada"
                            >
                                {processing ? (
                                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.31.31.59.55.82l2.24 2.24a2 2 0 002.11.45c.84-.31 1.72-.52 2.62-.64A2 2 0 0122 16.92z"
                                        />
                                    </svg>
                                )}
                            </button>

                            <span className="mt-2 block text-xs font-medium text-slate-500">
                                Aceptar
                            </span>
                        </div>
                    </div>

                    <p className="mt-5 text-center text-[11px] leading-4 text-slate-400">
                        Al aceptar, podrás continuar
                        utilizando el chat durante la
                        videollamada.
                    </p>
                </div>
            </div>

            <style>
                {`
                    @keyframes medicalCallAppear {
                        from {
                            opacity: 0;
                            transform: translateY(-12px) scale(0.98);
                        }

                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                `}
            </style>
        </div>
    );
}