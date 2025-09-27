-- Create ports table for comprehensive port database
CREATE TABLE IF NOT EXISTS public.ports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Port identification
    port_name TEXT NOT NULL,
    port_code TEXT, -- UNLOCODE or other port codes
    country TEXT NOT NULL,
    region TEXT, -- State/Province/Region

    -- Geographic coordinates
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,

    -- Port characteristics
    port_type TEXT, -- Container, Bulk, Cruise, Ferry, etc.
    size_category TEXT, -- Major, Medium, Small
    max_vessel_size INTEGER, -- Maximum vessel LOA in meters
    max_draft DECIMAL(4, 2), -- Maximum draft in meters

    -- Operational information
    is_active BOOLEAN DEFAULT true,
    timezone_name TEXT, -- IANA timezone identifier

    -- Alternative names for better matching
    alternative_names TEXT[], -- Array of alternative names

    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', port_name), 'A') ||
        setweight(to_tsvector('english', COALESCE(port_code, '')), 'B') ||
        setweight(to_tsvector('english', country), 'C') ||
        setweight(to_tsvector('english', COALESCE(region, '')), 'D') ||
        setweight(to_tsvector('english', array_to_string(COALESCE(alternative_names, ARRAY[]::TEXT[]), ' ')), 'B')
    ) STORED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ports_search_vector ON public.ports USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_ports_country ON public.ports(country);
CREATE INDEX IF NOT EXISTS idx_ports_location ON public.ports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ports_name ON public.ports(port_name);
CREATE INDEX IF NOT EXISTS idx_ports_code ON public.ports(port_code);
CREATE INDEX IF NOT EXISTS idx_ports_active ON public.ports(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ports_updated_at BEFORE UPDATE ON public.ports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to ports" ON public.ports
    FOR SELECT USING (true);

-- Create policy to allow insert/update for authenticated users (if needed for admin operations)
CREATE POLICY "Allow insert for authenticated users" ON public.ports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.ports
    FOR UPDATE USING (auth.role() = 'authenticated');