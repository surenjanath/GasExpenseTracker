import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFuelExpenses, getPayments, deleteFuelExpense, deletePayment } from '@/lib/supabase';
import { FuelExpense, Payment } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/format';

type EntryType = 'all' | 'fuel' | 'payments';

export default function EntriesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<FuelExpense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedType, setSelectedType] = useState<EntryType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, paymentsData] = await Promise.all([
        getFuelExpenses(),
        getPayments(),
      ]);
      setExpenses(expensesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const filteredExpenses = expenses.filter(expense => {
    if (selectedType === 'all' || selectedType === 'fuel') return true;
    return false;
  });

  const filteredPayments = payments.filter(payment => {
    if (selectedType === 'all' || selectedType === 'payments') return true;
    return false;
  });

  const allEntries = [
    ...filteredExpenses.map(expense => ({
      type: 'fuel' as const,
      data: expense,
      date: new Date(expense.date),
    })),
    ...filteredPayments.map(payment => ({
      type: 'payment' as const,
      data: payment,
      date: new Date(payment.date),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleDeleteFuelExpense = async (id: string) => {
    Alert.alert(
      'Delete Fuel Entry',
      'Are you sure you want to delete this fuel entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFuelExpense(id);
              setExpenses(prev => prev.filter(expense => expense.id !== id));
              Alert.alert('Success', 'Fuel entry deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete fuel entry');
            }
          },
        },
      ]
    );
  };

  const handleDeletePayment = async (id: string) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(id);
              setPayments(prev => prev.filter(payment => payment.id !== id));
              Alert.alert('Success', 'Payment deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete payment');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#282828" />
        </TouchableOpacity>
        <Text style={styles.title}>All Entries</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'fuel' && styles.filterButtonActive]}
          onPress={() => setSelectedType('fuel')}
        >
          <Text style={[styles.filterText, selectedType === 'fuel' && styles.filterTextActive]}>
            Fuel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'payments' && styles.filterButtonActive]}
          onPress={() => setSelectedType('payments')}
        >
          <Text style={[styles.filterText, selectedType === 'payments' && styles.filterTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#282828"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
      >
        <View style={styles.content}>
          {allEntries.map((entry, index) => (
            <BlurView key={index} intensity={60} tint="light" style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryTypeContainer}>
                  <View style={[
                    styles.entryTypeBadge,
                    entry.type === 'fuel' ? styles.fuelBadge : styles.paymentBadge
                  ]}>
                    <Text style={styles.entryTypeText}>
                      {entry.type === 'fuel' ? 'Fuel' : 'Payment'}
                    </Text>
                  </View>
                  <Text style={styles.entryDate}>
                    {entry.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.entryAmountContainer}>
                  <Text style={styles.entryAmount}>
                    {formatCurrency(entry.type === 'fuel' ? entry.data.total : entry.data.amount)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => entry.type === 'fuel' 
                      ? handleDeleteFuelExpense(entry.data.id)
                      : handleDeletePayment(entry.data.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.entryDetails}>
                {entry.type === 'fuel' ? (
                  <>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue}>{entry.data.location || 'Not specified'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Mileage</Text>
                        <Text style={styles.detailValue}>{formatNumber(entry.data.mileage)}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Gallons</Text>
                        <Text style={styles.detailValue}>{formatNumber(entry.data.gallons)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Price/Gallon</Text>
                        <Text style={styles.detailValue}>
                          {formatCurrency(entry.data.total / entry.data.gallons)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Payment Type</Text>
                        <Text style={styles.detailValue}>{entry.data.payment_type || 'Not specified'}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Source</Text>
                        <Text style={styles.detailValue}>{entry.data.source || 'Not specified'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Type</Text>
                        <Text style={styles.detailValue}>{entry.data.type || 'Not specified'}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Notes</Text>
                        <Text style={styles.detailValue}>{entry.data.notes || 'No notes'}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </BlurView>
          ))}
          {allEntries.length === 0 && (
            <Text style={styles.emptyText}>No entries found</Text>
          )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  filterButtonActive: {
    backgroundColor: '#282828',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  entryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  entryTypeContainer: {
    flex: 1,
  },
  entryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  fuelBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  paymentBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#282828',
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  entryAmountContainer: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
  entryDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#282828',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
}); 