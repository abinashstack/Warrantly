import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function CustomerAuthScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputs = useRef<(TextInput | null)[]>([]);

  // Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Fade in OTP
  useEffect(() => {
    if (otpSent) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [otpSent]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Enter phone number');
      return;
    }

    setLoading(true);

    console.log('Requesting OTP for:', phone);

    const { error } = await supabase.auth.signInWithOtp({ phone });

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    setOtpSent(true);
    setTimer(30);
  };

  const handleVerifyOtp = async (code: string) => {
    console.log('Verifying OTP:', code);
    try {
      setLoading(true);

      // Verify OTP
      // const { error } = await supabase.auth.verifyOtp({
      //   phone,
      //   token: code,
      //   type: 'sms',
      // });

      // if (error) {
      //   shake();
      //   setOtp(['', '', '', '', '', '']);
      //   inputs.current[0]?.focus();
      //   return;
      // }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Session not found');
        return;
      }

      const token = session.access_token;

      // 2️⃣ Check if customer exists
      const checkResponse = await fetch(
        `http://localhost:3000/api/customers?phone=${encodeURIComponent(phone)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const checkResult = await checkResponse.json();

      let customer = checkResult.customer;

      //If customer doesn't exist → create
      if (!checkResponse.ok || !customer) {
        const createResponse = await fetch('http://localhost:3000/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phoneNumber: phone,
            isActive: true,
          }),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok) {
          Alert.alert(createResult.error || 'Failed to create customer');
          return;
        }

        customer = createResult.customer;
      }

      // 4️⃣ Check if profile is completed
      const hasCompletedProfile = customer.profile_id !== null;

      if (hasCompletedProfile) {
        router.replace('/customer/CustomerDashboard');
      } else {
        router.replace({
          pathname: '/customer/CustomerOnboarding',
          params: { phone, customer_id: customer.customer_id },
        });
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handler
  const handleChangeOtp = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    await handleSendOtp();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 justify-center bg-white px-6">
      <View className="mb-12">
        <Text className="text-3xl font-bold text-gray-900">Customer Access</Text>
        <Text className="mt-2 text-gray-500">Enter your phone number to continue</Text>
      </View>

      {!otpSent && (
        <>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91 98765 43210"
            className="rounded-xl bg-gray-100 px-4 py-4 text-lg text-gray-900"
            placeholderTextColor="#9CA3AF"
          />

          <Pressable
            onPress={handleSendOtp}
            disabled={!phone || loading}
            className={`mt-6 items-center rounded-xl py-4 ${
              phone ? 'bg-blue-700' : 'bg-gray-300'
            }`}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">Continue</Text>
            )}
          </Pressable>
        </>
      )}

      {otpSent && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: shakeAnim }],
          }}>
          <Text className="mb-4 mt-4 font-medium text-gray-600">Enter 6-digit OTP</Text>

          <View className="mb-6 flex-row justify-between">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(text) => handleChangeOtp(text, index)}
                keyboardType="number-pad"
                maxLength={1}
                className="h-14 w-12 rounded-xl bg-gray-100 text-center text-xl"
              />
            ))}
          </View>

          {timer > 0 ? (
            <Text className="text-sm text-gray-400">Resend OTP in {timer}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-sm font-medium text-blue-700">Resend OTP</Text>
            </Pressable>
          )}

          <View className="mt-6 items-center">
            {loading && <ActivityIndicator size="small" color="#1D4ED8" />}
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}
