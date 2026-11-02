import { notImplemented } from './apiClient';
import { demoConversations, demoProfile } from '../data/demo';
import type { EmoSenseService } from '../types/api';
import type { ChatMessage, Conversation, MessageAnalysis } from '../types/conversation';

const DEMO_USER_ID = 'demo-user';
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * In-memory preview implementation, active only when Supabase Auth isn't configured.
 * It never runs or imitates model inference on new input and never generates replies.
 */
export function createDemoApi(): EmoSenseService {
  const now = Date.now();
  const conversations: Conversation[] = [];
  const messages = new Map<string, ChatMessage[]>();
  const analyses: Record<string, MessageAnalysis> = {};
  let counter = 0;
  const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counter += 1}`;

  demoConversations.forEach((seed) => {
    const start = now - seed.hoursAgo * 3_600_000;
    const list = seed.messages.map((m, i): ChatMessage => {
      const id = `${seed.id}-m${i}`;
      const createdAt = new Date(start + m.minutesAfter * 60_000).toISOString();
      if (m.sampleEmotion) {
        analyses[id] = {
          id: `${id}-a`,
          messageId: id,
          transcript: m.inputType === 'audio' ? m.content : null,
          predictedEmotion: m.sampleEmotion,
          emotionConfidence: null,
          emotionProbabilities: null,
          modelName: 'preview-sample',
          modelVersion: 'sample',
          createdAt
        };
      }
      return { id, conversationId: seed.id, role: m.role, content: m.content, inputType: m.inputType, createdAt, hasAudio: m.inputType === 'audio' };
    });
    messages.set(seed.id, list);
    conversations.push({
      id: seed.id,
      userId: DEMO_USER_ID,
      title: seed.title,
      createdAt: new Date(start).toISOString(),
      updatedAt: list[list.length - 1]?.createdAt ?? new Date(start).toISOString()
    });
  });

  function addMessage(conversationId: string, message: ChatMessage) {
    messages.set(conversationId, [...(messages.get(conversationId) ?? []), message]);
    const convo = conversations.find((c) => c.id === conversationId);
    if (convo) convo.updatedAt = message.createdAt;
  }

  return {
    mode: 'demo',
    async getMe() {
      await wait(150);
      return { userId: DEMO_USER_ID, email: 'preview@emosense.demo' };
    },
    async getProfile() {
      await wait(350);
      return { ...demoProfile };
    },
    async updateProfile() {
      await wait(300);
      throw notImplemented('Profile editing', 'PATCH /auth/me/profile');
    },
    async listConversations() {
      await wait(500);
      return conversations.map((c) => ({ ...c }));
    },
    async createConversation(title) {
      await wait(350);
      const ts = new Date().toISOString();
      const convo: Conversation = { id: nextId('demo-c'), userId: DEMO_USER_ID, title, createdAt: ts, updatedAt: ts };
      conversations.unshift(convo);
      messages.set(convo.id, []);
      return { ...convo };
    },
    async renameConversation() {
      await wait(300);
      throw notImplemented('Renaming conversations', 'PATCH /conversations/{conversation_id}');
    },
    async deleteConversation() {
      await wait(300);
      throw notImplemented('Deleting conversations', 'DELETE /conversations/{conversation_id}');
    },
    async deleteAllConversations() {
      await wait(300);
      throw notImplemented('Deleting conversation history', 'DELETE /conversations/');
    },
    async listMessages(conversationId) {
      await wait(450);
      const list = messages.get(conversationId) ?? [];
      const own: Record<string, MessageAnalysis> = {};
      list.forEach((m) => {
        if (analyses[m.id]) own[m.id] = analyses[m.id];
      });
      return { messages: list.map((m) => ({ ...m })), analyses: own };
    },
    async sendTextMessage(conversationId, content) {
      await wait(900);
      const message: ChatMessage = {
        id: nextId('demo-m'),
        conversationId,
        role: 'user',
        content,
        inputType: 'text',
        createdAt: new Date().toISOString(),
        hasAudio: false
      };
      addMessage(conversationId, message);
      return { message, analysis: null, assistantMessage: null };
    },
    async sendAudioMessage(conversationId, _file, options) {
      for (const step of [0.25, 0.55, 0.85, 1]) {
        await wait(220);
        options?.onProgress?.(step);
      }
      await wait(900);
      const message: ChatMessage = {
        id: nextId('demo-m'),
        conversationId,
        role: 'user',
        content: 'Voice note recorded in preview mode. Transcription runs on the EmoSense API, which isn’t connected here.',
        inputType: 'audio',
        createdAt: new Date().toISOString(),
        hasAudio: true
      };
      addMessage(conversationId, message);
      return { message, analysis: null, assistantMessage: null };
    }
  };
}