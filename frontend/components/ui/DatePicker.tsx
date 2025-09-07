import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  placeholder?: string
  label?: string
  minimumDate?: Date
  maximumDate?: Date
  mode?: 'date' | 'time' | 'datetime'
  disabled?: boolean
  error?: string
  required?: boolean
}

const { width } = Dimensions.get('window')

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  minimumDate,
  maximumDate,
  mode = 'date',
  disabled = false,
  error,
  required = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [tempDate, setTempDate] = useState(value)

  const formatDate = (date: Date): string => {
    if (mode === 'time') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    }
    
    if (mode === 'datetime') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
      if (selectedDate) {
        onChange(selectedDate)
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate)
      }
    }
  }

  const handleConfirm = () => {
    onChange(tempDate)
    setShowPicker(false)
  }

  const handleCancel = () => {
    setTempDate(value)
    setShowPicker(false)
  }

  const openPicker = () => {
    if (!disabled) {
      setTempDate(value)
      setShowPicker(true)
    }
  }

  const renderPicker = () => {
    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )
    }

    return (
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {mode === 'time' ? 'Select Time' : mode === 'datetime' ? 'Select Date & Time' : 'Select Date'}
              </Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, styles.confirmButton]}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.picker}
              />
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.input,
          disabled && styles.inputDisabled,
          error && styles.inputError,
        ]}
        onPress={openPicker}
        disabled={disabled}
      >
        <View style={styles.inputContent}>
          <Ionicons
            name={mode === 'time' ? 'time-outline' : 'calendar-outline'}
            size={20}
            color={disabled ? Colors.text.tertiary : Colors.text.secondary}
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              disabled && styles.inputTextDisabled,
              !value && styles.placeholderText,
            ]}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={disabled ? Colors.text.tertiary : Colors.text.secondary}
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {showPicker && Platform.OS === 'ios' && renderPicker()}
      {showPicker && Platform.OS === 'android' && renderPicker()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: Colors.accent.primary,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 52,
  },
  inputDisabled: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.border.secondary,
  },
  inputError: {
    borderColor: Colors.accent.error,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  inputTextDisabled: {
    color: Colors.text.tertiary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  errorText: {
    fontSize: 14,
    color: Colors.accent.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  confirmButton: {
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  pickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  picker: {
    width: '100%',
    height: 200,
  },
})
