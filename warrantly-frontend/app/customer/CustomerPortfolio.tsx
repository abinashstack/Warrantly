import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ValuablesScreen() {
  const router = useRouter();

  const totalValue = 185000; // replace with real data
  const goldValue = 140000;
  const silverValue = 45000;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-xl font-semibold text-white">Valuables</Text>

        <Text className="mt-2 text-sm text-blue-100">Track your gold & silver portfolio</Text>
      </View>

      <ScrollView className="px-6 pt-6">
        {/* Portfolio Summary Card */}
        <View className="rounded-3xl bg-white p-6 shadow-md">
          <Text className="text-sm text-gray-500">Total Portfolio Value</Text>

          <Text className="mt-2 text-3xl font-bold text-gray-900">
            ₹ {totalValue.toLocaleString()}
          </Text>

          <View className="mt-6 flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-500">Gold</Text>
              <Text className="mt-1 text-lg font-semibold text-yellow-600">
                ₹ {goldValue.toLocaleString()}
              </Text>
            </View>

            <View>
              <Text className="text-xs text-gray-500">Silver</Text>
              <Text className="mt-1 text-lg font-semibold text-gray-600">
                ₹ {silverValue.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Gold Section */}
        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Gold Holdings</Text>

          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-base font-medium text-gray-800">22K Necklace</Text>

              <Text className="font-semibold text-gray-900">₹ 75,000</Text>
            </View>

            <Text className="mt-1 text-sm text-gray-500">18 grams • Purchased 12 Jan 2025</Text>
          </View>
        </View>

        {/* Silver Section */}
        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Silver Holdings</Text>

          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-base font-medium text-gray-800">Silver Coins</Text>

              <Text className="font-semibold text-gray-900">₹ 45,000</Text>
            </View>

            <Text className="mt-1 text-sm text-gray-500">500 grams • Purchased 5 Mar 2025</Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-28" />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push('/AddValuable')}
        className="absolute bottom-8 right-6 rounded-full bg-blue-600 p-4 shadow-lg">
        <Ionicons name="add" size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
}
