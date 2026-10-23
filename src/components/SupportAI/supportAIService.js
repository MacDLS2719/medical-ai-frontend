const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const sendSupportAIMessage = async (message, options = {}) => {
  try {
    let userId = options.userId || null;
    if (!userId) {
      try {
        const storedUser = localStorage.getItem('medai_user') || localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = parsed.id || parsed.user_id;
        }
      } catch (e) {
        // Ignorar error al leer localStorage
      }
    }

    const payload = {
      message,
      ...(userId ? { user_id: Number(userId) } : {}),
      ...(options.conversationId ? { conversation_id: options.conversationId } : {}),
    };

    const response = await fetch(`${API_URL}/support-ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail || "No fue posible obtener una respuesta del soporte."
      );
    }

    return data;
  } catch (error) {
    console.error("Support AI error:", error);

    throw new Error(
      error.message ||
        "Ocurrió un error al comunicarse con el asistente de soporte."
    );
  }
};
