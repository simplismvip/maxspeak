'use client';

import { useState, useMemo, useCallback, useRef, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { PRESET_VOICES, VOICE_LANGUAGES, filterVoices, groupVoicesByLanguage } from '@/lib/voices/preset-voices';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useServerConfig } from '@/lib/store/useServerConfig';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { cn } from '@/lib/utils';
import { minimaxHeaders } from '@/lib/minimax/request';
import { ChevronDown, Search, Library } from 'lucide-react';
import { LibraryVoiceCard } from '@/components/library/LibraryVoiceCard';
import { LoginRequiredState } from '@/components/auth/LoginRequiredState';

type VoiceSource = 'system' | 'cloned' | 'designed';

function FitSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const label = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '';

  const updateMenuPos = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    const maxH = 256;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < 160 && rect.top > spaceBelow;
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      minWidth: rect.width,
      maxHeight: Math.min(maxH, Math.max(120, openUp ? rect.top - 8 : spaceBelow)),
      zIndex: 80,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', updateMenuPos);
    window.addEventListener('scroll', updateMenuPos, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', updateMenuPos);
      window.removeEventListener('scroll', updateMenuPos, true);
    };
  }, [open, updateMenuPos]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="input-field relative inline-flex w-auto shrink-0 cursor-pointer items-center whitespace-nowrap py-2.5 pl-3.5 pr-[2.625rem] text-left text-sm"
      >
        {label}
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]"
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className="overflow-y-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] py-1 shadow-lg"
          >
            {options.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full whitespace-nowrap px-3.5 py-2 text-left text-sm',
                  option.value === value
                    ? 'bg-brand/10 text-[rgb(var(--foreground))]'
                    : 'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export function VoiceLibrary() {
  const router = useRouter();
  const settings = useSettingsStore();
  const hasServerKey = useServerConfig((s) => s.hasServerKey);
  const selectVoiceFromLibrary = useTTSStore((s) => s.selectVoiceFromLibrary);
  const selectedVoiceId = useTTSStore((s) => s.voiceId);
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [source, setSource] = useState<VoiceSource>('system');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncedVoices, setSyncedVoices] = useState<any[]>([]);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get('source');
    if (src === 'cloned' || src === 'designed' || src === 'system') {
      setSource(src);
    }
  }, []);

  // Load custom voices
  const clonedVoices = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('tts-cloned-voices') || '[]'); }
    catch { return []; }
  }, []);

  const designedVoices = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('tts-designed-voices') || '[]'); }
    catch { return []; }
  }, []);

  // Filter system voices (merge preset + synced from API)
  const allSystemVoices = useMemo(
    () => hasSynced ? [...PRESET_VOICES, ...syncedVoices] : PRESET_VOICES,
    [hasSynced, syncedVoices]
  );
  const filteredSystem = useMemo(
    () => filterVoices(allSystemVoices, language || undefined, search || undefined, gender || undefined),
    [allSystemVoices, language, search, gender]
  );

  const groupedSystem = useMemo(() => groupVoicesByLanguage(filteredSystem), [filteredSystem]);

  // Sync from API
  const handleSyncFromAPI = async () => {
    if (!settings.apiKey && !hasServerKey) {
      setSyncMessage('请先配置 MiniMax API Key');
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch('/api/voices/list', {
        method: 'POST',
        headers: minimaxHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ voice_type: 'all', page_size: 500 }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await res.json();
      const rawVoices: any[] = data.voice_list || [];
      // Convert MiniMax API voice format to PresetVoice format
      const converted = rawVoices.map((v: any) => ({
        id: String(v.voice_id || ''),
        name: String(v.voice_name || v.voice_id || ''),
        language: String(v.language || 'Unknown'),
        languageLabel: String(v.language || 'Unknown'),
        gender: (v.gender || 'neutral') as 'male' | 'female' | 'neutral',
        description: typeof v.description === 'string' ? v.description : '',
        tags: v.voice_type === 'voice_cloning' ? ['复刻'] : v.voice_type === 'voice_generation' ? ['设计'] : ['系统'],
        demoAudio: typeof v.demo_audio === 'string' ? v.demo_audio : undefined,
        voiceType: v.voice_type,
      }));
      setSyncedVoices(converted);
      setHasSynced(true);
      setSyncMessage(`✅ 成功获取 ${converted.length} 个音色（系统 + 自定义）。已合并到本地库。`);
    } catch (err) {
      setSyncMessage(`❌ 同步失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleUseVoice = (opts: {
    voiceId: string;
    source: VoiceSource;
    language?: string;
    gender?: string;
  }) => {
    selectVoiceFromLibrary(opts);
    router.push('/text-to-speech');
  };

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lazy-create preview audio that's DOM-attached (autoplay policy requires DOM connection)
  const ensurePreviewAudio = useCallback(() => {
    if (!previewAudioRef.current || !document.body.contains(previewAudioRef.current)) {
      const a = new Audio();
      a.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(a);
      previewAudioRef.current = a;
    }
    return previewAudioRef.current;
  }, []);

  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    if (!settings.apiKey && !hasServerKey) return;

    setPreviewLoading(voiceId);
    setPreviewError(null);

    try {
      const voice = PRESET_VOICES.find(v => v.id === voiceId);
      const sampleText = voice?.sampleText || '你好，这是音色试听。Hello, this is a voice preview.';

      // Map voice language to language_boost
      const langMap: Record<string, string> = {
        'Chinese': 'Chinese', 'English': 'English', 'Japanese': 'Japanese',
        'Korean': 'Korean', 'Cantonese': 'Chinese,Yue', 'Spanish': 'Spanish',
        'French': 'French', 'Portuguese': 'Portuguese', 'German': 'German',
        'Russian': 'Russian', 'Arabic': 'Arabic', 'Italian': 'Italian',
        'Turkish': 'Turkish', 'Dutch': 'Dutch', 'Ukrainian': 'Ukrainian',
        'Vietnamese': 'Vietnamese', 'Indonesian': 'Indonesian',
        'Thai': 'Thai', 'Polish': 'Polish', 'Hindi': 'Hindi',
      };
      const languageBoost = voice ? (langMap[voice.language] || 'auto') : 'auto';

      const body = {
        model: 'speech-2.8-turbo' as const,
        text: sampleText,
        voice_setting: { voice_id: voiceId },
        audio_setting: {
          sample_rate: 24000 as const,
          bitrate: 64000,
          format: 'mp3' as const,
          channel: 1 as const,
        },
        language_boost: languageBoost,
        output_format: 'url' as const,
      };

      console.log('[preview] Requesting TTS for voice:', voiceId);

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: minimaxHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[preview] API error:', res.status, errText.slice(0, 200));
        setPreviewError(`API ${res.status}: ${errText.slice(0, 100)}`);
        return;
      }

      const ct = res.headers.get('content-type') || '';
      let audioUrl: string;

      if (ct.startsWith('audio/')) {
        const blob = await res.blob();
        console.log('[preview] Got audio blob:', blob.size, 'bytes, type:', blob.type);
        audioUrl = URL.createObjectURL(blob);
      } else {
        const data = await res.json();
        console.log('[preview] JSON, audio_file:', data.audio_file?.slice(0, 80) || 'none');
        if (!data.audio_file) {
          setPreviewError('No audio in response');
          return;
        }
        audioUrl = data.audio_file;
      }

      // Play: try DOM-attached element first, fallback to main player's audio
      const playAudio = (url: string) => {
        const a = ensurePreviewAudio();
        a.src = url;
        const p = a.play();
        if (p) p.catch(() => {
          // DOM audio failed — try main player audio (already visible in DOM)
          const mainAudio = document.querySelector('#main-player-audio') as HTMLAudioElement | null;
          if (mainAudio) { mainAudio.src = url; mainAudio.play().catch(() => {}); }
        });
      };
      playAudio(audioUrl);
    } catch (err) {
      console.error('[preview] Exception:', err);
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewLoading(null);
    }
  }, [settings, hasServerKey, ensurePreviewAudio]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-[rgb(var(--foreground))] tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
              <Library size={16} className="text-purple-500" />
            </div>
            Voice Library
          </h2>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1.5 ml-[42px]">
            Browse system voices, cloned voices, and designed voices
          </p>
        </div>

        <button
          onClick={handleSyncFromAPI}
          disabled={isSyncing}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              同步中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              从 API 同步
            </>
          )}
        </button>
      </div>

      {previewError && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {previewError}
        </p>
      )}

      {syncMessage && (
        <div className={cn(
          'mb-4 p-3 rounded-lg text-sm',
          syncMessage.startsWith('✅') ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
        )}>
          {syncMessage}
        </div>
      )}

      {/* Source Tabs */}
      <div className="flex gap-1 mb-4 p-0.5 bg-[rgb(var(--muted))] rounded-lg w-fit">
        {[
          { id: 'system' as VoiceSource, label: '系统音色', count: allSystemVoices.length },
          { id: 'cloned' as VoiceSource, label: '复刻音色', count: user ? clonedVoices.length : null },
          { id: 'designed' as VoiceSource, label: '设计音色', count: user ? designedVoices.length : null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSource(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              source === tab.id
                ? 'bg-white dark:bg-slate-600 shadow-sm text-[rgb(var(--foreground))]'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
            )}
          >
            {tab.label}{tab.count == null ? '' : ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Filters (for system voices only) */}
      {source === 'system' && (
        <div className="mb-4 flex flex-wrap items-center gap-3 pr-6">
          <div className="relative min-w-[12rem] flex-1 max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索音色..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <FitSelect
            value={language}
            onChange={setLanguage}
            options={[
              { value: '', label: '全部语言' },
              ...VOICE_LANGUAGES.map((item) => ({ value: item.code, label: item.label })),
            ]}
          />
          <FitSelect
            value={gender}
            onChange={setGender}
            options={[
              { value: '', label: '全部' },
              { value: 'male', label: '男声' },
              { value: 'female', label: '女声' },
              { value: 'neutral', label: '中性' },
            ]}
          />
        </div>
      )}

      {/* Voice Display */}
      {source === 'system' && (
        <div className="space-y-6">
          {Array.from(groupedSystem.entries()).map(([languageLabel, voices]) => (
            <div key={languageLabel}>
              <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-2 flex items-center gap-2">
                {languageLabel}
                <span className="text-xs font-normal text-[rgb(var(--muted-foreground))]">({voices.length})</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {voices.map((voice) => (
                  <LibraryVoiceCard
                    key={voice.id}
                    seed={voice.id}
                    name={voice.name}
                    description={voice.description}
                    meta={voice.languageLabel}
                    tags={voice.tags}
                    selected={selectedVoiceId === voice.id}
                    previewLoading={previewLoading === voice.id}
                    onPreview={() => void handlePreviewVoice(voice.id)}
                    onUse={() =>
                      handleUseVoice({
                        voiceId: voice.id,
                        source: 'system',
                        language: voice.language,
                        gender: voice.gender,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
          {filteredSystem.length === 0 && (
            <p className="text-center py-8 text-[rgb(var(--muted-foreground))]">
              未找到匹配的音色
            </p>
          )}
        </div>
      )}

      {/* Cloned Voices */}
      {source === 'cloned' && !user && (
        <LoginRequiredState
          title="登录后查看复刻音色"
          description="复刻音色仅对您的登录账户可见。"
          next="/voices?source=cloned"
        />
      )}
      {source === 'cloned' && user && (
        <div>
          {clonedVoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎙️</div>
              <p className="text-[rgb(var(--muted-foreground))]">暂无复刻音色</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                前往「音色复刻」页面创建您的自定义音色
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {clonedVoices.map((voice: { voiceId: string; name: string; createdAt: number; demoAudio?: string; fileId: number }) => (
                <LibraryVoiceCard
                  key={voice.voiceId}
                  seed={voice.voiceId}
                  name={voice.name || voice.voiceId}
                  description={voice.voiceId}
                  meta={new Date(voice.createdAt).toLocaleString('zh-CN')}
                  selected={selectedVoiceId === voice.voiceId}
                  canPreview={Boolean(voice.demoAudio)}
                  onPreview={
                    voice.demoAudio
                      ? () => {
                          try {
                            const a = new Audio(voice.demoAudio);
                            a.play().catch(() => {});
                          } catch {}
                        }
                      : undefined
                  }
                  onUse={() => handleUseVoice({ voiceId: voice.voiceId, source: 'cloned' })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Designed Voices */}
      {source === 'designed' && !user && (
        <LoginRequiredState
          title="登录后查看设计音色"
          description="设计音色仅对您的登录账户可见。"
          next="/voices?source=designed"
        />
      )}
      {source === 'designed' && user && (
        <div>
          {designedVoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-[rgb(var(--muted-foreground))]">暂无设计音色</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                前往「音色设计」页面通过文字描述创造新音色
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {designedVoices.map((voice: { voiceId: string; prompt: string; previewText: string; createdAt: number; trialAudio?: string }) => (
                <LibraryVoiceCard
                  key={voice.voiceId}
                  seed={voice.voiceId}
                  name={voice.voiceId}
                  description={voice.prompt}
                  meta={new Date(voice.createdAt).toLocaleString('zh-CN')}
                  selected={selectedVoiceId === voice.voiceId}
                  canPreview={Boolean(voice.trialAudio)}
                  onPreview={
                    voice.trialAudio
                      ? () => {
                          try {
                            const audio = voice.trialAudio!;
                            const bytes = new Uint8Array(audio.length / 2);
                            for (let i = 0; i < audio.length; i += 2) {
                              bytes[i / 2] = parseInt(audio.substring(i, i + 2), 16);
                            }
                            const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
                            const url = URL.createObjectURL(blob);
                            const a = new Audio(url);
                            a.play().catch(() => {});
                          } catch {}
                        }
                      : undefined
                  }
                  onUse={() => handleUseVoice({ voiceId: voice.voiceId, source: 'designed' })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
