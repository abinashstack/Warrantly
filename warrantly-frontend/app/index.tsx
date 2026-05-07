// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Linking from 'expo-linking';
// import { supabase } from 'lib/supabase';
// import { useState } from 'react';
// import { Alert, Image, Platform, Text, View } from 'react-native';
// import CustomButton from './components/CustomButton';

// const SignUp = () => {
//   const [role, setRole] = useState<'consumer' | 'dealer'>('consumer');

//   const signInWithGoogle = async () => {
//     await AsyncStorage.setItem('signup_role', role);
//     try {
//       if (Platform.OS === 'web') {

//         await supabase.auth.signInWithOAuth({
//           provider: 'google',
//         });
//       } else {

//         const { data, error } = await supabase.auth.signInWithOAuth({
//           provider: 'google',
//           options: {
//             redirectTo: 'warrantly://auth/callback',
//           },
//         });

//         if (error) throw error;

//         if (data?.url) {
//           await Linking.openURL(data.url);
//         }
//       }
//     } catch (error: any) {
//       Alert.alert('Google Sign-In failed', error.message);
//     }
//   };

//   return (
//     <View className="h-full w-full flex-1 items-center justify-center bg-white px-8">
//       <Image
//         source={require('./assets/icon.png')}
//         className="mb-2 h-16 w-16"
//         resizeMode="contain"
//       />

//       <Text className="mb-4 mt-4 text-5xl font-bold tracking-widest">Warrantly</Text>

//       <View className="mb-8 mt-2 h-[1px] w-full bg-gray-100" />

//       {/* <View>
//         <Text className="mt-10 text-lg text-center font-semibold text-gray-700">Account type</Text>

//         <View className="flex-row">
//           <Pressable onPress={() => setRole('consumer')}>
//             <Text className="text-base p-1 mr-4 text-gray-500">{role === 'consumer' ? '🔘' : '⚪'} Consumer</Text>
//           </Pressable>

//           <Pressable onPress={() => setRole('dealer')}>
//             <Text className="text-base p-1 mr-4 text-gray-500">{role === 'dealer' ? '🔘' : '⚪'} Dealer</Text>
//           </Pressable>
//         </View>
//       </View> */}

//       {/* <Text className="mt-10 text-lg font-bold text-gray-700">Create an account</Text> */}

//       {/* <Text className="mb-4 text-center text-sm text-gray-500">
//         Enter your phone number to sign up for this app
//       </Text> */}

//       {/* <InputField placeholder="+91 00000 00000" keyboardType="phone-pad" /> */}

//       <CustomButton title="Sign up as a Customer" filled />
//       <CustomButton title="Sign up as a Dealer" filled />
//       <CustomButton title="Sign up as an Organisation" filled />

//       {/* <View className="mb-3 mt-6 w-full flex-row items-center">
//         <View className="h-px flex-1 bg-gray-300" />
//         <Text className="mx-2 text-gray-400">or continue with</Text>
//         <View className="h-px flex-1 bg-gray-300" />
//       </View> */}
// {/*
//       <CustomButton
//         title="Google"
//         icon={require('./assets/google.png')}
//         onPress={signInWithGoogle}
//       />

//       <Text className="mt-5 text-center text-xs text-gray-500">
//         By clicking continue, you agree to our{' '}
//         <Text className="text-blue-500">Terms of Service</Text> and{' '}
//         <Text className="text-blue-500">Privacy Policy</Text>
//       </Text> */}
//     </View>
//   );
// };

// export default SignUp;

import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import RoleCard from './components/RoleCard';

const RoleSelect = () => {
  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <Image
        source={require('./assets/icon.png')}
        className="mb-6 h-14 w-14 self-center"
      />

      <Text className="text-center text-3xl font-bold text-gray-900">Welcome to Warrantly</Text>

      <Text className="mb-10 mt-3 text-center text-base text-gray-500">
        Keep track of bills, warranties and reminders — effortlessly.
      </Text>

      <RoleCard
        title="I’m a Customer"
        desc="Store bills, track warranties and get expiry reminders."
        onPress={() =>
          router.push({
            pathname: '/login',
            params: { role: 'consumer' },
          })
        }
      />

      <RoleCard
        title="I’m a Dealer"
        desc="Manage customers and warranties you sell."
        onPress={() =>
          router.push({
            pathname: '/login',
            params: { role: 'dealer' },
          })
        }
      />

      <RoleCard
        title="We’re an Organisation"
        desc="Handle warranties and assets at scale."
        onPress={() =>
          router.push({
            pathname: '/login',
            params: { role: 'organisation' },
          })
        }
      />
    </View>
  );
};

export default RoleSelect;