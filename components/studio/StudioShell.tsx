'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle, History, Mic, Settings, Sparkles, Volume2, WandSparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STUDIO_WRAP } from '@/lib/site';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useServerConfig } from '@/lib/store/useServerConfig';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

const ITEMS = [
  { href: '/text-to-speech', label: '生成语音', desc: '把文案转成有情绪的声音', icon: Volume2 },
  { href: '/voice-cloning', label: '克隆音色', desc: '从样本训练可复用模型', icon: Mic },
  { href: '/voices', label: '我的音色', desc: '管理公开音色和已克隆音色', icon: Sparkles },
  { href: '/history', label: '历史', desc: '回放和复用生成结果', icon: History },
  { href: '/voice-design', label: '音色设计', desc: '用文字描述生成音色', icon: WandSparkles },
];

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full flex-col gap-1 p-3 md:w-56 md:flex-shrink-0 md:border-r md:border-[rgb(var(--border))]">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-xl px-3 py-2.5 transition-colors',
              active
                ? 'bg-brand/10 text-brand'
                : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon size={16} />
              {item.label}
            </span>
            <span className={cn('mt-0.5 block pl-6 text-[11px]', active ? 'text-brand/80' : '')}>
              {item.desc}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const hasServerKey = useServerConfig((s) => s.hasServerKey);
  const refreshConfig = useServerConfig((s) => s.refresh);
  const [showSettings, setShowSettings] = useState(false);
  const ready = Boolean(apiKey || hasServerKey);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  return (
    <div className={STUDIO_WRAP}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <div>
          <p className="font-semibold">Voxify Studio</p>
          <p className="text-xs text-[rgb(var(--muted-foreground))]">克隆、合成、管理音色</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-[rgb(var(--muted))] px-2.5 py-1">0 积分</span>
          <span className="rounded-full bg-brand/15 px-2.5 py-1 font-medium text-brand">
            {user ? '已登录工作区' : '免费工作区'}
          </span>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded-full bg-[rgb(var(--muted))] p-1.5 hover:text-brand"
            title="设置"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
      {!ready && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            尚未配置 MiniMax API Key。在项目根目录的 .env 或 .env.local 写入 MINIMAX_API_KEY，或在设置里填写。
          </span>
          <button type="button" onClick={() => setShowSettings(true)} className="btn-secondary h-8 text-xs">
            打开设置
          </button>
        </div>
      )}
      <div className="card flex min-h-[70vh] flex-1 flex-col overflow-hidden md:flex-row">
        <StudioNav />
        <div className="min-w-0 flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">{children}</div>
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
