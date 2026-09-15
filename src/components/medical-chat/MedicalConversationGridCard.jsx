import React from "react";

export default function MedicalConversationGridCard({
    conversation,
    currentUserId,
    role,
    colors,
    onSelectChat,
    onStartVideoCall,
    onDeleteConversation,
    canStartVideoCall,
}) {
    const isDoctor = role === "doctor";
    const contact = isDoctor ? conversation?.patient : conversation?.doctor;

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

    const specialtyOrRole = isDoctor
        ? "Paciente"
        : contact?.specialty || "Médico";

    const lastMessage =
        conversation?.last_message || conversation?.lastMessage;
    const lastMessageText =
        typeof lastMessage === "string"
            ? lastMessage
            : lastMessage?.message || "No hay mensajes aún.";

    const updatedAt = new Date(
        conversation?.updated_at || conversation?.created_at || Date.now()
    );
    const timeString = updatedAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    }) + " " + updatedAt.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });

    const unreadCount = isDoctor
        ? conversation?.doctor_unread_count || 0
        : conversation?.patient_unread_count || 0;

    const lastSenderId = conversation?.last_message_sender_id;
    const isLastFromOther = lastSenderId ? Number(lastSenderId) !== Number(currentUserId) : true;
    const hasUnread = unreadCount > 0 && isLastFromOther;

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                hasUnread ? "ring-2 ring-emerald-500/50 border-emerald-300" : ""
            }`}
            style={{ borderColor: hasUnread ? "#a7f3d0" : "#e2e8f0" }}
        >
            {onDeleteConversation && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation);
                    }}
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Eliminar conversación"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
            <div className="flex flex-col items-center p-6 text-center">
                {/* Avatar */}
                <div
                    className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-sm"
                    style={{
                        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.turquoise} 100%)`,
                    }}
                >
                    {contactInitials || (isDoctor ? "P" : "M")}
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md border-2 border-white animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>

                {/* Nombre y especialidad / badge */}
                <h3
                    className="mb-1 text-lg font-bold"
                    style={{ color: colors.primary }}
                >
                    {contactName}
                </h3>
                {hasUnread ? (
                    <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Mensaje Pendiente
                    </span>
                ) : (
                    <span className="mb-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {specialtyOrRole}
                    </span>
                )}

                {/* Último mensaje / Estado Pendiente */}
                {hasUnread ? (
                    <div className="w-full rounded-xl bg-emerald-50/90 border border-emerald-200 p-3 text-left shadow-xs transition">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                Pendiente
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                                {unreadCount} {unreadCount === 1 ? "nuevo" : "nuevos"}
                            </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold text-emerald-950">
                            {lastMessageText}
                        </p>
                        <p className="mt-1.5 text-right text-xs text-emerald-700 font-medium">
                            {timeString}
                        </p>
                    </div>
                ) : (
                    <div className="w-full rounded-xl bg-slate-50 border border-slate-100 p-3 text-left">
                        <p className="line-clamp-2 text-sm text-slate-600">
                            {lastMessageText}
                        </p>
                        <p className="mt-2 text-right text-xs text-slate-400">
                            {timeString}
                        </p>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="mt-auto grid grid-cols-1 border-t sm:grid-cols-2" style={{ borderColor: "#e2e8f0" }}>
                <button
                    onClick={() => onSelectChat(conversation)}
                    className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition hover:bg-slate-50"
                    style={{ color: colors.blue }}
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
                            d="M8 10h8M8 14h5"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 11.5a7.5 7.5 0 01-7.5 7.5c-1.3 0-2.53-.33-3.6-.92L4 19l.92-3.9A7.5 7.5 0 1119 11.5z"
                        />
                    </svg>
                    Abrir Chat
                </button>
                {canStartVideoCall ? (
                    <button
                        onClick={() => onStartVideoCall(conversation)}
                        className="flex items-center justify-center gap-2 border-t py-3.5 text-sm font-semibold transition hover:bg-slate-50 sm:border-l sm:border-t-0"
                        style={{ borderColor: "#e2e8f0", color: colors.turquoise }}
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
                        Videollamada
                    </button>
                ) : (
                    <div className="hidden border-t sm:block sm:border-l sm:border-t-0" style={{ borderColor: "#e2e8f0" }}></div>
                )}
            </div>
        </div>
    );
}
