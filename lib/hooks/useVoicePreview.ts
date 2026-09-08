'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { minimaxHeaders } from '@/lib/minimax/request';
import type { PresetVoice } from '@/lib/minimax/types';

const LANGUAGE_BOOST: Record<string, string> = {
  Chinese: 'Chinese',
  English: 'English',
  Japanese: 'Japanese',
  Korean: 'Korean',
  Cantonese: 'Chinese,Yue',
  Spanish: 'Spanish',
  French: 'French',
  Portuguese: 'Portuguese',
  German: 'German',
  Russian: 'Russian',
  Arabic: 'Arabic',
  Italian: 'Italian',
  Turkish: 'Turkish',
  Dutch: 'Dutch',
  Ukrainian: 'Ukrainian',
  Vietnamese: 'Vietnamese',
  Indonesian: 'Indonesian',
  Thai: 'Thai',
  Polish: 'Polish',
  Hindi: 'Hindi',
};

export function useVoicePreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current || !document.body.contains(audioRef.current)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('ended', () => setPlayingId(null));
      document.body.appendChild(audio);
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.remove();
      }
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingId(null);
  }, []);

  const playUrl = useCallback((voiceId: string, url: string) => {
    const audio = ensureAudio();
    if (audio.src !== url) audio.src = url;
    void audio.play().then(() => setPlayingId(voiceId)).catch(() => {
      setError('无法播放试听，请再点一次');
      setPlayingId(null);
    });
  }, [ensureAudio]);

  const preview = useCallback(async (voice: PresetVoice) => {
    setError(null);

    if (playingId === voice.id) {
      stop();
      return;
    }

    const cached = cacheRef.current.get(voice.id);
    if (cached) {
      playUrl(voice.id, cached);
      return;
    }

    setLoadingId(voice.id);
    try {
      const body = {
        model: 'speech-2.8-turbo' as const,
        text: voice.sampleText || '你好，这是音色试听。Hello, this is a voice preview.',
        voice_setting: { voice_id: voice.id },
        audio_setting: {
          sample_rate: 24000 as const,
          bitrate: 64000,
          format: 'mp3' as const,
          channel: 1 as const,
        },
        language_boost: LANGUAGE_BOOST[voice.language] || 'auto',
        output_format: 'url' as const,
      };

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: minimaxHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText.slice(0, 120) || `试听失败（${res.status}）`);
      }

      const contentType = res.headers.get('content-type') || '';
      let audioUrl: string;
      if (contentType.startsWith('audio/')) {
        audioUrl = URL.createObjectURL(await res.blob());
      } else {
        const data = await res.json();
        if (!data.audio_file) throw new Error('接口未返回音频');
        audioUrl = data.audio_file;
      }

      cacheRef.current.set(voice.id, audioUrl);
      playUrl(voice.id, audioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '试听失败');
      setPlayingId(null);
    } finally {
      setLoadingId(null);
    }
  }, [playUrl, playingId, stop]);

  return { preview, stop, loadingId, playingId, error };
}
