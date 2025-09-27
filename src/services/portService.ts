import { supabase } from '@/integrations/supabase/client';

export interface Port {
  id: string;
  port_name: string;
  un_locode?: string;  // Changed from port_code to match CSV
  country?: string;
  region?: string;
  latitude?: number;   // Allow null for ports without coordinates
  longitude?: number;  // Allow null for ports without coordinates
  port_type?: string;
  size_category?: string;
  max_vessel_size?: number;
  max_draft?: number;
  is_active: boolean;
  timezone_name?: string;
  alternative_names?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Search for ports in Supabase database using fuzzy matching
 */
export const searchPorts = async (query: string, limit: number = 10): Promise<Port[]> => {
  try {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .or(`port_name.ilike.%${query}%, un_locode.ilike.%${query}%, country.ilike.%${query}%`)
      .eq('is_active', true)
      .order('port_name')
      .limit(limit);

    if (error) {
      console.error('Error searching ports:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to search ports:', error);
    throw error;
  }
};

/**
 * Find port coordinates by destination name with fuzzy matching
 */
export const findPortCoordinates = async (destinationName: string): Promise<{ lat: number; lng: number } | null> => {
  if (!destinationName?.trim()) {
    return null;
  }

  try {
    console.log(`Searching for port: "${destinationName}"`);

    // First try exact match on port name
    let { data, error } = await supabase
      .from('ports')
      .select('latitude, longitude, port_name')
      .eq('port_name', destinationName.trim())
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Database error in exact match:', error);
    }

    if (data && data.length > 0) {
      console.log(`Found exact match: ${data[0].port_name}`);
      return {
        lat: parseFloat(data[0].latitude.toString()),
        lng: parseFloat(data[0].longitude.toString())
      };
    }

    // Try fuzzy search with ilike (case-insensitive LIKE)
    const { data: fuzzyData, error: fuzzyError } = await supabase
      .from('ports')
      .select('latitude, longitude, port_name, un_locode, alternative_names')
      .or(`port_name.ilike.%${destinationName.trim()}%, un_locode.ilike.%${destinationName.trim()}%`)
      .eq('is_active', true)
      .not('latitude', 'is', null)  // Only ports with coordinates
      .not('longitude', 'is', null)
      .order('port_name')
      .limit(5);

    if (fuzzyError) {
      console.error('Database error in fuzzy search:', fuzzyError);
    }

    if (fuzzyData && fuzzyData.length > 0) {
      // Find best match
      const bestMatch = fuzzyData.find(port => {
        const query = destinationName.toLowerCase().trim();
        const portName = port.port_name.toLowerCase();
        const unLocode = port.un_locode?.toLowerCase() || '';
        const altNames = port.alternative_names || [];

        // Check for exact substring matches
        if (portName.includes(query) || query.includes(portName) ||
            unLocode.includes(query) || query.includes(unLocode)) {
          return true;
        }

        // Check alternative names
        return altNames.some(altName => {
          const altLower = altName.toLowerCase();
          return altLower.includes(query) || query.includes(altLower);
        });
      });

      const selectedPort = bestMatch || fuzzyData[0];
      console.log(`Found fuzzy match: ${selectedPort.port_name} (${selectedPort.un_locode || 'N/A'})`);

      return {
        lat: parseFloat(selectedPort.latitude.toString()),
        lng: parseFloat(selectedPort.longitude.toString())
      };
    }

    console.log(`No port found for: "${destinationName}"`);
    return null;

  } catch (error) {
    console.error('Error finding port coordinates:', error);
    throw error;
  }
};

/**
 * Get port details by ID
 */
export const getPortById = async (id: string): Promise<Port | null> => {
  try {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting port by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get port by ID:', error);
    throw error;
  }
};

/**
 * Get all ports for a specific country
 */
export const getPortsByCountry = async (country: string, limit: number = 50): Promise<Port[]> => {
  try {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .eq('country', country)
      .eq('is_active', true)
      .order('port_name')
      .limit(limit);

    if (error) {
      console.error('Error getting ports by country:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get ports by country:', error);
    throw error;
  }
};

/**
 * Get major ports (useful for quick lookup)
 */
export const getMajorPorts = async (limit: number = 100): Promise<Port[]> => {
  try {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .eq('size_category', 'Major')
      .eq('is_active', true)
      .order('port_name')
      .limit(limit);

    if (error) {
      console.error('Error getting major ports:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get major ports:', error);
    throw error;
  }
};

/**
 * Get ports within a geographic bounding box
 */
export const getPortsInBounds = async (
  northLat: number,
  southLat: number,
  eastLng: number,
  westLng: number,
  limit: number = 100
): Promise<Port[]> => {
  try {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .gte('latitude', southLat)
      .lte('latitude', northLat)
      .gte('longitude', westLng)
      .lte('longitude', eastLng)
      .eq('is_active', true)
      .order('port_name')
      .limit(limit);

    if (error) {
      console.error('Error getting ports in bounds:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get ports in bounds:', error);
    throw error;
  }
};