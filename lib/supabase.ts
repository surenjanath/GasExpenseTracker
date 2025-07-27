import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { FuelExpense, Payment, Vehicle, ServiceRecord, UserProfile } from '@/types';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key. Please check your app.config.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Types for our database tables
export interface FuelExpense {
  id: string;
  user_id: string;
  date: string;
  fuel_amount: number;
  price_per_unit: number;
  total_cost: number;
  odometer: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  description: string;
  cost: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_gas_price: number | null;
  use_location: boolean;
  notifications: boolean;
  dark_mode: boolean;
  currency: string;
  distance_unit: string;
  volume_unit: string;
  auto_sync: boolean;
  sync_frequency: string;
  data_retention_months: number;
  fuel_efficiency_unit: string;
  temperature_unit: string;
  language: string;
  theme_color: string;
  show_tutorial: boolean;
  export_format: string;
  created_at: string;
  updated_at: string;
}

// Database operations
export const db = {
  fuelExpenses: {
    async create(data: Omit<FuelExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      const { data: expense, error } = await supabase
        .from('fuel_expenses')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return expense;
    },

    async list() {
      const { data: expenses, error } = await supabase
        .from('fuel_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return expenses;
    },

    async update(id: string, data: Partial<FuelExpense>) {
      const { data: expense, error } = await supabase
        .from('fuel_expenses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return expense;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('fuel_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  payments: {
    async create(data: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return payment;
    },

    async list() {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return payments;
    },

    async update(id: string, data: Partial<Payment>) {
      const { data: payment, error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return payment;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  vehicles: {
    async create(data: Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return vehicle;
    },

    async list() {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('make', { ascending: true });

      if (error) throw error;
      return vehicles;
    },

    async update(id: string, data: Partial<Vehicle>) {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return vehicle;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  serviceRecords: {
    async create(data: Omit<ServiceRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      const { data: record, error } = await supabase
        .from('service_records')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return record;
    },

    async list(vehicleId?: string) {
      let query = supabase
        .from('service_records')
        .select('*')
        .order('date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data: records, error } = await query;

      if (error) throw error;
      return records;
    },

    async update(id: string, data: Partial<ServiceRecord>) {
      const { data: record, error } = await supabase
        .from('service_records')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return record;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('service_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  settings: {
    async get() {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      if (!data) {
        // Create default settings if none exist
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error('No user found');
        return await this.createDefault(userId);
      }

      return data;
    },

    async createDefault(userId: string) {
      const defaultSettings: UserSettings = {
        user_id: userId,
        default_gas_price: 0,
        use_location: true,
        notifications: true,
        dark_mode: false,
        currency: 'USD',
        distance_unit: 'miles',
        volume_unit: 'gallons',
        auto_sync: true,
        sync_frequency: 'daily',
        data_retention_months: 12,
        fuel_efficiency_unit: 'mpg',
        temperature_unit: 'fahrenheit',
        language: 'en',
        theme_color: 'default',
        show_tutorial: true,
        export_format: 'csv',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('Error creating default settings:', error);
        throw error;
      }

      return data;
    },

    async update(settings: Partial<UserSettings>) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating settings:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No settings found to update');
        }

        return data;
      } catch (error) {
        console.error('Error in settings update:', error);
        throw error;
      }
    }
  },

  profiles: {
    async get() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create default
          return await this.createDefault(user.id);
        }
        throw error;
      }

      return data;
    },

    async createDefault(userId: string) {
      const defaultProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
        full_name: 'New User',
        email: '',
        phone_number: '+1 (555) 000-0000',
        date_of_birth: new Date().toISOString().split('T')[0],
        gender: 'Not Specified',
        address: 'Not Set',
        city: 'Not Set',
        state: 'Not Set',
        zip_code: '00000',
        country: 'United States',
        license_number: 'Not Set',
        license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        license_state: 'Not Set',
        license_country: 'United States',
        vehicle_count: 0,
        total_miles_driven: 0,
        total_fuel_saved: 0,
        total_money_saved: 0,
        average_mpg: 0,
        preferred_fuel_type: 'Regular',
        preferred_payment_method: 'Credit Card',
        notification_preferences: {
          email: true,
          push: true,
          maintenance: true,
          price_alerts: true
        }
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ ...defaultProfile, id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(data: Partial<UserProfile>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    }
  },

  statistics: {
    async list() {
      const { data, error } = await supabase
        .from('app_statistics')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  },

  journey: {
    async list() {
      const { data, error } = await supabase
        .from('app_journey')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    }
  }
};

export async function addFuelExpense(expense: Omit<FuelExpense, 'id' | 'created_at' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('fuel_expenses')
    .insert([{ ...expense, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFuelExpenses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('fuel_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateFuelExpense(id: string, expense: Partial<FuelExpense>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('fuel_expenses')
    .update(expense)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const deleteFuelExpense = async (id: string) => {
  const { error } = await supabase
    .from('fuel_expenses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export async function addPayment(payment: Omit<Payment, 'id' | 'created_at' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('payments')
    .insert([{ ...payment, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPayments() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, payment: Partial<Payment>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('payments')
    .update(payment)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const deletePayment = async (id: string) => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export async function addVehicle(vehicle: Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vehicles')
    .insert([{ ...vehicle, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addServiceRecord(record: Omit<ServiceRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .insert([{ ...record, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVehicles() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('make', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getServiceRecords(vehicleId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('service_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}