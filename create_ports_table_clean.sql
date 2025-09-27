-- Clean ports table creation (handles existing triggers)
-- CSV columns: port_name, un_locode, latitude, longitude

-- Drop existing table and recreate cleanly
DROP TABLE IF EXISTS public.ports CASCADE;

CREATE TABLE public.ports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Main port data (matching your CSV)
    port_name TEXT NOT NULL,
    un_locode TEXT,  -- This matches your CSV 'un_locode' column
    latitude DECIMAL(10, 7),  -- Allow NULL for empty values
    longitude DECIMAL(10, 7), -- Allow NULL for empty values

    -- Additional metadata fields (will be populated with defaults)
    country TEXT,
    region TEXT,
    port_type TEXT DEFAULT 'Container',
    size_category TEXT DEFAULT 'Medium',
    max_vessel_size INTEGER DEFAULT 300,
    max_drift DECIMAL(4, 2) DEFAULT 12.0,
    is_active BOOLEAN DEFAULT true,
    timezone_name TEXT,
    alternative_names TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create indexes for performance
CREATE INDEX idx_ports_name ON public.ports(port_name);
CREATE INDEX idx_ports_unlocode ON public.ports(un_locode);
CREATE INDEX idx_ports_country ON public.ports(country);
CREATE INDEX idx_ports_location ON public.ports(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_ports_active ON public.ports(is_active);
CREATE INDEX idx_ports_with_coords ON public.ports(port_name) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ports_updated_at
    BEFORE UPDATE ON public.ports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to ports" ON public.ports
    FOR SELECT USING (true);

-- Create policy to allow insert for authenticated users (for CSV import)
CREATE POLICY "Allow insert for authenticated users" ON public.ports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow update for authenticated users
CREATE POLICY "Allow update for authenticated users" ON public.ports
    FOR UPDATE USING (auth.role() = 'authenticated');