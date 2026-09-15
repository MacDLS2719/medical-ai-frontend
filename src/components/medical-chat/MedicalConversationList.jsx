import React, { useMemo, useState } from "react";
import MedicalConversationGridCard from "./MedicalConversationGridCard";

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

export default function MedicalConversationList({
    conversations = [],
    selectedConversation = null,
    currentUserId,
    role,
    colors = DEFAULT_COLORS,
    permissions = {},

    loading = false,
    error = null,

    onSelectConversation,
    onCreateConversation,
    onSearchPatients,
    onStartVideoCall,
    onDeleteConversation,
}) {
    const [search, setSearch] = useState("");

    const isDoctor = role === "doctor";
    const isPatient = role === "patient";

    const filteredConversations = useMemo(() => {
        if (!search.trim()) {
            return conversations;
        }

        const normalizedSearch = search.trim().toLowerCase();

        return conversations.filter((conversation) => {
            const contact = isDoctor
                ? conversation?.patient
                : conversation?.doctor;

            const contactName =
                (isDoctor ? conversation?.patient_name : conversation?.doctor_name) ||
                contact?.name ||
                contact?.full_name ||
                contact?.fullName ||
                contact?.email ||
                "";

            const lastMessage =
                conversation?.last_message ||
                conversation?.lastMessage ||
                "";

            const lastMessageText =
                typeof lastMessage === "string"
                    ? lastMessage
                    : lastMessage?.message || "";

            return (
                contactName.toLowerCase().includes(normalizedSearch) ||
                lastMessageText.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [conversations, search, isDoctor]);

    const canCreate = isDoctor && permissions?.canCreateConversation === true;
    const canStartVideoCall = permissions?.canStartVideoCall === true;

    return (
        <div className="flex h-full w-full flex-col bg-slate-50 p-6 md:p-10">
            {/* Encabezado y buscador */}
            <div className="mx-auto mb-8 w-full max-w-7xl">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1
                            className="text-2xl font-bold md:text-3xl"
                            style={{ color: colors.primary }}
                        >
                            {isDoctor
                                ? "Mis pacientes"
                                : "Mis médicos"}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {isDoctor
                                ? "Gestiona tus conversaciones y consultas con pacientes."
                                : "Tus conversaciones activas con profesionales de la salud."}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        {/* Buscador */}
                        <div className="relative w-full sm:w-72">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-3.5-3.5" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={
                                    isDoctor
                                        ? "Buscar paciente..."
                                        : "Buscar médico..."
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Botón nueva conversación */}
                        {canCreate && (
                            <button
                                type="button"
                                onClick={() => onCreateConversation?.()}
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.turquoise} 100%)`,
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
                                        d="M12 5v14M5 12h14"
                                    />
                                </svg>
                                Nueva Conversación
                            </button>
                        )}
                    </div>
                </div>

                {/* Cuadrícula de tarjetas */}
                <div className="w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-600">
                            <p className="font-semibold">Error al cargar conversaciones</p>
                            <p className="mt-1 text-sm">{error}</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                            <div
                                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
                                style={{ color: colors.blue }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">
                                {search
                                    ? "No se encontraron resultados"
                                    : "Aún no tienes conversaciones"}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                {search
                                    ? "Intenta con otro término de búsqueda."
                                    : isDoctor
                                    ? "Haz clic en 'Nueva Conversación' para empezar."
                                    : "Cuando un médico se comunique contigo, aparecerá aquí."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredConversations.map((conversation) => (
                                <MedicalConversationGridCard
                                    key={conversation.id}
                                    conversation={conversation}
                                    currentUserId={currentUserId}
                                    role={role}
                                    colors={colors}
                                    onSelectChat={onSelectConversation}
                                    onStartVideoCall={onStartVideoCall}
                                    onDeleteConversation={onDeleteConversation}
                                    canStartVideoCall={canStartVideoCall}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}