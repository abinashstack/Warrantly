import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CustomerDashboard() {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Dashboard';
  };

  const expiringCount = 2;
  const upcomingServices = 1;
  const activeAMCs = 3;
  const portfolioValue = 172500;

  return (
    <View className="flex-1 bg-gray-100">
      <View className="rounded-b-3xl bg-blue-800 px-5 pb-10 pt-14">
        <Text className="text-2xl font-bold text-white">{getGreeting()}, John!</Text>
        <Text className="mt-2 text-blue-100">
          ₹ {portfolioValue.toLocaleString()} protected across your products
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ⚪ TODAY'S ACTION CARD */}
        <View className="mb-6 mt-6 rounded-3xl bg-white p-6 shadow">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Today’s Actions</Text>

          <View className="space-y-2">
            <Text className="text-gray-700">• {expiringCount} warranties expiring soon</Text>
            <Text className="text-gray-700">• {upcomingServices} upcoming services</Text>
            <Text className="text-gray-700">• {activeAMCs} active AMC plans</Text>
          </View>
        </View>

        {/* 🔷 QUICK ACTION GRID */}
        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity
            className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow"
            onPress={() => router.replace('/customer/CustomerProducts')}>
            <Ionicons name="receipt-outline" size={26} color="#2563EB" />
            <Text className="mt-2 font-semibold text-gray-900">My Products</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="time-outline" size={26} color="#F59E0B" />
            <Text className="mt-2 font-semibold text-gray-900">Services</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="construct-outline" size={26} color="#EAB308" />
            <Text className="mt-2 font-semibold text-gray-900">AMC Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="cash-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">Expiring Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="cash-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">Valuables</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-4 w-[48%] items-center rounded-2xl bg-white p-5 shadow">
            <Ionicons name="cash-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">Insurances</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
        <Pressable onPress={() => router.push('/customer/CustomerDashboard')}>
          <Ionicons name="home" size={24} color="#2563EB" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerProducts')}>
          <Ionicons name="cube-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerUpload')}>
          <View className="-mt-8 rounded-full bg-blue-600 p-4 shadow-lg">
            <Ionicons name="add" size={28} color="white" />
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerNotifications')}>
          <Ionicons name="chatbubble-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/customer/CustomerAccount')}>
          <Ionicons name="person-outline" size={24} color="gray" />
        </Pressable>
      </View>
    </View>
    // <SafeAreaView className="flex-1 bg-gray-100">
    //   <ScrollView
    //     showsVerticalScrollIndicator={false}
    //     contentContainerStyle={{ paddingBottom: 120 }}>
    //     {/* ================= HEADER ================= */}
    //     <View className="rounded-b-3xl bg-blue-800 px-6 pb-12 pt-14">
    //       <Text className="text-2xl font-bold text-white">Good Afternoon</Text>

    //       <Text className="mt-2 text-base text-blue-100">
    //         ₹ {portfolioValue.toLocaleString()} protected across your products
    //       </Text>
    //     </View>

    //     {/* ================= TODAY’S ALERTS ================= */}
    //     <View className="mx-5 mt-6 rounded-2xl bg-white p-6 shadow-md">
    //       <Text className="mb-3 text-lg font-semibold text-gray-900">Alerts</Text>

    //       <Text className="mb-1 text-gray-600">• {expiringCount} warranties expiring soon</Text>

    //       <Text className="mb-1 text-gray-600">• {upcomingServices} upcoming services</Text>

    //       <Text className="text-gray-600">• {activeAMCs} active AMC plans</Text>
    //     </View>

    //     {/* ================= ACTION GRID ================= */}
    //     <View className="mt-8 px-5">
    //       <Text className="mb-4 text-xl font-semibold text-gray-900">Manage</Text>

    //       <View className="flex-row flex-wrap justify-between">
    //         <TouchableOpacity
    //           onPress={() => router.push('/customer/CustomerProducts')}
    //           className="mb-4 w-[48%] items-center rounded-2xl bg-white p-6 shadow-md">
    //           <Ionicons name="cube-outline" size={28} color="#2563EB" />
    //           <Text className="mt-3 text-base font-semibold text-gray-900">My Products</Text>
    //         </TouchableOpacity>

    //         <TouchableOpacity
    //           onPress={() => router.push('/customer/Services')}
    //           className="mb-4 w-[48%] items-center rounded-2xl bg-white p-6 shadow-md">
    //           <Ionicons name="construct-outline" size={28} color="#F59E0B" />
    //           <Text className="mt-3 text-base font-semibold text-gray-900">Services</Text>
    //         </TouchableOpacity>

    //         <TouchableOpacity
    //           onPress={() => router.push('/customer/AMCs')}
    //           className="mb-4 w-[48%] items-center rounded-2xl bg-white p-6 shadow-md">
    //           <Ionicons name="shield-checkmark-outline" size={28} color="#16A34A" />
    //           <Text className="mt-3 text-base font-semibold text-gray-900">AMC Plans</Text>
    //         </TouchableOpacity>

    //         <TouchableOpacity
    //           onPress={() => router.push('/customer/Warranties')}
    //           className="mb-4 w-[48%] items-center rounded-2xl bg-white p-6 shadow-md">
    //           <Ionicons name="time-outline" size={28} color="#6366F1" />
    //           <Text className="mt-3 text-base font-semibold text-gray-900">Expiring Soon</Text>
    //         </TouchableOpacity>
    //       </View>
    //     </View>
    //   </ScrollView>

    //   {/* ================= BOTTOM NAV ================= */}
    //   <View className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around border-t border-gray-200 bg-white">
    //     <Ionicons name="home" size={26} color="#2563EB" />

    //     <Ionicons name="cube-outline" size={24} color="#9CA3AF" />

    //     {/* Center FAB */}
    //     <TouchableOpacity className="-mt-8 h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg">
    //       <Ionicons name="add" size={28} color="white" />
    //     </TouchableOpacity>

    //     <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />

    //     <Ionicons name="person-outline" size={24} color="#9CA3AF" />
    //   </View>
    // </SafeAreaView>
  );
}
