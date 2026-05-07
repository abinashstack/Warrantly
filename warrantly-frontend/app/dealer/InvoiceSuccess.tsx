import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

export default function InvoiceSuccess() {
  const router = useRouter();
  const { invoiceId, invoiceNumber } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-4 text-2xl font-bold">Sale Successful 🎉</Text>

      <Text className="mb-6 text-gray-600">{invoiceNumber} generated successfully.</Text>

      <TouchableOpacity
        className="mb-4 rounded-xl bg-blue-600 px-6 py-4"
        onPress={() => {
          router.push({
            pathname: '/dealer/InvoicePreview',
            params: { invoiceId },
          });
        }}>
        <Text className="font-semibold text-white">View Invoice</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="rounded-xl border border-gray-300 px-6 py-4"
        onPress={() => router.replace('/dealer/DealerDashboard')}>
        <Text className="font-semibold text-gray-700">Back to Dashboard</Text>
      </TouchableOpacity>
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
