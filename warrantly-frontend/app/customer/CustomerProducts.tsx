import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CustomerProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserProducts = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const res = await fetch('http://localhost:3000/api/user-products', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setProducts(data.userProducts);
      } else {
        console.error('Failed to fetch products:', data);
      }
    };

    fetchUserProducts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'EXPIRING':
        return 'text-amber-600';
      case 'EXPIRED':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getWarrantyStatus = (warrantyEndDate: string) => {
    if (!warrantyEndDate) return 'EXPIRED';

    const today = new Date();
    const endDate = new Date(warrantyEndDate);

    // Remove time part for accurate day comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < today) {
      return 'EXPIRED';
    }

    // Days remaining
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return 'EXPIRING';
    }

    return 'ACTIVE';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ================= HEADER ================= */}
        <View className="rounded-b-3xl bg-blue-800 px-5 pb-10 pt-14">
          <Text className="text-2xl font-bold text-white">My Products</Text>
          <Text className="mt-2 text-blue-100">Track warranties & services</Text>
        </View>

        {/* ================= PRODUCT LIST ================= */}
        <View className="mt-8 px-5">
          {products.map((item) => (
            <TouchableOpacity
              key={item.user_product_id}
              onPress={() => router.push(`/customer/CustomerProductDetail`)}
              className="mb-4 rounded-2xl bg-white p-5 shadow-md">
              {/* Top Row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <Ionicons name="cube-outline" size={24} color="#2563EB" />
                  <Text className="ml-3 flex-1 text-base font-semibold text-gray-900">
                    {item.user_product_name}
                  </Text>
                </View>

                <Ionicons name="chevron-forward-outline" size={20} color="gray" />
              </View>

              {/* Model */}
              <Text className="mt-2 text-sm text-gray-500">Model: {item.model}</Text>

              {/* Warranty + Service Info */}
              <View className="mt-3">
                <Text className="text-sm text-gray-600">
                  Warranty valid till: {item.warranty_end_date}
                </Text>

                {item.nextService && (
                  <Text className="text-sm text-gray-600">Next service: {item.nextService}</Text>
                )}

                {(() => {
                  const status = getWarrantyStatus(item.warranty_end_date);

                  return (
                    <Text className={`mt-2 text-sm font-semibold ${getStatusColor(status)}`}>
                      {status === 'ACTIVE'
                        ? 'Warranty Active'
                        : status === 'EXPIRING'
                          ? 'Expiring Soon'
                          : 'Expired'}
                    </Text>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ================= BOTTOM NAV ================= */}
      <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
        <Pressable onPress={() => router.push('/customer/CustomerDashboard')}>
          <Ionicons name="home" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerProducts')}>
          <Ionicons name="cube-outline" size={24} color="#2563EB" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerUpload')}>
          <View className="-mt-8 rounded-full bg-blue-600 p-4 shadow-lg">
            <Ionicons name="add" size={28} color="white" />
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerNotifications')}>
          <Ionicons name="chatbubble-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerAccount')}>
          <Ionicons name="person-outline" size={24} color="gray" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
