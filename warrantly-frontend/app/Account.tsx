import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Profile = {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  role?: string[]; // if you add role later
  timezone?: string;
};

export default function Account() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      setLoading(true);

      // 1️⃣ Get auth user
      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData.user;

      if (!authUser) {
        setLoading(false);
        return;
      }

      setUser(authUser);

      // 2️⃣ Fetch profile from API
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token) {
        try {
          const res = await fetch('http://localhost:3000/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profileData = await res.json();
            setProfile(profileData);
          }
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      }

      setLoading(false);
    };

    loadAccount();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading account…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      {/* Header */}
      <Text className="mb-6 text-2xl font-bold text-gray-900">Account</Text>

      {/* Profile Card */}
      <View className="mb-8 rounded-2xl bg-gray-100 p-5">
        <Text className="text-lg font-semibold text-gray-800">
          {profile
            ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'User'
            : 'User'}
        </Text>

        <Text className="mt-1 text-sm text-gray-500">
          {profile?.email_address ?? user?.phone ?? 'No email set'}
        </Text>

        {profile?.role && (
          <Text className="mt-2 text-xs text-gray-400">
            Role: {Array.isArray(profile.role) ? profile.role.join(', ') : profile.role}
          </Text>
        )}

        {profile?.timezone && (
          <Text className="mt-1 text-xs text-gray-400">Timezone: {profile.timezone}</Text>
        )}
      </View>

      {/* Menu Items */}
      <View className="space-y-4">
        <TouchableOpacity
          className="rounded-xl bg-gray-100 px-4 py-4"
          onPress={() => router.push('/HomeScreen')}>
          <Text className="text-gray-700">My Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-xl bg-gray-100 px-4 py-4"
          onPress={() => router.push('/WarrantyDetailsScreen')}>
          <Text className="text-gray-700">Upload Warranty</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      <View className="flex-1" />

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} className="mb-10 rounded-xl bg-red-100 py-4">
        <Text className="text-center text-base font-semibold text-red-600">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
