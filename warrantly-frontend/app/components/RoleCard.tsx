import { Pressable, Text } from 'react-native';

export type Role = 'consumer' | 'dealer' | 'organisation';

type RoleCardProps = {
  title: string;
  desc: string;
  onPress: () => void;
};

const RoleCard = ({ title, desc, onPress }: RoleCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      <Text className="mt-1 text-sm text-gray-500">{desc}</Text>
    </Pressable>
  );
};

export default RoleCard;
