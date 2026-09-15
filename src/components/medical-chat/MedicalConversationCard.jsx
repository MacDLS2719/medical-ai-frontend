import React from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    turquoise: "#14b8a6",
    green: "#22c55e",
    muted: "#64748b",
};

export default function MedicalConversationCard({
    conversation,
    currentUserId,
    role,
    colors = DEFAULT_COLORS,
    isSelected = false,
    onClick,
}) {
    const isDoctor = role === "doctor";

    /**
     * Determinar la persona con la que estamos conversando.
     *
     * La conversación tiene:
     * patient
     * doctor
     *
     * Dependiendo del usuario actual mostramos al otro participante.
     */
    const contact = isDoctor
        ? conversation?.patient
        : conversation?.doctor;

    const contactName =
        contact?.name ||
        contact?.full_name ||
        contact?.fullName ||
        contact?.email ||
        (isDoctor ? "Paciente" : "Médico");

    const initials = contactName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();

    /**
     * Último mensaje.
     */
    const lastMessage =
        conversation?.last_message ||
        conversation?.lastMessage ||
        conversation?.messages?.[
            conversation?.messages?.length - 1
        ];

    const lastMessageText =
        typeof lastMessage === "string"
            ? lastMessage
            : lastMessage?.message ||
              lastMessage?.content ||
              "Sin mensajes";

    /**
     * Fecha del último mensaje o actualización.
     */
    const dateValue =
        lastMessage?.created_at ||
        lastMessage?.createdAt ||
        conversation?.updated_at ||
        conversation?.updatedAt ||
        conversation?.created_at;

    const formattedDate = formatConversationDate(dateValue);

    /**
     * Mensajes no leídos.
     */
    const unreadCount =
        conversation?.unread_count ??
        conversation?.unreadCount ??
        0;

    /**
     * Estado de la conversación.
     */
    const isActive =
        conversation?.status === "active" ||
        conversation?.status === undefined;

    return (
        <button
            type="button"
            onClick={() => onClick?.(conversation)}
            className="group flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-all duration-150"
            style={{
                borderColor: "#e2e8f0",
                backgroundColor: isSelected
                    ? "#eff6ff"
                    : "#ffffff",
            }}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white shadow-sm"
                    style={{
                        background:
                            "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                    }}
                >
                    {initials || (isDoctor ? "P" : "M")}
                </div>

                {/* Estado online */}
                {isActive && (
                    <span
                        className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white"
                        style={{
                            backgroundColor: colors.green,
                        }}
                        title="Conversación activa"
                    />
                )}
            </div>

            {/* Información */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <h3
                        className="truncate text-sm font-semibold"
                        style={{
                            color: colors.primary,
                        }}
                    >
                        {isDoctor && contact?.specialty
                            ? `${contactName}`
                            : contactName}
                    </h3>

                    {formattedDate && (
                        <span
                            className="shrink-0 text-[11px]"
                            style={{
                                color:
                                    unreadCount > 0
                                        ? colors.blue
                                        : colors.muted,
                            }}
                        >
                            {formattedDate}
                        </span>
                    )}
                </div>

                <div className="mt-1 flex items-center gap-2">
                    <p
                        className="min-w-0 flex-1 truncate text-xs"
                        style={{
                            color:
                                unreadCount > 0
                                    ? "#334155"
                                    : colors.muted,
                            fontWeight:
                                unreadCount > 0
                                    ? 600
                                    : 400,
                        }}
                    >
                        {lastMessageText}
                    </p>

                    {/* No leídos */}
                    {unreadCount > 0 && (
                        <span
                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                            style={{
                                backgroundColor: colors.blue,
                            }}
                        >
                            {unreadCount > 99
                                ? "99+"
                                : unreadCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Indicador */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                    color: isSelected
                        ? colors.blue
                        : "#94a3b8",
                }}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                />
            </svg>
        </button>
    );
}

/**
 * Formatea la fecha de la conversación.
 */
function formatConversationDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return "Ayer";
    }

    return date.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
    });
}