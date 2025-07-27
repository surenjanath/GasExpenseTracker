-- Add missing columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(10) DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS fuel_efficiency_unit VARCHAR(10) DEFAULT 'mpg',
ADD COLUMN IF NOT EXISTS temperature_unit VARCHAR(10) DEFAULT 'fahrenheit',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS show_tutorial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS export_format VARCHAR(10) DEFAULT 'csv';

-- Update existing rows with default values
UPDATE user_settings
SET 
    auto_sync = true,
    sync_frequency = 'daily',
    fuel_efficiency_unit = 'mpg',
    temperature_unit = 'fahrenheit',
    language = 'en',
    theme_color = 'default',
    show_tutorial = true,
    export_format = 'csv'
WHERE 
    auto_sync IS NULL OR
    sync_frequency IS NULL OR
    fuel_efficiency_unit IS NULL OR
    temperature_unit IS NULL OR
    language IS NULL OR
    theme_color IS NULL OR
    show_tutorial IS NULL OR
    export_format IS NULL; 