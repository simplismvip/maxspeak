'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { useTtsUiLocale } from '@/lib/tts/useTtsUiLocale';
import { EMOTION_OPTIONS } from '@/lib/voices/emotions';
import { cn } from '@/lib/utils';
import { CollapsibleCard } from './CollapsibleCard';

export function EmotionTags() {
  const emotion = useTTSStore((s) => s.emotion);
  const setEmotion = useTTSStore((s) => s.setEmotion);
  const model = useTTSStore((s) => s.model);
  const locale = useTtsUiLocale();
  const isZh = locale === 'zh';

  const modelSupportsEmotion = (emotionOption: (typeof EMOTION_OPTIONS)[number]) => {
    return emotionOption.models.includes(model);
  };

  return (
    <CollapsibleCard
      title={isZh ? '情感标签' : 'Emotion tags'}
      hint={isZh ? '选择整段语音的情绪风格' : 'Applies to the whole utterance'}
    >
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setEmotion(undefined)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
            !emotion
              ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          {isZh ? '无' : 'None'}
        </button>
        {EMOTION_OPTIONS.map((opt) => {
          const supported = modelSupportsEmotion(opt);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => supported && setEmotion(opt.value)}
              disabled={!supported}
              title={`${isZh ? opt.descriptionZh : opt.descriptionEn}${supported ? '' : isZh ? '（当前模型不支持）' : ' (not supported by this model)'}`}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
                emotion === opt.value
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-900 dark:text-primary-300'
                  : supported
                    ? 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'cursor-not-allowed bg-transparent text-[rgb(var(--muted-foreground))]/40'
              )}
            >
              {opt.emoji} {isZh ? opt.labelZh : opt.labelEn}
            </button>
          );
        })}
      </div>
    </CollapsibleCard>
  );
}
