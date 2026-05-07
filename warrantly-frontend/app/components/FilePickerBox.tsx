import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';

type Props = {
  onPick?: (uri: string) => void;
};

const FilePickerBox = ({ onPick }: Props) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Permission required to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      onPick?.(uri);
    }
  };

  return (
    <TouchableOpacity
      onPress={pickImage}
      activeOpacity={0.8}
      className="mb-10 h-40 w-40 items-center justify-center self-center rounded-xl bg-gray-200">
      {imageUri ? (
        <Image source={{ uri: imageUri }} className="h-full w-full rounded-xl" resizeMode="cover" />
      ) : (
        <>
          <Ionicons name="cloud-upload-outline" size={28} color="#6b7280" />
          <Text className="mt-2 text-xs text-gray-500">Upload bill / image</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default FilePickerBox;
