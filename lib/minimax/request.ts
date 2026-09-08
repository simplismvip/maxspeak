import { useSettingsStore } from '@/lib/store/useSettingsStore';

export function minimaxHeaders(init: Record<string, string> = {}): Record<string, string> {
  const { apiKey, baseUrl } = useSettingsStore.getState();
  const headers: Record<string, string> = { ...init };
  if (apiKey) headers['x-api-key'] = apiKey;
  if (baseUrl) headers['x-base-url'] = baseUrl;
  return headers;
}
