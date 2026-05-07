import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ConfigureServiceRule() {
  const router = useRouter();
  const { scopeId } = useLocalSearchParams();

  const [warrantyMonths, setWarrantyMonths] = useState('12');

  const [services, setServices] = useState([
    {
      id: '1',
      service_type: 'INSTALLATION',
      interval_days: '0',
      max_occurrences: '1',
      cost: '0',
    },
  ]);

  const addService = () => {
    setServices([
      ...services,
      {
        id: Date.now().toString(),
        service_type: '',
        interval_days: '',
        max_occurrences: '',
        cost: '',
      },
    ]);
  };

  const updateService = (id: string, field: string, value: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="flex-row items-center justify-between rounded-b-3xl bg-blue-700 px-6 pb-8 pt-14">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <Text className="text-lg font-bold text-white">Configure Service Rule</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* ================= WARRANTY SECTION ================= */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-gray-900">Warranty Configuration</Text>

          <Text className="mt-4 text-sm text-gray-600">Warranty Duration (Months)</Text>

          <TextInput
            value={warrantyMonths}
            onChangeText={setWarrantyMonths}
            keyboardType="numeric"
            className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />
        </View>

        {/* ================= SERVICES SECTION ================= */}
        <Text className="mb-3 text-base font-semibold text-gray-900">Service Types</Text>

        {services.map((service) => (
          <View key={service.id} className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <Text className="text-sm font-semibold text-gray-800">Service Type</Text>

            <TextInput
              placeholder="e.g., INSTALLATION"
              value={service.service_type}
              onChangeText={(value) => updateService(service.id, 'service_type', value)}
              className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            />

            <Text className="mt-4 text-sm font-semibold text-gray-800">Interval (Days)</Text>

            <TextInput
              placeholder="e.g., 365"
              value={service.interval_days}
              keyboardType="numeric"
              onChangeText={(value) => updateService(service.id, 'interval_days', value)}
              className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            />

            <Text className="mt-4 text-sm font-semibold text-gray-800">Max Free Occurrences</Text>

            <TextInput
              placeholder="e.g., 3"
              value={service.max_occurrences}
              keyboardType="numeric"
              onChangeText={(value) => updateService(service.id, 'max_occurrences', value)}
              className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            />

            <Text className="mt-4 text-sm font-semibold text-gray-800">Cost (₹)</Text>

            <TextInput
              placeholder="e.g., 1000"
              value={service.cost}
              keyboardType="numeric"
              onChangeText={(value) => updateService(service.id, 'cost', value)}
              className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            />
          </View>
        ))}

        {/* Add Service Button */}
        <TouchableOpacity
          onPress={addService}
          className="mb-6 flex-row items-center justify-center rounded-2xl border border-blue-600 py-3">
          <Ionicons name="add" size={18} color="#2563EB" />
          <Text className="ml-2 font-semibold text-blue-600">Add Service Type</Text>
        </TouchableOpacity>

        {/* ================= SAVE BUTTON ================= */}
        <TouchableOpacity
          className="mb-10 rounded-2xl bg-blue-600 py-4"
          onPress={() => {
            console.log({
              scopeId,
              warrantyMonths,
              services,
            });

            router.back();
          }}>
          <Text className="text-center font-semibold text-white">Save Service Rule</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
