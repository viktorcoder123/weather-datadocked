interface ApiKeys {
  datadocked: string;
  stormglass: string;
  weatherapi: string;
  windy: string;
  openweathermap: string;
  worldtides: string;
}

export const getApiKeys = (): ApiKeys | null => {
  const stored = localStorage.getItem('api_keys');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const fetchDataDockedVessel = async (imoOrMmsi: string) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.datadocked) {
    throw new Error('DataDocked API key not configured');
  }

  try {
    // DataDocked API endpoint for getting vessel location
    const url = `https://datadocked.com/api/vessels_operations/get-vessel-location?api_key=${apiKeys.datadocked}&imo_or_mmsi=${encodeURIComponent(imoOrMmsi)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Vessel not found
      }
      throw new Error(`DataDocked API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform DataDocked response to our format
    if (data.detail) {
      const vessel = data.detail;

      // Debug: Log all available fields to understand the API response structure
      console.log('DataDocked vessel fields:', Object.keys(vessel));
      console.log('DataDocked vessel data:', vessel);
      console.log('UNLOCODE mapping check:', {
        raw_unlocode_destination: vessel.unlocode_destination,
        raw_destinationUnlocode: vessel.destinationUnlocode,
        raw_destination_unlocode: vessel.destination_unlocode,
        will_map_to: vessel.unlocode_destination || vessel.destinationUnlocode || vessel.destination_unlocode
      });

      const mappedVessel = {
        id: vessel.imo || vessel.mmsi,
        name: vessel.name,
        imo: vessel.imo,
        mmsi: vessel.mmsi,
        latitude: parseFloat(vessel.latitude),
        longitude: parseFloat(vessel.longitude),
        speed: vessel.speed ? parseFloat(vessel.speed.replace(' kn', '')) : 0,
        course: vessel.course ? parseFloat(vessel.course.replace('°', '')) : 0,
        status: vessel.navigationalStatus,
        lastUpdate: vessel.updateTime,
        destination: vessel.destination,
        lastPort: vessel.lastPort,
        unlocode_destination: vessel.unlocode_destination || vessel.destinationUnlocode || vessel.destination_unlocode,
        unlocode_lastport: vessel.unlocode_lastport || vessel.lastPortUnlocode || vessel.last_port_unlocode,
        eta: vessel.etaUtc,
        atd: vessel.atdUtc,
        callsign: vessel.callsign,
        draught: vessel.draught,
        positionReceived: vessel.positionReceived
      };

      console.log('Final mapped vessel object:', mappedVessel);
      console.log('Mapped UNLOCODE fields:', {
        unlocode_destination: mappedVessel.unlocode_destination,
        unlocode_lastport: mappedVessel.unlocode_lastport
      });

      return mappedVessel;
    }

    return null;
  } catch (error: any) {
    console.error('DataDocked API error:', error);
    throw error;
  }
};

export const fetchDataDockedVessels = async (query: string) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.datadocked) {
    throw new Error('DataDocked API key not configured');
  }

  // Since DataDocked requires specific IMO or MMSI, we'll try to detect what type of query it is
  const isNumeric = /^\d+$/.test(query.trim());

  if (isNumeric) {
    try {
      // Try to fetch single vessel by IMO/MMSI
      const vessel = await fetchDataDockedVessel(query);
      if (vessel) {
        return { vessels: [vessel] };
      }
    } catch (error) {
      console.error('Error fetching vessel:', error);
    }
  }

  // For non-numeric queries or if single vessel fetch fails, return helpful message
  console.log('DataDocked API requires IMO or MMSI number. For vessel name search, please enter the vessel\'s IMO or MMSI.');

  // Return mock data with instructions
  return {
    vessels: [],
    message: "Please enter a vessel's IMO or MMSI number. DataDocked API requires specific vessel identifiers.",
    examples: [
      { imo: "9856189", name: "GALICIA (Example)" },
      { imo: "9123456", name: "TEST VESSEL (Mock)" }
    ]
  };
};

