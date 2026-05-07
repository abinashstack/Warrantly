import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import CustomButton from './components/CustomButton';
import InputField from './components/InputField';

export default function DealerOnboarding() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  const [dealerName, setDealerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const submitDealer = async () => {
    if (!dealerName) {
      Alert.alert('Dealer name is required');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert('Session expired');
        return;
      }

      const response = await fetch('http://localhost:3000/api/onboarding/dealer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealerName,
          phoneNumber: phone,
          gstNumber,
        }),
      });

      const result = await response.json();
      const { dealer } = result;

      if (!response.ok) {
        Alert.alert(result.error || 'Failed to onboard dealer');
        return;
      }

      console.log('Dealer onboarded successfully:', dealer.dealer_id);

      // ✅ Move to dealer user (personal profile) onboarding
      router.replace({
        pathname: '/CompleteProfile',
        params: {
          role: 'dealer',
          phone: phone,
          dealerId: dealer.dealer_id,
        },
      });
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-24">
      {/* ---------- HEADER ---------- */}
      <Text className="text-3xl font-bold text-gray-900">Set up your business</Text>

      <Text className="mt-2 text-sm text-gray-500">Enter your dealer details to continue</Text>

      {/* ---------- FORM ---------- */}
      <View className="mt-10">
        <InputField
          placeholder="Dealer / Business name"
          value={dealerName}
          onChangeText={setDealerName}
        />

        <InputField
          placeholder="GST Number"
          value={gstNumber}
          onChangeText={setGstNumber}
        />

        <CustomButton title="Continue" filled loading={loading} onPress={submitDealer} />
      </View>
    </View>
  );
}
