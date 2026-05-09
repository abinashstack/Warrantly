import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000';
const SESSION_KEY = 'auth_session';

interface Session {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    phone?: string;
    role?: string;
  };
}

/**
 * Compatibility shim that exposes the same supabase.auth interface
 * but uses the Go backend for auth instead of Supabase.
 */
export const supabase = {
  auth: {
    async signInWithOtp({ phone }: { phone: string }) {
      try {
        const res = await fetch(`${API_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) return { error: { message: data.error || 'Failed to send OTP' } };
        return { error: null };
      } catch (e: any) {
        return { error: { message: e.message || 'Network error' } };
      }
    },

    async verifyOtp({ phone, token, type }: { phone: string; token: string; type?: string }) {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: token }),
        });
        const data = await res.json();
        if (!res.ok) return { error: { message: data.error || 'Verification failed' } };

        const session: Session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { error: null, data: { session } };
      } catch (e: any) {
        return { error: { message: e.message || 'Network error' } };
      }
    },

    async getSession() {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return { data: { session: null } };
      const session = JSON.parse(raw) as Session;
      return { data: { session } };
    },

    async getUser() {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return { data: { user: null } };
      const session = JSON.parse(raw) as Session;
      return { data: { user: session.user } };
    },

    async signOut() {
      await AsyncStorage.removeItem(SESSION_KEY);
    },
  },
};
