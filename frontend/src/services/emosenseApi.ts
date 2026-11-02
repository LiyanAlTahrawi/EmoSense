import { ApiError, type ApiClient } from './apiClient';
import type { Profile } from '../types/auth';
import type { ChatMessage, Conversation, ConversationMessages, MessageAnalysis, SendMessageResult } from '../types/conversation';
import type {
  EmoSenseService,
  RawAnalysis,
  RawConversation,
  RawMessage,
  RawProfile,
  RawSendResponse } from
'../types/api';

/**
 * EmoSense API client — implemented contracts:
 *   GET  /auth/me
 *   GET  /auth/me/profile
 *   GET  /conversations/
 *   POST /conversations/                         { title }
 *   GET  /conversations/{id}/messages
 *   POST /conversations/{id}/messages            { content, input_type: "text" }
 *   POST /conversations/{id}/audio               multipart field "file" (.wav sent)
 *
 * Integration-ready (UI built, backend route pending — calls fail honestly):
 *   PATCH  /auth/me/profile                      profile editing
 *   PATCH  /conversations/{id}                   rename
 *   DELETE /conversations/{id}                   delete
 *   DELETE /conversations/                       delete all history
 *   assistant_message in message responses       OpenAI-generated, persisted reply
 */
export function createEmoSenseApi(client: ApiClient): EmoSenseService {
  
  async function generateReply(
    conversationId: string
  ): Promise<ChatMessage | null> {
    try {
      const response = await client.request<{
        status: string;
        detected_emotion: string | null;
        assistant_message: RawMessage;
      }>(
        `/conversations/${encodeURIComponent(conversationId)}/reply`,
        {
          method: 'POST',
          timeoutMs: 120000
        }
      );

      return mapMessage(response.assistant_message, null);
    } catch (error) {
      // The user message was already saved.
      // A Gemini failure must never trigger resending it.
      console.warn(
        'Assistant reply unavailable. User message remains saved.',
        error
      );
      return null;
    }
  }

  return {
    mode: 'supabase',

    async getMe() {
      const res = await client.request<{user_id: string;email: string | null;}>('/auth/me');
      return { userId: res.user_id, email: res.email ?? null };
    },

    async getProfile() {
      const res = await client.request<{profile?: RawProfile | null;}>('/auth/me/profile');
      if (!res?.profile) {
        throw new ApiError('not_found', 'No profile exists for this account yet.', 404, '/auth/me/profile');
      }
      return mapProfile(res.profile);
    },


    async updateProfile(input) {
      const res = await client.request<{ profile: RawProfile }>(
        '/auth/me/profile',
        {
          method: 'PATCH',
          body: {
            first_name: input.firstName,
            last_name: input.lastName,
            phone_number: input.phoneNumber ?? null
          }
        }
      );

      return mapProfile(res.profile);
    },
    
    async deleteAccount() {
      await client.request(
        '/auth/me',
        { method: 'DELETE' }
      );
    },

    async listConversations() {
      const res = await client.request<{conversations?: RawConversation[];}>('/conversations/');
      return (res.conversations ?? []).map(mapConversation);
    },

    async createConversation(title) {
      const res = await client.request<{conversation: RawConversation;}>('/conversations/', {
        method: 'POST',
        body: { title }
      });
      return mapConversation(res.conversation);
    },

    
    async renameConversation(conversationId, title) {
      const res = await client.request<{ conversation: RawConversation }>(
        `/conversations/${encodeURIComponent(conversationId)}`,
        {
          method: 'PATCH',
          body: { title }
        }
      );

      return mapConversation(res.conversation);
    },



    async deleteConversation(conversationId) {
      await client.request(
        `/conversations/${encodeURIComponent(conversationId)}`,
        { method: 'DELETE' }
      );
    },



    async deleteAllConversations() {
      await client.request(
        '/conversations/',
        { method: 'DELETE' }
      );
    },


    async listMessages(conversationId) {
      const res = await client.request<{messages?: RawMessage[];}>(
        `/conversations/${encodeURIComponent(conversationId)}/messages`
      );
      return splitMessages(res.messages ?? []);
    },
    
    async sendTextMessage(conversationId, content) {
      const path = `/conversations/${encodeURIComponent(conversationId)}`;

      const saved = await client.request<RawSendResponse>(
        `${path}/messages`,
        {
          method: 'POST',
          body: { content, input_type: 'text' },
          timeoutMs: 60000
        }
      );

      const assistantMessage = await generateReply(conversationId);

      return {
        ...mapSendResponse(saved),
        assistantMessage
      };
    },

    async sendAudioMessage(conversationId, file, options) {
      const path = `/conversations/${encodeURIComponent(conversationId)}`;

      const form = new FormData();
      form.append('file', file, file.name);

      const saved = await client.upload<RawSendResponse>(
        `${path}/audio`,
        form,
        { onProgress: options?.onProgress }
      );

      const assistantMessage = await generateReply(conversationId);

      return {
        ...mapSendResponse(saved),
        assistantMessage
      };
    }
  };
}
  



function mapProfile(raw: RawProfile): Profile {
  return {
    userId: raw.user_id,
    firstName: raw.first_name ?? '',
    lastName: raw.last_name ?? '',
    phoneNumber: raw.phone_number ?? null
  };
}

function mapConversation(raw: RawConversation): Conversation {
  return {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title?.trim() || 'Untitled conversation',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? raw.created_at
  };
}

function pickAnalysis(raw: RawMessage): RawAnalysis | null {
  const value = raw.analysis ?? raw.message_analysis ?? null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapAnalysis(raw: RawAnalysis): MessageAnalysis {
  return {
    id: raw.id,
    messageId: raw.message_id,
    transcript: raw.transcript ?? null,
    predictedEmotion: raw.predicted_emotion ?? null,
    emotionConfidence: raw.emotion_confidence ?? null,
    emotionProbabilities: raw.emotion_probabilities ?? null,
    modelName: raw.model_name ?? null,
    modelVersion: raw.model_version ?? null,
    createdAt: raw.created_at ?? null
  };
}

function mapMessage(raw: RawMessage, analysis: RawAnalysis | null): ChatMessage {
  const isAudio = raw.input_type === 'audio';
  return {
    id: raw.id,
    conversationId: raw.conversation_id,
    role: raw.role === 'assistant' ? 'assistant' : 'user',
    content: raw.content?.trim() || analysis?.transcript?.trim() || '',
    inputType: isAudio ? 'audio' : 'text',
    createdAt: raw.created_at,
    hasAudio: isAudio || Boolean(raw.audio_path)
  };
}

function splitMessages(raws: RawMessage[]): ConversationMessages {
  const analyses: Record<string, MessageAnalysis> = {};
  const messages = raws.
  map((raw) => {
    const analysis = pickAnalysis(raw);
    if (analysis) analyses[raw.id] = mapAnalysis(analysis);
    return mapMessage(raw, analysis);
  }).
  sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return { messages, analyses };
}

function mapSendResponse(res: RawSendResponse): SendMessageResult {
  const analysis = res.analysis ?? pickAnalysis(res.message);
  return {
    message: mapMessage(res.message, analysis),
    analysis: analysis ? mapAnalysis(analysis) : null,
    assistantMessage: res.assistant_message ? mapMessage(res.assistant_message, null) : null
  };
}