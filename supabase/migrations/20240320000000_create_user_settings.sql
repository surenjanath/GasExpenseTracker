-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    default_gas_price DECIMAL(10,2),
    use_location BOOLEAN DEFAULT true,
    notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    currency VARCHAR(3) DEFAULT 'USD',
    distance_unit VARCHAR(10) DEFAULT 'miles',
    volume_unit VARCHAR(10) DEFAULT 'gallons',
    -- Sync settings
    auto_sync BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(10) DEFAULT 'daily',
    data_retention_months INTEGER DEFAULT 12,
    -- Display settings
    fuel_efficiency_unit VARCHAR(10) DEFAULT 'mpg',
    temperature_unit VARCHAR(10) DEFAULT 'fahrenheit',
    language VARCHAR(10) DEFAULT 'en',
    theme_color VARCHAR(20) DEFAULT 'default',
    show_tutorial BOOLEAN DEFAULT true,
    export_format VARCHAR(10) DEFAULT 'csv',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

-- Create RLS policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to delete user data
CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete user's settings
    DELETE FROM user_settings WHERE user_id = OLD.id;
    -- Delete user's gas entries
    DELETE FROM gas_entries WHERE user_id = OLD.id;
    -- Delete user's vehicles
    DELETE FROM vehicles WHERE user_id = OLD.id;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS delete_user_data_trigger ON auth.users;

-- Create trigger to delete user data when user is deleted
CREATE TRIGGER delete_user_data_trigger
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION delete_user_data(); 