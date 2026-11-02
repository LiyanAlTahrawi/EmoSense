export type MessageRole = 'user' | 'assistant';
export type InputType = 'text' | 'audio';

/** Mirrors the `conversations` table. */
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/** User-visible message content only. Analysis metadata is kept separately. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  inputType: InputType;
  createdAt: string;
  hasAudio: boolean;
}

/** Mirrors `message_analysis`. Internal inference metadata — never rendered raw in chat. */
export interface MessageAnalysis {
  id: string;
  messageId: string;
  transcript: string | null;
  predictedEmotion: string | null;
  emotionConfidence: number | null;
  emotionProbabilities: Record<string, number> | null;
  modelName: string | null;
  modelVersion: string | null;
  createdAt: string | null;
}

export interface ConversationMessages {
  messages: ChatMessage[];
  analyses: Record<string, MessageAnalysis>;
}

export interface SendMessageResult {
  message: ChatMessage;
  analysis: MessageAnalysis | null;
  /** Present only once the backend returns a persisted assistant reply. */
  assistantMessage: ChatMessage | null;
}

export type LocalStatus = 'sending' | 'uploading' | 'analyzing' | 'failed';

export interface DisplayMessage extends ChatMessage {
  localStatus?: LocalStatus;
  uploadProgress?: number;
  error?: string;
  retry?: () => void;
  audioDuration?: number;
}

export type ReplyState = 'idle' | 'awaiting' | 'unavailable';

export type PendingPayload =
{kind: 'text';content: string;} |
{kind: 'audio';file: File;duration: number;};

export interface ReflectionEntry {
  id: string;
  conversationId: string;
  conversationTitle: string;
  content: string;
  inputType: InputType;
  createdAt: string;
  emotion: string;
}