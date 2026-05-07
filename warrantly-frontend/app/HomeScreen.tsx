import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const HomeScreen = () => {
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
        setProducts(data);
      } else {
        console.error('Failed to fetch products:', data);
      }
    };

    fetchUserProducts();
  }, []);

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10" showsVerticalScrollIndicator={false}>
      {/* Top Icons Row */}
      <View className="mb-6 flex-row items-center justify-between">
        <TouchableOpacity
          className="rounded-xl bg-gray-100 p-2"
          onPress={() => router.push('/Account')}>
          <Ionicons name="apps-outline" size={22} color="black" />
        </TouchableOpacity>

        <TouchableOpacity className="rounded-full bg-gray-100 p-2">
          <Ionicons name="notifications-outline" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Upload New Warranty Box */}
      <TouchableOpacity
        onPress={() => router.push('/WarrantyDetailsScreen')}
        activeOpacity={0.7}
        className="mb-6 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-4 py-8">
        <View className="mr-3 rounded-full bg-black p-3">
          <Ionicons name="add" size={22} color="white" />
        </View>
        <Text className="text-lg font-semibold text-gray-700">Upload New Receipt</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text className="mb-4 mt-2 text-center font-medium text-gray-600">Existing Receipts</Text>

      {/* Grid List */}
      <View className="flex-row flex-wrap justify-between">
        {products.length === 0 ? (
          // Empty state
          <Text className="mt-6 w-full text-center text-gray-400">No warranties added yet</Text>
        ) : (
          products.map((p) => {
            const isExpired = p.warranty_end_date && new Date(p.warranty_end_date) < new Date();
            console.log('Product:', p, 'IsExpired:', isExpired);
            return (
              <TouchableOpacity
                key={p.user_product_id}
                activeOpacity={0.8}
                onPress={() =>
                  router.replace(`/ProductDetails?user_product_id=${p.user_product_id}`)
                }
                className={`mb-4 w-[48%] rounded-xl p-4 ${
                  isExpired ? 'border border-red-200 bg-red-50' : 'bg-green-100'
                }`}>
                <Text
                  className={`mb-1 font-semibold ${isExpired ? 'text-red-700' : 'text-gray-900'}`}
                  numberOfLines={2}>
                  {p.user_product_name}
                </Text>

                <Text className={`text-xs ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                  Warranty till
                </Text>

                <Text
                  className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                  {p.warranty_end_date}
                </Text>

                {isExpired && (
                  <Text className="mt-2 text-xs font-semibold text-red-600">Expired</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
