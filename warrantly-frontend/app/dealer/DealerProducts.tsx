import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DealerProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDealerProducts();
  }, []);

  const fetchDealerProducts = async () => {
    try {
      setLoading(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('http://localhost:3000/api/dealerProducts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.items || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-xl font-bold text-white">Dealer Products</Text>
        <Text className="mt-1 text-sm text-blue-100">Manage your products & models</Text>
      </View>

      {/* ================= CONTENT ================= */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Add Product Button */}
        <TouchableOpacity
          onPress={() => router.push('/dealer/DealerAddProduct')}
          className="mb-6 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4">
          <Ionicons name="add" size={20} color="white" />
          <Text className="ml-2 font-semibold text-white">Add Product</Text>
        </TouchableOpacity>

        {/* Product Cards */}
        {products.map((item) => (
          <TouchableOpacity
            key={item.dealer_product_id}
            className="mb-4 rounded-2xl bg-white p-5 shadow-sm"
            onPress={() => {router.push({
              pathname: '/dealer/DealerProductModels',
              params: { dealer_product_id: item.dealer_product_id },
            })}}>
            <View className="flex-row items-center justify-between">
              {/* Left Side */}
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={24} color="#2563EB" />
                  <Text className="ml-3 text-lg font-semibold text-gray-900">
                    {item.product_name}
                  </Text>
                </View>

                <Text className="mt-2 text-sm text-gray-500">{item.model_count} Models</Text>
              </View>

              {/* Right Chevron */}
              <View className="justify-center">
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ================= BOTTOM NAV ================= */}
      <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
        <Pressable onPress={() => router.push('/dealer/DealerDashboard')}>
          <Ionicons name="home-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerProducts')}>
          <Ionicons name="cube-outline" size={24} color="#2563EB" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerSale')}>
          <View className="-mt-8 rounded-full bg-blue-600 p-4 shadow-lg">
            <Ionicons name="add" size={28} color="white" />
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/Tasks')}>
          <Ionicons name="list-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/Account')}>
          <Ionicons name="person-outline" size={24} color="gray" />
        </Pressable>
      </View>
    </View>
  );
}
