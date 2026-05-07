import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
} from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  filled?: boolean;
  icon?: ImageSourcePropType;
  loading?: boolean;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  filled = false,
  icon,
  loading = false,
  disabled = false,
}) => {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
      className={`mt-3 w-full flex-row items-center justify-center rounded-xl py-4 ${
        filled ? 'bg-black' : 'bg-gray-100'
      } ${isDisabled ? 'opacity-60' : ''}`}>
      {loading ? (
        <ActivityIndicator color={filled ? '#fff' : '#000'} />
      ) : (
        <>
          {icon && <Image source={icon} className="mr-2 h-5 w-5" />}
          <Text className={`text-base font-semibold ${filled ? 'text-white' : 'text-black'}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
