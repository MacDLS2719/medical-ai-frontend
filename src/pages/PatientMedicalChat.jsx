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

export default function PatientMedicalChat() {
    const { user } = useAuth();

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            <MedicalChatLayout
                role="patient"
                user={user}
                colors={MIVOR_COLORS}

                // El paciente NO puede iniciar conversaciones
                canCreateConversation={false}

                // El paciente NO puede buscar médicos
                canSearchDoctors={false}

                // El paciente NO puede iniciar llamadas
                canStartVideoCall={false}

                // El paciente SÍ puede responder conversaciones existentes
                canReply={true}

                // Audio permitido
                canSendAudio={true}

                // El paciente recibe llamadas
                canReceiveVideoCall={true}

                // Permitir envío de imágenes y archivos
                canSendFiles={true}
                canSendImages={true}

                // El paciente solamente verá conversaciones existentes
                conversationMode="existing"
            />
        </div>
    );
}