import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../lib/supabase';
import { UserSettings } from '../../lib/supabase';
import Logo from '../../components/Logo';

const DecimalInput = ({ value, onChange, placeholder }: { value: number | null, onChange: (value: number | null) => void, placeholder: string }) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // If there's a decimal point, limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setInputValue(cleaned);
    
    // Convert to number only when we have a valid number
    if (cleaned === '') {
      onChange(null);
    } else if (!isNaN(parseFloat(cleaned))) {
      onChange(parseFloat(cleaned));
    }
  };

  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={inputValue}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      returnKeyType="done"
    />
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempSettings, setTempSettings] = useState<UserSettings | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await db.settings.get();
      setSettings(data);
      setTempSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateTempSetting = (key: keyof UserSettings, value: any) => {
    if (!tempSettings) return;
    setTempSettings({ ...tempSettings, [key]: value });
  };

  const handleSave = async () => {
    if (!tempSettings) return;
    
    try {
      setLoading(true);
      const data = await db.settings.update(tempSettings);
      setSettings(data);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        'Error',
        'Failed to save settings. Please try again.',
        [
          {
            text: 'Retry',
            onPress: handleSave
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const { error } = await db.auth.deleteUser();
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (!settings || !tempSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#282828" />
          </TouchableOpacity>
          <Logo size="small" showText={false} />
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <BlurView intensity={60} tint="light" style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Gas Price ($/gallon)</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <DecimalInput
                  value={tempSettings.default_gas_price}
                  onChange={(value) => updateTempSetting('default_gas_price', value)}
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Use Current Location</Text>
                <Text style={styles.settingDescription}>
                  Automatically detect and use your current location for gas entries
                </Text>
              </View>
              <Switch
                value={tempSettings.use_location}
                onValueChange={(value) => updateTempSetting('use_location', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={tempSettings.use_location ? '#282828' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive reminders and updates about your fuel expenses
                </Text>
              </View>
              <Switch
                value={tempSettings.notifications}
                onValueChange={(value) => updateTempSetting('notifications', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={tempSettings.notifications ? '#282828' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Switch to dark theme for better visibility in low light
                </Text>
              </View>
              <Switch
                value={tempSettings.dark_mode}
                onValueChange={(value) => updateTempSetting('dark_mode', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={tempSettings.dark_mode ? '#282828' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Tutorial</Text>
                <Text style={styles.settingDescription}>
                  Show tutorial tips when using the app
                </Text>
              </View>
              <Switch
                value={tempSettings.show_tutorial}
                onValueChange={(value) => updateTempSetting('show_tutorial', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={tempSettings.show_tutorial ? '#282828' : '#f4f3f4'}
              />
            </View>
          </BlurView>

          <BlurView intensity={60} tint="light" style={[styles.settingsCard, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Units & Display</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingDescription}>
                  Select your preferred currency for displaying amounts
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.currency === 'USD' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('currency', 'USD')}
                >
                  <Text style={[styles.selectorText, tempSettings.currency === 'USD' && styles.selectorTextActive]}>USD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.currency === 'EUR' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('currency', 'EUR')}
                >
                  <Text style={[styles.selectorText, tempSettings.currency === 'EUR' && styles.selectorTextActive]}>EUR</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Distance Unit</Text>
                <Text style={styles.settingDescription}>
                  Choose between miles and kilometers
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.distance_unit === 'miles' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('distance_unit', 'miles')}
                >
                  <Text style={[styles.selectorText, tempSettings.distance_unit === 'miles' && styles.selectorTextActive]}>Miles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.distance_unit === 'kilometers' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('distance_unit', 'kilometers')}
                >
                  <Text style={[styles.selectorText, tempSettings.distance_unit === 'kilometers' && styles.selectorTextActive]}>KM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Volume Unit</Text>
                <Text style={styles.settingDescription}>
                  Choose between gallons and liters
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.volume_unit === 'gallons' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('volume_unit', 'gallons')}
                >
                  <Text style={[styles.selectorText, tempSettings.volume_unit === 'gallons' && styles.selectorTextActive]}>Gallons</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.volume_unit === 'liters' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('volume_unit', 'liters')}
                >
                  <Text style={[styles.selectorText, tempSettings.volume_unit === 'liters' && styles.selectorTextActive]}>Liters</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Fuel Efficiency Unit</Text>
                <Text style={styles.settingDescription}>
                  Choose between MPG and L/100km
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.fuel_efficiency_unit === 'mpg' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('fuel_efficiency_unit', 'mpg')}
                >
                  <Text style={[styles.selectorText, tempSettings.fuel_efficiency_unit === 'mpg' && styles.selectorTextActive]}>MPG</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.fuel_efficiency_unit === 'l100km' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('fuel_efficiency_unit', 'l100km')}
                >
                  <Text style={[styles.selectorText, tempSettings.fuel_efficiency_unit === 'l100km' && styles.selectorTextActive]}>L/100km</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Temperature Unit</Text>
                <Text style={styles.settingDescription}>
                  Choose between Fahrenheit and Celsius
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.temperature_unit === 'fahrenheit' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('temperature_unit', 'fahrenheit')}
                >
                  <Text style={[styles.selectorText, tempSettings.temperature_unit === 'fahrenheit' && styles.selectorTextActive]}>°F</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.temperature_unit === 'celsius' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('temperature_unit', 'celsius')}
                >
                  <Text style={[styles.selectorText, tempSettings.temperature_unit === 'celsius' && styles.selectorTextActive]}>°C</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingDescription}>
                  Select your preferred language
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.language === 'en' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('language', 'en')}
                >
                  <Text style={[styles.selectorText, tempSettings.language === 'en' && styles.selectorTextActive]}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.language === 'es' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('language', 'es')}
                >
                  <Text style={[styles.selectorText, tempSettings.language === 'es' && styles.selectorTextActive]}>Español</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Theme Color</Text>
                <Text style={styles.settingDescription}>
                  Choose your preferred theme color
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.theme_color === 'default' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('theme_color', 'default')}
                >
                  <Text style={[styles.selectorText, tempSettings.theme_color === 'default' && styles.selectorTextActive]}>Default</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.theme_color === 'blue' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('theme_color', 'blue')}
                >
                  <Text style={[styles.selectorText, tempSettings.theme_color === 'blue' && styles.selectorTextActive]}>Blue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.theme_color === 'green' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('theme_color', 'green')}
                >
                  <Text style={[styles.selectorText, tempSettings.theme_color === 'green' && styles.selectorTextActive]}>Green</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          <BlurView intensity={60} tint="light" style={[styles.settingsCard, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Data & Sync</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync your data across devices
                </Text>
              </View>
              <Switch
                value={tempSettings.auto_sync}
                onValueChange={(value) => updateTempSetting('auto_sync', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={tempSettings.auto_sync ? '#282828' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sync Frequency</Text>
                <Text style={styles.settingDescription}>
                  How often to sync your data
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.sync_frequency === 'hourly' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('sync_frequency', 'hourly')}
                >
                  <Text style={[styles.selectorText, tempSettings.sync_frequency === 'hourly' && styles.selectorTextActive]}>Hourly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.sync_frequency === 'daily' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('sync_frequency', 'daily')}
                >
                  <Text style={[styles.selectorText, tempSettings.sync_frequency === 'daily' && styles.selectorTextActive]}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.sync_frequency === 'weekly' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('sync_frequency', 'weekly')}
                >
                  <Text style={[styles.selectorText, tempSettings.sync_frequency === 'weekly' && styles.selectorTextActive]}>Weekly</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Data Retention</Text>
                <Text style={styles.settingDescription}>
                  How long to keep your data before automatic deletion
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.data_retention_months === 3 && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('data_retention_months', 3)}
                >
                  <Text style={[styles.selectorText, tempSettings.data_retention_months === 3 && styles.selectorTextActive]}>3 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.data_retention_months === 6 && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('data_retention_months', 6)}
                >
                  <Text style={[styles.selectorText, tempSettings.data_retention_months === 6 && styles.selectorTextActive]}>6 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.data_retention_months === 12 && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('data_retention_months', 12)}
                >
                  <Text style={[styles.selectorText, tempSettings.data_retention_months === 12 && styles.selectorTextActive]}>1 Year</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Export Format</Text>
                <Text style={styles.settingDescription}>
                  Choose your preferred export format
                </Text>
              </View>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.export_format === 'csv' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('export_format', 'csv')}
                >
                  <Text style={[styles.selectorText, tempSettings.export_format === 'csv' && styles.selectorTextActive]}>CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, tempSettings.export_format === 'json' && styles.selectorButtonActive]}
                  onPress={() => updateTempSetting('export_format', 'json')}
                >
                  <Text style={[styles.selectorText, tempSettings.export_format === 'json' && styles.selectorTextActive]}>JSON</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonModal]}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  settingsCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#282828',
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#282828',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#282828',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  selectorButtonActive: {
    backgroundColor: '#282828',
  },
  selectorText: {
    fontSize: 14,
    color: '#282828',
  },
  selectorTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#282828',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteButtonModal: {
    backgroundColor: '#ff3b30',
  },
  cancelButtonText: {
    color: '#282828',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});