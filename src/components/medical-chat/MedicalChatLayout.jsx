import React, { useCallback, useEffect, useMemo, useState } from "react";
import MedicalConversationList from "./MedicalConversationList";
import MedicalChatWindow from "./MedicalChatWindow";
import MedicalChatInput from "./MedicalChatInput";
import VideoCallModal from "./VideoCallModal";
import { medicalChatService } from "../../services/medicalChatService";
import { useWebSocket } from "../../hooks/useWebSocket";

// ─────────────────────────────────────────────
// Paleta por defecto
// ─────────────────────────────────────────────
const DEFAULT_COLORS = {
    primary: "#172554",
    primaryLight: "#1e3a8a",
    blue: "#2563eb",
    sky: "#e0f2fe",
    cyan: "#06b6d4",
    turquoise: "#14b8a6",
    green: "#22c55e",
    background: "#f8fafc",
    white: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
};

// ─────────────────────────────────────────────
// MedicalChatLayout
// Sin header propio: usa el Navbar global del app.
// Ocupa el espacio restante con h-full.
// ─────────────────────────────────────────────
export default function MedicalChatLayout({
    role,
    user,
    colors = DEFAULT_COLORS,

    // Permisos
    canCreateConversation = false,
    canSearchDoctors = false,
    canSearchPatients = false,
    canStartVideoCall = false,
    canReply = true,
    canSendAudio = true,
    canSendFiles = false,
    canSendImages = false,
    canReceiveVideoCall = false,
    canViewCallHistory = false,

    conversationMode = "existing",
}) {
    // ── Estado UI ─────────────────────────────
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [view, setView] = useState("grid"); // "grid" | "chat"

    // ── Estado de datos ───────────────────────
    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [conversationsError, setConversationsError] = useState(null);

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState(null);

    const [sending, setSending] = useState(false);
    const [inputText, setInputText] = useState("");

    // ── Estado de Videollamada ─────────────────
    const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'ringing' | 'in-call'
    const [callData, setCallData] = useState(null);

    const isDoctor = role === "doctor";
    const userId = user?.id;

    // ── Permisos ──────────────────────────────
    const permissions = useMemo(
        () => ({
            canCreateConversation,
            canSearchDoctors,
            canSearchPatients,
            canStartVideoCall,
            canReply,
            canSendAudio,
            canSendFiles,
            canSendImages,
            canReceiveVideoCall,
            canViewCallHistory,
            conversationMode,
        }),
        [
            canCreateConversation,
            canSearchDoctors,
            canSearchPatients,
            canStartVideoCall,
            canReply,
            canSendAudio,
            canSendFiles,
            canSendImages,
            canReceiveVideoCall,
            canViewCallHistory,
            conversationMode,
        ]
    );

    // Durante la videollamada, el paciente obtiene permisos para enviar imágenes y archivos
    const effectivePermissions = useMemo(() => {
        const isCallActive = callStatus === "in-call";
        return {
            ...permissions,
            canSendFiles: permissions.canSendFiles || isCallActive,
            canSendImages: permissions.canSendImages || isCallActive,
        };
    }, [permissions, callStatus]);

    // ── Cargar conversaciones ─────────────────
    const loadConversations = useCallback(async () => {
        if (!userId) return;
        setConversationsLoading(true);
        setConversationsError(null);
        try {
            const data = await medicalChatService.getConversations(userId);
            setConversations(data || []);
        } catch (err) {
            console.error("[Chat] Error cargando conversaciones:", err);
            setConversationsError(
                err?.response?.data?.detail ||
                    "No se pudieron cargar las conversaciones."
            );
        } finally {
            setConversationsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // ── Cargar mensajes ───────────────────────
    const loadMessages = useCallback(
        async (conversationId) => {
            if (!conversationId || !userId) return;
            setMessagesLoading(true);
            setMessagesError(null);
            try {
                const data = await medicalChatService.getMessages(
                    conversationId,
                    userId
                );
                setMessages(data || []);
            } catch (err) {
                console.error("[Chat] Error cargando mensajes:", err);
                setMessagesError(
                    err?.response?.data?.detail ||
                        "No se pudieron cargar los mensajes."
                );
            } finally {
                setMessagesLoading(false);
            }
        },
        [userId]
    );

    // ── WebSocket ─────────────────────────────
    const handleWsMessage = useCallback(
        (data) => {
            const action = data.action || data.type;

            if (
                data.type === "new_message" &&
                data.conversation_id === selectedConversation?.id
            ) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === data.message?.id);
                    return exists ? prev : [...prev, data.message];
                });
            }

            if (
                data.type === "new_message" ||
                data.type === "conversation_created"
            ) {
                loadConversations();
            }

            // Manejo de eventos de señalización de videollamada
            const actionUpper = String(action || "").toUpperCase();

            if (actionUpper === "INCOMING_CALL" || actionUpper === "VIDEO_CALL_INVITE") {
                console.log("[Chat] Llamada entrante recibida:", data);
                setCallData(data);
                setCallStatus("ringing");
                // Si viene el id de conversación, seleccionarlo para mostrar chat en llamada
                if (data.conversation_id) {
                    const targetId = Number(data.conversation_id);
                    const found = conversations.find((c) => Number(c.id) === targetId);
                    if (found) {
                        setSelectedConversation(found);
                        loadMessages(found.id);
                    } else if (userId) {
                        medicalChatService.getConversations(userId).then((list) => {
                            if (list) {
                                setConversations(list);
                                const f = list.find((c) => Number(c.id) === targetId);
                                if (f) {
                                    setSelectedConversation(f);
                                    loadMessages(f.id);
                                }
                            }
                        }).catch(() => {});
                    }
                }
            } else if (actionUpper === "CALL_ACCEPTED" || actionUpper === "VIDEO_CALL_ACCEPTED") {
                setCallData((prev) => ({
                    ...prev,
                    room_url: prev?.room_url || data.room_url || null,
                    room_name: prev?.room_name || data.room_name || null,
                    target_name: prev?.target_name || data.caller_name || "Contacto",
                }));
                setCallStatus("in-call");
            } else if (
                actionUpper === "CALL_REJECTED" ||
                actionUpper === "VIDEO_CALL_REJECTED" ||
                actionUpper === "CALL_CANCELLED" ||
                actionUpper === "CALL_ENDED" ||
                actionUpper === "VIDEO_CALL_ENDED"
            ) {
                setCallStatus("idle");
                setCallData(null);
            }
        },
        [selectedConversation?.id, loadConversations, loadMessages, conversations]
    );

    const { sendWsMessage } = useWebSocket(userId, handleWsMessage);

    // ── Seleccionar conversación ──────────────
    const handleSelectConversation = useCallback(
        async (conversation) => {
            setSelectedConversation(conversation);
            setView("chat");
            setMessages([]);
            if (conversation?.id) {
                await loadMessages(conversation.id);
                loadConversations();
            }
        },
        [loadMessages, loadConversations]
    );

    const handleBackToGrid = () => {
        setSelectedConversation(null);
        setView("grid");
    };

    // ── Enviar texto ──────────────────────────
    const handleSendMessage = useCallback(
        async (text) => {
            const content = (text || inputText).trim();
            if (!content || !selectedConversation?.id || !userId) return;
            setSending(true);
            setInputText("");
            try {
                const newMsg = await medicalChatService.sendMessage(
                    selectedConversation.id,
                    userId,
                    content
                );
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === newMsg.id);
                    return exists ? prev : [...prev, newMsg];
                });
                loadConversations();
            } catch (err) {
                console.error("[Chat] Error enviando mensaje:", err);
            } finally {
                setSending(false);
            }
        },
        [inputText, selectedConversation?.id, userId, loadConversations]
    );

    // ── Enviar audio ──────────────────────────
    const handleSendAudio = useCallback(
        async (audioBlob, duration, mimeType) => {
            if (!audioBlob || !selectedConversation?.id || !userId) return;
            setSending(true);
            try {
                const newMsg = await medicalChatService.sendAudioMessage(
                    selectedConversation.id,
                    userId,
                    audioBlob,
                    duration,
                    mimeType
                );
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === newMsg.id);
                    return exists ? prev : [...prev, newMsg];
                });
                loadConversations();
            } catch (err) {
                console.error("[Chat] Error enviando audio:", err);
            } finally {
                setSending(false);
            }
        },
        [selectedConversation?.id, userId, loadConversations]
    );

    // ── Enviar archivo o imagen ───────────────
    const handleSendFile = useCallback(
        async (file, attachmentType = "file") => {
            if (!file || !selectedConversation?.id || !userId) return;
            setSending(true);
            try {
                const newMsg = await medicalChatService.sendFileMessage(
                    selectedConversation.id,
                    userId,
                    file,
                    attachmentType
                );
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === newMsg.id);
                    return exists ? prev : [...prev, newMsg];
                });
                loadConversations();
            } catch (err) {
                console.error("[Chat] Error enviando archivo:", err);
            } finally {
                setSending(false);
            }
        },
        [selectedConversation?.id, userId, loadConversations]
    );

    const handleSendImage = useCallback(
        async (file) => {
            return handleSendFile(file, "image");
        },
        [handleSendFile]
    );

    // ── Estado modal de contactos ────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableContacts, setAvailableContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactSearch, setContactSearch] = useState("");

    const handleOpenNewConversationModal = useCallback(async () => {
        if (!userId) return;
        setIsModalOpen(true);
        setLoadingContacts(true);
        try {
            const data = await medicalChatService.getAvailableContacts(userId);
            // Si es médico, mostramos pacientes; si es paciente, mostramos médicos
            const filtered = (data || []).filter((item) =>
                isDoctor ? item.role === "patient" : item.role === "doctor"
            );
            setAvailableContacts(filtered);
        } catch (err) {
            console.error("[Chat] Error al obtener contactos:", err);
        } finally {
            setLoadingContacts(false);
        }
    }, [userId, isDoctor]);

    // ── Crear conversación (médico) ───────────
    const handleCreateConversation = useCallback(
        async (patientId) => {
            if (!userId || !patientId) return;
            try {
                // patientId es el user_id del paciente, userId es el user_id del médico
                const pId = isDoctor ? patientId : userId;
                const dId = isDoctor ? userId : patientId;
                const conv = await medicalChatService.createConversation(
                    pId,
                    dId
                );
                setIsModalOpen(false);
                await loadConversations();
                handleSelectConversation(conv);
            } catch (err) {
                console.error("[Chat] Error creando conversación:", err);
            }
        },
        [isDoctor, userId, loadConversations, handleSelectConversation]
    );

    const getOtherUserId = useCallback((conv) => {
        if (!conv) return null;
        return Number(userId) === Number(conv.patient_id) ? conv.doctor_id : conv.patient_id;
    }, [userId]);

    // ── Videollamada (médico) ─────────────────
    const handleStartVideoCall = useCallback(
        async (conversation) => {
            if (!isDoctor || !conversation?.id || !userId) return;
            try {
                const targetName = isDoctor ? conversation.patient_name : conversation.doctor_name;
                const targetUser = getOtherUserId(conversation);
                setCallData({
                    target_name: targetName || "Paciente",
                    conversation_id: conversation.id,
                    caller_name: user?.name || user?.full_name || "Doctor",
                    from_user: userId,
                    target_user: targetUser,
                });
                setCallStatus("calling");

                // Seleccionar la conversación para que el médico vea el chat durante la llamada
                setSelectedConversation(conversation);
                if (messages.length === 0) {
                    loadMessages(conversation.id);
                }

                const result = await medicalChatService.startVideoCall(conversation.id, userId);
                if (result?.room_url) {
                    setCallData((prev) => ({
                        ...prev,
                        room_name: result.room_name,
                        room_url: result.room_url,
                    }));
                }
            } catch (err) {
                console.error("[Chat] Error iniciando videollamada:", err);
                alert(err?.response?.data?.detail || "No se pudo iniciar la videollamada.");
                setCallStatus("idle");
                setCallData(null);
            }
        },
        [isDoctor, userId, user, getOtherUserId, messages.length, loadMessages]
    );

    // ── Acciones de Videollamada ─────────────────
    const handleAcceptCall = useCallback(() => {
        const targetUser = callData?.from_user || callData?.target_user || getOtherUserId(selectedConversation);
        sendWsMessage({
            action: "CALL_ACCEPTED",
            target_user: targetUser,
            room_name: callData?.room_name,
            room_url: callData?.room_url,
        });
        setCallStatus("in-call");

        // Si el paciente no tiene la conversación seleccionada, intentar cargarla
        if (!selectedConversation && callData?.conversation_id) {
            const targetId = Number(callData.conversation_id);
            const found = conversations.find((c) => Number(c.id) === targetId);
            if (found) {
                setSelectedConversation(found);
                loadMessages(found.id);
            } else if (userId) {
                medicalChatService.getConversations(userId).then((list) => {
                    if (list) {
                        setConversations(list);
                        const f = list.find((c) => Number(c.id) === targetId);
                        if (f) {
                            setSelectedConversation(f);
                            loadMessages(f.id);
                        }
                    }
                }).catch(() => {});
            }
        }
    }, [callData, getOtherUserId, selectedConversation, sendWsMessage, conversations, userId, loadMessages]);

    const handleRejectCall = useCallback(() => {
        const targetUser = callData?.from_user || callData?.target_user || getOtherUserId(selectedConversation);
        sendWsMessage({
            action: "CALL_REJECTED",
            target_user: targetUser,
            room_name: callData?.room_name,
        });
        setCallStatus("idle");
        setCallData(null);
    }, [callData, getOtherUserId, selectedConversation, sendWsMessage]);

    const handleCancelCall = useCallback(() => {
        const targetUser = callData?.target_user || callData?.from_user || getOtherUserId(selectedConversation);
        sendWsMessage({
            action: "CALL_CANCELLED",
            target_user: targetUser,
            room_name: callData?.room_name,
        });
        setCallStatus("idle");
        setCallData(null);
    }, [callData, getOtherUserId, selectedConversation, sendWsMessage]);

    const handleEndCall = useCallback(() => {
        const targetUser = callData?.from_user || callData?.target_user || getOtherUserId(selectedConversation);
        sendWsMessage({
            action: "CALL_ENDED",
            target_user: targetUser,
            room_name: callData?.room_name,
        });
        if (selectedConversation?.id && userId) {
            medicalChatService.sendMessage(selectedConversation.id, userId, "[Videollamada finalizada]").catch(() => {});
        }
        setCallStatus("idle");
        setCallData(null);
    }, [callData, getOtherUserId, selectedConversation, sendWsMessage, userId]);

    // ── Eliminar conversación ─────────────────
    const handleDeleteConversation = useCallback(
        async (conversation) => {
            const convId = conversation?.id;
            if (!convId || !userId) return;

            const confirmDelete = window.confirm(
                "¿Estás seguro de que deseas eliminar esta conversación?"
            );
            if (!confirmDelete) return;

            try {
                await medicalChatService.deleteConversation(convId, userId);
                if (selectedConversation?.id === convId) {
                    setSelectedConversation(null);
                    setView("grid");
                }
                await loadConversations();
            } catch (err) {
                console.error("[Chat] Error eliminando conversación:", err);
                alert(
                    err?.response?.data?.detail ||
                        "No se pudo eliminar la conversación."
                );
            }
        },
        [userId, selectedConversation?.id, loadConversations]
    );

    const filteredContacts = useMemo(() => {
        if (!contactSearch.trim()) return availableContacts;
        const q = contactSearch.toLowerCase().trim();
        return availableContacts.filter((c) =>
            (c.full_name || `${c.first_name || ""} ${c.last_name || ""}`)
                .toLowerCase()
                .includes(q)
        );
    }, [availableContacts, contactSearch]);

    // ── Render ────────────────────────────────
    return (
        <div
            className="flex h-full w-full overflow-hidden"
            style={{ backgroundColor: colors.background }}
        >
            {/* MODAL DE VIDEOLLAMADA CON SALA DAILY Y CHAT AL COSTADO */}
            <VideoCallModal
                callStatus={callStatus}
                callData={callData}
                userName={user?.name || user?.full_name || (isDoctor ? "Doctor" : "Paciente")}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
                onCancel={handleCancelCall}
                onEnd={handleEndCall}
            >
                {selectedConversation && (
                    <MedicalChatWindow
                        conversation={selectedConversation}
                        messages={messages}
                        currentUserId={userId}
                        role={role}
                        user={user}
                        colors={colors}
                        permissions={effectivePermissions}
                        messagesLoading={messagesLoading}
                        error={messagesError}
                        isInCall={true}
                    >
                        <MedicalChatInput
                            conversation={selectedConversation}
                            role={role}
                            colors={colors}
                            permissions={effectivePermissions}
                            value={inputText}
                            onChange={setInputText}
                            onSendMessage={handleSendMessage}
                            onSendAudio={handleSendAudio}
                            onSendFile={(file) => handleSendFile(file, "file")}
                            onSendImage={handleSendImage}
                            disabled={!selectedConversation}
                            sending={sending}
                        />
                    </MedicalChatWindow>
                )}
            </VideoCallModal>

            {/* VISTA GRID: Lista de tarjetas de conversaciones */}
            {view === "grid" && (
                <div className="flex h-full w-full flex-col overflow-y-auto">
                    <MedicalConversationList
                        conversations={conversations}
                        selectedConversation={selectedConversation}
                        currentUserId={userId}
                        role={role}
                        colors={colors}
                        permissions={effectivePermissions}
                        loading={conversationsLoading}
                        error={conversationsError}
                        onSelectConversation={handleSelectConversation}
                        onCreateConversation={handleOpenNewConversationModal}
                        onStartVideoCall={handleStartVideoCall}
                        onSearchPatients={handleOpenNewConversationModal}
                        onDeleteConversation={handleDeleteConversation}
                    />
                </div>
            )}

            {/* VISTA CHAT: Panel lateral de otros chats activos + Ventana de conversación */}
            {view === "chat" && (
                <div className="flex h-full w-full overflow-hidden">
                    {/* Lateral de otros chats activos (visible en pantallas medianas y superiores) */}
                    <div className="hidden md:flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
                        {/* Cabecera del lateral */}
                        <div className="flex items-center justify-between border-b border-slate-100 p-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    Chats activos
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {conversations.length} {conversations.length === 1 ? "conversación" : "conversaciones"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleBackToGrid}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                title="Volver a tarjetas"
                            >
                                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Tarjetas
                            </button>
                        </div>

                        {/* Lista de chats activos */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {conversations.map((conv) => {
                                const isSelected = conv.id === selectedConversation?.id;
                                const contactName =
                                    (isDoctor ? conv?.patient_name : conv?.doctor_name) ||
                                    (isDoctor ? "Paciente" : "Médico");

                                const unreadCount = isDoctor
                                    ? conv?.doctor_unread_count || 0
                                    : conv?.patient_unread_count || 0;
                                const lastSenderId = conv?.last_message_sender_id;
                                const isLastFromOther = lastSenderId ? Number(lastSenderId) !== Number(userId) : true;
                                const hasUnread = unreadCount > 0 && isLastFromOther;

                                const lastMsg =
                                    typeof conv?.last_message === "string"
                                        ? conv.last_message
                                        : conv?.last_message?.message || "Sin mensajes";

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`group flex items-center justify-between gap-3 p-3.5 cursor-pointer transition ${
                                            isSelected
                                                ? "bg-blue-50/80 border-l-4 border-blue-600"
                                                : hasUnread
                                                ? "bg-emerald-50/60 border-l-4 border-emerald-500 hover:bg-emerald-50"
                                                : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="relative">
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white text-sm shadow-sm"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.turquoise} 100%)`,
                                                    }}
                                                >
                                                    {contactName.charAt(0).toUpperCase()}
                                                </div>
                                                {hasUnread && (
                                                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className={`truncate text-sm ${isSelected ? "font-bold text-blue-950" : hasUnread ? "font-bold text-emerald-950" : "font-semibold text-slate-800"}`}>
                                                        {contactName}
                                                    </p>
                                                    {hasUnread && (
                                                        <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`truncate text-xs ${hasUnread ? "font-medium text-emerald-800" : "text-slate-500"} mt-0.5`}>
                                                    {hasUnread ? `[Pendiente] ${lastMsg}` : lastMsg}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteConversation(conv);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar conversación"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pie para volver a tarjetas */}
                        <div className="p-3 border-t border-slate-200 bg-slate-50">
                            <button
                                type="button"
                                onClick={handleBackToGrid}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Salir a Vista de Tarjetas
                            </button>
                        </div>
                    </div>

                    {/* Ventana de chat principal */}
                    <div className="flex h-full w-full flex-1 flex-col min-w-0">
                        <MedicalChatWindow
                            conversation={selectedConversation}
                            messages={messages}
                            currentUserId={userId}
                            role={role}
                            user={user}
                            colors={colors}
                            permissions={effectivePermissions}
                            messagesLoading={messagesLoading}
                            error={messagesError}
                            onBack={handleBackToGrid}
                            onStartVideoCall={handleStartVideoCall}
                            onDeleteConversation={handleDeleteConversation}
                            onOpenCallHistory={() => {
                                /* TODO: modal historial de llamadas */
                            }}
                        >
                            {selectedConversation && (
                                <MedicalChatInput
                                    conversation={selectedConversation}
                                    role={role}
                                    colors={colors}
                                    permissions={effectivePermissions}
                                    value={inputText}
                                    onChange={setInputText}
                                    onSendMessage={handleSendMessage}
                                    onSendAudio={handleSendAudio}
                                    onSendFile={(file) => handleSendFile(file, "file")}
                                    onSendImage={handleSendImage}
                                    disabled={!selectedConversation}
                                    sending={sending}
                                />
                            )}
                        </MedicalChatWindow>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIONAR CONTACTO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                                {isDoctor ? "Seleccionar Paciente" : "Seleccionar Médico"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Buscador de contactos */}
                        <div className="mb-4">
                            <input
                                type="text"
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                                placeholder={isDoctor ? "Buscar por nombre..." : "Buscar médico por nombre..."}
                                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Lista de contactos */}
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                            {loadingContacts ? (
                                <div className="py-8 text-center text-sm text-slate-500 animate-pulse">
                                    Cargando lista...
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-500">
                                    No se encontraron personas disponibles.
                                </div>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <div
                                        key={contact.user_id || contact.id}
                                        onClick={() => handleCreateConversation(contact.user_id || contact.id)}
                                        className="flex items-center justify-between rounded-xl p-3 transition hover:bg-slate-50 cursor-pointer border border-slate-100 hover:border-slate-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white text-sm"
                                                style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.turquoise})` }}
                                            >
                                                {(contact.full_name || contact.first_name || "U")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {contact.full_name || `${contact.first_name || ""} ${contact.last_name || ""}`}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {contact.specialty || (isDoctor ? "Paciente" : "Médico")}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                                            style={{ backgroundColor: colors.blue }}
                                        >
                                            Iniciar Chat
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}