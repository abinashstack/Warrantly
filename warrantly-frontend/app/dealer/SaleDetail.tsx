import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SaleDetail() {
  const router = useRouter();
  const { invoiceId } = useLocalSearchParams();

  /* ---------------- Dummy Data ---------------- */

  const sale = {
    customer_name: 'Rahul Sharma',
    product_name: 'Aquaguard RO+UV',
    model_number: 'GWPDLTX2X00B00',
    serial_number: 'SN-6253-AX12',
    purchase_date: '2026-02-12',
    purchase_price: 18500,
    warranty_valid_till: '2027-02-12',
    amc_active: false,
  };

  const today = new Date();
  const expiry = new Date(sale.warranty_valid_till);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const warrantyStatus = diffDays < 0 ? 'EXPIRED' : diffDays <= 30 ? 'EXPIRING' : 'ACTIVE';

  const getWarrantyBadgeStyle = () => {
    switch (warrantyStatus) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'EXPIRING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="flex-row items-center justify-between rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <Text className="text-lg font-bold text-white">Sale Details</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="px-6 pt-6">
        {/* ================= CUSTOMER + PRODUCT ================= */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-900">{sale.customer_name}</Text>

          <Text className="mt-2 text-gray-600">{sale.product_name}</Text>

          <Text className="mt-1 text-sm text-gray-500">Model: {sale.model_number}</Text>

          <Text className="mt-1 text-sm text-gray-500">Serial: {sale.serial_number}</Text>

          <View className="mt-4 flex-row justify-between">
            <Text className="text-sm text-gray-500">Purchased on {sale.purchase_date}</Text>

            <Text className="text-lg font-bold text-blue-600">
              ₹ {sale.purchase_price.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* ================= WARRANTY ================= */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-gray-900">Warranty</Text>

          <View className={`mt-3 self-start rounded-full px-3 py-1 ${getWarrantyBadgeStyle()}`}>
            <Text className="text-xs font-semibold">{warrantyStatus}</Text>
          </View>

          <Text className="mt-3 text-sm text-gray-600">Valid till: {sale.warranty_valid_till}</Text>

          <Text className="mt-1 text-sm text-gray-600">
            {diffDays > 0 ? `${diffDays} days remaining` : 'Warranty expired'}
          </Text>

          <TouchableOpacity className="mt-4 rounded-xl bg-blue-600 py-3">
            <Text className="text-center font-semibold text-white">Extend Warranty</Text>
          </TouchableOpacity>
        </View>

        {/* ================= AMC ================= */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-gray-900">AMC</Text>

          {sale.amc_active ? (
            <>
              <Text className="mt-3 text-sm text-gray-600">AMC Active</Text>
              <Text className="mt-1 text-sm text-gray-600">Next Service: 12 March 2026</Text>
            </>
          ) : (
            <>
              <Text className="mt-3 text-sm text-gray-600">No AMC active</Text>

              <TouchableOpacity className="mt-4 rounded-xl bg-green-600 py-3">
                <Text className="text-center font-semibold text-white">Add AMC Plan</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ================= SERVICE TIMELINE ================= */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-gray-900">Service Timeline</Text>

          <View className="mt-4 space-y-2">
            <Text className="text-sm text-gray-600">• Installation Completed</Text>
            <Text className="text-sm text-gray-600">• 1st Free Service - Pending</Text>
          </View>
        </View>

        {/* ================= INVOICE BUTTON ================= */}
        <TouchableOpacity
          className="mb-10 rounded-2xl border border-blue-600 py-4"
          onPress={() => router.push(`/dealer/InvoicePreview?invoiceId=${invoiceId}`)}>
          <Text className="text-center font-semibold text-blue-600">View Invoice PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
