import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  label: string;
  options: any[];
  value: string | null;
  idKey: string,
  labelKey: string,
  onSelect: (id: string) => void;
};

const Dropdown = ({ label, options, value, idKey, labelKey, onSelect }: Props) => {
  return (
    <View className="mb-6">
      <Text className="mb-2 font-semibold text-gray-700">{label}</Text>

      <View className="rounded-xl border border-gray-200">
        {options.map((option) => {
          const id = option[idKey];
          const name = option[labelKey];

          return (
            <TouchableOpacity
              key={id}
              onPress={() => onSelect(id)}
              className={`border-b border-gray-100 px-4 py-3 ${value === id ? 'bg-gray-100' : ''}`}>
              <Text>{name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// // type Option = {
// //   id: string;
// //   name: string;
// // };


// const Dropdown = ({ label, options, value, onSelect }: Props) => {
//   return (
//     <View className="mb-6">
//       <Text className="mb-2 font-semibold text-gray-700">{label}</Text>

//       <View className="rounded-xl border border-gray-200">
//         {options.map((option) => {
//           const id = option.category_id || option.item_id || option.product_id;

//           const name = option.category_name || option.item_name || option.product_name;

//           return (
//             <TouchableOpacity
//               key={id}
//               onPress={() => {
//                 onSelect(id);
//               }}
//               className={`border-b border-gray-100 px-4 py-3 ${value === id ? 'bg-gray-100' : ''}`}>
//               <Text>{name}</Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     </View>
//   );
// };

export default Dropdown;
