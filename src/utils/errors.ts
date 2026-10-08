// ==============================================================================
// NEXA — Error & Notification Helpers
// ==============================================================================

export interface AppError {
  message: string;
  technicalDetails?: string;
  code?: string;
}

export function handleAppError(error: unknown, fallbackMessage = 'Não foi possível concluir a ação no momento.'): AppError {
  // Always log for internal diagnostic/debugging without exposing technical jargon in production UI
  console.error('[NEXA System Error]:', error);

  if (typeof error === 'string') {
    return {
      message: error,
      technicalDetails: error,
    };
  }

  if (error instanceof Error) {
    // If it's a known domain validation or friendly error
    if (error.message.includes('Estoque insuficiente') || 
        error.message.includes('não encontrado') || 
        error.message.includes('obrigatório')) {
      return {
        message: error.message,
        technicalDetails: error.stack,
      };
    }

    return {
      message: fallbackMessage,
      technicalDetails: error.message,
    };
  }

  return {
    message: fallbackMessage,
    technicalDetails: JSON.stringify(error),
  };
}
