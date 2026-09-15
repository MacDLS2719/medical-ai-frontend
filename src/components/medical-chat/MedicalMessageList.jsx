import React, { useEffect, useRef, useState, useCallback } from "react";
import MedicalMessageBubble from "./MedicalMessageBubble";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    sky: "#e0f2fe",
    turquoise: "#14b8a6",
    green: "#22c55e",
    background: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
};

export default function MedicalMessageList({
    messages = [],
    currentUserId,
    role,
    user,
    colors = DEFAULT_COLORS,
    loading = false,
    error = null,
}) {
    const bottomRef = useRef(null);
    const topRef = useRef(null);
    const containerRef = useRef(null);

    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    /**
     * Scroll al último mensaje al recibir nuevos mensajes
     */
    const scrollToBottom = useCallback((smooth = true) => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({
                behavior: smooth ? "smooth" : "auto",
                block: "end",
            });
        }
    }, []);

    const scrollToTop = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    }, []);

    useEffect(() => {
        if (!showScrollBottom) {
            scrollToBottom(true);
        }
    }, [messages, scrollToBottom, showScrollBottom]);

    /**
     * Detectar scroll para mostrar botones de navegación interna
     */
    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

        // Si el usuario subió más de 120px desde abajo
        const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 120;
        setShowScrollBottom(isFarFromBottom);

        // Si el usuario bajó más de 200px desde arriba
        const isFarFromTop = scrollTop > 200;
        setShowScrollTop(isFarFromTop);
    };

    /**
     * Group messages by date
     */
    const groupedMessages = groupMessagesByDate(messages);

    if (loading) {
        return (
            <div
                className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-5 md:px-6"
                style={{ backgroundColor: colors.background }}
            >
                <MessageSkeleton align="left" />
                <MessageSkeleton align="right" />
                <MessageSkeleton align="left" />
                <MessageSkeleton align="right" />
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="flex h-full items-center justify-center px-6"
                style={{ backgroundColor: colors.background }}
            >
                <div className="max-w-sm text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                        No se pudieron cargar los mensajes
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {typeof error === "string" ? error : "Intenta nuevamente."}
                    </p>
                </div>
            </div>
        );
    }

    if (!messages.length) {
        return (
            <div
                className="flex h-full items-center justify-center px-6"
                style={{ backgroundColor: colors.background }}
            >
                <div className="max-w-sm text-center">
                    <div
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: colors.sky, color: colors.blue }}
                    >
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M19 11.5a7.5 7.5 0 01-7.5 7.5c0 4.14-3.36 7.5-7.5 7.5-1.3 0-2.53-.33-3.6-.92L4 19l.92-3.9A7.5 7.5 0 1119 11.5z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold" style={{ color: colors.primary }}>
                        Comienza la conversación
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Envía un mensaje para comenzar a comunicarte de forma segura.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col">
            {/* CONTENEDOR DE MENSAJES CON CONGRUENCIA Y SCROLL INTERNO */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-5 md:px-6 scroll-smooth"
                style={{ backgroundColor: colors.background }}
            >
                <div ref={topRef} />

                <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
                    {groupedMessages.map((group) => (
                        <div key={group.dateLabel} className="flex flex-col gap-3">
                            {/* ENCABEZADO SEPARADOR DE FECHA */}
                            <div className="my-2 flex items-center justify-center">
                                <span className="rounded-full border border-slate-200 bg-white/80 backdrop-blur px-3.5 py-1 text-[11px] font-semibold text-slate-500 shadow-2xs">
                                    {group.dateLabel}
                                </span>
                            </div>

                            {group.items.map((message, index) => (
                                <MedicalMessageBubble
                                    key={message?.id ?? `msg-${group.dateLabel}-${index}`}
                                    message={message}
                                    currentUserId={currentUserId}
                                    role={role}
                                    colors={colors}
                                />
                            ))}
                        </div>
                    ))}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* BOTÓN FLOTANTE SUPERIOR (IR AL INICIO) */}
            {showScrollTop && (
                <button
                    type="button"
                    onClick={scrollToTop}
                    className="absolute top-3 right-6 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md transition-all hover:bg-slate-50 hover:scale-105 cursor-pointer animate-in fade-in duration-200"
                    title="Ir a mensajes más antiguos"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <span>Subir</span>
                </button>
            )}

            {/* BOTÓN FLOTANTE INFERIOR (IR AL FINAL / NAVEGACIÓN RÁPIDA) */}
            {showScrollBottom && (
                <button
                    type="button"
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-4 right-6 z-20 flex items-center gap-2 rounded-full border border-teal-200 bg-gradient-to-r from-blue-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 cursor-pointer animate-in fade-in duration-200"
                    title="Ir a los mensajes más recientes"
                >
                    <span>Ir al final</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}
        </div>
    );
}

function MessageSkeleton({ align = "left" }) {
    const isRight = align === "right";
    return (
        <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
            <div className={`h-14 w-40 animate-pulse rounded-2xl bg-slate-200 ${isRight ? "rounded-br-md" : "rounded-bl-md"}`} />
        </div>
    );
}

/**
 * Agrupa los mensajes por fecha legible (Hoy, Ayer, 15 de Septiembre, etc.)
 */
function groupMessagesByDate(messages) {
    if (!messages || !messages.length) return [];

    const groupsMap = new Map();

    messages.forEach((msg) => {
        const rawDate = msg?.created_at ?? msg?.createdAt;
        const dateObj = rawDate ? new Date(rawDate) : new Date();
        const dateKey = formatDateLabel(dateObj);

        if (!groupsMap.has(dateKey)) {
            groupsMap.set(dateKey, []);
        }
        groupsMap.get(dateKey).push(msg);
    });

    return Array.from(groupsMap.entries()).map(([dateLabel, items]) => ({
        dateLabel,
        items,
    }));
}

function formatDateLabel(date) {
    if (!date || isNaN(date.getTime())) return "Fecha desconocida";

    const now = new Date();
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) return "Hoy";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Ayer";

    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}