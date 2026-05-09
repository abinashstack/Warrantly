import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    phone: string;
    roles: string[];
  };
}

export async function sendOtp(phone: string): Promise<{ error?: string }> {
  const res = await fetch(`${API_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || 'Failed to send OTP' };
  return {};
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ session?: AuthSession; error?: string }> {
  const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || 'Verification failed' };

  const session: AuthSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
  };

  await AsyncStorage.setItem('auth_session', JSON.stringify(session));
  return { session };
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem('auth_session');
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem('auth_session');
}
