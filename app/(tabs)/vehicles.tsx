import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '@/lib/supabase';
import { Vehicle } from '@/types';

export default function VehiclesScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    license_plate: '',
    vin: '',
    current_mileage: '',
    service_interval: '5000',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    }
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        license_plate: vehicle.license_plate || '',
        vin: vehicle.vin || '',
        current_mileage: vehicle.current_mileage.toString(),
        service_interval: vehicle.service_interval.toString(),
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        make: '',
        model: '',
        year: '',
        license_plate: '',
        vin: '',
        current_mileage: '',
        service_interval: '5000',
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.make || !formData.model || !formData.year || !formData.current_mileage) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const vehicleData = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        license_plate: formData.license_plate.trim() || null,
        vin: formData.vin.trim() || null,
        current_mileage: parseInt(formData.current_mileage),
        service_interval: parseInt(formData.service_interval),
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
        Alert.alert('Success', 'Vehicle updated successfully');
      } else {
        await addVehicle(vehicleData);
        Alert.alert('Success', 'Vehicle added successfully');
      }

      setModalVisible(false);
      loadVehicles();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              loadVehicles();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#282828" />
          </TouchableOpacity>
          <Text style={styles.title}>My Vehicles</Text>
          <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#282828" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {vehicles.map((vehicle) => (
            <BlurView key={vehicle.id} intensity={60} tint="light" style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <View>
                  <Text style={styles.vehicleName}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  {vehicle.license_plate && (
                    <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
                  )}
                </View>
                <View style={styles.vehicleActions}>
                  <TouchableOpacity
                    onPress={() => handleOpenModal(vehicle)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil" size={20} color="#282828" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(vehicle)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash" size={20} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.vehicleDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Current Mileage</Text>
                  <Text style={styles.detailValue}>{vehicle.current_mileage}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service Interval</Text>
                  <Text style={styles.detailValue}>{vehicle.service_interval} miles</Text>
                </View>
                {vehicle.next_service_mileage && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Next Service</Text>
                    <Text style={styles.detailValue}>{vehicle.next_service_mileage} miles</Text>
                  </View>
                )}
              </View>
            </BlurView>
          ))}

          {vehicles.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No vehicles added yet</Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => handleOpenModal()}
              >
                <Text style={styles.addFirstButtonText}>Add Your First Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={60} tint="light" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#282828" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Make *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Toyota"
                  value={formData.make}
                  onChangeText={(text) => setFormData({ ...formData, make: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Camry"
                  value={formData.model}
                  onChangeText={(text) => setFormData({ ...formData, model: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Year *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2020"
                  value={formData.year}
                  onChangeText={(text) => setFormData({ ...formData, year: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>License Plate</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., ABC123"
                  value={formData.license_plate}
                  onChangeText={(text) => setFormData({ ...formData, license_plate: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>VIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle Identification Number"
                  value={formData.vin}
                  onChangeText={(text) => setFormData({ ...formData, vin: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Mileage *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 50000"
                  value={formData.current_mileage}
                  onChangeText={(text) => setFormData({ ...formData, current_mileage: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Interval (miles)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5000"
                  value={formData.service_interval}
                  onChangeText={(text) => setFormData({ ...formData, service_interval: text })}
                  keyboardType="number-pad"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Text>
            </TouchableOpacity>
          </BlurView>
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
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
  },
  addButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  vehicleCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#282828',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#282828',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
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
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
  },
  closeButton: {
    padding: 8,
  },
  modalForm: {
    maxHeight: '70%',
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
  submitButton: {
    backgroundColor: '#282828',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 