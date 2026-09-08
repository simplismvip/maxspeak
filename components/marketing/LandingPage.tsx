'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check, Mic2, Play } from 'lucide-react';
import { PAGE_WRAP, SITE } from '@/lib/site';
import { FeatureHighlights, PricingSection } from './PricingSection';
import { VoicePreviewGrid } from './VoicePreviewGrid';

const DEMO_VOICES = [
  { name: '可靠高管', desc: '稳重、适合口播与课程' },
  { name: '暖心闺蜜', desc: '温暖、适合叙事' },
  { name: '电台主播', desc: '磁性、适合播客' },
];

const FAQS = [
  {
    q: 'Voxify 怎么工作？',
    a: '上传你拥有授权的人声样本，系统会训练一个可复用音色。之后在工作区输入文案即可合成。',
  },
  {
    q: '样本有什么要求？',
    a: '建议 10 秒到 5 分钟、单说话人、背景安静。MP3 / WAV / M4A 等常见格式都可以。',
  },
  {
    q: '能商用吗？',
    a: 'Pro 及以上按套餐提供商用授权。你必须对源声音拥有权利，并自行负责生成内容的用途。',
  },
  {
    q: '现在能调外部 API 吗？',
    a: '网站工作区会走站内已登录接口。对外开放的 API Key 会在计费稳定后提供。',
  },
];

export function LandingPage() {
  const [demoVoice, setDemoVoice] = useState(0);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  return (
    <div>
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto w-full max-w-4xl px-6 pb-8 pt-16 text-center">
          <div className="mb-5 inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            约 5 分钟完成首次配音 · 无需录音棚
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{SITE.tagline}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[rgb(var(--muted-foreground))]">
            {SITE.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/voice-cloning" className="btn-primary">
              免费克隆我的声音
              <ArrowRight size={16} />
            </Link>
            <Link href="/voices" className="btn-secondary">
              <Play size={14} />
              试听公开音色
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl px-6 pb-16">
          <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2.5 text-xs text-[rgb(var(--muted-foreground))]">
              <span>交互演示 · 不会保存内容</span>
              <span className="inline-flex items-center gap-1.5 text-brand">
                <Check size={12} /> 演示就绪
              </span>
            </div>
            <div className="grid md:grid-cols-[220px_1fr]">
              <aside className="border-b border-[rgb(var(--border))] p-3 md:border-b-0 md:border-r">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted-foreground))]">
                  音色
                </p>
                {DEMO_VOICES.map((voice, index) => (
                  <button
                    key={voice.name}
                    onClick={() => setDemoVoice(index)}
                    className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                      demoVoice === index
                        ? 'bg-brand text-brand-foreground'
                        : 'hover:bg-[rgb(var(--muted))]'
                    }`}
                  >
                    <span>
                      <span className="block font-medium">{voice.name}</span>
                      <span className={`block text-[11px] ${demoVoice === index ? 'opacity-80' : 'text-[rgb(var(--muted-foreground))]'}`}>
                        {voice.desc}
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold">MULTI</span>
                  </button>
                ))}
              </aside>
              <div className="p-5">
                <div className="mb-3 flex gap-2">
                  <span className="rounded-lg bg-[rgb(var(--muted))] px-3 py-1.5 text-xs">语音样本</span>
                  <span className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground">生成语音</span>
                </div>
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-[rgb(var(--muted-foreground))]">
                    <span>文本</span>
                    <div className="flex overflow-hidden rounded-md border border-[rgb(var(--border))]">
                      <button
                        onClick={() => setLang('en')}
                        className={`px-2 py-1 ${lang === 'en' ? 'bg-brand text-brand-foreground' : ''}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => setLang('zh')}
                        className={`px-2 py-1 ${lang === 'zh' ? 'bg-brand text-brand-foreground' : ''}`}
                      >
                        中文
                      </button>
                    </div>
                  </div>
                  <p className="min-h-[88px] text-sm leading-relaxed">
                    {lang === 'zh'
                      ? '你的故事值得被记住。把一段文案变成清晰、有情绪的声音，而不必再回到麦克风前。'
                      : 'Your story deserves a voice people remember. Turn a script into clear, expressive audio without returning to the microphone.'}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[rgb(var(--muted))] px-4 py-3">
                  <p className="text-sm">准备用自己的声音创作？</p>
                  <Link href="/text-to-speech" className="btn-primary text-xs">
                    进入工作区
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <VoicePreviewGrid />

      <section className={`${PAGE_WRAP} py-16`}>
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">三步完成克隆</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: '01', title: '上传样本', body: '录音或上传至少 10 秒清晰人声，尽量避免底噪和音乐。' },
            { step: '02', title: '训练音色', body: '确认授权后提交训练。多数情况下几分钟内就能得到可复用模型。' },
            { step: '03', title: '生成内容', body: '输入文案，调节语速和情感，下载用于视频、课程或播客。' },
          ].map((item) => (
            <div key={item.step} className="card p-5">
              <div className="mb-3 text-xs font-semibold text-brand">{item.step}</div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FeatureHighlights />
      <PricingSection />

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">常见问题</h2>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="card px-5 py-4">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="card flex flex-col items-start justify-between gap-6 bg-[rgb(var(--surface))] p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">用 10 秒音频换一条能上线的声音</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              新用户可体验一次免费克隆。克隆前需确认声音授权。
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/voice-cloning" className="btn-primary">
              <Mic2 size={16} />
              免费克隆
            </Link>
            <Link href="/pricing" className="btn-secondary">查看定价</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
