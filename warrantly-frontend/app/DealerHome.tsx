import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const DealerHome = () => {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10" showsVerticalScrollIndicator={false}>
      {/* Top Icons Row */}
      <View className="mb-6 flex-row items-center justify-between">
        <TouchableOpacity className="rounded-xl bg-gray-100 p-2">
          <Ionicons
            name="apps-outline"
            size={22}
            color="black"
            onPress={() => router.push('/Account')}
          />
        </TouchableOpacity>

        <TouchableOpacity className="rounded-full bg-gray-100 p-2">
          <Ionicons name="notifications-outline" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Dealer Greeting */}
      <Text className="mb-2 text-2xl font-bold text-gray-800">Dealer Dashboard</Text>
      <Text className="mb-6 text-gray-500">
        Manage products, generate bills, and track services
      </Text>

      {/* Primary Action: Add Products */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/DealerProducts')}
        className="mb-4 rounded-2xl bg-black px-5 py-6">
        <View className="flex-row items-center">
          <Ionicons name="cube-outline" size={26} color="white" />
          <Text className="ml-3 text-lg font-semibold text-white">Add Products You Sell</Text>
        </View>
        <Text className="mt-2 text-sm text-gray-300">Choose products from the catalog</Text>
      </TouchableOpacity>

      {/* Secondary Action: Generate Bill */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/GenerateBill')}
        className="mb-4 rounded-2xl border border-gray-200 px-5 py-6">
        <View className="flex-row items-center">
          <Ionicons name="receipt-outline" size={26} color="black" />
          <Text className="ml-3 text-lg font-semibold text-gray-800">Generate Bill</Text>
        </View>
        <Text className="mt-2 text-sm text-gray-500">Create a new invoice for a customer</Text>
      </TouchableOpacity>

      {/* Placeholder Section */}
      <Text className="mt-8 text-center text-gray-400">More features coming soon</Text>

      {/* Empty Grid (visual consistency with HomeScreen) */}
      <View className="mt-4 flex-row flex-wrap justify-between">
        {[1, 2, 3, 4].map((_, index) => (
          <View key={index} className="mb-4 h-28 w-[48%] rounded-xl bg-gray-100" />
        ))}
      </View>
    </ScrollView>
  );
};

export default DealerHome;
