import { getApiKeys } from './apiService';

interface RoutePoint {
  lat: number;
  lng: number;
  estimatedTime: Date;
  distanceFromStart: number;
}

interface WeatherAtPoint {
  lat: number;
  lng: number;
  time: Date;
  distanceFromStart: number;
  current?: any;
  forecast?: any;
  stormglass?: any;
  hourlyForecasts?: any[];
  source: string;
}

interface RouteWeatherForecast {
  routeWeather: WeatherAtPoint[];
  summary: {
    averageConditions: any;
    worstConditions: any;
    criticalPeriods: any[];
  };
  timeline: {
    windTrend: any[];
    waveTrend: any[];
    visibilityTrend: any[];
  };
}

// Fetch weather for a specific point and time
export const fetchWeatherAtPointAndTime = async (
  lat: number,
  lng: number,
  targetTime: Date
): Promise<WeatherAtPoint | null> => {
  const apiKeys = getApiKeys();
  const results: WeatherAtPoint = {
    lat,
    lng,
    time: targetTime,
    distanceFromStart: 0,
    source: 'none'
  };

  // Try WeatherAPI for this location and time
  if (apiKeys?.weatherapi) {
    try {
      // WeatherAPI provides forecasts up to 10 days
      const daysFromNow = Math.ceil((targetTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      console.log(`Fetching weather for ${lat.toFixed(3)}, ${lng.toFixed(3)} at ${targetTime.toISOString()}, ${daysFromNow} days from now`);

      if (daysFromNow <= 10) {
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKeys.weatherapi}&q=${lat},${lng}&days=${Math.max(1, daysFromNow + 1)}&aqi=yes&alerts=yes`
        );

        if (response.ok) {
          const data = await response.json();

          // Find the forecast for the target date
          const targetDate = targetTime.toISOString().split('T')[0];
          const forecastDay = data.forecast?.forecastday?.find((day: any) =>
            day.date === targetDate
          );

          console.log(`Target date: ${targetDate}, Found forecast day:`, forecastDay ? 'Yes' : 'No');

          if (forecastDay) {
            // Find the closest hour in the forecast
            const targetHour = targetTime.getHours();
            const targetMinute = targetTime.getMinutes();

            // Try to find exact hour match first
            let hourlyForecast = forecastDay.hour?.find((hour: any) =>
              new Date(hour.time).getHours() === targetHour
            );

            // If no exact match, find the closest hour
            if (!hourlyForecast && forecastDay.hour?.length > 0) {
              const targetTimeMs = targetTime.getTime();
              hourlyForecast = forecastDay.hour.reduce((closest: any, current: any) => {
                const currentDiff = Math.abs(new Date(current.time).getTime() - targetTimeMs);
                const closestDiff = Math.abs(new Date(closest.time).getTime() - targetTimeMs);
                return currentDiff < closestDiff ? current : closest;
              });
            }

            console.log(`Target time: ${targetTime.toISOString()}`);
            console.log(`Target hour: ${targetHour}:${targetMinute.toString().padStart(2, '0')}`);
            console.log(`Found hourly forecast:`, hourlyForecast ? 'Yes' : 'No');
            console.log(`Available hours in forecast:`, forecastDay.hour?.length || 0);

            if (hourlyForecast) {
              console.log('✅ Weather conditions for', new Date(hourlyForecast.time).toISOString(), ':', {
                wind: hourlyForecast.wind_kph + ' kph @ ' + hourlyForecast.wind_degree + '°',
                temp: hourlyForecast.temp_c + '°C',
                condition: hourlyForecast.condition?.text,
                waves: hourlyForecast.wave_height_m ? hourlyForecast.wave_height_m + 'm' : 'N/A',
                visibility: hourlyForecast.vis_km + 'km',
                humidity: hourlyForecast.humidity + '%',
                timeDiff: `Target: ${targetTime.toISOString()}`
              });

              // Store the specific hourly forecast as current
              results.forecast = forecastDay;
              results.current = hourlyForecast;
              results.hourlyForecasts = forecastDay.hour;
              results.source = 'weatherapi-hourly';
            } else {
              // Fallback to daily forecast if no hourly data
              console.log('No hourly forecast found, using daily forecast');
              results.forecast = forecastDay;
              results.current = {
                temp_c: forecastDay.day?.avgtemp_c || forecastDay.day?.maxtemp_c,
                wind_kph: forecastDay.day?.maxwind_kph,
                wind_degree: 180, // Default wind direction
                humidity: forecastDay.day?.avghumidity,
                vis_km: forecastDay.day?.avgvis_km,
                condition: forecastDay.day?.condition,
                precip_mm: forecastDay.day?.totalprecip_mm || 0,
                pressure_mb: 1013, // Default pressure
                uv: forecastDay.day?.uv || 0
              };
              results.source = 'weatherapi-daily';
            }
          } else {
            console.warn(`No forecast day found for target date: ${targetDate}`);
            console.log('Available forecast days:', data.forecast?.forecastday?.map((d: any) => d.date) || []);

            // Fallback: use closest available forecast day
            if (data.forecast?.forecastday?.length > 0) {
              const targetTimeMs = targetTime.getTime();
              const closestDay = data.forecast.forecastday.reduce((closest: any, current: any) => {
                const currentDiff = Math.abs(new Date(current.date + 'T12:00:00Z').getTime() - targetTimeMs);
                const closestDiff = Math.abs(new Date(closest.date + 'T12:00:00Z').getTime() - targetTimeMs);
                return currentDiff < closestDiff ? current : closest;
              });

              console.log(`Using closest available forecast day: ${closestDay.date}`);

              // Use the day's average data as fallback
              results.forecast = closestDay;
              results.current = {
                temp_c: closestDay.day?.avgtemp_c || closestDay.day?.maxtemp_c,
                wind_kph: closestDay.day?.maxwind_kph,
                wind_degree: 180, // Default wind direction
                humidity: closestDay.day?.avghumidity,
                vis_km: closestDay.day?.avgvis_km,
                condition: closestDay.day?.condition,
                precip_mm: closestDay.day?.totalprecip_mm || 0,
                pressure_mb: 1013, // Default pressure
                uv: closestDay.day?.uv || 0
              };
              results.source = 'weatherapi-fallback';
            }
          }
        } else {
          console.warn('WeatherAPI response not ok:', response.status);
        }
      } else {
        console.warn('Target time beyond WeatherAPI limit:', daysFromNow, 'days (max 10). No data available in API-only mode.');
      }
    } catch (error) {
      console.warn('WeatherAPI error for point:', error);
    }
  }

  // Try StormGlass for marine-specific data
  if (apiKeys?.stormglass) {
    try {
      const start = new Date(targetTime.getTime() - 3 * 60 * 60 * 1000); // 3 hours before
      const end = new Date(targetTime.getTime() + 3 * 60 * 60 * 1000);   // 3 hours after

      const params = [
        'windSpeed', 'windDirection', 'waveHeight', 'waveDirection', 'wavePeriod',
        'swellHeight', 'swellDirection', 'swellPeriod', 'waterTemperature',
        'currentSpeed', 'currentDirection', 'visibility', 'precipitation'
      ].join(',');

      const response = await fetch(
        `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}&start=${start.toISOString()}&end=${end.toISOString()}`,
        {
          headers: {
            'Authorization': apiKeys.stormglass
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Find the closest time point
        const closestPoint = data.hours?.reduce((closest: any, current: any) => {
          const currentDiff = Math.abs(new Date(current.time).getTime() - targetTime.getTime());
          const closestDiff = Math.abs(new Date(closest.time).getTime() - targetTime.getTime());
          return currentDiff < closestDiff ? current : closest;
        });

        if (closestPoint) {
          results.stormglass = closestPoint;
          if (!results.source || results.source === 'none') {
            results.source = 'stormglass';
          }
        }
      }
    } catch (error) {
      console.warn('StormGlass error for point:', error);
    }
  }

  return results.source !== 'none' ? results : null;
};

// Fetch weather along the entire route
export const fetchRouteWeatherForecast = async (
  routePoints: RoutePoint[]
): Promise<RouteWeatherForecast> => {
  const routeWeather: WeatherAtPoint[] = [];

  console.log(`Fetching weather for ${routePoints.length} route points...`);
  console.log('Route timeline:', routePoints.map(p => ({
    time: new Date(p.estimatedTime).toISOString(),
    location: `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`,
    distance: p.distanceFromStart.toFixed(1) + 'nm'
  })));

  // Fetch weather for each significant waypoint
  const weatherPromises = routePoints.map(async (point, index) => {
    // Skip some intermediate points to avoid too many API calls
    const shouldFetch = index === 0 || // Always fetch for start
                       index === routePoints.length - 1 || // Always fetch for end
                       index % 2 === 0; // Fetch every other intermediate point

    if (!shouldFetch) {
      return null;
    }

    const weather = await fetchWeatherAtPointAndTime(
      point.lat,
      point.lng,
      point.estimatedTime
    );

    if (weather) {
      weather.distanceFromStart = point.distanceFromStart;
      return weather;
    }

    return null;
  });

  const weatherResults = await Promise.all(weatherPromises);

  // Filter out null results
  routeWeather.push(...weatherResults.filter(w => w !== null) as WeatherAtPoint[]);

  // Analyze the route weather data
  const summary = analyzeRouteWeatherSummary(routeWeather);
  const timeline = generateWeatherTimeline(routeWeather);

  return {
    routeWeather,
    summary,
    timeline
  };
};

// Analyze weather conditions along the route
const analyzeRouteWeatherSummary = (routeWeather: WeatherAtPoint[]) => {
  const weatherPoints = routeWeather.filter(w => w.current || w.stormglass);

  if (weatherPoints.length === 0) {
    return {
      averageConditions: null,
      worstConditions: null,
      criticalPeriods: []
    };
  }

  // Calculate average conditions
  const avgWindSpeed = weatherPoints.reduce((sum, w) => {
    const wind = w.current?.wind_kph || w.stormglass?.windSpeed?.sg || 0;
    return sum + wind;
  }, 0) / weatherPoints.length;

  const avgWaveHeight = weatherPoints.reduce((sum, w) => {
    const wave = w.stormglass?.waveHeight?.sg || 0;
    return sum + wave;
  }, 0) / weatherPoints.length;

  const avgVisibility = weatherPoints.reduce((sum, w) => {
    const vis = w.current?.vis_km || w.stormglass?.visibility?.sg || 10;
    return sum + vis;
  }, 0) / weatherPoints.length;

  // Find worst conditions
  const worstWind = Math.max(...weatherPoints.map(w =>
    w.current?.wind_kph || w.stormglass?.windSpeed?.sg || 0
  ));

  const worstWaves = Math.max(...weatherPoints.map(w =>
    w.stormglass?.waveHeight?.sg || 0
  ));

  const worstVisibility = Math.min(...weatherPoints.map(w =>
    w.current?.vis_km || w.stormglass?.visibility?.sg || 10
  ));

  // Identify critical periods
  const criticalPeriods = weatherPoints.filter(w => {
    const windSpeed = w.current?.wind_kph || w.stormglass?.windSpeed?.sg || 0;
    const waveHeight = w.stormglass?.waveHeight?.sg || 0;
    const visibility = w.current?.vis_km || w.stormglass?.visibility?.sg || 10;

    return windSpeed > 25 || waveHeight > 3 || visibility < 2;
  }).map(w => ({
    time: w.time,
    location: { lat: w.lat, lng: w.lng },
    distanceFromStart: w.distanceFromStart,
    conditions: {
      wind: w.current?.wind_kph || w.stormglass?.windSpeed?.sg,
      waves: w.stormglass?.waveHeight?.sg,
      visibility: w.current?.vis_km || w.stormglass?.visibility?.sg
    },
    severity: calculateSeverity(w)
  }));

  return {
    averageConditions: {
      windSpeed: avgWindSpeed.toFixed(1),
      waveHeight: avgWaveHeight.toFixed(1),
      visibility: avgVisibility.toFixed(1)
    },
    worstConditions: {
      windSpeed: worstWind.toFixed(1),
      waveHeight: worstWaves.toFixed(1),
      visibility: worstVisibility.toFixed(1)
    },
    criticalPeriods
  };
};

// Calculate severity score for weather conditions
const calculateSeverity = (weather: WeatherAtPoint): number => {
  const windSpeed = weather.current?.wind_kph || weather.stormglass?.windSpeed?.sg || 0;
  const waveHeight = weather.stormglass?.waveHeight?.sg || 0;
  const visibility = weather.current?.vis_km || weather.stormglass?.visibility?.sg || 10;

  let severity = 0;

  // Wind severity (0-4 points)
  if (windSpeed > 50) severity += 4;
  else if (windSpeed > 35) severity += 3;
  else if (windSpeed > 25) severity += 2;
  else if (windSpeed > 15) severity += 1;

  // Wave severity (0-3 points)
  if (waveHeight > 6) severity += 3;
  else if (waveHeight > 4) severity += 2;
  else if (waveHeight > 2) severity += 1;

  // Visibility severity (0-3 points)
  if (visibility < 0.5) severity += 3;
  else if (visibility < 1) severity += 2;
  else if (visibility < 2) severity += 1;

  return severity;
};

// Generate weather timeline trends
const generateWeatherTimeline = (routeWeather: WeatherAtPoint[]) => {
  const sortedWeather = routeWeather.sort((a, b) => a.time.getTime() - b.time.getTime());

  const windTrend = sortedWeather.map(w => ({
    time: w.time,
    distance: w.distanceFromStart,
    windSpeed: w.current?.wind_kph || w.stormglass?.windSpeed?.sg || 0,
    windDirection: w.current?.wind_degree || w.stormglass?.windDirection?.sg || 0
  }));

  const waveTrend = sortedWeather.map(w => ({
    time: w.time,
    distance: w.distanceFromStart,
    waveHeight: w.stormglass?.waveHeight?.sg || 0,
    waveDirection: w.stormglass?.waveDirection?.sg || 0
  }));

  const visibilityTrend = sortedWeather.map(w => ({
    time: w.time,
    distance: w.distanceFromStart,
    visibility: w.current?.vis_km || w.stormglass?.visibility?.sg || 10
  }));

  return {
    windTrend,
    waveTrend,
    visibilityTrend
  };
};

// Generate route-specific weather recommendations
export const generateRouteWeatherRecommendations = (forecast: RouteWeatherForecast): string[] => {
  const recommendations: string[] = [];
  const { summary, timeline } = forecast;

  if (!summary.averageConditions) {
    recommendations.push('⚠️ Limited weather data available for route analysis');
    return recommendations;
  }

  // Wind analysis
  const avgWind = parseFloat(summary.averageConditions.windSpeed);
  const maxWind = parseFloat(summary.worstConditions.windSpeed);

  if (maxWind > 35) {
    recommendations.push('🌪️ STRONG WINDS: Expect winds over 35 knots during voyage');
  } else if (avgWind > 20) {
    recommendations.push('💨 Moderate to fresh winds expected throughout journey');
  } else {
    recommendations.push('✅ Generally favorable wind conditions along route');
  }

  // Wave analysis
  const avgWaves = parseFloat(summary.averageConditions.waveHeight);
  const maxWaves = parseFloat(summary.worstConditions.waveHeight);

  if (maxWaves > 4) {
    recommendations.push('🌊 ROUGH SEAS: Wave heights over 4m expected');
  } else if (avgWaves > 2) {
    recommendations.push('〰️ Moderate sea conditions with waves 2-4m');
  } else {
    recommendations.push('🌊 Calm to moderate seas expected');
  }

  // Visibility analysis
  const avgVis = parseFloat(summary.averageConditions.visibility);
  const minVis = parseFloat(summary.worstConditions.visibility);

  if (minVis < 1) {
    recommendations.push('🌫️ POOR VISIBILITY: Fog or precipitation reducing visibility below 1km');
  } else if (avgVis < 5) {
    recommendations.push('👁️ Reduced visibility conditions expected');
  }

  // Critical periods
  if (summary.criticalPeriods.length > 0) {
    const severeCount = summary.criticalPeriods.filter(p => p.severity >= 6).length;
    const moderateCount = summary.criticalPeriods.length - severeCount;

    if (severeCount > 0) {
      recommendations.push(`🚨 ${severeCount} severe weather period(s) identified along route`);
    }
    if (moderateCount > 0) {
      recommendations.push(`⚠️ ${moderateCount} periods of challenging conditions expected`);
    }

    // Time-specific warnings
    summary.criticalPeriods.forEach(period => {
      const timeStr = period.time.toLocaleDateString() + ' ' + period.time.toLocaleTimeString();
      const distanceStr = `${period.distanceFromStart.toFixed(0)}nm from start`;
      recommendations.push(`📍 ${timeStr} (${distanceStr}): Monitor conditions closely`);
    });
  }

  // Trend analysis
  if (timeline.windTrend.length > 2) {
    const windStart = timeline.windTrend[0].windSpeed;
    const windEnd = timeline.windTrend[timeline.windTrend.length - 1].windSpeed;
    const windChange = windEnd - windStart;

    if (windChange > 10) {
      recommendations.push('📈 Wind conditions deteriorating along route');
    } else if (windChange < -10) {
      recommendations.push('📉 Wind conditions improving along route');
    }
  }

  return recommendations;
};