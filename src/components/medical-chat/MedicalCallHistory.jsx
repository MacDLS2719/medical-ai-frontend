import React, { useMemo } from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    primaryLight: "#1e3a8a",
    blue: "#2563eb",
    turquoise: "#14b8a6",
    green: "#22c55e",
    muted: "#64748b",
};

export default function MedicalCallHistory({
    calls = [],
    role = "patient",
    colors = DEFAULT_COLORS,
    loading = false,
    error = null,
    onCallClick,
}) {
    const sortedCalls = useMemo(() => {
        return [...calls].sort(
            (a, b) =>
                new Date(
                    b.created_at ||
                        b.createdAt ||
                        0
                ) -
                new Date(
                    a.created_at ||
                        a.createdAt ||
                        0
                )
        );
    }, [calls]);

    return (
        <div className="flex h-full flex-col bg-white">
            {/* HEADER */}
            <div className="shrink-0 border-b px-5 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                        style={{
                            background:
                                "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14"
                            />

                            <rect
                                width="10"
                                height="12"
                                x="3"
                                y="6"
                                rx="2"
                            />
                        </svg>
                    </div>

                    <div>
                        <h2
                            className="text-base font-bold"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            Historial de llamadas
                        </h2>

                        <p className="text-xs text-slate-500">
                            Videollamadas de esta
                            conversación
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {loading && (
                    <LoadingState
                        colors={colors}
                    />
                )}

                {!loading && error && (
                    <ErrorState
                        message={error}
                    />
                )}

                {!loading &&
                    !error &&
                    sortedCalls.length ===
                        0 && (
                        <EmptyState />
                    )}

                {!loading &&
                    !error &&
                    sortedCalls.length >
                        0 && (
                        <div className="space-y-3">
                            {sortedCalls.map(
                                (
                                    call
                                ) => (
                                    <CallHistoryItem
                                        key={
                                            call.id
                                        }
                                        call={
                                            call
                                        }
                                        role={
                                            role
                                        }
                                        colors={
                                            colors
                                        }
                                        onClick={
                                            onCallClick
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ITEM
|--------------------------------------------------------------------------
*/

function CallHistoryItem({
    call,
    role,
    colors,
    onClick,
}) {
    const status = normalizeStatus(
        call.status
    );

    const isIncoming =
        Number(call.receiver_id) ===
        Number(call.current_user_id);

    const date = formatDate(
        call.created_at ||
            call.createdAt
    );

    const duration = formatDuration(
        call.duration
    );

    const statusData =
        getStatusData(status);

    return (
        <button
            type="button"
            onClick={() =>
                onClick?.(call)
            }
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
        >
            <div className="flex items-start gap-3">
                {/* ICONO */}
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${statusData.bg} ${statusData.text}`}
                >
                    {statusData.icon}
                </div>

                {/* INFO */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p
                                className="truncate text-sm font-semibold"
                                style={{
                                    color: colors.primary,
                                }}
                            >
                                {getCallTitle(
                                    call,
                                    role,
                                    isIncoming
                                )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                                {date}
                            </p>
                        </div>

                        <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusData.badge}`}
                        >
                            {
                                statusData.label
                            }
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                />

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 7v5l3 2"
                                />
                            </svg>

                            {duration}
                        </span>

                        {call.room_name && (
                            <span className="truncate">
                                Sala:{" "}
                                {
                                    call.room_name
                                }
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}

/*
|--------------------------------------------------------------------------
| ESTADOS
|--------------------------------------------------------------------------
*/

function LoadingState() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-100 p-4"
                >
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />

                        <div className="flex-1">
                            <div className="h-4 w-32 rounded bg-slate-200" />

                            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />

                            <div className="mt-3 h-3 w-40 rounded bg-slate-100" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                !
            </div>

            <p className="mt-3 text-sm font-semibold text-red-700">
                No se pudo cargar el historial
            </p>

            <p className="mt-1 text-xs text-red-500">
                {message}
            </p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14"
                    />

                    <rect
                        width="10"
                        height="12"
                        x="3"
                        y="6"
                        rx="2"
                    />
                </svg>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
                No hay llamadas
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                Todavía no se han realizado
                videollamadas en esta
                conversación.
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeStatus(status) {
    const value = String(
        status || ""
    ).toLowerCase();

    if (
        value === "completed" ||
        value === "ended" ||
        value === "finished"
    ) {
        return "completed";
    }

    if (
        value === "rejected" ||
        value === "declined"
    ) {
        return "rejected";
    }

    if (
        value === "cancelled" ||
        value === "canceled"
    ) {
        return "cancelled";
    }

    if (
        value === "missed" ||
        value === "no_answer"
    ) {
        return "missed";
    }

    if (value === "accepted") {
        return "accepted";
    }

    if (value === "calling") {
        return "calling";
    }

    return "unknown";
}

function getStatusData(status) {
    const data = {
        completed: {
            label: "Finalizada",
            bg: "bg-emerald-50",
            text: "text-emerald-600",
            badge:
                "bg-emerald-50 text-emerald-700",
            icon: "✓",
        },

        accepted: {
            label: "Aceptada",
            bg: "bg-blue-50",
            text: "text-blue-600",
            badge:
                "bg-blue-50 text-blue-700",
            icon: "✓",
        },

        rejected: {
            label: "Rechazada",
            bg: "bg-red-50",
            text: "text-red-500",
            badge:
                "bg-red-50 text-red-600",
            icon: "✕",
        },

        cancelled: {
            label: "Cancelada",
            bg: "bg-orange-50",
            text: "text-orange-500",
            badge:
                "bg-orange-50 text-orange-600",
            icon: "✕",
        },

        missed: {
            label: "Perdida",
            bg: "bg-slate-100",
            text: "text-slate-500",
            badge:
                "bg-slate-100 text-slate-600",
            icon: "☎",
        },

        calling: {
            label: "En curso",
            bg: "bg-blue-50",
            text: "text-blue-500",
            badge:
                "bg-blue-50 text-blue-600",
            icon: "●",
        },

        unknown: {
            label: "Llamada",
            bg: "bg-slate-100",
            text: "text-slate-500",
            badge:
                "bg-slate-100 text-slate-600",
            icon: "☎",
        },
    };

    return (
        data[status] || data.unknown
    );
}

function getCallTitle(
    call,
    role,
    isIncoming
) {
    if (role === "doctor") {
        return isIncoming
            ? "Videollamada recibida"
            : "Videollamada al paciente";
    }

    return isIncoming
        ? "Videollamada recibida"
        : "Videollamada al médico";
}

function formatDate(value) {
    if (!value) {
        return "Fecha no disponible";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat(
        "es-CO",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(date);
}

function formatDuration(seconds) {
    if (
        seconds === null ||
        seconds === undefined ||
        Number.isNaN(Number(seconds))
    ) {
        return "Sin duración";
    }

    const total = Math.max(
        0,
        Number(seconds)
    );

    const hours = Math.floor(
        total / 3600
    );

    const minutes = Math.floor(
        (total % 3600) / 60
    );

    const remainingSeconds =
        total % 60;

    if (hours > 0) {
        return `${String(hours).padStart(
            2,
            "0"
        )}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(
        2,
        "0"
    )}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}