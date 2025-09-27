#!/usr/bin/env python3
"""
Convert ports CSV file to SQL INSERT statements
"""
import csv
import re

def clean_port_name(name):
    """Clean port name and extract country/region info"""
    # Remove 'Port' suffix if present
    name = re.sub(r'\s+Port$', '', name, flags=re.IGNORECASE)
    return name.strip()

def extract_country_from_locode(locode):
    """Extract country code from UN/LOCODE"""
    if locode and len(locode) >= 2:
        return locode[:2]
    return None

def country_code_to_name(code):
    """Convert country code to full country name"""
    country_map = {
        'NL': 'Netherlands', 'CH': 'Switzerland', 'ES': 'Spain', 'LY': 'Libya',
        'TR': 'Turkey', 'HR': 'Croatia', 'AE': 'United Arab Emirates',
        'DE': 'Germany', 'RO': 'Romania', 'SN': 'Senegal', 'CN': 'China',
        'BE': 'Belgium', 'CS': 'Serbia', 'ME': 'Montenegro', 'EG': 'Egypt',
        'US': 'United States', 'GR': 'Greece', 'TN': 'Tunisia', 'RU': 'Russia',
        'AR': 'Argentina', 'ZA': 'Zaporizhzhia', 'CA': 'Canada', 'GB': 'United Kingdom',
        'FR': 'France', 'IT': 'Italy', 'PT': 'Portugal', 'DK': 'Denmark',
        'SE': 'Sweden', 'NO': 'Norway', 'FI': 'Finland', 'PL': 'Poland',
        'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'AU': 'Australia',
        'NZ': 'New Zealand', 'BR': 'Brazil', 'CL': 'Chile', 'PE': 'Peru',
        'CO': 'Colombia', 'PA': 'Panama', 'MX': 'Mexico', 'VE': 'Venezuela',
        'EC': 'Ecuador', 'UY': 'Uruguay', 'PY': 'Paraguay', 'BO': 'Bolivia',
        'MY': 'Malaysia', 'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines',
        'ID': 'Indonesia', 'SG': 'Singapore', 'HK': 'Hong Kong', 'TW': 'Taiwan',
        'SA': 'Saudi Arabia', 'QA': 'Qatar', 'KW': 'Kuwait', 'BH': 'Bahrain',
        'OM': 'Oman', 'IR': 'Iran', 'IQ': 'Iraq', 'JO': 'Jordan', 'LB': 'Lebanon',
        'SY': 'Syria', 'IL': 'Israel', 'CY': 'Cyprus', 'MT': 'Malta',
        'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'LY': 'Libya',
        'EG': 'Egypt', 'SD': 'Sudan', 'ER': 'Eritrea', 'ET': 'Ethiopia',
        'DJ': 'Djibouti', 'SO': 'Somalia', 'KE': 'Kenya', 'TZ': 'Tanzania',
        'MZ': 'Mozambique', 'MG': 'Madagascar', 'MU': 'Mauritius',
        'ZA': 'South Africa', 'NA': 'Namibia', 'AO': 'Angola', 'GH': 'Ghana',
        'NG': 'Nigeria', 'CM': 'Cameroon', 'GA': 'Gabon', 'CG': 'Congo',
        'CD': 'Democratic Republic of Congo', 'CF': 'Central African Republic',
        'TD': 'Chad', 'LR': 'Liberia', 'SL': 'Sierra Leone', 'GN': 'Guinea',
        'CI': 'Ivory Coast', 'BF': 'Burkina Faso', 'ML': 'Mali', 'NE': 'Niger',
        'IS': 'Iceland', 'IE': 'Ireland', 'LV': 'Latvia', 'LT': 'Lithuania',
        'EE': 'Estonia', 'BY': 'Belarus', 'UA': 'Ukraine', 'MD': 'Moldova',
        'BG': 'Bulgaria', 'MK': 'North Macedonia', 'AL': 'Albania',
        'BA': 'Bosnia and Herzegovina', 'SI': 'Slovenia', 'SK': 'Slovakia',
        'CZ': 'Czech Republic', 'HU': 'Hungary', 'AT': 'Austria',
        'LI': 'Liechtenstein', 'LU': 'Luxembourg'
    }
    return country_map.get(code, 'Unknown')

def process_csv_to_sql(csv_file_path, output_file_path):
    """Convert CSV to SQL INSERT statements"""

    # First, create the table structure
    create_table_sql = """-- Create ports table
CREATE TABLE IF NOT EXISTS public.ports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    port_name TEXT NOT NULL,
    port_code TEXT,
    country TEXT NOT NULL,
    region TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    port_type TEXT DEFAULT 'Container',
    size_category TEXT DEFAULT 'Medium',
    max_vessel_size INTEGER DEFAULT 300,
    max_draft DECIMAL(4, 2) DEFAULT 12.0,
    is_active BOOLEAN DEFAULT true,
    timezone_name TEXT,
    alternative_names TEXT[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ports_name ON public.ports(port_name);
CREATE INDEX IF NOT EXISTS idx_ports_code ON public.ports(port_code);
CREATE INDEX IF NOT EXISTS idx_ports_country ON public.ports(country);
CREATE INDEX IF NOT EXISTS idx_ports_location ON public.ports(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to ports" ON public.ports FOR SELECT USING (true);

"""

    insert_statements = []

    with open(csv_file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)

        for row in csv_reader:
            port_name = row['port_name'].strip()
            un_locode = row['un_locode'].strip() if row['un_locode'].strip() else None

            # Skip rows with missing coordinates
            try:
                latitude = float(row['latitude']) if row['latitude'].strip() else None
                longitude = float(row['longitude']) if row['longitude'].strip() else None

                if latitude is None or longitude is None:
                    continue

            except (ValueError, TypeError):
                continue

            # Clean port name
            clean_name = clean_port_name(port_name)

            # Extract country from UN/LOCODE
            country_code = extract_country_from_locode(un_locode) if un_locode else None
            country_name = country_code_to_name(country_code) if country_code else 'Unknown'

            # Create alternative names array
            alt_names = []
            if port_name != clean_name:
                alt_names.append(port_name)

            escaped_names = [f"'{name.replace(chr(39), chr(39)+chr(39))}'" for name in alt_names]
            alt_names_sql = "ARRAY[" + ",".join(escaped_names) + "]" if alt_names else "ARRAY[]::TEXT[]"

            # Create INSERT statement
            insert_sql = f"""INSERT INTO public.ports (port_name, port_code, country, latitude, longitude, alternative_names) VALUES
('{clean_name.replace("'", "''")}', {'NULL' if not un_locode else f"'{un_locode}'"}, '{country_name.replace("'", "''")}', {latitude}, {longitude}, {alt_names_sql});"""

            insert_statements.append(insert_sql)

    # Write to output file
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        output_file.write(create_table_sql)
        output_file.write("\n-- Insert ports data\n")
        output_file.write("\n".join(insert_statements))
        output_file.write("\n")

    print(f"Converted {len(insert_statements)} ports to SQL")
    print(f"SQL file written to: {output_file_path}")

if __name__ == "__main__":
    csv_file = "/Users/vasvenss/Desktop/Ports Data/ports simple.csv"
    output_file = "/Users/vasvenss/Projects/weather-datadocked/ports_import.sql"

    process_csv_to_sql(csv_file, output_file)