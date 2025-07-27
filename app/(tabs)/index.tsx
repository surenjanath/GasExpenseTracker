import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { getFuelExpenses, getPayments, getVehicles } from '@/lib/supabase';
import { FuelExpense, Payment } from '@/types';
import { formatCurrency } from '@/utils/format';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [expenses, setExpenses] = useState<FuelExpense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, paymentsData, vehiclesData] = await Promise.all([
        getFuelExpenses(),
        getPayments(),
        getVehicles(),
      ]);
      setExpenses(expensesData);
      setPayments(paymentsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProfileImage = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile image:', error);
        return;
      }

      if (data?.avatar_url) {
        setProfileImage(data.avatar_url);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error in fetchProfileImage:', error);
    }
  };

  useEffect(() => {
    loadData();
    fetchProfileImage();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      fetchProfileImage();
    }, [user?.id])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
    fetchProfileImage();
  }, []);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total, 0);
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = totalPayments - totalExpenses;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/menu')} style={styles.menuButton}>
            <Ionicons name="grid" size={24} color="#282828" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#282828" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Image
                  source={{ 
                    uri: profileImage || 'https://placekitten.com/100/100',
                    cache: 'force-cache'
                  }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.error('Error loading profile image:', e.nativeEvent.error);
                    setProfileImage(null);
                  }}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#282828" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>
            Welcome, {user?.user_metadata?.full_name || 'User'}!
          </Text>
          <Text style={styles.subtitle}>Track your gas expenses</Text>

          <View style={styles.statsCards}>
            <BlurView intensity={60} tint="light" style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardTitle}>Fuel Expenses</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Total Spent</Text>
                    <MaterialIcons name="local-gas-station" size={16} color="#282828" />
                  </View>
                  <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Total Gallons</Text>
                    <MaterialIcons name="water" size={16} color="#282828" />
                  </View>
                  <Text style={styles.statValue}>{expenses.reduce((sum, e) => sum + e.gallons, 0)}</Text>
                </View>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={[styles.statsCard, styles.greenCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.updateText}>Updated just now</Text>
                <TouchableOpacity>
                  <Text style={styles.moreText}>More</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardTitle}>Payments</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Total Paid</Text>
                    <MaterialIcons name="payment" size={16} color="#282828" />
                  </View>
                  <Text style={styles.statValue}>{formatCurrency(totalPayments)}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Balance</Text>
                    <MaterialIcons 
                      name={balance >= 0 ? "account-balance" : "warning"} 
                      size={16} 
                      color={balance >= 0 ? "#34C759" : "#FF3B30"} 
                    />
                  </View>
                  <Text style={[styles.statValue, { color: balance >= 0 ? '#34C759' : '#FF3B30' }]}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
              </View>
            </BlurView>
          </View>

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
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF6B6B" />
                <Text style={styles.loadingText}>Loading entries...</Text>
              </View>
            ) : expenses.length === 0 ? (
              <Text style={styles.emptyText}>No fuel expenses recorded yet</Text>
            ) : (
              expenses.slice(0, 4).map((expense) => (
                <BlurView key={expense.id} intensity={60} tint="light" style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View>
                      <Text style={styles.entryLocation}>{expense.location || 'Unknown Location'}</Text>
                      <Text style={styles.entryDate}>{new Date(expense.date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.entryAmount}>{formatCurrency(expense.total)}</Text>
                  </View>
                  <View style={styles.entryDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Gallons</Text>
                      <Text style={styles.detailValue}>{expense.gallons}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Price/Gallon</Text>
                      <Text style={styles.detailValue}>{formatCurrency(expense.price_per_gallon)}</Text>
                    </View>
                  </View>
                </BlurView>
              ))
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/add')}
            >
              <Ionicons name="add-circle" size={24} color="#282828" />
              <Text style={styles.actionButtonText}>Add Fuel Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/add-payment')}
            >
              <Ionicons name="card" size={24} color="#282828" />
              <Text style={styles.actionButtonText}>Add Payment</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#282828',
    backgroundColor: '#f5f5f5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  statsCards: {
    gap: 16,
    marginBottom: 24,
  },
  statsCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    overflow: 'hidden',
  },
  greenCard: {
    backgroundColor: 'rgba(230, 240, 230, 0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateText: {
    fontSize: 12,
    color: '#666',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#282828',
  },
  section: {
    marginBottom: 24,
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
  seeAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  entryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#282828',
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#282828',
  },
  entryDetails: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
  },
  paymentItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '500',
    color: '#282828',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
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
  logoutButton: {
    padding: 8,
    marginLeft: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});