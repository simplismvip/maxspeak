'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { useTtsUiLocale } from '@/lib/tts/useTtsUiLocale';
import {
  PARALINGUISTIC_TAGS,
  PARALINGUISTIC_CATEGORIES,
  PARALINGUISTIC_SUPPORTED_MODELS,
} from '@/lib/voices/paralinguistic';
import { cn } from '@/lib/utils';
import { CollapsibleCard } from './CollapsibleCard';

export function ParalinguisticTagInserter() {
  const setText = useTTSStore((s) => s.setText);
  const text = useTTSStore((s) => s.text);
  const model = useTTSStore((s) => s.model);
  const locale = useTtsUiLocale();
  const isZh = locale === 'zh';

  const isSupported = PARALINGUISTIC_SUPPORTED_MODELS.includes(model);

  const insertTag = (tagText: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.slice(0, start) + tagText + text.slice(end);
      setText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagText.length, start + tagText.length);
      }, 0);
    } else {
      setText(text + tagText);
    }
  };

  return (
    <CollapsibleCard
      title={isZh ? '副语言标签' : 'Paralinguistic tags'}
      hint={isZh ? '点击插入到光标位置' : 'Click to insert at the cursor'}
    >
      {!isSupported ? (
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          {isZh
            ? '副语言标签仅支持 speech-2.8-hd / speech-2.8-turbo 模型。请切换模型以使用此功能。'
            : 'Paralinguistic tags are available on speech-2.8-hd / speech-2.8-turbo. Switch models to use them.'}
        </p>
      ) : (
        <div className="space-y-3">
          {PARALINGUISTIC_CATEGORIES.map((cat) => {
            const tags = PARALINGUISTIC_TAGS.filter((t) => t.category === cat.key);
            if (tags.length === 0) return null;
            return (
              <div key={cat.key}>
                <span className="mb-1.5 block text-[10px] font-medium text-[rgb(var(--muted-foreground))]">
                  {isZh ? cat.labelZh : cat.labelEn}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => insertTag(tag.insertText)}
                      title={tag.insertText}
                      className={cn(
                        'rounded-md px-2 py-1 text-xs font-medium transition-all duration-150',
                        'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]',
                        'hover:bg-primary-100 hover:text-primary-700 active:scale-95',
                        'dark:hover:bg-primary-900 dark:hover:text-primary-300'
                      )}
                    >
                      {tag.emoji} {isZh ? tag.labelZh : tag.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleCard>
  );
}
