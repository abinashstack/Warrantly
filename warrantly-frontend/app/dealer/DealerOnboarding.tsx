import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function DealerOnboarding() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [gst, setGst] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!businessName || !ownerName || !address || !city) {
      Alert.alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
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
          phone,
          businessName,
          ownerName,
          email,
          address,
          city,
          gst,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert(result.error || 'Failed to submit');
        return;
      }

      router.replace('/dealer/DealerPendingApproval');
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-20">
      <Text className="text-3xl font-bold text-gray-900">Set Up Your Business</Text>

      <Text className="mt-2 text-gray-500">Tell us about your dealership.</Text>

      {/* Business Name */}
      <TextInput
        placeholder="Business Name"
        value={businessName}
        onChangeText={setBusinessName}
        className="mt-8 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* Owner Name */}
      <TextInput
        placeholder="Owner Name"
        value={ownerName}
        onChangeText={setOwnerName}
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
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* Address */}
      <TextInput
        placeholder="Business Address"
        value={address}
        onChangeText={setAddress}
        className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* City */}
      <TextInput
        placeholder="City"
        value={city}
        onChangeText={setCity}
        className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* GST (Optional) */}
      <TextInput
        placeholder="GST Number (Optional)"
        value={gst}
        onChangeText={setGst}
        className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-gray-900"
      />

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        className="mt-8 items-center rounded-xl bg-blue-700 py-4"
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">Submit for Approval</Text>
        )}
      </Pressable>

      <View className="h-20" />
    </ScrollView>
  );
}
