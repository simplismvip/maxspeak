export const PASSWORD_MIN_LENGTH = 8;
export const NAME_MAX_LENGTH = 32;

export function normalizeName(name: string): string | null {
  const value = name.trim().replace(/\s+/g, ' ');
  if (!value || value.length > NAME_MAX_LENGTH) return null;
  return value;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return '密码至少 8 位';
  if (password.length > 72) return '密码过长';
  return null;
}
