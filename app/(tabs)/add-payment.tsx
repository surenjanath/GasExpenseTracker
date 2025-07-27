import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addPayment, getPayments } from '@/lib/supabase';
import { Payment } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function AddPaymentScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const paymentsData = await getPayments();
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !date || !method) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await addPayment({
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        method,
      });
      Alert.alert('Success', 'Payment added successfully');
      loadPayments(); // Refresh the payments list
      setAmount('');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#282828" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Payment</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <BlurView intensity={60} tint="light" style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
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
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.methodButtons}>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'cash' && styles.methodButtonActive]}
                  onPress={() => setMethod('cash')}
                >
                  <Ionicons name="cash" size={20} color={method === 'cash' ? '#ffffff' : '#282828'} />
                  <Text style={[styles.methodButtonText, method === 'cash' && styles.methodButtonTextActive]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'card' && styles.methodButtonActive]}
                  onPress={() => setMethod('card')}
                >
                  <Ionicons name="card" size={20} color={method === 'card' ? '#ffffff' : '#282828'} />
                  <Text style={[styles.methodButtonText, method === 'card' && styles.methodButtonTextActive]}>
                    Card
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Payment'}
              </Text>
            </TouchableOpacity>
          </BlurView>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {payments.slice(0, 5).map((payment) => (
              <BlurView key={payment.id} intensity={60} tint="light" style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethod}>{payment.method}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
              </BlurView>
            ))}
            {payments.length === 0 && (
              <Text style={styles.emptyText}>No payments recorded yet</Text>
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
    fontSize: 16,
    color: '#282828',
    paddingVertical: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: '#282828',
  },
  methodButtonText: {
    fontSize: 16,
    color: '#282828',
  },
  methodButtonTextActive: {
    color: '#ffffff',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 16,
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
}); 