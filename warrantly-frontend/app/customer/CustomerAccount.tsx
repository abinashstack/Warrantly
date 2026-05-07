import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CustomerAccount() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) return;

    //   const { data } = await supabase.from('profile').select('*').eq('profile_id', userId).single();

    //   setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/LandingScreen');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-10 pt-14">
        <Text className="text-2xl font-bold text-white">Account</Text>
        <Text className="mt-2 text-blue-100">{profile?.full_name || 'Customer'}</Text>
      </View>

      {/* ================= ACTIONS ================= */}
      <View className="mx-6 mt-8">
        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push('/customer/EditProfile')}>
          <Ionicons name="person-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push('/dealer/DealerSale')}>
          <Ionicons name="settings-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push('/dealer/DealerSale')}>
          <Ionicons name="key-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Security</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push('/dealer/DealerSale')}>
          <Ionicons name="help-circle-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center rounded-xl bg-red-50 p-4"
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="ml-3 font-medium text-red-600">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ================= BOTTOM NAV ================= */}
      <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
        <Pressable onPress={() => router.push('/customer/CustomerDashboard')}>
          <Ionicons name="home-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerProducts')}>
          <Ionicons name="cube-outline" size={24} color="gray" />
        </Pressable>

        <Pressable>
          <View className="-mt-8 rounded-full bg-blue-600 p-4 shadow-lg">
            <Ionicons name="add" size={28} color="white" />
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/customer/Services')}>
          <Ionicons name="chatbubble-outline" size={24} color="gray" />
        </Pressable>

        <Pressable>
          <Ionicons name="person" size={24} color="#2563EB" />
        </Pressable>
      </View>
    </View>
  );
}
