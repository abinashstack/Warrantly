import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function DealerPendingApproval() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* Icon */}
      <View className="mb-8 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
        <Ionicons name="time-outline" size={40} color="#1D4ED8" />
      </View>

      {/* Title */}
      <Text className="text-center text-2xl font-bold text-gray-900">Approval Pending</Text>

      {/* Subtitle */}
      <Text className="mt-4 text-center leading-6 text-gray-500">
        Your business details are under review. Once approved, you will gain full access to the
        Dealer Dashboard.
      </Text>

      {/* Divider spacing */}
      <View className="h-8" />

      {/* Secondary Info */}
      <Text className="text-center text-sm leading-5 text-gray-400">
        This usually takes less than 24 hours.
      </Text>

      {/* Optional Back to Login */}
      <Pressable
        onPress={() => router.replace('/LandingScreen')}
        className="mt-10 rounded-xl border border-gray-300 px-6 py-3">
        <Text className="font-medium text-gray-700">Back to Login</Text>
      </Pressable>
    </View>
  );
}
