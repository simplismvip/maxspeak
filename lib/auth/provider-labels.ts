export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  google: '使用 Google 账号继续',
  github: '使用 GitHub 账号继续',
  apple: '使用 Apple 账号继续',
};

export function authProviderLabel(id: string, fallbackName?: string) {
  return AUTH_PROVIDER_LABELS[id] || `使用 ${fallbackName || id} 账号继续`;
}