export const fetchStormGlassWeather = async (lat: number, lng: number) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.stormglass) {
    throw new Error('StormGlass API key not configured');
  }

  const params = [
    'airTemperature',
    'airTemperature80m',
    'airTemperature100m',
    'airTemperature1000hpa',
    'airTemperature800hpa',
    'airTemperature500hpa',
    'airTemperature200hpa',
    'airPressure',
    'cloudCover',
    'currentDirection',
    'currentSpeed',
    'gust',
    'humidity',
    'iceCover',
    'precipitation',
    'snowDepth',
    'seaLevel',
    'swellDirection',
    'swellHeight',
    'swellPeriod',
    'secondarySwellPeriod',
    'secondarySwellDirection',
    'secondarySwellHeight',
    'visibility',
    'waterTemperature',
    'waveDirection',
    'waveHeight',
    'wavePeriod',
    'windWaveDirection',
    'windWaveHeight',
    'windWavePeriod',
    'windDirection',
    'windDirection20m',
    'windDirection30m',
    'windDirection40m',
    'windDirection50m',
    'windDirection80m',
    'windDirection100m',
    'windDirection1000hpa',
    'windDirection800hpa',
    'windDirection500hpa',
    'windDirection200hpa',
    'windSpeed',
    'windSpeed20m',
    'windSpeed30m',
    'windSpeed40m',
    'windSpeed50m',
    'windSpeed80m',
    'windSpeed100m',
    'windSpeed1000hpa',
    'windSpeed800hpa',
    'windSpeed500hpa',
    'windSpeed200hpa'
  ].join(',');

  const end = new Date();
  const start = new Date();
  start.setHours(start.getHours() - 1);

  try {
    const response = await fetch(
      `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}&start=${start.toISOString()}&end=${end.toISOString()}`,
      {
        headers: {
          'Authorization': apiKeys.stormglass
        }
      }
    );

    if (!response.ok) {
      throw new Error(`StormGlass API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('StormGlass API error:', error);
    throw error;
  }
};

export const fetchWeatherAPIData = async (lat: number, lng: number) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.weatherapi) {
    throw new Error('WeatherAPI key not configured');
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKeys.weatherapi}&q=${lat},${lng}&days=10&aqi=yes&alerts=yes`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WeatherAPI error:', error);
    throw error;
  }
};

export const fetchWindyData = async (lat: number, lng: number) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.windy) {
    throw new Error('Windy API key not configured');
  }

  try {
    const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat,
        lon: lng,
        model: 'gfs',
        parameters: ['temp', 'precip', 'windGust', 'windSpeed', 'pressure', 'cloudCover', 'visibility'],
        levels: ['surface', '900h', '850h', '700h'],
        key: apiKeys.windy
      })
    });

    if (!response.ok) {
      throw new Error(`Windy API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Windy API error:', error);
    throw error;
  }
};

export const fetchAllWeatherData = async (lat: number, lng: number) => {
  const results = {
    stormglass: null as any,
    weatherapi: null as any,
    windy: null as any,
    errors: [] as string[]
  };

  // Try each API and collect any errors
  try {
    results.stormglass = await fetchStormGlassWeather(lat, lng);
  } catch (error: any) {
    console.error('StormGlass error:', error);
    results.errors.push(`StormGlass: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.weatherapi = await fetchWeatherAPIData(lat, lng);
  } catch (error: any) {
    console.error('WeatherAPI error:', error);
    results.errors.push(`WeatherAPI: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.windy = await fetchWindyData(lat, lng);
  } catch (error: any) {
    console.error('Windy error:', error);
    results.errors.push(`Windy: ${error.message || 'Failed to fetch'}`);
  }

  // If all APIs fail, provide mock weather data for testing
  if (!results.stormglass && !results.weatherapi && !results.windy) {
    console.log('All weather APIs failed, using mock data');
    results.weatherapi = {
      current: {
        temp_c: 22,
        feelslike_c: 24,
        wind_kph: 15,
        wind_dir: 'NW',
        pressure_mb: 1013,
        humidity: 65,
        cloud: 25,
        vis_km: 10,
        uv: 5,
        gust_kph: 20,
        precip_mm: 0,
        condition: { text: 'Mock data - API keys may need configuration' }
      },
      location: {
        name: 'Test Location',
        lat: lat,
        lon: lng
      }
    };
  }

  return results;
};

// OpenWeatherMap Marine API (free tier available)
export const fetchOpenWeatherMapMarine = async (lat: number, lng: number) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.openweathermap) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  try {
    // Current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKeys.openweathermap}&units=metric`
    );

    // One Call API for comprehensive data
    const oneCallResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${apiKeys.openweathermap}&units=metric`
    );

    const current = currentResponse.ok ? await currentResponse.json() : null;
    const oneCall = oneCallResponse.ok ? await oneCallResponse.json() : null;

    return {
      current,
      oneCall,
      coordinates: { lat, lng }
    };
  } catch (error) {
    console.error('OpenWeatherMap Marine API error:', error);
    throw error;
  }
};

// World Tides API for tidal information
export const fetchTidalData = async (lat: number, lng: number) => {
  const apiKeys = getApiKeys();
  if (!apiKeys?.worldtides) {
    throw new Error('WorldTides API key not configured');
  }

  try {
    const now = new Date();
    const start = Math.floor(now.getTime() / 1000);
    const end = Math.floor((now.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000); // 7 days

    const response = await fetch(
      `https://www.worldtides.info/api/v3?heights&extremes&lat=${lat}&lon=${lng}&start=${start}&length=${end - start}&key=${apiKeys.worldtides}`
    );

    if (!response.ok) {
      throw new Error(`WorldTides API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WorldTides API error:', error);
    throw error;
  }
};

// NOAA Tides and Currents (Free, US waters)
export const fetchNOAATidesAndCurrents = async (lat: number, lng: number) => {
  try {
    // Find nearest NOAA station (simplified - would need proper station lookup)
    const stationsResponse = await fetch(
      `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions`
    );

    if (!stationsResponse.ok) {
      throw new Error(`NOAA API error: ${stationsResponse.status}`);
    }

    const stations = await stationsResponse.json();

    // For demo, use the first station (in production, find nearest by distance)
    const nearestStation = stations.stations?.[0];

    if (!nearestStation) {
      throw new Error('No NOAA stations found');
    }

    // Get tidal predictions for the station
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');

    const tidesResponse = await fetch(
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=NOS.COOPS.TAC.WL&begin_date=${today}&end_date=${tomorrow}&datum=MLLW&station=${nearestStation.id}&time_zone=lst_ldt&units=metric&format=json`
    );

    const tidesData = tidesResponse.ok ? await tidesResponse.json() : null;

    return {
      station: nearestStation,
      tides: tidesData,
      coordinates: { lat, lng }
    };
  } catch (error) {
    console.error('NOAA API error:', error);
    throw error;
  }
};

