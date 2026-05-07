import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Dropdown from '../components/Dropdown';

export default function DealerCreateSaleScreen() {
  const router = useRouter();

  /* ---------------- Product + Model State ---------------- */
  const [dealerProducts, setDealerProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [models, setModels] = useState<any[]>([]);
  const [modelId, setModelId] = useState<string | null>(null);

  /* ---------------- Customer State ---------------- */
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerExists, setCustomerExists] = useState<boolean | null>(null);
  const [customerVerified, setCustomerVerified] = useState(false);

  /* ---------------- Sale State ---------------- */
  const [serialNumber, setSerialNumber] = useState('');
  const [salePrice, setSalePrice] = useState('');

  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);

  const saleDate = new Date().toISOString().split('T')[0];

  /* =======================================================
     RESET WHEN PHONE CHANGES
  ======================================================= */
  useEffect(() => {
    setCustomerVerified(false);
    setCustomerExists(null);
    setSelectedProductId(null);
    setModelId(null);
    setModels([]);
  }, [customerPhone]);

  /* =======================================================
     FETCH DEALER PRODUCTS
  ======================================================= */
  useEffect(() => {
    fetchDealerProducts();
  }, []);

  const fetchDealerProducts = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('http://localhost:3000/api/dealerProducts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setDealerProducts(data.items || []);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    }
  };

  /* =======================================================
     FETCH MODELS WHEN PRODUCT CHANGES
  ======================================================= */
  useEffect(() => {
    if (selectedProductId) {
      fetchModels(selectedProductId);
    }
  }, [selectedProductId]);

  const fetchModels = async (productId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `http://localhost:3000/api/dealerModels?dealer_product_id=${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setModels(data.items || []);
    } catch {
      Alert.alert('Error', 'Failed to load models');
    }
  };

  /* =======================================================
     CHECK CUSTOMER
  ======================================================= */
  const checkCustomer = async () => {
    if (!customerPhone) {
      Alert.alert('Enter phone number');
      return;
    }

    try {
      setCheckingCustomer(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`http://localhost:3000/api/customers?phone=${customerPhone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.exists) {
        setCustomerName(data.customer.name);
        setCustomerAddress(data.customer.address);
        setCustomerId(data.customer.customer_id);
        setCustomerExists(true);
      } else {
        setCustomerName('');
        setCustomerAddress('');
        setCustomerExists(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to check customer');
    } finally {
      setCheckingCustomer(false);
    }
  };

  /* =======================================================
     CONFIRM CUSTOMER
  ======================================================= */
  const confirmCustomer = async () => {
    if (customerExists === false && (!customerName || !customerAddress)) {
      Alert.alert('Missing details', 'Please enter name and address');
      return;
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (customerExists === false) {
      const customerRes = await fetch(`http://localhost:3000/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: false,
          phoneNumber: customerPhone,
        }),
      });

      const data = await customerRes.json();
      setCustomerId(data.customer_id);
    }

    setCustomerVerified(true);
  };

  /* =======================================================
     CREATE SALE
  ======================================================= */
  const handleCreateSale = async () => {
    if (!customerVerified || !selectedProductId || !modelId || !serialNumber || !salePrice) {
      Alert.alert('Missing details', 'Please complete all required fields');
      return;
    }

    try {
      setLoading(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(`http://localhost:3000/api/upload/dealer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          owner_id: customerId,

          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,

          dealer_product_id: selectedProductId,
          dealer_product_model_id: modelId,
          serial_number: serialNumber,

          purchase_date: saleDate,
          base_price: Number(salePrice),

          product_name: selectedProductId, // make sure you store this
          model_number: modelId, // better than sending modelId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sale failed');
      }

      console.log('Upload Success:', data);

      Alert.alert('Sale Successful', `Invoice ${data.invoice_number} generated`);

      router.replace({
        pathname: '/dealer/InvoiceSuccess',
        params: {
          invoiceId: data.invoice_id,
          invoiceNumber: data.invoice_number,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    customerVerified && selectedProductId && modelId && serialNumber && salePrice && !loading;

  /* =======================================================
     UI
  ======================================================= */
  return (
    <View className="flex-1 bg-gray-50">
      <View className="rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Text className="text-xl font-semibold text-white">Create Sale</Text>
        <Text className="mt-2 text-sm text-blue-100">Generate invoice and activate warranty</Text>
      </View>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl bg-white p-6 shadow-md">
          {/* PHONE */}
          <Text className="mb-2 font-medium text-gray-700">Customer Phone *</Text>

          <View className="flex-row items-center">
            <TextInput
              placeholder="Enter phone number"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            />

            <TouchableOpacity
              onPress={checkCustomer}
              className="ml-2 rounded-xl bg-blue-700 px-4 py-3">
              {checkingCustomer ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="font-semibold text-white">Check</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* CUSTOMER DETAILS */}
          {customerExists === true && (
            <View className="mt-4 rounded-xl bg-green-50 p-4">
              <Text className="font-semibold text-green-800">Customer Found</Text>
              <Text className="mt-1 text-gray-700">{customerName}</Text>
              <Text className="text-gray-600">{customerAddress}</Text>
            </View>
          )}

          {customerExists === false && (
            <View className="mt-4">
              <Text className="mb-2 font-medium text-gray-700">Customer Name *</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter name"
                className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              />

              <Text className="mb-2 font-medium text-gray-700">Address *</Text>
              <TextInput
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="Enter address"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              />
            </View>
          )}

          {/* CONFIRM BUTTON */}
          {customerExists !== null && !customerVerified && (
            <TouchableOpacity
              onPress={confirmCustomer}
              className="mt-4 items-center rounded-xl bg-blue-700 py-3">
              <Text className="font-semibold text-white">Confirm Customer</Text>
            </TouchableOpacity>
          )}

          {/* PRODUCT + SALE SECTION */}
          {customerVerified && (
            <>
              <View className="mt-6">
                <Dropdown
                  label="Select Product *"
                  options={dealerProducts}
                  value={selectedProductId}
                  idKey="dealer_product_id"
                  labelKey="product_name"
                  onSelect={(id) => {
                    setSelectedProductId(id);
                    setModelId(null);
                  }}
                />
              </View>

              <View className="mt-6">
                <Dropdown
                  label="Select Model *"
                  options={models}
                  value={modelId}
                  idKey="dealer_product_model_id"
                  labelKey="model_number"
                  onSelect={setModelId}
                />
              </View>

              <Text className="mb-2 mt-6 font-medium text-gray-700">Serial Number *</Text>
              <TextInput
                placeholder="Enter serial number"
                value={serialNumber}
                onChangeText={setSerialNumber}
                className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              />

              <Text className="mb-2 font-medium text-gray-700">Sale Price (₹) *</Text>
              <TextInput
                placeholder="Enter sale price"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              />

              <TouchableOpacity
                onPress={handleCreateSale}
                disabled={!canSubmit}
                className={`mt-6 items-center rounded-xl py-4 ${
                  canSubmit ? 'bg-blue-700' : 'bg-gray-300'
                }`}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-semibold text-white">Generate Sale</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
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
