'use client';

import { History } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { LoginRequiredState } from '@/components/auth/LoginRequiredState';

export function HistoryPanel() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <div className="mb-6">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[rgb(var(--foreground))]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/10">
            <History size={16} className="text-sky-500" />
          </div>
          生成历史
        </h2>
        <p className="ml-[42px] mt-1.5 text-sm text-[rgb(var(--muted-foreground))]">
          回放和复用每次合成任务
        </p>
      </div>

      {user ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] px-6 py-16 text-center">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">暂无生成记录</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
            去「生成语音」合成后，任务会出现在这里。
          </p>
        </div>
      ) : (
        <LoginRequiredState
          title="登录后查看生成历史"
          description="生成历史仅对您的登录账户可见。"
        />
      )}
    </div>
  );
}
