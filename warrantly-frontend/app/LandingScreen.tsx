import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function LandingScreen() {
      const router = useRouter();
  return (
    <View className="flex-1 bg-gray-100">
      {/* 🔵 Gradient Top Section */}
      <LinearGradient
        colors={['#E0E7FF', '#F3F4F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 130,
          paddingBottom: 90,
          alignItems: 'center',
        }}>
        {/* Gradient Logo */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 110,
            height: 110,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}>
          <Ionicons name="shield-checkmark" size={48} color="white" />
        </LinearGradient>

        {/* Brand */}
        <Text className="mt-8 text-4xl font-bold tracking-wide text-gray-900">Warrantly</Text>

        <Text className="mt-3 text-base text-gray-500">Warranty & AMC Platform</Text>
      </LinearGradient>

      {/* 🔳 Cards Section (Layered Over Gradient) */}
      <View className="-mt-16 flex-1 px-6">
        {/* Dealer - Elevated */}
        <Pressable
          onPress={() => router.push({ pathname: '/dealer/DealerLogin', params: { role: 'dealer' } })}
          className="mb-6 rounded-2xl bg-white p-6 shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}>
          <Text className="text-xl font-semibold text-gray-900">I’m a Dealer</Text>
          <Text className="mt-2 text-gray-600">Manage customers and service operations.</Text>
        </Pressable>

        {/* Customer */}
        <Pressable
          onPress={() => router.push({ pathname: '/customer/CustomerLogin', params: { role: 'customer' } })}
          className="mb-6 rounded-2xl bg-white p-6 shadow">
          <Text className="text-xl font-semibold text-gray-900">I’m a Customer</Text>
          <Text className="mt-2 text-gray-600">Track bills, warranties and service history.</Text>
        </Pressable>

        {/* Organisation */}
        <Pressable
          onPress={() => router.push({ pathname: '/dealer/DealerLogin', params: { role: 'dealer' } })}
          className="rounded-2xl bg-white p-6 shadow">
          <Text className="text-xl font-semibold text-gray-900">We’re an Organisation</Text>
          <Text className="mt-2 text-gray-600">Manage assets and warranties at scale.</Text>
        </Pressable>
      </View>
    </View>
  );
}
