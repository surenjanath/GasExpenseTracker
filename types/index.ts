export interface FuelExpense {
  id: string;
  user_id: string;
  date: string;
  location: string;
  mileage: number;
  gallons: number;
  price_per_unit: number;
  total: number;
  payment_type: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  source: string;
  type: string;
  notes: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string;
  vin?: string;
  current_mileage: number;
  last_service_mileage?: number;
  next_service_mileage?: number;
  service_interval: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  mileage: number;
  service_type: string;
  description?: string;
  cost?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
    id: string;
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
    created_at: string;
    updated_at: string;
}

export interface AppStatistic {
    id: string;
    name: string;
    value: number;
    icon: string;
    created_at: string;
    updated_at: string;
}

export interface JourneyItem {
    id: string;
    date: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
} 