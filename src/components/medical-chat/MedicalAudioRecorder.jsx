import React, { useEffect, useRef, useState } from "react";

const DEFAULT_COLORS = {
    primary: "#172554",
    blue: "#2563eb",
    turquoise: "#14b8a6",
    green: "#22c55e",
};

export default function MedicalAudioRecorder({
    colors = DEFAULT_COLORS,
    disabled = false,
    onRecordingComplete,
    onCancel,
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            cleanupRecorder();
        };
    }, []);

    const startRecording = async () => {
        if (disabled || isRecording) {
            return;
        }

        try {
            setError(null);

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setError(
                    "Tu navegador no permite acceder al micrófono."
                );
                return;
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            streamRef.current = stream;

            const mimeType = getSupportedMimeType();

            const recorder = mimeType
                ? new MediaRecorder(stream, {
                      mimeType,
                  })
                : new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (
                    event.data &&
                    event.data.size > 0
                ) {
                    chunksRef.current.push(
                        event.data
                    );
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(
                    chunksRef.current,
                    {
                        type:
                            recorder.mimeType ||
                            "audio/webm",
                    }
                );

                const duration = recordingTime;

                stopTimer();
                stopStream();

                if (blob.size > 0) {
                    await onRecordingComplete?.(
                        blob,
                        duration
                    );
                }

                chunksRef.current = [];
            };

            recorder.onerror = () => {
                setError(
                    "Ocurrió un error durante la grabación."
                );

                cleanupRecorder();
            };

            recorder.start();

            setRecordingTime(0);
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingTime(
                    (previous) => previous + 1
                );
            }, 1000);
        } catch (err) {
            console.error(
                "Error accediendo al micrófono:",
                err
            );

            setError(
                "No fue posible acceder al micrófono. Verifica los permisos del navegador."
            );

            cleanupRecorder();
        }
    };

    const stopRecording = () => {
        const recorder =
            mediaRecorderRef.current;

        if (!recorder) {
            return;
        }

        if (recorder.state !== "inactive") {
            recorder.stop();
        }

        setIsRecording(false);
    };

    const cancelRecording = () => {
        const recorder =
            mediaRecorderRef.current;

        if (recorder) {
            recorder.ondataavailable = null;
            recorder.onstop = null;
            recorder.onerror = null;

            if (
                recorder.state !== "inactive"
            ) {
                recorder.stop();
            }
        }

        chunksRef.current = [];

        stopTimer();
        stopStream();

        mediaRecorderRef.current = null;

        setIsRecording(false);
        setRecordingTime(0);
        setError(null);

        onCancel?.();
    };

    const cleanupRecorder = () => {
        stopTimer();
        stopStream();

        const recorder =
            mediaRecorderRef.current;

        if (
            recorder &&
            recorder.state !== "inactive"
        ) {
            try {
                recorder.stop();
            } catch {
                // No hacemos nada.
            }
        }

        mediaRecorderRef.current = null;
        chunksRef.current = [];

        setIsRecording(false);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }
    };

    return (
        <div className="w-full">
            {!isRecording ? (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={startRecording}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Grabar mensaje de voz"
                    aria-label="Grabar mensaje de voz"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"
                        />
                    </svg>
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    {/* Cancelar */}
                    <button
                        type="button"
                        onClick={cancelRecording}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                        title="Cancelar grabación"
                        aria-label="Cancelar grabación"
                    >
                        ✕
                    </button>

                    {/* Grabación */}
                    <div
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2"
                        style={{
                            backgroundColor: "#fef2f2",
                        }}
                    >
                        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />

                        <span className="shrink-0 text-sm font-semibold text-red-600">
                            {formatDuration(
                                recordingTime
                            )}
                        </span>

                        {/* Onda */}
                        <div className="flex flex-1 items-center justify-center gap-1">
                            {[
                                3,
                                6,
                                4,
                                8,
                                5,
                                7,
                                4,
                                6,
                                3,
                                5,
                                7,
                                4,
                            ].map(
                                (
                                    height,
                                    index
                                ) => (
                                    <span
                                        key={index}
                                        className="w-1 rounded-full bg-red-300"
                                        style={{
                                            height: `${
                                                height *
                                                2
                                            }px`,
                                        }}
                                    />
                                )
                            )}
                        </div>
                    </div>

                    {/* Enviar */}
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-95"
                        style={{
                            background:
                                "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                        }}
                        title="Enviar mensaje de voz"
                        aria-label="Enviar mensaje de voz"
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
                                d="M22 2L11 13"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M22 2l-7 20-4-9-9-4 20-7z"
                            />
                        </svg>
                    </button>
                </div>
            )}

            {error && (
                <p className="mt-1 px-2 text-[11px] text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}

function getSupportedMimeType() {
    if (
        typeof MediaRecorder === "undefined"
    ) {
        return null;
    }

    const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
    ];

    return (
        types.find((type) =>
            MediaRecorder.isTypeSupported(
                type
            )
        ) || null
    );
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(
        2,
        "0"
    )}:${String(remainingSeconds).padStart(
        2,
        "0"
    )}`;
}