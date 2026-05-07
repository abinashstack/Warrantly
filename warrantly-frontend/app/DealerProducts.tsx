import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Dropdown from './components/Dropdown';

const DealerProducts = () => {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const [modelNumber, setModelNumber] = useState('');
  const [modelName, setModelName] = useState('');
  const [mrp, setMrp] = useState('');

  /* ---------- helpers ---------- */
  const fetchWithAuth = async (url: string) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`http://localhost:3000${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.json();
  };

  /* ---------- fetch categories ---------- */
  useEffect(() => {
    fetchWithAuth('/api/categories')
      .then(setCategories)
      .catch(() => Alert.alert('Error', 'Failed to load categories'));
  }, []);

  /* ---------- fetch items ---------- */
  useEffect(() => {
    if (!categoryId) return;
    setItemId(null);
    setProductId(null);
    setItems([]);
    setProducts([]);
    setModelNumber('');
    setModelName('');
    setMrp('');

    fetchWithAuth(`/api/items?category_id=${categoryId}`)
      .then(setItems)
      .catch(() => Alert.alert('Error', 'Failed to load items'));
  }, [categoryId]);

  /* ---------- fetch products ---------- */
  useEffect(() => {
    if (!itemId) return;
    setProductId(null);
    setProducts([]);
    setModelNumber('');
    setModelName('');
    setMrp('');

    fetchWithAuth(`/api/products?item_id=${itemId}`)
      .then(setProducts)
      .catch(() => Alert.alert('Error', 'Failed to load products'));
  }, [itemId]);

  /* ---------- add product ---------- */
  const addProduct = async () => {
    if (!productId || !modelNumber || !mrp) {
      Alert.alert('Missing details', 'Please select a product and enter model number & MRP');
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      /* ---------- 1️⃣ Add dealer product ---------- */
      const productRes = await fetch('http://localhost:3000/api/dealerProducts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
        }),
      });

      const productData = await productRes.json();
      const dealerProductId = await productData.dealer_product_id;

      console.log(productData)

      if (!productRes.ok) {
        const err = await productRes.json();
        throw new Error(err.error || 'Failed to add dealer product');
      }

      /* ---------- 2️⃣ Add dealer product model ---------- */
      const modelRes = await fetch('http://localhost:3000/api/dealerModels', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealer_product_id: dealerProductId,
          model_number: modelNumber,
          model_name: modelName || null,
          mrp: Number(mrp),
        }),
      });

      if (!modelRes.ok) {
        const err = await modelRes.json();
        throw new Error(err.error || 'Failed to add product model');
      }

      Alert.alert('Success', 'Product and model added to your catalog');
      router.replace('/DealerHome');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10">
      {/* Header */}
      <View className="mb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.replace('DealerHome')} className="mr-4 rounded-xl bg-gray-100 p-2">
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Add Product</Text>
      </View>

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

      {/* Add Button */}

      {/* Model Details */}
      {productId && (
        <View className="mt-6">
          <Text className="mb-2 font-semibold text-gray-700">Model Details</Text>

          <TextInput
            placeholder="Model Number (required)"
            value={modelNumber}
            onChangeText={setModelNumber}
            className="mb-3 rounded-lg border border-gray-200 px-4 py-3"
          />

          <TextInput
            placeholder="Model Name (optional)"
            value={modelName}
            onChangeText={setModelName}
            className="mb-3 rounded-lg border border-gray-200 px-4 py-3"
          />

          <TextInput
            placeholder="MRP (₹)"
            value={mrp}
            onChangeText={setMrp}
            keyboardType="numeric"
            className="rounded-lg border border-gray-200 px-4 py-3"
          />
        </View>
      )}
      {productId && modelNumber && mrp && (
        <TouchableOpacity onPress={addProduct} className="mt-8 rounded-xl bg-black py-4">
          <Text className="text-center font-semibold text-white">Add Product</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default DealerProducts;
