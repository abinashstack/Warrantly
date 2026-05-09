import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FilePickerBox from './components/FilePickerBox';

const WarrantyDetailsScreen = () => {
  const [invoiceImageUrl, setInvoiceImageUrl] = useState<string | null>(null);

  // Autofilled / editable fields
  const [productName, setProductName] = useState('');
  const [boughtOn, setBoughtOn] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [amount, setAmount] = useState('');

  const router = useRouter();

  // IDs returned by upload API
  const [resolvedProductId, setResolvedProductId] = useState<string | null>(null);

  const toDateOnly = (iso?: string | null) => {
    if (!iso) return '';
    return iso.split('T')[0];
  };

  /* ---------------- Upload + OCR ---------------- */

  const handleFilePicked = async (uri: string) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return;

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();

      formData.append(
        'invoiceImage',
        new File([blob], 'invoice.jpg', {
          type: blob.type || 'image/jpeg',
        })
      );
    } else {
      formData.append('invoiceImage', {
        uri,
        name: 'invoice.jpg',
        type: 'image/jpeg',
      } as any);
    }

    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = await res.json();

    setProductName(data.product_preview.product_name);
    setInvoiceImageUrl(data.product_preview.item_url);
    setAmount(data.invoice_preview.total_amount);
    setBoughtOn(toDateOnly(data.invoice_preview.invoice_date));
    setExpiryDate(toDateOnly(data.warranty_preview.warranty_end_date));
    setResolvedProductId(data.product_preview.product_id);

    console.log(invoiceImageUrl);
  };

  /* ---------------- Save to DB ---------------- */

  const handleConfirm = async () => {
    if (!productName || !boughtOn || !expiryDate) return;

    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return;

    /* ---------- 1. Create user product ---------- */
    const productRes = await fetch('http://localhost:3000/api/user-products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: resolvedProductId || null,
        user_product_name: productName,
        warranty_start_date: boughtOn,
        warranty_end_date: expiryDate,
      }),
    });

    const productData = await productRes.json();
    console.log('Product: ', productData);

    if (!productRes.ok) {
      console.error('User product creation failed:', productData);
      return;
    }

    const userProductId = productData.user_product_id;

    /* ---------- 2. Create invoice (optional) ---------- */
    if (amount && userProductId) {
      const invoiceRes = await fetch('http://localhost:3000/api/invoices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_product_id: userProductId,
          sale_price: parseFloat(amount) || 0,
          customer_name: '',
          customer_phone: '',
          customer_address: '',
          dealer_name: '',
          dealer_address: '',
          dealer_gstin: '',
          product_name: productName,
          model_number: '',
          serial_number: '',
        }),
      });

      if (!invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        console.error('Invoice creation failed:', invoiceData);
      }
    }

    router.replace('/HomeScreen');
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 30 }}>
      {invoiceImageUrl ? (
        <View className="mb-6 overflow-hidden rounded-xl border border-gray-200">
          <Image source={{ uri: invoiceImageUrl }} className="h-48 w-full" resizeMode="cover" />
        </View>
      ) : (
        <FilePickerBox onPick={handleFilePicked} />
      )}

      {/* {invoiceUri && !loading && ( */}
      <View className="mt-8">
        <TextInput
          placeholder="Product name"
          value={productName}
          onChangeText={setProductName}
          className="mb-4 rounded-lg border px-4 py-3"
        />

        <TextInput
          placeholder="Bought on (YYYY-MM-DD)"
          value={boughtOn}
          onChangeText={setBoughtOn}
          className="mb-4 rounded-lg border px-4 py-3"
        />

        <TextInput
          placeholder="Expiry Date (YYYY-MM-DD)"
          value={expiryDate}
          onChangeText={setExpiryDate}
          className="mb-4 rounded-lg border px-4 py-3"
        />

        <TextInput
          placeholder="Purchase Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          className="mb-6 rounded-lg border px-4 py-3"
        />

        <TouchableOpacity className="rounded-xl bg-black py-4" onPress={handleConfirm}>
          <Text className="text-center font-semibold text-white">Confirm Warranty Details</Text>
        </TouchableOpacity>
      </View>
      {/* )} */}
    </ScrollView>
  );
};

export default WarrantyDetailsScreen;
