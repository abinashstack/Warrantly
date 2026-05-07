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

      // 2️⃣ Fetch profile from DB
      const { data: profileData, error } = await supabase
        .from('profile')
        .select(
          `
          profile_id,
          first_name,
          last_name,
          email_address,
          role,
          timezone
        `
        )
        .eq('profile_id', authUser.id)
        .single();

      if (!error) {
        setProfile(profileData);
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
          {profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : 'User'}
        </Text>

        <Text className="mt-1 text-sm text-gray-500">{profile?.email_address ?? user?.email}</Text>

        {profile?.role && (
          <Text className="mt-2 text-xs text-gray-400">Role: {profile.role.join(', ')}</Text>
        )}

        {profile?.timezone && (
          <Text className="mt-1 text-xs text-gray-400">Timezone: {profile.timezone}</Text>
        )}
      </View>

      {/* Menu Items */}
      <View className="space-y-4">
        <MenuItem title="Profile details" disabled />
        <MenuItem title="Notification preferences" disabled />
        <MenuItem title="Role & access" disabled />
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

const MenuItem = ({ title, disabled = false }: { title: string; disabled?: boolean }) => {
  return (
    <View className={`rounded-xl px-4 py-4 ${disabled ? 'bg-gray-100' : 'bg-gray-200'}`}>
      <Text className="text-gray-400">{title}</Text>
    </View>
  );
};
