'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { SpeedPitchControls } from './SpeedPitchControls';
import { VoiceModifyControls } from './VoiceModifyControls';
import { AudioSettings } from './AudioSettings';
import { LanguageBoostSelect } from './LanguageBoostSelect';
import { PronunciationEditor } from './PronunciationEditor';

export function AdvancedSettingsPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative m-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[rgb(var(--card))] shadow-2xl scrollbar-thin animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">高级设置</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[rgb(var(--muted))]"
            aria-label="关闭"
          >
            <X size={18} className="text-[rgb(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <ModelSelector />
          <SpeedPitchControls />
          <VoiceModifyControls />
          <AudioSettings />
          <LanguageBoostSelect />
          <PronunciationEditor />
        </div>
      </div>
    </div>
  );
}
