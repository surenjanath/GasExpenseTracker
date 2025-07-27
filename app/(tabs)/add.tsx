import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addFuelExpense, getFuelExpenses, getVehicles } from '@/lib/supabase';
import { FuelExpense, Vehicle } from '@/types';
import { formatCurrency } from '@/utils/format';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function AddScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [gallons, setGallons] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [total, setTotal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<FuelExpense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [mileage, setMileage] = useState('');
  const [useLocation, setUseLocation] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, vehiclesData] = await Promise.all([
        getFuelExpenses(),
        getVehicles(),
      ]);
      setExpenses(expensesData);
      setVehicles(vehiclesData);
      if (vehiclesData.length > 0) {
        setSelectedVehicleId(vehiclesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (settings?.default_gas_price) {
        setPricePerGallon(settings.default_gas_price.toString());
      }
      if (settings?.use_location !== undefined) {
        setUseLocation(settings.use_location);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to automatically detect your location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const { name, street, city, region } = address[0];
        const locationName = name || street || `${city}, ${region}`;
        setLocation(locationName);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (useLocation) {
      getCurrentLocation();
    }
  }, [useLocation]);

  const calculateFromTotal = (totalValue: string) => {
    setTotal(totalValue);
    if (totalValue && pricePerGallon) {
      const totalNum = parseFloat(totalValue);
      const priceNum = parseFloat(pricePerGallon);
      if (!isNaN(totalNum) && !isNaN(priceNum) && priceNum > 0) {
        const calculatedGallons = (totalNum / priceNum).toFixed(2);
        setGallons(calculatedGallons);
      }
    }
  };

  const calculateFromGallons = (gallonsValue: string) => {
    setGallons(gallonsValue);
    if (gallonsValue && pricePerGallon) {
      const gallonsNum = parseFloat(gallonsValue);
      const priceNum = parseFloat(pricePerGallon);
      if (!isNaN(gallonsNum) && !isNaN(priceNum)) {
        const calculatedTotal = (gallonsNum * priceNum).toFixed(2);
        setTotal(calculatedTotal);
      }
    }
  };

  const handlePricePerGallonChange = (price: string) => {
    setPricePerGallon(price);
    if (price && (gallons || total)) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum > 0) {
        if (gallons) {
          const gallonsNum = parseFloat(gallons);
          if (!isNaN(gallonsNum)) {
            const calculatedTotal = (gallonsNum * priceNum).toFixed(2);
            setTotal(calculatedTotal);
          }
        } else if (total) {
          const totalNum = parseFloat(total);
          if (!isNaN(totalNum)) {
            const calculatedGallons = (totalNum / priceNum).toFixed(2);
            setGallons(calculatedGallons);
          }
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (!gallons || !pricePerGallon) {
      Alert.alert('Error', 'Please enter both gallons and price per gallon');
      return;
    }
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }
    if (!mileage) {
      Alert.alert('Error', 'Please enter the current mileage');
      return;
    }

    try {
      setLoading(true);
      await addFuelExpense({
        location: location.trim(),
        gallons: parseFloat(gallons),
        price_per_gallon: parseFloat(pricePerGallon),
        total: parseFloat(total),
        date,
        notes: notes.trim(),
        vehicle_id: selectedVehicleId,
        mileage: parseInt(mileage),
      });
      Alert.alert('Success', 'Fuel expense added successfully');
      loadData(); // Refresh the expenses list
      setLocation('');
      setGallons('');
      setPricePerGallon('');
      setTotal('');
      setNotes('');
      setMileage('');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred while adding the expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#282828" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Fuel Expense</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <BlurView intensity={60} tint="light" style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle</Text>
              <View style={styles.vehicleSelector}>
                {vehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleOption,
                      selectedVehicleId === vehicle.id && styles.vehicleOptionSelected,
                    ]}
                    onPress={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      selectedVehicleId === vehicle.id && styles.vehicleOptionTextSelected,
                    ]}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationInput}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Gas station name"
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                >
                  <Ionicons
                    name={locationLoading ? 'refresh' : 'location'}
                    size={20}
                    color="#282828"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Gallons</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={gallons}
                  onChangeText={calculateFromGallons}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Price/Gallon</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={pricePerGallon}
                    onChangeText={handlePricePerGallonChange}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={total}
                  onChangeText={calculateFromTotal}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Mileage</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current odometer reading"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Add any additional notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
          </BlurView>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/(tabs)/entries')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#282828" />
              </TouchableOpacity>
            </View>
            {expenses.slice(0, 5).map((expense) => (
              <BlurView key={expense.id} intensity={60} tint="light" style={styles.expenseItem}>
                <View style={styles.expenseHeader}>
                  <View>
                    <Text style={styles.expenseLocation}>{expense.location}</Text>
                    <Text style={styles.expenseDate}>
                      {new Date(expense.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatCurrency(expense.total)}</Text>
                </View>
                <View style={styles.expenseDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Gallons</Text>
                    <Text style={styles.detailValue}>{expense.gallons}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Price/Gallon</Text>
                    <Text style={styles.detailValue}>{formatCurrency(expense.price_per_gallon)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mileage</Text>
                    <Text style={styles.detailValue}>{expense.mileage}</Text>
                  </View>
                </View>
              </BlurView>
            ))}
            {expenses.length === 0 && (
              <Text style={styles.emptyText}>No fuel expenses recorded yet</Text>
            )}
          </View>
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
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
  },
  headerRight: {
    width: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
  },
  content: {
    padding: 20,
  },
  formCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#282828',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    color: '#282828',
    fontSize: 16,
    marginRight: 8,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  totalCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
  },
  submitButton: {
    backgroundColor: '#282828',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#282828',
  },
  expenseItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#282828',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#282828',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#282828',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  vehicleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  vehicleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  vehicleOptionSelected: {
    backgroundColor: '#282828',
  },
  vehicleOptionText: {
    fontSize: 14,
    color: '#282828',
  },
  vehicleOptionTextSelected: {
    color: '#fff',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  locationButton: {
    padding: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#282828',
  },
});