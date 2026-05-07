import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ModelDetail() {
  const router = useRouter();
  const { modelId } = useLocalSearchParams<{ modelId?: string }>();

  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    if (modelId) {
      fetchModel();
    }
  }, [modelId]);

  const fetchModel = async () => {
    try {
      setLoading(true);

      // TODO: replace with real API call
      setTimeout(() => {
        setModel({
          model_number: 'GWPDLT2X00B00',
          product_name: 'Aquaguard RO+UV+UF Water Purifier',
          service_rule_configured: true,
          amc_configured: false,
          sales_count: 12,
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
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

        <Text className="text-lg font-bold text-white">{model?.model_number || 'Model'}</Text>

        {/* Edit Button */}
        <Pressable onPress={() => router.push(`/dealer/edit-model/${modelId}`)}>
          <Ionicons name="create-outline" size={22} color="white" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}>
          {/* ================= MODEL INFO ================= */}
          <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <Text className="text-sm text-gray-500">Product</Text>
            <Text className="mt-1 text-base font-semibold text-gray-900">{model.product_name}</Text>

            <Text className="mt-4 text-sm text-gray-500">Model Number</Text>
            <Text className="mt-1 text-base font-semibold text-gray-900">{model.model_number}</Text>
          </View>

          {/* ================= SERVICE RULE ================= */}
          <TouchableOpacity
            className="mb-4 rounded-2xl bg-white p-5 shadow-sm"
            onPress={() => router.push(`/dealer/ServiceRuleConfig?modelId=${modelId}`)}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="construct-outline" size={22} color="#2563EB" />
                <Text className="ml-3 text-base font-semibold text-gray-900">Service Rules</Text>
              </View>

              <Ionicons name="chevron-forward-outline" size={20} color="gray" />
            </View>

            <Text className="mt-2 text-xs text-gray-500">
              {model.service_rule_configured ? 'Configured' : 'Not configured'}
            </Text>
          </TouchableOpacity>

          {/* ================= AMC ================= */}
          <TouchableOpacity
            className="mb-4 rounded-2xl bg-white p-5 shadow-sm"
            onPress={() => router.push(`/dealer/AMCConfig?modelId=${modelId}`)}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="refresh-circle-outline" size={22} color="#16A34A" />
                <Text className="ml-3 text-base font-semibold text-gray-900">
                  AMC Configuration
                </Text>
              </View>

              <Ionicons name="chevron-forward-outline" size={20} color="gray" />
            </View>

            <Text className="mt-2 text-xs text-gray-500">
              {model.amc_configured ? 'AMC Available' : 'No AMC configured'}
            </Text>
          </TouchableOpacity>

          {/* ================= STATS ================= */}
          <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <Text className="text-sm text-gray-500">Sales</Text>
            <Text className="mt-1 text-lg font-bold text-gray-900">{model.sales_count}</Text>
          </View>

          {/* ================= DANGER ZONE ================= */}
          <TouchableOpacity
            className="rounded-2xl bg-red-50 py-4"
            onPress={() => console.log('Delete model')}>
            <Text className="text-center font-semibold text-red-600">Delete Model</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
