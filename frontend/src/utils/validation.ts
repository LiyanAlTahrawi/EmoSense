export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const v = value.trim();
  return v === '' || /^\+?[0-9\s().-]{7,20}$/.test(v);
}

export interface PasswordCheck {
  id: string;
  label: string;
  met: boolean;
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
  { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
  { id: 'case', label: 'Upper and lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  { id: 'number', label: 'At least one number', met: /\d/.test(password) },
  { id: 'symbol', label: 'At least one symbol', met: /[^A-Za-z0-9]/.test(password) }];

}

export function passwordStrength(password: string): {score: number;label: string;} {
  if (!password) return { score: 0, label: '' };
  const met = passwordChecks(password).filter((c) => c.met).length;
  if (password.length < 8) return { score: 1, label: 'Too short' };
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: Math.max(1, met), label: labels[met] };
}

export function isPasswordAcceptable(password: string): boolean {
  return password.length >= 8 && passwordStrength(password).score >= 2;
}