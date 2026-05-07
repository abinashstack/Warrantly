import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Account() {
  const router = useRouter();
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchDealerProfile();
    fetchRevenue();
  }, []);

  const fetchDealerProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) return;

      // Get dealer_id from dealer_user
      const { data: dealerUser } = await supabase
        .from('dealer_user')
        .select('dealer_id')
        .eq('profile_id', userId)
        .single();

      if (!dealerUser) return;

      // Get dealer details
      const { data: dealerData } = await supabase
        .from('dealer')
        .select('*')
        .eq('dealer_id', dealerUser.dealer_id)
        .single();

      setDealer(dealerData);
    } catch (err) {
      console.error('Failed to load dealer:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const { data } = await supabase.from('invoices').select('total_amount');

      const revenue = data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      setTotalRevenue(revenue);
    } catch (err) {
      console.error('Failed to fetch revenue:', err);
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
      {/* Header */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-2xl font-bold text-white">Account</Text>
      </View>

      {/* Actions */}
      <View className="mx-6 mt-8">
        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push('/dealer/SalesHistory')}>
          <Ionicons name="business-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Business Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push('/dealer/DealerSale')}>
          <Ionicons name="receipt-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Invoice Setting</Text>
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
          <Ionicons name="cash-outline" size={20} color="#2563EB" />
          <Text className="ml-3 font-medium text-gray-900">Business Insights</Text>
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

            <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
              <Pressable onPress={() => router.push('/dealer/DealerDashboard')}>
                <Ionicons name="home" size={24} color="#2563EB" />
              </Pressable>
      
              <Pressable onPress={() => router.push('/dealer/DealerAddProduct')}>
                <Ionicons name="cube-outline" size={24} color="gray" />
              </Pressable>
      
              <Pressable onPress={() => router.push('/dealer/DealerSale')}>
                <View className="-mt-8 rounded-full bg-blue-600 p-4 shadow-lg">
                  <Ionicons name="add" size={28} color="white" />
                </View>
              </Pressable>
      
              <Pressable>
                <Ionicons name="chatbubble-outline" size={24} color="gray" />
              </Pressable>
      
              <Pressable>
                <Ionicons name="person-outline" size={24} color="gray" />
              </Pressable>
            </View>
    </View>
  );
}
