-- Insert comprehensive ports data
-- Major ports worldwide with accurate coordinates and information

INSERT INTO public.ports (port_name, port_code, country, region, latitude, longitude, port_type, size_category, max_vessel_size, max_draft, timezone_name, alternative_names) VALUES

-- Europe
('Rotterdam', 'NLRTM', 'Netherlands', 'South Holland', 51.9244, 4.4777, 'Container', 'Major', 400, 23.0, 'Europe/Amsterdam', ARRAY['Port of Rotterdam']),
('Amsterdam', 'NLAMS', 'Netherlands', 'North Holland', 52.3676, 4.9041, 'Container', 'Major', 350, 14.0, 'Europe/Amsterdam', ARRAY['Port of Amsterdam', 'Amsterdam, Netherlands']),
('Hamburg', 'DEHAM', 'Germany', 'Hamburg', 53.5511, 9.9937, 'Container', 'Major', 400, 15.1, 'Europe/Berlin', ARRAY['Port of Hamburg']),
('Antwerp', 'BEANR', 'Belgium', 'Flanders', 51.2194, 4.4025, 'Container', 'Major', 366, 17.75, 'Europe/Brussels', ARRAY['Port of Antwerp', 'Antwerpen']),
('Le Havre', 'FRLEH', 'France', 'Normandy', 49.4944, 0.1079, 'Container', 'Major', 400, 16.0, 'Europe/Paris', ARRAY['Port of Le Havre']),
('Southampton', 'GBSOU', 'United Kingdom', 'England', 50.9097, -1.4044, 'Container', 'Major', 400, 16.0, 'Europe/London', ARRAY['Port of Southampton']),
('Portsmouth', 'GBPME', 'United Kingdom', 'England', 50.8198, -1.0880, 'Ferry', 'Medium', 250, 12.0, 'Europe/London', ARRAY['Portsmouth, United Kingdom (UK)', 'Port of Portsmouth']),
('London', 'GBLON', 'United Kingdom', 'England', 51.5074, -0.1278, 'Container', 'Major', 300, 12.5, 'Europe/London', ARRAY['Port of London', 'London Gateway']),
('Bilbao', 'ESBIO', 'Spain', 'Basque Country', 43.2627, -2.9253, 'Container', 'Medium', 300, 15.0, 'Europe/Madrid', ARRAY['Port of Bilbao']),
('Barcelona', 'ESBCN', 'Spain', 'Catalonia', 41.3851, 2.1734, 'Container', 'Major', 400, 16.0, 'Europe/Madrid', ARRAY['Port of Barcelona']),
('Valencia', 'ESVLC', 'Spain', 'Valencia', 39.4699, -0.3763, 'Container', 'Major', 400, 16.0, 'Europe/Madrid', ARRAY['Port of Valencia']),
('Marseille', 'FRMRS', 'France', 'Provence', 43.2965, 5.3698, 'Container', 'Major', 400, 18.0, 'Europe/Paris', ARRAY['Port of Marseille', 'Marseilles']),
('Genoa', 'ITGOA', 'Italy', 'Liguria', 44.4056, 8.9463, 'Container', 'Major', 366, 15.0, 'Europe/Rome', ARRAY['Port of Genoa', 'Genova']),
('Naples', 'ITNAP', 'Italy', 'Campania', 40.8518, 14.2681, 'Container', 'Medium', 300, 14.0, 'Europe/Rome', ARRAY['Port of Naples', 'Napoli']),
('Piraeus', 'GRPIR', 'Greece', 'Attica', 37.9472, 23.6348, 'Container', 'Major', 400, 18.0, 'Europe/Athens', ARRAY['Port of Piraeus']),
('Istanbul', 'TRIST', 'Turkey', 'Istanbul', 41.0082, 28.9784, 'Container', 'Major', 400, 18.0, 'Europe/Istanbul', ARRAY['Port of Istanbul']),

