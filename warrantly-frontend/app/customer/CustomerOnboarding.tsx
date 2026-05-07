import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function CustomerOnboarding() {
  const router = useRouter();
  const { phone, customer_id } = useLocalSearchParams<{ phone?: string, customer_id?: string }>();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  const canContinue = fullName && address && emailAddress;
  const handleContinue = async () => {
    if (!canContinue) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Session not found');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`, // Supabase session
        },
        body: JSON.stringify({
          firstName: fullName,
          address,
          emailAddress,
          phone_number: phone,
          roles: ['customer'], // ['consumer'] or ['dealer']
          notificationPreference: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          customer_id: customer_id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      console.log('Profile created:', result);

      // Redirect after success
      router.push('/customer/CustomerDashboard');
    } catch (err: any) {
      console.error('Error creating profile:', err.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-20">
      <Text className="text-3xl font-bold text-gray-900">Set Up Your Profile</Text>

      <Text className="mt-2 text-gray-500">Tell us about yourself.</Text>

      {/* Business Name */}
      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        className="mt-8 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* Owner Name */}
      <TextInput
        placeholder="Email Address"
        value={emailAddress}
        onChangeText={setEmailAddress}
        className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* Phone (Locked) */}
      <TextInput
        value={phone}
        editable={false}
        className="mt-4 rounded-xl bg-gray-200 px-4 py-4 text-gray-500"
      />

      {/* Email Address */}
      <TextInput
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* Submit */}
      <Pressable onPress={handleContinue} className="mt-8 items-center rounded-xl bg-blue-700 py-4">
        <Text className="text-base font-semibold text-white">Submit</Text>
      </Pressable>

      <View className="h-20" />
    </ScrollView>
  );
}
