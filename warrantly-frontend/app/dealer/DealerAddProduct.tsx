import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Dropdown from '../components/Dropdown';

export default function DealerSelectProductScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const fetchWithAuth = async (url: string) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`http://localhost:3000${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Request failed');

    return res.json();
  };

  useEffect(() => {
    fetchWithAuth('/api/categories')
      .then(setCategories)
      .catch(() => Alert.alert('Error', 'Failed to load categories'));
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    setItemId(null);
    setProductId(null);
    setItems([]);
    setProducts([]);

    fetchWithAuth(`/api/items?category_id=${categoryId}`)
      .then(setItems)
      .catch(() => Alert.alert('Error', 'Failed to load items'));
  }, [categoryId]);

  useEffect(() => {
    if (!itemId) return;
    setProductId(null);
    setProducts([]);

    fetchWithAuth(`/api/products?item_id=${itemId}`)
      .then(setProducts)
      .catch(() => Alert.alert('Error', 'Failed to load products'));
  }, [itemId]);

  const handleContinue = async () => {
    if (!productId) {
      Alert.alert('Select a product');
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      /* ---------- 1️⃣ Add dealer product ---------- */
      const dealerProduct = await fetch('http://localhost:3000/api/dealerProducts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
        }),
      });

      const productData = await dealerProduct.json();
      const dealerProductId = await productData.dealer_product_id;

      console.log(productData);

      if (!dealerProduct.ok) {
        const err = await dealerProduct.json();
        throw new Error(err.error || 'Failed to add dealer product');
      }

      router.push({
        pathname: '/dealer/DealerAddModel',
        params: { dealerProductId },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-xl font-semibold text-white">Select Product</Text>
        <Text className="mt-2 text-sm text-blue-100">Choose the product you want to sell</Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl bg-white p-6 shadow-md">
          <Dropdown
            label="Category"
            options={categories}
            value={categoryId}
            idKey="category_id"
            labelKey="category_name"
            onSelect={setCategoryId}
          />

          {items.length > 0 && (
            <Dropdown
              label="Item"
              options={items}
              value={itemId}
              idKey="item_id"
              labelKey="item_name"
              onSelect={setItemId}
            />
          )}

          {products.length > 0 && (
            <Dropdown
              label="Product"
              options={products}
              value={productId}
              idKey="product_id"
              labelKey="product_name"
              onSelect={setProductId}
            />
          )}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!productId}
            className={`mt-6 items-center rounded-xl py-4 ${
              productId ? 'bg-blue-700' : 'bg-gray-300'
            }`}>
            <Text className="font-semibold text-white">Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav (absolute) */}
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
