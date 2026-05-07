import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SalesHistory() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      setSales(data || []);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Warranty Helpers ---------------- */

  const calculateWarrantyStatus = (invoice: any) => {
    if (!invoice.warranty_valid_till) return 'UNKNOWN';

    const today = new Date();
    const expiry = new Date(invoice.warranty_valid_till);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING';
    return 'ACTIVE';
  };

  const getWarrantyBadgeStyle = (status: string) => {
    switch (status) {
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

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  /* ---------------- UI ---------------- */

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-2xl font-bold text-white">Sales History</Text>
        <Text className="mt-1 text-blue-100">Track invoices & warranty status</Text>
      </View>

      {/* Revenue Summary */}
      <View className="mx-6 mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-sm text-gray-500">Total Revenue</Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900">
          ₹ {totalRevenue.toLocaleString()}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.invoice_id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const status = calculateWarrantyStatus(item);

            return (
              <TouchableOpacity
                className="mb-5 rounded-2xl bg-white p-5 shadow-sm"
                onPress={() => router.push(`/dealer/SaleDetail`)}>
                {/* Top Row */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-bold text-gray-900">{item.customer_name}</Text>

                    <Text numberOfLines={1} className="mt-1 text-sm text-gray-600">
                      {item.product_name}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-xl font-bold text-blue-600">
                      ₹ {Number(item.total_amount).toLocaleString()}
                    </Text>

                    <View
                      className={`mt-2 rounded-full px-3 py-1 ${getWarrantyBadgeStyle(status)}`}>
                      <Text className="text-xs font-semibold">{status}</Text>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View className="my-4 h-px bg-gray-100" />

                {/* Bottom Row */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-500">{item.invoice_number}</Text>

                  <Text className="text-sm text-gray-500">{item.invoice_date}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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

        <Pressable onPress={() => router.push('/dealer/DealerSale')}>
          <Ionicons name="chatbubble-outline" size={24} color="gray" />
        </Pressable>

        <Pressable onPress={() => router.push('/dealer/DealerAccount')}>
          <Ionicons name="person-outline" size={24} color="gray" />
        </Pressable>
      </View>
    </View>
  );
}
