import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

const OptionPickerModal: React.FC<OptionPickerModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text className="text-foreground text-xl font-black">{title}</Text>
          <ScrollView
            className="mt-5"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 360 }}
          >
            {options.map((option) => {
              const active = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={`${title}-${option.value || 'empty'}`}
                  onPress={() => onSelect(option.value)}
                  className={`px-4 py-4 rounded-2xl mb-3 border ${
                    active
                      ? 'bg-primary/10 border-primary'
                      : 'bg-white border-border'
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      active ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 20,
  },
});

export default OptionPickerModal;
