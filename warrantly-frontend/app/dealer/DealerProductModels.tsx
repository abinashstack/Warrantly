import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProductModels() {
  const router = useRouter();
  const { dealer_product_id } = useLocalSearchParams<{ dealer_product_id?: string }>();

  const [applySameRule, setApplySameRule] = useState(true);
  const [productName, setProductName] = useState<string>('');
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH MODELS ================= */
  useEffect(() => {
    if (dealer_product_id) {
      fetchModels();
    }
  }, [dealer_product_id]);

  const fetchModels = async () => {
    try {
      setLoading(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `http://localhost:3000/api/dealerProducts/${dealer_product_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch models');
      }

      setProductName(data.product_name);
      setModels(data.models || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="flex-row items-center justify-between rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <Text className="text-lg font-bold text-white">{productName || 'Models'}</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* ================= LOADING ================= */}
        {loading && (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}

        {!loading && (
          <>
            {/* ================= RULE TOGGLE ================= */}
            <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
              <Text className="text-base font-semibold text-gray-900">
                Service Rule Configuration
              </Text>

              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Apply same rule for all models</Text>

                <Switch
                  value={applySameRule}
                  onValueChange={setApplySameRule}
                  trackColor={{ false: '#d1d5db', true: '#2563EB' }}
                />
              </View>

              <Text className="mt-2 text-xs text-gray-500">
                If enabled, service rules will apply to all models under this product.
              </Text>
            </View>

            {/* ================= MODELS LIST ================= */}
            <Text className="mb-3 text-base font-semibold text-gray-900">Models</Text>

            {models.length === 0 && <Text className="text-gray-500">No models added yet.</Text>}

            {models.map((item) => (
              <TouchableOpacity
                key={item.dealer_product_model_id}
                className="mb-4 rounded-2xl bg-white p-5 shadow-sm"
                disabled={applySameRule}
                onPress={() => router.push({
                  pathname: '/dealer/ModelDetail',
                  params: { modelId: item.dealer_product_model_id },
                })}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="cube-outline" size={22} color="#2563EB" />
                    <Text className="ml-3 text-base font-semibold text-gray-900">
                      {item.model_name || item.model_number}
                    </Text>
                  </View>

                  {!applySameRule && (
                    <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                  )}
                </View>

                {applySameRule && (
                  <Text className="mt-2 text-xs text-gray-500">Inherits product-level rule</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* ================= CONFIGURE RULE BUTTON ================= */}
            {applySameRule && <TouchableOpacity
              className="mt-4 rounded-2xl bg-blue-600 py-4"
              onPress={() =>
                router.push({
                  pathname: '/dealer/ServiceRuleConfig',
                  params: { dealer_product_id },
                })
              }>
              <Text className="text-center font-semibold text-white">Configure Service Rule</Text>
            </TouchableOpacity>}
          </>
        )}
      </ScrollView>
    </View>
  );
}
