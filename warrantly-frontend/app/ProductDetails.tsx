import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ProductDetailsScreen = () => {
  const router = useRouter();
  const { user_product_id } = useLocalSearchParams<{ user_product_id?: string }>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProduct = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session || !user_product_id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/api/user-products/${user_product_id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('Failed to fetch product:', data);
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProduct();
  }, [user_product_id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Product not found</Text>
      </View>
    );
  }

  /* ---------------- derive UI-safe model ---------------- */

  const uiProduct = {
    name: product.user_product_name || product.product?.product_name || 'Product',
    brand: product.product?.brands?.brand_name,
    category: product.product?.items?.item_name,
    purchaseDate: product.warranty_start_date,
    warrantyEnd: product.warranty_end_date,
    serialNumber: product.serial_number,
  };

  const isExpired = uiProduct.warrantyEnd && new Date(uiProduct.warrantyEnd) < new Date();

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10">
      {/* Header */}
      <View className="mb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.replace('/HomeScreen') } className="mr-4 rounded-xl bg-gray-100 p-2">
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Product Details</Text>
      </View>

      {/* Product Summary */}
      <View className="mb-6 rounded-xl border border-gray-200 p-4">
        <Text className="text-lg font-bold text-gray-900">{uiProduct.name}</Text>

        {uiProduct.brand && uiProduct.category && (
          <Text className="mt-1 text-sm text-gray-600">
            {uiProduct.brand} · {uiProduct.category}
          </Text>
        )}

        {uiProduct.purchaseDate && (
          <Text className="mt-1 text-sm text-gray-600">Purchased on: {uiProduct.purchaseDate}</Text>
        )}

        {uiProduct.serialNumber && (
          <Text className="mt-1 text-sm text-gray-600">Serial: {uiProduct.serialNumber}</Text>
        )}
      </View>

      {/* Warranty */}
      <View className="mb-6 rounded-xl border border-gray-200 p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-semibold text-gray-800">Product Warranty</Text>

          <View className={`rounded-full px-3 py-1 ${isExpired ? 'bg-red-100' : 'bg-green-100'}`}>
            <Text
              className={`text-xs font-semibold ${isExpired ? 'text-red-700' : 'text-green-700'}`}>
              {isExpired ? 'EXPIRED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        {uiProduct.warrantyEnd && (
          <Text className="text-sm text-gray-700">Valid till: {uiProduct.warrantyEnd}</Text>
        )}
      </View>

      {/* Documents */}
      <View className="mb-6">
        <Text className="mb-2 font-semibold text-gray-800">Documents</Text>

        <TouchableOpacity className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 p-4">
          <Text className="text-gray-800">Invoice</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center justify-between rounded-xl border border-dashed border-gray-300 p-4">
          <Text className="text-gray-600">Upload Extended Warranty</Text>
          <Ionicons name="add" size={18} color="#777" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProductDetailsScreen;
