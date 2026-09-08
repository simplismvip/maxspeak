import Link from 'next/link';
import { Check, Sparkles, Zap, Shield, Languages, Code2 } from 'lucide-react';
import { PAGE_WRAP } from '@/lib/site';

const PLANS = [
  {
    name: 'Free',
    price: '¥0',
    period: '/月',
    blurb: '体验一次完整的克隆到合成流程。',
    cta: '免费开始',
    href: '/signin',
    featured: false,
    features: ['新用户 1 次音色复刻 + 1 次 TTS', '单次 TTS 最多 120 字', '保留 1 个可复用音色', '社区支持'],
    limits: ['输出可能带标识', '不可商用'],
  },
  {
    name: 'Pro',
    price: '¥99',
    period: '/月',
    blurb: '创作者和配音工作流的主力套餐。',
    cta: '选择 Pro',
    href: '/signin',
    featured: true,
    features: [
      '每期 100,000 积分',
      'TTS 每满 1000 字消耗 1000 积分',
      '每次复刻消耗 2000 积分',
      '最多 5 个可复用音色',
      '无水印 · 可商用',
      '语速 / 音高 / 情感调节',
    ],
    limits: [],
  },
  {
    name: 'Enterprise',
    price: '联系我们',
    period: '',
    blurb: '大规模生成、私有化和团队协作。',
    cta: '联系销售',
    href: 'mailto:hello@example.com',
    featured: false,
    features: ['按量或专属配额', '团队管理', '私有部署协商', '专属支持与对接'],
    limits: [],
  },
];

export function PricingSection({ id = 'pricing' }: { id?: string }) {
  return (
    <section id={id} className={`${PAGE_WRAP} py-20`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">定价</h2>
        <p className="mt-3 text-[rgb(var(--muted-foreground))]">
          先免费跑通流程，再按积分升级。价格可按你的上游成本再调整。
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`card flex flex-col p-6 ${plan.featured ? 'border-brand/50 ring-1 ring-brand/30' : ''}`}
          >
            {plan.featured && (
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand">最受欢迎</div>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">{plan.blurb}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">{plan.price}</span>
              <span className="text-sm text-[rgb(var(--muted-foreground))]">{plan.period}</span>
            </div>
            <Link href={plan.href} className={`mt-6 ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}>
              {plan.cta}
            </Link>
            <ul className="mt-6 space-y-2 text-sm">
              {plan.features.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-brand" />
                  <span>{item}</span>
                </li>
              ))}
              {plan.limits.map((item) => (
                <li key={item} className="flex gap-2 text-[rgb(var(--muted-foreground))]">
                  <span className="mt-0.5 w-4 text-center">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-3 text-sm text-[rgb(var(--muted-foreground))] md:grid-cols-3">
        <div className="flex items-center gap-2"><Zap size={16} className="text-brand" /> 大约 5 分钟完成首次克隆</div>
        <div className="flex items-center gap-2"><Shield size={16} className="text-brand" /> 账号绑定音色，默认不公开</div>
        <div className="flex items-center gap-2"><Code2 size={16} className="text-brand" /> 后续开放开发者 API</div>
      </div>
    </section>
  );
}

export function FeatureHighlights() {
  const items = [
    { icon: Languages, title: '多语言合成', body: '中英日韩及更多语种，同一套工作流出声。' },
    { icon: Sparkles, title: '情感与参数', body: '语速、音高、情感标签可调，适合口播和叙事。' },
    { icon: Zap, title: '短样本复刻', body: '约 10 秒清晰人声即可开始训练可复用音色。' },
    { icon: Shield, title: '授权确认', body: '每次复刻前确认声音归属，降低滥用风险。' },
  ];
  return (
    <section className={`${PAGE_WRAP} py-16`}>
      <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">先求快，也不丢关键能力</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <Icon size={18} className="mb-3 text-brand" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