-- North America
('New York', 'USNYC', 'United States', 'New York', 40.6892, -74.0445, 'Container', 'Major', 366, 15.2, 'America/New_York', ARRAY['Port of New York', 'New York/New Jersey']),
('Los Angeles', 'USLAX', 'United States', 'California', 33.7174, -118.2517, 'Container', 'Major', 400, 16.8, 'America/Los_Angeles', ARRAY['Port of Los Angeles', 'LA']),
('Long Beach', 'USLGB', 'United States', 'California', 33.7701, -118.1937, 'Container', 'Major', 400, 23.0, 'America/Los_Angeles', ARRAY['Port of Long Beach']),
('Oakland', 'USOAK', 'United States', 'California', 37.8044, -122.2712, 'Container', 'Major', 366, 15.2, 'America/Los_Angeles', ARRAY['Port of Oakland']),
('Seattle', 'USSEA', 'United States', 'Washington', 47.6062, -122.3321, 'Container', 'Major', 366, 16.8, 'America/Los_Angeles', ARRAY['Port of Seattle']),
('Tacoma', 'USTAC', 'United States', 'Washington', 47.2529, -122.4443, 'Container', 'Major', 366, 16.8, 'America/Los_Angeles', ARRAY['Port of Tacoma']),
('Miami', 'USMIA', 'United States', 'Florida', 25.7617, -80.1918, 'Container', 'Major', 366, 15.2, 'America/New_York', ARRAY['Port of Miami']),
('Houston', 'USHOU', 'United States', 'Texas', 29.7604, -95.3698, 'Container', 'Major', 366, 13.7, 'America/Chicago', ARRAY['Port of Houston']),
('Norfolk', 'USNFK', 'United States', 'Virginia', 36.8468, -76.2852, 'Container', 'Major', 400, 15.2, 'America/New_York', ARRAY['Port of Norfolk']),
('Charleston', 'USCHS', 'United States', 'South Carolina', 32.7767, -79.9311, 'Container', 'Major', 366, 14.0, 'America/New_York', ARRAY['Port of Charleston']),
('Vancouver', 'CAVAN', 'Canada', 'British Columbia', 49.2827, -123.1207, 'Container', 'Major', 366, 16.8, 'America/Vancouver', ARRAY['Port of Vancouver']),
('Montreal', 'CAMTR', 'Canada', 'Quebec', 45.5017, -73.5673, 'Container', 'Major', 300, 11.3, 'America/Montreal', ARRAY['Port of Montreal']),

-- Asia
('Shanghai', 'CNSHA', 'China', 'Shanghai', 31.2304, 121.4737, 'Container', 'Major', 400, 17.0, 'Asia/Shanghai', ARRAY['Port of Shanghai', 'Shanghai Yangshan']),
('Shenzhen', 'CNSZN', 'China', 'Guangdong', 22.5431, 114.0579, 'Container', 'Major', 400, 17.0, 'Asia/Shanghai', ARRAY['Port of Shenzhen']),
('Ningbo', 'CNNGB', 'China', 'Zhejiang', 29.8683, 121.5440, 'Container', 'Major', 400, 23.0, 'Asia/Shanghai', ARRAY['Port of Ningbo']),
('Hong Kong', 'HKHKG', 'Hong Kong', 'Hong Kong', 22.3193, 114.1694, 'Container', 'Major', 400, 17.0, 'Asia/Hong_Kong', ARRAY['Port of Hong Kong']),
('Singapore', 'SGSIN', 'Singapore', 'Singapore', 1.2966, 103.7764, 'Container', 'Major', 400, 20.0, 'Asia/Singapore', ARRAY['Port of Singapore']),
('Busan', 'KRPUS', 'South Korea', 'Busan', 35.1796, 129.0756, 'Container', 'Major', 400, 17.0, 'Asia/Seoul', ARRAY['Port of Busan', 'Pusan']),
('Tokyo', 'JPTYO', 'Japan', 'Tokyo', 35.6762, 139.6503, 'Container', 'Major', 400, 16.0, 'Asia/Tokyo', ARRAY['Port of Tokyo']),
('Yokohama', 'JPYOK', 'Japan', 'Kanagawa', 35.4437, 139.6380, 'Container', 'Major', 400, 16.0, 'Asia/Tokyo', ARRAY['Port of Yokohama']),
('Kobe', 'JPUKB', 'Japan', 'Hyogo', 34.6937, 135.5023, 'Container', 'Major', 366, 16.0, 'Asia/Tokyo', ARRAY['Port of Kobe']),
('Osaka', 'JPOSA', 'Japan', 'Osaka', 34.6937, 135.5023, 'Container', 'Major', 366, 14.0, 'Asia/Tokyo', ARRAY['Port of Osaka']),
('Mumbai', 'INBOM', 'India', 'Maharashtra', 19.0760, 72.8777, 'Container', 'Major', 366, 12.0, 'Asia/Kolkata', ARRAY['Port of Mumbai', 'Bombay']),
('Chennai', 'INMAA', 'India', 'Tamil Nadu', 13.0827, 80.2707, 'Container', 'Major', 350, 19.0, 'Asia/Kolkata', ARRAY['Port of Chennai', 'Madras']),
('Jawaharlal Nehru Port', 'INJNP', 'India', 'Maharashtra', 18.9647, 72.9492, 'Container', 'Major', 400, 15.0, 'Asia/Kolkata', ARRAY['JNPT', 'Nhava Sheva']),

