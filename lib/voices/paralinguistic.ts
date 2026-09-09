import type { ParalinguisticTag } from '@/lib/minimax/types';

export interface ParalinguisticOption {
  value: ParalinguisticTag;
  labelZh: string;
  labelEn: string;
  emoji: string;
  category: string;
  insertText: string;
}

export const PARALINGUISTIC_TAGS: ParalinguisticOption[] = [
  { value: 'sighs', labelZh: '叹气', labelEn: 'Sighs', emoji: '😮‍💨', category: '呼吸/发声', insertText: '(sighs)' },
  { value: 'breath', labelZh: '呼吸', labelEn: 'Breath', emoji: '🌬️', category: '呼吸/发声', insertText: '(breath)' },
  { value: 'inhale', labelZh: '吸气', labelEn: 'Inhale', emoji: '🫁', category: '呼吸/发声', insertText: '(inhale)' },
  { value: 'exhale', labelZh: '呼气', labelEn: 'Exhale', emoji: '💨', category: '呼吸/发声', insertText: '(exhale)' },
  { value: 'pant', labelZh: '喘息', labelEn: 'Pant', emoji: '😤', category: '呼吸/发声', insertText: '(pant)' },
  { value: 'gasps', labelZh: '倒抽气', labelEn: 'Gasps', emoji: '😱', category: '呼吸/发声', insertText: '(gasps)' },
  { value: 'groans', labelZh: '呻吟', labelEn: 'Groans', emoji: '😩', category: '呼吸/发声', insertText: '(groans)' },

  { value: 'laughs', labelZh: '大笑', labelEn: 'Laughs', emoji: '😂', category: '笑声/情感', insertText: '(laughs)' },
  { value: 'chuckle', labelZh: '轻笑', labelEn: 'Chuckle', emoji: '😄', category: '笑声/情感', insertText: '(chuckle)' },
  { value: 'crying', labelZh: '哭泣', labelEn: 'Crying', emoji: '😭', category: '笑声/情感', insertText: '(crying)' },
  { value: 'emm', labelZh: '嗯...', labelEn: 'Emm', emoji: '🤔', category: '笑声/情感', insertText: '(emm)' },

  { value: 'coughs', labelZh: '咳嗽', labelEn: 'Coughs', emoji: '😷', category: '身体音效', insertText: '(coughs)' },
  { value: 'clear-throat', labelZh: '清嗓子', labelEn: 'Clear throat', emoji: '🗣️', category: '身体音效', insertText: '(clear-throat)' },
  { value: 'sniffs', labelZh: '抽鼻子', labelEn: 'Sniffs', emoji: '🤧', category: '身体音效', insertText: '(sniffs)' },
  { value: 'snorts', labelZh: '哼气', labelEn: 'Snorts', emoji: '🐽', category: '身体音效', insertText: '(snorts)' },
  { value: 'burps', labelZh: '打嗝', labelEn: 'Burps', emoji: '🤭', category: '身体音效', insertText: '(burps)' },
  { value: 'sneezes', labelZh: '打喷嚏', labelEn: 'Sneezes', emoji: '🤧', category: '身体音效', insertText: '(sneezes)' },
  { value: 'lip-smacking', labelZh: '咂嘴', labelEn: 'Lip smacking', emoji: '👄', category: '身体音效', insertText: '(lip-smacking)' },

  { value: 'humming', labelZh: '哼唱', labelEn: 'Humming', emoji: '🎵', category: '声音/动作', insertText: '(humming)' },
  { value: 'whistles', labelZh: '吹口哨', labelEn: 'Whistles', emoji: '🎶', category: '声音/动作', insertText: '(whistles)' },
  { value: 'hissing', labelZh: '嘶嘶声', labelEn: 'Hissing', emoji: '🐍', category: '声音/动作', insertText: '(hissing)' },
  { value: 'applause', labelZh: '鼓掌', labelEn: 'Applause', emoji: '👏', category: '声音/动作', insertText: '(applause)' },
];

export const PARALINGUISTIC_SUPPORTED_MODELS = ['speech-2.8-hd', 'speech-2.8-turbo'];

export const PARALINGUISTIC_CATEGORIES = [
  { key: '呼吸/发声', labelZh: '呼吸 / 发声', labelEn: 'Breathing / Vocal' },
  { key: '笑声/情感', labelZh: '笑声 / 情感', labelEn: 'Laughter / Emotion' },
  { key: '身体音效', labelZh: '身体音效', labelEn: 'Body sounds' },
  { key: '声音/动作', labelZh: '声音 / 动作', labelEn: 'Sounds / Actions' },
];
