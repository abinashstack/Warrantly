import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import CustomButton from './components/CustomButton';
import InputField from './components/InputField';

export default function Auth() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) {
      Alert.alert('Enter phone number');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ phone });

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    setStep('OTP');
  };

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert('Enter OTP');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        Alert.alert(error.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Session not found');
        return;
      }

      if (role === 'consumer') {
        //Check if the customer exists --> This means its just a login
        const response = await fetch(
          `http://localhost:3000/api/customers?phone=${encodeURIComponent(phone)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          Alert.alert(result.error || 'Failed to check customer');
          return;
        }

        console.log('Customer check result:', result);

        const hasCompletedProfile = result.customer.profile_id !== null;
        console.log('Has completed profile:', hasCompletedProfile);

        if (hasCompletedProfile) {
          console.log('Customer has completed profile, navigating to HomeScreen');
          router.replace('/HomeScreen');
        } else {
          console.log('Customer profile incomplete, navigating to CompleteProfile');
          router.replace({
            pathname: '/CompleteProfile',
            params: {
              role: 'consumer',
              phone: phone,
            },
          });
          // router.replace(`/CompleteProfile?role=consumer&phone=${encodeURIComponent(phone)}`);
        }
      } else if (role === 'dealer') {
        //Check if the dealer exists --> This means its just a login
        const response = await fetch(
          `http://localhost:3000/api/dealerUsers?phone=${encodeURIComponent(phone)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          Alert.alert(result.error || 'Failed to check dealer');
          return;
        }

        if (result.exists) {
          router.replace('/DealerDashboard');
        } else {
          router.replace(`/DealerOnboarding?role=dealer&phone=${encodeURIComponent(phone)}`);
        }
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-24">
      <Text className="text-2xl font-bold text-gray-900">Sign up or log in</Text>

      <Text className="mt-2 text-sm text-gray-500">Enter your phone number to continue</Text>

      {step === 'PHONE' ? (
        <>
          <InputField
            placeholder="+91 00000 00000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <CustomButton title="Continue" loading={loading} onPress={sendOtp} />
        </>
      ) : (
        <>
          <Text className="mt-6 text-sm text-gray-500">OTP sent to {phone}</Text>

          <InputField
            placeholder="123456"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />

          <CustomButton title="Verify" loading={loading} onPress={verifyOtp} />
        </>
      )}
    </View>
  );
}