-- Middle East
('Dubai', 'AEDXB', 'United Arab Emirates', 'Dubai', 25.2048, 55.2708, 'Container', 'Major', 400, 17.0, 'Asia/Dubai', ARRAY['Port of Dubai', 'Jebel Ali']),
('Abu Dhabi', 'AEAUH', 'United Arab Emirates', 'Abu Dhabi', 24.4539, 54.3773, 'Container', 'Major', 400, 18.0, 'Asia/Dubai', ARRAY['Port of Abu Dhabi']),
('Jeddah', 'SAJED', 'Saudi Arabia', 'Makkah', 21.4858, 39.1925, 'Container', 'Major', 400, 16.0, 'Asia/Riyadh', ARRAY['Port of Jeddah']),
('Alexandria', 'EGALY', 'Egypt', 'Alexandria', 31.2001, 29.9187, 'Container', 'Major', 366, 14.0, 'Africa/Cairo', ARRAY['Port of Alexandria']),
('Suez', 'EGSUZ', 'Egypt', 'Suez', 29.9668, 32.5498, 'Container', 'Major', 400, 20.0, 'Africa/Cairo', ARRAY['Port of Suez']),

-- Africa
('Cape Town', 'ZACPT', 'South Africa', 'Western Cape', -33.9249, 18.4241, 'Container', 'Major', 366, 18.0, 'Africa/Johannesburg', ARRAY['Port of Cape Town']),
('Durban', 'ZADUR', 'South Africa', 'KwaZulu-Natal', -29.8587, 31.0218, 'Container', 'Major', 366, 16.0, 'Africa/Johannesburg', ARRAY['Port of Durban']),
('Lagos', 'NGLOS', 'Nigeria', 'Lagos', 6.4281, 3.4219, 'Container', 'Major', 300, 15.0, 'Africa/Lagos', ARRAY['Port of Lagos', 'Apapa']),
('Casablanca', 'MACAS', 'Morocco', 'Casablanca-Settat', 33.5731, -7.5898, 'Container', 'Medium', 366, 14.0, 'Africa/Casablanca', ARRAY['Port of Casablanca']),

-- South America
('Santos', 'BRSSZ', 'Brazil', 'São Paulo', -23.9608, -46.3331, 'Container', 'Major', 366, 15.0, 'America/Sao_Paulo', ARRAY['Port of Santos']),
('Rio de Janeiro', 'BRRIO', 'Brazil', 'Rio de Janeiro', -22.9068, -43.1729, 'Container', 'Major', 350, 13.5, 'America/Sao_Paulo', ARRAY['Port of Rio de Janeiro']),
('Buenos Aires', 'ARBUE', 'Argentina', 'Buenos Aires', -34.6118, -58.3960, 'Container', 'Major', 300, 10.0, 'America/Argentina/Buenos_Aires', ARRAY['Port of Buenos Aires']),
('Paranaguá', 'BRPNG', 'Brazil', 'Paraná', -25.5163, -48.5082, 'Bulk', 'Major', 366, 12.5, 'America/Sao_Paulo', ARRAY['Port of Paranaguá', 'Paranagua, Brazil']),
('Valparaiso', 'CLVAP', 'Chile', 'Valparaíso', -33.0472, -71.6127, 'Container', 'Medium', 300, 14.0, 'America/Santiago', ARRAY['Port of Valparaiso']),
('Callao', 'PECLL', 'Peru', 'Lima', -12.0464, -77.1428, 'Container', 'Medium', 300, 16.0, 'America/Lima', ARRAY['Port of Callao']),
('Cartagena', 'COCTG', 'Colombia', 'Bolívar', 10.3910, -75.4794, 'Container', 'Medium', 350, 14.0, 'America/Bogota', ARRAY['Port of Cartagena']),

-- Panama Canal
('Balboa', 'PABAL', 'Panama', 'Panama', 8.9501, -79.5364, 'Container', 'Major', 366, 18.0, 'America/Panama', ARRAY['Port of Balboa']),
('Colon', 'PACRI', 'Panama', 'Colon', 9.3549, -79.9036, 'Container', 'Major', 366, 15.0, 'America/Panama', ARRAY['Port of Colon', 'Cristobal']),
('Panama City', 'PAPTY', 'Panama', 'Panama', 8.9824, -79.5199, 'Container', 'Major', 366, 15.0, 'America/Panama', ARRAY['Port of Panama City']),

