import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, Switch, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/lib/auth';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

interface UserProfile {
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  license_number: string;
  license_expiry: string;
  license_state: string;
  license_country: string;
  vehicle_count: number;
  total_miles_driven: number;
  total_fuel_saved: number;
  total_money_saved: number;
  average_mpg: number;
  preferred_fuel_type: string;
  preferred_payment_method: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    maintenance: boolean;
    price_alerts: boolean;
  };
  avatar_url: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (!data) {
        // Create a new profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: user?.id,
              full_name: user?.user_metadata?.full_name || '',
              email: user?.email || null,
              notification_preferences: {
                email: true,
                push: true,
                maintenance: true,
                price_alerts: true
              }
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          ...profile,
          email: profile.email || null,
          updated_at: new Date()
        });

      if (error) throw error;
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setSaving(false);
      setShowSaveConfirmation(false);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      
      // Get the file extension from the URI
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Create a FormData object
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          avatar_url: publicUrl
        });
      }

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleGenderSelect = (gender: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      gender
    });
    setShowGenderModal(false);
  };

  const handlePhoneChange = (text: string) => {
    if (!profile) return;
    const formatted = formatPhoneNumber(text);
    setProfile({
      ...profile,
      phone_number: formatted
    });
  };

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [field]: value
    });
  };

  const handleNotificationPreferenceUpdate = (field: keyof UserProfile['notification_preferences'], value: boolean) => {
    if (!profile) return;
    setProfile({
      ...profile,
      notification_preferences: {
        ...profile.notification_preferences,
        [field]: value
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#282828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            onPress={editing ? handleSave : () => setEditing(true)} 
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={editing ? pickImage : undefined}
            disabled={!editing}
          >
            <Image
              source={{ 
                uri: profile?.avatar_url || 'https://placekitten.com/100/100',
                cache: 'force-cache'
              }}
              style={styles.avatar}
              onError={(e) => {
                console.error('Error loading avatar:', e.nativeEvent.error);
                // Fallback to default avatar
                if (profile) {
                  setProfile({
                    ...profile,
                    avatar_url: null
                  });
                }
              }}
              onLoadStart={() => console.log('Loading avatar...')}
              onLoadEnd={() => console.log('Avatar loaded successfully')}
            />
            {editing && (
              <View style={styles.editAvatarButton}>
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.statsContainer}>
          <BlurView intensity={40} tint="light" style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="car-outline" size={24} color="#FF6B6B" />
              <Text style={styles.statValue}>{profile?.vehicle_count || 0}</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={24} color="#FF6B6B" />
              <Text style={styles.statValue}>{profile?.total_miles_driven?.toLocaleString() || 0}</Text>
              <Text style={styles.statLabel}>Miles</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={24} color="#FF6B6B" />
              <Text style={styles.statValue}>{profile?.total_fuel_saved?.toFixed(0) || 0}</Text>
              <Text style={styles.statLabel}>Gallons Saved</Text>
            </View>
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Full Name</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.full_name}
                  onChangeText={(text) => handleProfileUpdate('full_name', text)}
                  placeholder="Enter your name"
                />
              ) : (
                <Text style={styles.value}>{profile?.full_name}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.phone_number}
                  onChangeText={handlePhoneChange}
                  placeholder="(123) 456-7890"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{profile?.phone_number}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date of Birth</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.date_of_birth}
                  onChangeText={(text) => handleProfileUpdate('date_of_birth', text)}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
              ) : (
                <Text style={styles.value}>{formatDate(profile?.date_of_birth || '')}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Gender</Text>
              {editing ? (
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Text style={styles.inputText}>
                    {profile?.gender || 'Select gender'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.value}>{profile?.gender}</Text>
              )}
            </View>
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driving Information</Text>
          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>License Number</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.license_number}
                  onChangeText={(text) => handleProfileUpdate('license_number', text)}
                  placeholder="Enter license number"
                />
              ) : (
                <Text style={styles.value}>{profile?.license_number}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>License Expiry</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.license_expiry}
                  onChangeText={(text) => handleProfileUpdate('license_expiry', text)}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
              ) : (
                <Text style={styles.value}>{formatDate(profile?.license_expiry || '')}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>License State</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.license_state}
                  onChangeText={(text) => handleProfileUpdate('license_state', text)}
                  placeholder="Enter state"
                />
              ) : (
                <Text style={styles.value}>{profile?.license_state}</Text>
              )}
            </View>
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driving Preferences</Text>
          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Preferred Fuel Type</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.preferred_fuel_type}
                  onChangeText={(text) => handleProfileUpdate('preferred_fuel_type', text)}
                  placeholder="e.g., Regular, Premium"
                />
              ) : (
                <Text style={styles.value}>{profile?.preferred_fuel_type}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Payment Method</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={profile?.preferred_payment_method}
                  onChangeText={(text) => handleProfileUpdate('preferred_payment_method', text)}
                  placeholder="e.g., Credit Card, Cash"
                />
              ) : (
                <Text style={styles.value}>{profile?.preferred_payment_method}</Text>
              )}
            </View>
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Vehicles</Text>
              <Text style={styles.value}>{profile?.vehicle_count || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Miles Driven</Text>
              <Text style={styles.value}>{profile?.total_miles_driven?.toLocaleString() || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Fuel Saved</Text>
              <Text style={styles.value}>{profile?.total_fuel_saved?.toFixed(0) || 0} gallons</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Money Saved</Text>
              <Text style={styles.value}>{formatCurrency(profile?.total_money_saved || 0)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Average MPG</Text>
              <Text style={styles.value}>{profile?.average_mpg?.toFixed(1) || 0}</Text>
            </View>
          </BlurView>
        </View>

        {showGenderModal && (
          <Modal
            visible={showGenderModal}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      profile?.gender === 'Male' && styles.selectedGenderButton
                    ]}
                    onPress={() => handleGenderSelect('Male')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      profile?.gender === 'Male' && styles.selectedGenderButtonText
                    ]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      profile?.gender === 'Female' && styles.selectedGenderButton
                    ]}
                    onPress={() => handleGenderSelect('Female')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      profile?.gender === 'Female' && styles.selectedGenderButtonText
                    ]}>Female</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      profile?.gender === 'Other' && styles.selectedGenderButton
                    ]}
                    onPress={() => handleGenderSelect('Other')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      profile?.gender === 'Other' && styles.selectedGenderButtonText
                    ]}>Other</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      profile?.gender === 'Prefer not to say' && styles.selectedGenderButton
                    ]}
                    onPress={() => handleGenderSelect('Prefer not to say')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      profile?.gender === 'Prefer not to say' && styles.selectedGenderButtonText
                    ]}>Prefer not to say</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowGenderModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showSaveConfirmation && (
          <Modal
            visible={showSaveConfirmation}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Save Changes?</Text>
                <Text style={styles.modalText}>
                  Are you sure you want to save these changes to your profile?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowSaveConfirmation(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 80,
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#282828',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(245, 245, 245, 0.5)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#282828',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#282828',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#282828',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#282828',
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 150,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  inputText: {
    fontSize: 16,
    color: '#282828',
    fontWeight: '500',
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    gap: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  genderButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedGenderButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  selectedGenderButtonText: {
    color: '#FFFFFF',
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
}); 