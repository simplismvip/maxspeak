export function safeInternalPath(value: string | null | undefined, fallback = '/text-to-speech') {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