-- Oceania
('Sydney', 'AUSYD', 'Australia', 'New South Wales', -33.8688, 151.2093, 'Container', 'Major', 366, 15.5, 'Australia/Sydney', ARRAY['Port of Sydney', 'Port Botany']),
('Melbourne', 'AUMEL', 'Australia', 'Victoria', -37.8136, 144.9631, 'Container', 'Major', 366, 14.0, 'Australia/Melbourne', ARRAY['Port of Melbourne']),
('Brisbane', 'AUBNE', 'Australia', 'Queensland', -27.4698, 153.0251, 'Container', 'Major', 366, 15.0, 'Australia/Brisbane', ARRAY['Port of Brisbane']),
('Fremantle', 'AUFRE', 'Australia', 'Western Australia', -32.0569, 115.7439, 'Container', 'Major', 366, 14.5, 'Australia/Perth', ARRAY['Port of Fremantle']),
('Auckland', 'NZAKL', 'New Zealand', 'Auckland', -36.8485, 174.7633, 'Container', 'Medium', 300, 12.0, 'Pacific/Auckland', ARRAY['Port of Auckland']),

-- Scandinavia & Baltic
('Copenhagen', 'DKCPH', 'Denmark', 'Capital Region', 55.6761, 12.5683, 'Container', 'Medium', 350, 13.0, 'Europe/Copenhagen', ARRAY['Port of Copenhagen']),
('Stockholm', 'SESTO', 'Sweden', 'Stockholm', 59.3293, 18.0686, 'Container', 'Medium', 300, 11.5, 'Europe/Stockholm', ARRAY['Port of Stockholm']),
('Oslo', 'NOOSL', 'Norway', 'Oslo', 59.9139, 10.7522, 'Container', 'Medium', 300, 12.0, 'Europe/Oslo', ARRAY['Port of Oslo']),
('Helsinki', 'FIHEL', 'Finland', 'Uusimaa', 60.1699, 24.9384, 'Container', 'Medium', 300, 11.0, 'Europe/Helsinki', ARRAY['Port of Helsinki']),
('Gothenburg', 'SEGOT', 'Sweden', 'Västra Götaland', 57.7089, 11.9746, 'Container', 'Major', 366, 13.5, 'Europe/Stockholm', ARRAY['Port of Gothenburg', 'Göteborg']),

-- Eastern Europe
('Gdansk', 'PLGDN', 'Poland', 'Pomeranian', 54.3520, 18.6466, 'Container', 'Major', 366, 15.5, 'Europe/Warsaw', ARRAY['Port of Gdansk', 'Danzig']),
('St. Petersburg', 'RULED', 'Russia', 'St. Petersburg', 59.9311, 30.3609, 'Container', 'Major', 300, 10.0, 'Europe/Moscow', ARRAY['Port of St. Petersburg']),
('Riga', 'LVRIX', 'Latvia', 'Riga', 56.9496, 24.1052, 'Container', 'Medium', 300, 12.0, 'Europe/Riga', ARRAY['Port of Riga']),
('Tallinn', 'EETLL', 'Estonia', 'Harju', 59.4370, 24.7536, 'Container', 'Medium', 300, 10.5, 'Europe/Tallinn', ARRAY['Port of Tallinn']),

-- Additional Strategic Ports
('Suez Canal', 'EGSUZ', 'Egypt', 'Suez', 30.0131, 32.5498, 'Transit', 'Major', 400, 20.0, 'Africa/Cairo', ARRAY['Suez Canal Authority']),
('Gibraltar', 'GIGIB', 'Gibraltar', 'Gibraltar', 36.1408, -5.3536, 'Bunkering', 'Medium', 350, 12.0, 'Europe/Gibraltar', ARRAY['Port of Gibraltar']),
('Malta', 'MTMLA', 'Malta', 'Malta', 35.8989, 14.5148, 'Container', 'Medium', 400, 17.0, 'Europe/Malta', ARRAY['Port of Malta', 'Valletta']),
('Port Said', 'EGPSD', 'Egypt', 'Port Said', 31.2653, 32.3019, 'Container', 'Major', 400, 18.0, 'Africa/Cairo', ARRAY['Port of Port Said']);