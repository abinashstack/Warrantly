import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Dropdown from './components/Dropdown';

const GenerateBill = () => {
  const router = useRouter();

  const [dealerProducts, setDealerProducts] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  const [dealerProductId, setDealerProductId] = useState<string | null>(null);
  const [dealerProductModelId, setDealerProductModelId] = useState<string | null>(null);

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerFirstName, setcustomerFirstName] = useState('');
  const [customerLastName, setcustomerLastName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  /* ---------- helper ---------- */
  const fetchWithAuth = async (url: string, options: any = {}) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`http://localhost:3000${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    return res.json();
  };

  /* ---------- fetch dealer products ---------- */
  useEffect(() => {
    fetchWithAuth('/api/dealerProducts')
      .then((res) => setDealerProducts(res.items || []))
      .catch(() => Alert.alert('Error', 'Failed to load products'));
  }, []);

  console.log(dealerProducts);

  /* ---------- fetch models ---------- */
  useEffect(() => {
    if (!dealerProductId) return;

    setDealerProductModelId(null);
    setModels([]);

    fetchWithAuth(`/api/dealerModels?dealer_product_id=${dealerProductId}`)
      .then((res) => setModels(res.items || []))
      .catch(() => Alert.alert('Error', 'Failed to load models'));
  }, [dealerProductId]);

  useEffect(() => {
    setInvoiceDate(new Date().toISOString().slice(0, 10));
  }, []);

  /* ---------- generate + confirm invoice ---------- */
  const generateBill = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      Alert.alert('Session not found');
      return;
    }

    if (
      !dealerProductId ||
      !dealerProductModelId ||
      !customerPhone ||
      !invoiceDate ||
      !sellingPrice
    ) {
      Alert.alert('Missing details', 'Please fill all fields');
      return;
    }

    let customer;

    /* ---------- check if customer exists ---------- */
    const response = await fetch(
      `http://localhost:3000/api/customers?phone=${encodeURIComponent(customerPhone)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();

    if (result.exists) {
      // Customer exists
      customer = result.customer;
    } else {
      /* ---------- create customer ---------- */
      const createRes = await fetch(`http://localhost:3000/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          isActive: false,
          phoneNumber: customerPhone,
        }),
      });

      const createResult = await createRes.json();

      if (!createRes.ok) {
        Alert.alert(createResult.error || 'Failed to create customer');
        return;
      }

      customer = createResult;
    }

    /* ---------- proceed to invoice generation ---------- */
    console.log('Using customer:', customer);

    //Create an entry in user-products table
    const userProductRes = await fetch(`http://localhost:3000/api/user-products/dealer-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        owner_id: customer.customer_id, // IMPORTANT
        dealer_product_id: dealerProductId,
        dealer_product_model_id: dealerProductModelId,
        purchase_date: invoiceDate,
        purchase_price: Number(sellingPrice),
      }),
    });

    const userProductResult = await userProductRes.json();

    if (!userProductRes.ok) {
      Alert.alert(userProductResult.error || 'Failed to create product');
      return;
    }

    console.log('Created user product:', userProductResult);

    // TODO: call POST /api/invoices here
    router.replace('/DealerHome');
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10">
      {/* Header */}
      <View className="mb-6 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.replace('/DealerHome')}
          className="mr-4 rounded-xl bg-gray-100 p-2">
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Generate Bill</Text>
      </View>

      {/* Product */}
      <Dropdown
        label="Product"
        options={dealerProducts}
        value={dealerProductId}
        idKey="dealer_product_id"
        labelKey="product_name"
        onSelect={setDealerProductId}
      />

      {/* Model */}
      {models.length > 0 && (
        <Dropdown
          label="Model"
          options={models}
          value={dealerProductModelId}
          idKey="dealer_product_model_id"
          labelKey="model_number"
          onSelect={setDealerProductModelId}
        />
      )}

      {/* Customer */}
      <Text className="mb-2 mt-6 font-semibold text-gray-700">Customer First Name</Text>
      <TextInput
        placeholder="Name"
        keyboardType="phone-pad"
        value={customerFirstName}
        onChangeText={setcustomerFirstName}
        className="mb-4 rounded-lg border border-gray-200 px-4 py-3"
      />

      <Text className="mb-2 mt-6 font-semibold text-gray-700">Customer Last Name</Text>
      <TextInput
        placeholder="Name"
        keyboardType="phone-pad"
        value={customerLastName}
        onChangeText={setcustomerLastName}
        className="mb-4 rounded-lg border border-gray-200 px-4 py-3"
      />

      <Text className="mb-2 mt-6 font-semibold text-gray-700">Customer Phone</Text>
      <TextInput
        placeholder="+91XXXXXXXXXX"
        keyboardType="phone-pad"
        value={customerPhone}
        onChangeText={setCustomerPhone}
        className="mb-4 rounded-lg border border-gray-200 px-4 py-3"
      />

      {/* Invoice */}
      <Text className="mb-2 font-semibold text-gray-700">Invoice Date</Text>
      <TextInput
        placeholder="YYYY-MM-DD"
        value={invoiceDate}
        onChangeText={setInvoiceDate}
        className="mb-4 rounded-lg border border-gray-200 px-4 py-3"
      />

      <Text className="mb-2 font-semibold text-gray-700">Selling Price</Text>
      <TextInput
        placeholder="₹ Amount"
        keyboardType="numeric"
        value={sellingPrice}
        onChangeText={setSellingPrice}
        className="mb-6 rounded-lg border border-gray-200 px-4 py-3"
      />

      {/* Submit */}
      <TouchableOpacity onPress={generateBill} className="rounded-xl bg-black py-4">
        <Text className="text-center font-semibold text-white">Generate Bill</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GenerateBill;
