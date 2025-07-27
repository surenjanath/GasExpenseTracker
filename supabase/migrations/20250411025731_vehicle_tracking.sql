-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  license_plate text,
  vin text,
  current_mileage integer NOT NULL,
  last_service_mileage integer,
  next_service_mileage integer,
  service_interval integer NOT NULL DEFAULT 5000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service records table
CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  date date NOT NULL,
  mileage integer NOT NULL,
  service_type text NOT NULL,
  description text,
  cost decimal,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add vehicle_id and mileage to fuel_expenses table
ALTER TABLE fuel_expenses 
ADD COLUMN vehicle_id uuid REFERENCES vehicles(id),
ADD COLUMN mileage integer;

-- Update existing records to have a default mileage value
UPDATE fuel_expenses SET mileage = 0 WHERE mileage IS NULL;

-- Now make mileage NOT NULL
ALTER TABLE fuel_expenses ALTER COLUMN mileage SET NOT NULL;

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles
CREATE POLICY "Users can create their own vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for service_records
CREATE POLICY "Users can create their own service records"
  ON service_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own service records"
  ON service_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own service records"
  ON service_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service records"
  ON service_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 