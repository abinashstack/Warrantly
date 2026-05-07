import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function InvoicePreview() {
  const router = useRouter();
  const { invoiceId } = useLocalSearchParams();

  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      setLoading(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:3000/api/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch invoice');
      }

      setInvoiceUrl(result.invoice.invoice_url);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading invoice...</Text>
      </View>
    );
  }

  if (!invoiceUrl) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-lg font-semibold">Invoice not found</Text>

        <TouchableOpacity
          className="rounded-xl bg-blue-600 px-6 py-4"
          onPress={() => router.back()}>
          <Text className="font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="border-b border-gray-200 px-6 pb-4 pt-14">
        <Text className="text-xl font-semibold">Invoice Preview</Text>
      </View>

      {/* PDF Viewer */}
      {Platform.OS === 'web' ? (
        <iframe src={invoiceUrl} style={{ flex: 1, width: '100%', height: '100%' }} />
      ) : (
        <WebView source={{ uri: invoiceUrl }} startInLoadingState />
      )}

      {/* <WebView
        source={{ uri: invoiceUrl }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      /> */}
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
