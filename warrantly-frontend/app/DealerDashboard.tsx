import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function DealerHome() {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Dashboard";
  };

  return (
    <View className="flex-1 bg-gray-100">

      <View className="bg-blue-800 pt-14 px-5 pb-10 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold">
          {getGreeting()}, John!
        </Text>
        <Text className="text-blue-100 mt-2">
          3 follow-ups today • ₹12,500 potential revenue
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* ⚪ TODAY'S ACTION CARD */}
        <View className="bg-white rounded-3xl p-6 shadow mt-6 mb-6">

          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Today’s Actions
          </Text>

          <View className="space-y-2">
            <Text className="text-gray-700">
              • 3 AMC Eligible Customers
            </Text>
            <Text className="text-gray-700">
              • 2 Maintenance Tasks Due
            </Text>
            <Text className="text-gray-700">
              • 1 New AMC Request
            </Text>
          </View>

        </View>

        {/* 🔷 QUICK ACTION GRID */}
        <View className="flex-row flex-wrap justify-between">

          <TouchableOpacity className="bg-white w-[48%] rounded-2xl p-5 mb-4 shadow items-center">
            <Ionicons name="people-outline" size={26} color="#2563EB" />
            <Text className="mt-2 font-semibold text-gray-900">
              Customers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white w-[48%] rounded-2xl p-5 mb-4 shadow items-center">
            <Ionicons name="time-outline" size={26} color="#F59E0B" />
            <Text className="mt-2 font-semibold text-gray-900">
              Follow-ups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white w-[48%] rounded-2xl p-5 mb-4 shadow items-center">
            <Ionicons name="construct-outline" size={26} color="#EAB308" />
            <Text className="mt-2 font-semibold text-gray-900">
              Maintenance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white w-[48%] rounded-2xl p-5 mb-4 shadow items-center">
            <Ionicons name="cash-outline" size={26} color="#10B981" />
            <Text className="mt-2 font-semibold text-gray-900">
              Revenue
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      <View className="flex-row justify-around items-center h-20 bg-white border-t border-gray-200">

        <Ionicons name="home" size={24} color="#2563EB" />

        <Ionicons name="cube-outline" size={24} color="gray" />

        <View className="bg-blue-600 p-4 rounded-full -mt-8 shadow-lg">
          <Ionicons name="add" size={28} color="white" />
        </View>

        <Ionicons name="chatbubble-outline" size={24} color="gray" />

        <Ionicons name="person-outline" size={24} color="gray" />

      </View>

    </View>
  );
}