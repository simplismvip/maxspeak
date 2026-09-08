import Link from 'next/link';
import { SITE, PAGE_WRAP } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className={`${PAGE_WRAP} grid gap-8 py-12 md:grid-cols-4`}>
        <div className="md:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <img src="/logo.png?v=3" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-semibold">{SITE.name}</span>
          </div>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            {SITE.description}
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">产品</h3>
          <ul className="space-y-2 text-sm text-[rgb(var(--muted-foreground))]">
            <li><Link href="/voice-cloning" className="hover:text-[rgb(var(--foreground))]">音色复刻</Link></li>
            <li><Link href="/text-to-speech" className="hover:text-[rgb(var(--foreground))]">文字转语音</Link></li>
            <li><Link href="/voices" className="hover:text-[rgb(var(--foreground))]">公开音色</Link></li>
            <li><Link href="/voice-design" className="hover:text-[rgb(var(--foreground))]">音色设计</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">资源</h3>
          <ul className="space-y-2 text-sm text-[rgb(var(--muted-foreground))]">
            <li><Link href="/pricing" className="hover:text-[rgb(var(--foreground))]">定价</Link></li>
            <li><Link href="/history" className="hover:text-[rgb(var(--foreground))]">生成历史</Link></li>
            <li>
              <a href={SITE.github} target="_blank" rel="noreferrer" className="hover:text-[rgb(var(--foreground))]">
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">开始使用</h3>
          <p className="mb-3 text-sm text-[rgb(var(--muted-foreground))]">
            上传约 10 秒清晰人声，即可训练可复用音色。
          </p>
          <Link href="/voice-cloning" className="btn-primary text-xs">
            免费克隆音色
          </Link>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--border))] py-4 text-center text-xs text-[rgb(var(--muted-foreground))]">
        © {new Date().getFullYear()} {SITE.name}. 仅克隆你拥有授权的声音。
      </div>
    </footer>
  );
}
