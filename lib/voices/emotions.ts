import type { Emotion } from '@/lib/minimax/types';

export interface EmotionOption {
  value: Emotion;
  labelZh: string;
  labelEn: string;
  emoji: string;
  descriptionZh: string;
  descriptionEn: string;
  models: string[];
}

const ALL_MODELS = [
  'speech-2.8-hd',
  'speech-2.8-turbo',
  'speech-2.6-hd',
  'speech-2.6-turbo',
  'speech-02-hd',
  'speech-02-turbo',
  'speech-01-hd',
  'speech-01-turbo',
];

const V26_PLUS = ['speech-2.8-hd', 'speech-2.8-turbo', 'speech-2.6-hd', 'speech-2.6-turbo'];

export const EMOTION_OPTIONS: EmotionOption[] = [
  { value: 'happy', labelZh: '开心', labelEn: 'Happy', emoji: '😊', descriptionZh: '愉悦、积极的语调', descriptionEn: 'Cheerful, upbeat tone', models: ALL_MODELS },
  { value: 'sad', labelZh: '悲伤', labelEn: 'Sad', emoji: '😢', descriptionZh: '低沉、忧伤的语调', descriptionEn: 'Low, sorrowful tone', models: ALL_MODELS },
  { value: 'angry', labelZh: '愤怒', labelEn: 'Angry', emoji: '😠', descriptionZh: '激烈、愤怒的语调', descriptionEn: 'Intense, angry tone', models: ALL_MODELS },
  { value: 'fearful', labelZh: '恐惧', labelEn: 'Fearful', emoji: '😨', descriptionZh: '紧张、害怕的语调', descriptionEn: 'Tense, frightened tone', models: ALL_MODELS },
  { value: 'disgusted', labelZh: '厌恶', labelEn: 'Disgusted', emoji: '🤢', descriptionZh: '反感、厌恶的语调', descriptionEn: 'Repulsed, disgusted tone', models: ALL_MODELS },
  { value: 'surprised', labelZh: '惊讶', labelEn: 'Surprised', emoji: '😲', descriptionZh: '吃惊、意外的语调', descriptionEn: 'Startled, unexpected tone', models: ALL_MODELS },
  { value: 'neutral', labelZh: '中性', labelEn: 'Neutral', emoji: '😐', descriptionZh: '平稳、不带情绪的语调', descriptionEn: 'Calm, unemotional tone', models: ALL_MODELS },
  { value: 'fluent', labelZh: '流畅', labelEn: 'Fluent', emoji: '💬', descriptionZh: '快速流畅的语流', descriptionEn: 'Fast, fluent delivery', models: V26_PLUS },
  { value: 'whisper', labelZh: '耳语', labelEn: 'Whisper', emoji: '🤫', descriptionZh: '轻声低语', descriptionEn: 'Soft, whispered speech', models: V26_PLUS },
];
