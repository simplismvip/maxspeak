export const SITE = {
  name: 'Voxify',
  tagline: '克隆一次音色，随时生成配音',
  description:
    '用自己的克隆音色，或公开音色，把文案转成可用于视频、播客和课程的语音。',
  github: 'https://github.com/simplismvip/maxspeak',
} as const;

/** Matches CloneVoice marketing: 1280px content with 24px gutters. Studio uses the same so nav pages align. */
export const PAGE_WRAP = 'mx-auto w-full max-w-7xl px-6';
export const STUDIO_WRAP =
  'mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl flex-col px-6 py-6 pb-24';

export const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/voice-cloning', label: '音色复刻' },
  { href: '/history', label: '历史' },
  { href: '/voices', label: '公开音色' },
  { href: '/pricing', label: '定价' },
] as const;
