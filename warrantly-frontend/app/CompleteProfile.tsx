import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import CustomButton from './components/CustomButton';
import InputField from './components/InputField';

export default function CompleteProfile() {
  const router = useRouter();
  const { role, phone, dealerId } = useLocalSearchParams<{ role?: string; phone?: string, dealerId: string }>();


  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Address fields (JSON)
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);

  const submitProfile = async () => {
    if (!firstName) {
      Alert.alert('First name is required');
      return;
    }

    if (!email) {
      Alert.alert('Email is required');
      return;
    }

    const address = {
      line1,
      line2,
      city,
      state,
      pincode,
      country: 'India',
    };

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Session not found');
        return;
      }

      /* -----------------------------
       Call unified onboarding API
    ------------------------------ */
      const response = await fetch('http://localhost:3000/api/onboarding/user', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role, // 'consumer' | 'dealer'
          phoneNumber: phone,

          // personal profile fields
          firstName,
          lastName,
          emailAddress: email,
          address,

          // required only for dealer user
          dealerId: role === 'dealer' ? dealerId: undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert(result.error || 'Failed to complete onboarding');
        return;
      }

      /* -----------------------------
       Navigate based on role
    ------------------------------ */
      if (role === 'dealer') {
        router.replace('/DealerHome');
      } else {
        router.replace('/HomeScreen');
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-24">
      {/* ---------- HEADER ---------- */}
      <Text className="text-3xl font-bold text-gray-900">Complete your profile</Text>

      <Text className="mt-2 text-sm text-gray-500">Tell us a bit more about you</Text>

      {/* ---------- FORM ---------- */}
      <View className="mt-10">
        <InputField placeholder="First name" value={firstName} onChangeText={setFirstName} />

        <InputField
          placeholder="Last name (optional)"
          value={lastName}
          onChangeText={setLastName}
        />

        <InputField
          placeholder="Email address"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* ---------- ADDRESS ---------- */}
        <Text className="mb-2 mt-6 text-sm font-semibold text-gray-700">Address</Text>

        <InputField placeholder="Address line 1" value={line1} onChangeText={setLine1} />

        <InputField placeholder="Address line 2 (optional)" value={line2} onChangeText={setLine2} />

        <InputField placeholder="City" value={city} onChangeText={setCity} />

        <InputField placeholder="State" value={state} onChangeText={setState} />

        <InputField
          placeholder="Pincode"
          keyboardType="number-pad"
          value={pincode}
          onChangeText={setPincode}
        />

        <CustomButton title="Continue" filled loading={loading} onPress={submitProfile} />
      </View>
    </View>
  );
}