// Enhanced weather data fetcher with marine data
export const fetchAllMarineWeatherData = async (lat: number, lng: number) => {
  const results = {
    stormglass: null as any,
    weatherapi: null as any,
    windy: null as any,
    openweathermap: null as any,
    tidal: null as any,
    noaa: null as any,
    errors: [] as string[]
  };

  // Try each API and collect any errors
  try {
    results.stormglass = await fetchStormGlassWeather(lat, lng);
  } catch (error: any) {
    console.error('StormGlass error:', error);
    results.errors.push(`StormGlass: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.weatherapi = await fetchWeatherAPIData(lat, lng);
  } catch (error: any) {
    console.error('WeatherAPI error:', error);
    results.errors.push(`WeatherAPI: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.windy = await fetchWindyData(lat, lng);
  } catch (error: any) {
    console.error('Windy error:', error);
    results.errors.push(`Windy: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.openweathermap = await fetchOpenWeatherMapMarine(lat, lng);
  } catch (error: any) {
    console.error('OpenWeatherMap error:', error);
    results.errors.push(`OpenWeatherMap: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.tidal = await fetchTidalData(lat, lng);
  } catch (error: any) {
    console.error('WorldTides error:', error);
    results.errors.push(`WorldTides: ${error.message || 'Failed to fetch'}`);
  }

  try {
    results.noaa = await fetchNOAATidesAndCurrents(lat, lng);
  } catch (error: any) {
    console.error('NOAA error:', error);
    results.errors.push(`NOAA: ${error.message || 'Failed to fetch'}`);
  }

  // If all APIs fail, provide mock weather data for testing
  if (!results.stormglass && !results.weatherapi && !results.windy && !results.openweathermap) {
    console.log('All weather APIs failed, using mock data');
    results.weatherapi = {
      current: {
        temp_c: 22,
        feelslike_c: 24,
        wind_kph: 15,
        wind_dir: 'NW',
        pressure_mb: 1013,
        humidity: 65,
        cloud: 25,
        vis_km: 10,
        uv: 5,
        gust_kph: 20,
        precip_mm: 0,
        condition: { text: 'Mock data - API keys may need configuration' }
      },
      location: {
        name: 'Test Location',
        lat: lat,
        lon: lng
      }
    };
  }

  return results;
};