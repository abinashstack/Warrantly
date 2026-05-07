import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CustomerProductDetailScreen({ route }: any) {
  const router = useRouter();

  // Replace with API data
  const product = route?.params?.product || {
    product_name: 'LG Split AC',
    model_name: 'LS-Q18YNZA',
    serial_number: 'SN12345678',
    brand: 'LG',
    warranty_start: '2026-02-10',
    warranty_end: '2027-02-10',
    dealer_phone: '9876543210',

    // AMC
    amc_active: true,
    amc_plan_name: 'Gold AMC Plan',
    amc_valid_till: '2027-02-10',
    amc_remaining_services: 2,

    // Upcoming service
    next_service_date: '2026-08-10',
    next_service_task: 'Full Service',
    next_service_cost: 0,
  };

  const today = new Date();
  const endDate = new Date(product.warranty_end);

  const daysRemaining = Math.max(
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

  const warrantyStatus = useMemo(() => {
    if (daysRemaining <= 0) return 'Expired';
    if (daysRemaining <= 30) return 'Expiring Soon';
    return 'Active';
  }, [daysRemaining]);

  const progressPercent = useMemo(() => {
    const start = new Date(product.warranty_start);
    const total =
      (new Date(product.warranty_end).getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const elapsed = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* 🔵 Header */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white">Product Details</Text>
          <View style={{ width: 22 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}>
        {/* Product Info */}
        <View className="rounded-2xl bg-white p-6 shadow-md">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Product Information</Text>

          <Text className="text-sm text-gray-500">Product</Text>
          <Text className="text-gray-800">{product.product_name}</Text>

          <Text className="mt-2 text-sm text-gray-500">Brand</Text>
          <Text className="text-gray-800">{product.brand}</Text>

          <Text className="mt-2 text-sm text-gray-500">Model</Text>
          <Text className="text-gray-800">{product.model_name}</Text>

          <Text className="mt-2 text-sm text-gray-500">Serial Number</Text>
          <Text className="text-gray-800">{product.serial_number}</Text>
        </View>

        {/* Warranty */}
        <View className="mt-6 rounded-2xl bg-white p-6 shadow-md">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">Warranty</Text>

            <View
              className={`rounded-full px-3 py-1 ${
                warrantyStatus === 'Active'
                  ? 'bg-green-100'
                  : warrantyStatus === 'Expiring Soon'
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  warrantyStatus === 'Active'
                    ? 'text-green-700'
                    : warrantyStatus === 'Expiring Soon'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                }`}>
                {warrantyStatus}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            <View className="h-2 rounded-full bg-gray-200">
              <View
                style={{ width: `${progressPercent}%` }}
                className="h-2 rounded-full bg-blue-600"
              />
            </View>

            <Text className="mt-2 text-sm text-gray-600">
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Warranty expired'}
            </Text>
          </View>
        </View>

        {/* AMC Section */}
        <View className="mt-6 rounded-3xl bg-white p-6 shadow-md">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">AMC Plan</Text>

            <View className="rounded-full bg-green-100 px-3 py-1">
              <Text className="text-xs font-semibold text-green-700">Active</Text>
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-base font-medium text-gray-800">Gold AMC Plan</Text>

            <Text className="mt-1 text-sm text-gray-500">Valid till 10 Feb 2027</Text>
          </View>

          {/* Subtle validity bar */}
          <View className="mt-4 h-2 rounded-full bg-gray-200">
            <View className="h-2 w-2/3 rounded-full bg-green-500" />
          </View>
        </View>

        {/* Upcoming Service */}
<View className="mt-6 rounded-3xl bg-white p-6 shadow-md">
  <View className="flex-row items-center justify-between">
    <Text className="text-lg font-semibold text-gray-900">
      Regular Maintenance
    </Text>

    <View className="rounded-full bg-blue-100 px-3 py-1">
      <Text className="text-xs font-semibold text-blue-700">
        Upcoming
      </Text>
    </View>
  </View>

  <View className="mt-4 rounded-2xl bg-gray-50 p-4">
    <Text className="text-base font-medium text-gray-800">
      Full Service
    </Text>

    <Text className="mt-1 text-sm text-gray-500">
      Due on 10 Aug 2026
    </Text>
  </View>

  <TouchableOpacity className="mt-4 items-center rounded-xl bg-blue-700 py-3">
    <Text className="font-semibold text-white">
      Request Service
    </Text>
  </TouchableOpacity>
</View>


        {/* Dealer Contact */}
        <View className="mt-6 rounded-2xl bg-white p-6 shadow-md">
          <Text className="text-lg font-semibold text-gray-900">Contact Dealer</Text>

          <View className="mt-4 flex-row space-x-4">
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${product.dealer_phone}`)}
              className="flex-1 items-center rounded-xl bg-blue-700 py-4">
              <Ionicons name="call-outline" size={18} color="white" />
              <Text className="mt-1 font-semibold text-white">Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL(`sms:${product.dealer_phone}`)}
              className="flex-1 items-center rounded-xl bg-gray-100 py-4">
              <Ionicons name="chatbubble-outline" size={18} color="#2563EB" />
              <Text className="mt-1 font-semibold text-blue-700">Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
