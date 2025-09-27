import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    
    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: 'Latitude and longitude parameters are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API keys from user's stored secrets
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('stormglass_api_key, weatherapi_key')
      .single();

    if (apiKeyError || (!apiKeyData?.stormglass_api_key && !apiKeyData?.weatherapi_key)) {
      return new Response(JSON.stringify({ error: 'Weather API keys not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching weather data for coordinates:', lat, lng);

    let weatherData = null;

    // Try StormGlass first (marine-focused)
    if (apiKeyData.stormglass_api_key) {
      try {
        const stormGlassResponse = await fetch(
          `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=airTemperature,windSpeed,windDirection,waveHeight,visibility,weatherCode`,
          {
            headers: {
              'Authorization': apiKeyData.stormglass_api_key
            }
          }
        );

        if (stormGlassResponse.ok) {
          const stormData = await stormGlassResponse.json();
          const currentHour = stormData.hours?.[0];
          
          if (currentHour) {
            weatherData = {
              location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                name: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
              },
              current: {
                temperature: currentHour.airTemperature?.sg || 0,
                windSpeed: currentHour.windSpeed?.sg || 0,
                windDirection: currentHour.windDirection?.sg || 0,
                waveHeight: currentHour.waveHeight?.sg || 0,
                visibility: currentHour.visibility?.sg || 0,
                weather: getWeatherDescription(currentHour.weatherCode?.sg),
                timestamp: new Date().toISOString()
              },
              forecast: stormData.hours?.slice(1, 8).map((hour: any) => ({
                date: hour.time,
                temperature: {
                  min: hour.airTemperature?.sg - 2 || 0,
                  max: hour.airTemperature?.sg + 2 || 0
                },
                windSpeed: hour.windSpeed?.sg || 0,
                waveHeight: hour.waveHeight?.sg || 0,
                weather: getWeatherDescription(hour.weatherCode?.sg)
              })) || []
            };
          }
        }
      } catch (error) {
        console.log('StormGlass API error:', error);
      }
    }

    // Fallback to WeatherAPI if StormGlass failed
    if (!weatherData && apiKeyData.weatherapi_key) {
      try {
        const weatherApiResponse = await fetch(
          `https://api.weatherapi.com/v1/marine.json?key=${apiKeyData.weatherapi_key}&q=${lat},${lng}&days=7`
        );

        if (weatherApiResponse.ok) {
          const weatherApiData = await weatherApiResponse.json();
          
          weatherData = {
            location: {
              lat: weatherApiData.location.lat,
              lng: weatherApiData.location.lon,
              name: weatherApiData.location.name || `${lat}, ${lng}`
            },
            current: {
              temperature: weatherApiData.current.temp_c,
              windSpeed: weatherApiData.current.wind_kph / 3.6, // Convert to m/s
              windDirection: weatherApiData.current.wind_degree,
              waveHeight: weatherApiData.marine?.day?.[0]?.sig_ht_mt || 0,
              visibility: weatherApiData.current.vis_km,
              weather: weatherApiData.current.condition.text,
              timestamp: weatherApiData.current.last_updated
            },
            forecast: weatherApiData.forecast.forecastday.map((day: any) => ({
              date: day.date,
              temperature: {
                min: day.day.mintemp_c,
                max: day.day.maxtemp_c
              },
              windSpeed: day.day.maxwind_kph / 3.6, // Convert to m/s
              waveHeight: day.marine?.day?.[0]?.sig_ht_mt || 0,
              weather: day.day.condition.text
            }))
          };
        }
      } catch (error) {
        console.log('WeatherAPI error:', error);
      }
    }

    if (!weatherData) {
      throw new Error('Failed to fetch weather data from all sources');
    }

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weather-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getWeatherDescription(code: number | undefined): string {
  if (!code) return 'Unknown';
  
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return weatherCodes[code] || 'Unknown';
}