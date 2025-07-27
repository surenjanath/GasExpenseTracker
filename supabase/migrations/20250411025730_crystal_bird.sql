/*
  # Vehicle Expenses Schema

  1. New Tables
    - `fuel_expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `fuel_amount` (decimal)
      - `price_per_unit` (decimal)
      - `total_cost` (decimal)
      - `odometer` (integer)
      - `payment_method` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (decimal)
      - `date` (date)
      - `source` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `default_gas_price` (decimal)
      - `use_location` (boolean, default true)
      - `notifications` (boolean, default true)
      - `dark_mode` (boolean, default false)
      - `currency` (text, default 'USD')
      - `distance_unit` (text, default 'miles')
      - `volume_unit` (text, default 'gallons')
      - `backup_enabled` (boolean, default false)
      - `backup_frequency` (text, default 'weekly')
      - `data_retention_months` (integer, default 12)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create fuel expenses table
CREATE TABLE IF NOT EXISTS fuel_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  fuel_amount decimal NOT NULL,
  price_per_unit decimal NOT NULL,
  total_cost decimal NOT NULL,
  odometer integer NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount decimal NOT NULL,
  date date NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  default_gas_price decimal,
  use_location boolean DEFAULT true,
  notifications boolean DEFAULT true,
  dark_mode boolean DEFAULT false,
  currency text DEFAULT 'USD',
  distance_unit text DEFAULT 'miles',
  volume_unit text DEFAULT 'gallons',
  backup_enabled boolean DEFAULT false,
  backup_frequency text DEFAULT 'weekly',
  data_retention_months integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fuel_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for fuel_expenses
CREATE POLICY "Users can create their own fuel expenses"
  ON fuel_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own fuel expenses"
  ON fuel_expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own fuel expenses"
  ON fuel_expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fuel expenses"
  ON fuel_expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for payments
CREATE POLICY "Users can create their own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);