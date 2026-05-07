import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddModelScreen() {
  const router = useRouter();
  const { dealerProductId } = useLocalSearchParams<{ dealerProductId: string }>();

  const [modelNumber, setModelNumber] = useState('');
  const [modelName, setModelName] = useState('');
  const [mrp, setMrp] = useState('');
  const [loading, setLoading] = useState(false);

  const addModel = async () => {
    if (!modelNumber || !mrp) {
      Alert.alert('Model number and MRP required');
      return;
    }

    try {
      setLoading(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // 1️⃣ Add dealer product
      // const productRes = await fetch('http://localhost:3000/api/dealerProducts', {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ product_id: productId }),
      // });

      // const productData = await productRes.json();

      // if (!productRes.ok) {
      //   throw new Error(productData.error);
      // }

      // 2️⃣ Add model
      const dealerModel = await fetch('http://localhost:3000/api/dealerModels', {
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

      const modelData = await dealerModel.json();

      if (!dealerModel.ok) {
        throw new Error(modelData.error);
      }

      Alert.alert('Success', 'Model added successfully');
      router.replace('/dealer/DealerDashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-xl font-semibold text-white">Add Model</Text>
        <Text className="mt-2 text-sm text-blue-100">Enter model details</Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl bg-white p-6 shadow-md">
          <TextInput
            placeholder="Model Number *"
            value={modelNumber}
            onChangeText={setModelNumber}
            className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />

          <TextInput
            placeholder="Model Name"
            value={modelName}
            onChangeText={setModelName}
            className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />

          <TextInput
            placeholder="MRP (₹) *"
            value={mrp}
            onChangeText={setMrp}
            keyboardType="numeric"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />

          <TouchableOpacity
            onPress={addModel}
            disabled={!modelNumber || !mrp || loading}
            className={`mt-6 items-center rounded-xl py-4 ${
              modelNumber && mrp ? 'bg-blue-700' : 'bg-gray-300'
            }`}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-semibold text-white">Save Model</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
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
