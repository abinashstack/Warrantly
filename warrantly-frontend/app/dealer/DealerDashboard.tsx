import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DealerHome() {
  const router = useRouter();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Dashboard';
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="rounded-b-3xl bg-blue-800 px-5 pb-10 pt-14">
        <Text className="text-2xl font-bold text-white">{getGreeting()}, John!</Text>
        <Text className="mt-2 text-blue-100">3 follow-ups today • ₹12,500 potential revenue</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ⚪ TODAY'S ACTION CARD */}
        <View className="mb-6 mt-6 rounded-3xl bg-white p-6 shadow">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Today’s Actions</Text>

          <View className="space-y-2">
            <Text className="text-gray-700">• 3 AMC Eligible Customers</Text>
            <Text className="text-gray-700">• 2 Maintenance Tasks Due</Text>
            <Text className="text-gray-700">• 1 New AMC Request</Text>
          </View>
        </View>

        {/* 🔷 QUICK ACTION GRID */}
        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity
            className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow"
            onPress={() => router.replace('/dealer/SalesHistory')}>
            <Ionicons name="receipt-outline" size={26} color="#2563EB" />
            <Text className="mt-2 font-semibold text-gray-900">Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="time-outline" size={26} color="#F59E0B" />
            <Text className="mt-2 font-semibold text-gray-900">Follow-ups</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="construct-outline" size={26} color="#EAB308" />
            <Text className="mt-2 font-semibold text-gray-900">Maintenance</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="cash-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">Revenue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow"
            onPress={() => router.replace('/dealer/DealerProducts')}>
            <Ionicons name="layers-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">Products</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="refresh-circle-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">AMCs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
        <Pressable onPress={() => router.push('/dealer/DealerDashboard')}>
          <Ionicons name="home" size={24} color="#2563EB" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerProducts')}>
          <Ionicons name="cube-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerSale')}>
          <View className="-mt-8 rounded-full bg-blue-600 p-4 shadow-lg">
            <Ionicons name="add" size={28} color="white" />
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerAccount')}>
          <Ionicons name="chatbubble-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerAccount')}>
          <Ionicons name="person-outline" size={24} color="gray" />
        </Pressable>
      </View>
    </View>
  );
}
