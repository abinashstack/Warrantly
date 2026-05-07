import React from "react";
import { TextInput, View, KeyboardTypeOptions } from "react-native";

interface InputFieldProps {
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  value?: string;
  onChangeText?: (text: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  placeholder,
  keyboardType = "default",
  value,
  onChangeText,
}) => {
  return (
    <View className="w-full my-2">
      <TextInput
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#A1A1A1"
        value={value}
        onChangeText={onChangeText}
        className="w-full rounded-xl bg-gray-100 px-5 py-4 text-base text-black"
      />
    </View>
  );
};

export default InputField;
