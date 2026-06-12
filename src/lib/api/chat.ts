// API utility for chat functionality - uses enhanced-chat with mock responses
// This ensures chat always works without requiring external API keys or backend
import { sendChatMessage as sendEnhancedChatMessage } from './enhanced-chat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatResponse {
  reply: string;
  success: boolean;
  error?: string;
}

// Wrapper that uses enhanced-chat for reliable responses
export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    return await sendEnhancedChatMessage(message);
  } catch (error) {
    console.error('Chat error:', error);
    return {
      reply: 'Sorry, I encountered an error. Please try again.',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
