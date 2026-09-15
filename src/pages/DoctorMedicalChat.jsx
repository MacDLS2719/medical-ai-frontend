import React from "react";
import { useAuth } from "../context/AuthContext";
import MedicalChatLayout from "../components/medical-chat/MedicalChatLayout";

const MIVOR_COLORS = {
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

export default function DoctorMedicalChat() {
    const { user } = useAuth();

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            <MedicalChatLayout
                role="doctor"
                user={user}
                colors={MIVOR_COLORS}

                // El médico SÍ puede crear conversaciones
                canCreateConversation={true}

                // El médico SÍ puede buscar pacientes
                canSearchDoctors={false}
                canSearchPatients={true}

                // El médico SÍ puede iniciar videollamadas
                canStartVideoCall={true}

                // Puede responder conversaciones
                canReply={true}

                // Audio
                canSendAudio={true}

                // El médico puede enviar archivos
                canSendFiles={true}

                // El médico puede enviar imágenes
                canSendImages={true}

                // Puede recibir llamadas/eventos WebSocket
                canReceiveVideoCall={true}

                // Puede consultar historial de llamadas
                canViewCallHistory={true}

                // Puede crear nuevas conversaciones
                conversationMode="doctor"
            />
        </div>
    );
}