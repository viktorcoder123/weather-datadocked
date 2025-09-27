interface Vessel {
  latitude: number;
  longitude: number;
  course: number;
  speed: number;
  destination?: string;
  etaUtc?: string;
  name: string;
}

interface WeatherPoint {
  lat: number;
  lng: number;
  timestamp: string;
  windSpeed: number;
  windDirection: number;
  waveHeight?: number;
  visibility?: number;
  precipitation?: number;
  temperature?: number;
}

interface RoutePoint {
  lat: number;
  lng: number;
  estimatedTime: Date;
  distanceFromStart: number;
  weather?: WeatherPoint;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'severe';
  type: 'wind' | 'waves' | 'visibility' | 'weather' | 'navigation';
  description: string;
  recommendation: string;
  location: { lat: number; lng: number };
  timeframe: string;
  severity: number; // 1-10
}

interface RouteAnalysis {
  vessel: Vessel;
  projectedRoute: RoutePoint[];
  risks: RiskAssessment[];
  overallRisk: 'low' | 'medium' | 'high' | 'severe';
  recommendations: string[];
  alternativeActions: string[];
  routeDuration: number; // hours
  totalDistance: number; // nautical miles
  routeType: 'maritime' | 'great-circle';
}

// Calculate great circle distance between two points (nautical miles)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate bearing between two points
export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Project a point along a bearing for a given distance
export const projectPoint = (lat: number, lon: number, bearing: number, distance: number): { lat: number; lng: number } => {
  const R = 3440.065; // Earth's radius in nautical miles
  const bearingRad = bearing * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;

  const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(distance / R) +
    Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad));

  const newLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
    Math.cos(distance / R) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return {
    lat: newLatRad * 180 / Math.PI,
    lng: newLonRad * 180 / Math.PI
  };
};

// Parse destination coordinates from destination string
export const parseDestinationCoordinates = (destination: string): { lat: number; lng: number } | null => {
  // Common port coordinates - in production, this would be a comprehensive database
  const portCoordinates: Record<string, { lat: number; lng: number }> = {
    'Portsmouth, United Kingdom (UK)': { lat: 50.8198, lng: -1.0880 },
    'Portsmouth': { lat: 50.8198, lng: -1.0880 },
    'Southampton': { lat: 50.9097, lng: -1.4044 },
    'London': { lat: 51.5074, lng: -0.1278 },
    'Hamburg': { lat: 53.5511, lng: 9.9937 },
    'Rotterdam': { lat: 51.9244, lng: 4.4777 },
    'Antwerp': { lat: 51.2194, lng: 4.4025 },
    'Le Havre': { lat: 49.4944, lng: 0.1079 },
    'Bilbao': { lat: 43.2627, lng: -2.9253 },
    'Barcelona': { lat: 41.3851, lng: 2.1734 },
    'Marseille': { lat: 43.2965, lng: 5.3698 },
    'Genoa': { lat: 44.4056, lng: 8.9463 },
    'Naples': { lat: 40.8518, lng: 14.2681 },
    'Piraeus': { lat: 37.9472, lng: 23.6348 },
    'Istanbul': { lat: 41.0082, lng: 28.9784 }
  };

  // Try to find exact match first
  const exactMatch = portCoordinates[destination];
  if (exactMatch) return exactMatch;

  // Try to find partial match
  for (const [port, coords] of Object.entries(portCoordinates)) {
    if (destination.toLowerCase().includes(port.toLowerCase()) ||
        port.toLowerCase().includes(destination.toLowerCase())) {
      return coords;
    }
  }

  return null;
};

// Fetch route from Python searoute service
export const fetchMaritimeRoute = async (vessel: Vessel): Promise<{route: RoutePoint[], type: 'maritime' | 'great-circle'}> => {
  const ROUTE_SERVICE_URL = 'http://localhost:5000';

  try {
    const response = await fetch(`${ROUTE_SERVICE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_lat: vessel.latitude,
        start_lng: vessel.longitude,
        destination: vessel.destination,
        speed: vessel.speed
      })
    });

    if (!response.ok) {
      throw new Error(`Route service error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.route?.waypoints) {
      const route = data.route.waypoints.map((wp: any) => ({
        lat: wp.lat,
        lng: wp.lng,
        estimatedTime: new Date(wp.estimated_time),
        distanceFromStart: wp.distance_from_start
      }));
      return { route, type: 'maritime' };
    } else {
      throw new Error('No route data received from service');
    }

  } catch (error) {
    console.warn('Searoute service unavailable, falling back to great circle route:', error);
    const route = projectVesselRouteGreatCircle(vessel);
    return { route, type: 'great-circle' };
  }
};

// Fallback: Project vessel route using great circle calculation (original method)
export const projectVesselRouteGreatCircle = (vessel: Vessel): RoutePoint[] => {
  const route: RoutePoint[] = [];
  const currentTime = new Date();

  // Starting point
  route.push({
    lat: vessel.latitude,
    lng: vessel.longitude,
    estimatedTime: currentTime,
    distanceFromStart: 0
  });

  // Check if vessel is stationary (speed = 0 or very low speed)
  const isStationary = vessel.speed <= 1;

  // If we have a destination, calculate route to destination
  let destinationCoords = null;
  if (vessel.destination) {
    destinationCoords = parseDestinationCoordinates(vessel.destination);
  }

  if (isStationary) {
    console.log('Vessel appears stationary, creating time-based waypoints at current position');

    // For stationary vessels, create waypoints at the same location but different times
    // This allows weather forecasting at the vessel's current position over time
    for (let hour = 6; hour <= 72; hour += 6) {
      const estimatedTime = new Date(currentTime.getTime() + hour * 60 * 60 * 1000);

      route.push({
        lat: vessel.latitude,
        lng: vessel.longitude,
        estimatedTime,
        distanceFromStart: 0
      });
    }
  } else if (destinationCoords) {
    console.log('Vessel has destination, calculating route to:', vessel.destination);

    // Calculate direct route to destination
    const totalDistance = calculateDistance(
      vessel.latitude, vessel.longitude,
      destinationCoords.lat, destinationCoords.lng
    );

    const actualBearing = calculateBearing(
      vessel.latitude, vessel.longitude,
      destinationCoords.lat, destinationCoords.lng
    );

    // Use actual bearing to destination instead of current course if they differ significantly
    const bearingDifference = Math.abs(actualBearing - vessel.course);
    const shouldAdjustCourse = bearingDifference > 30 && bearingDifference < 330;
    const routeBearing = shouldAdjustCourse ? actualBearing : vessel.course;

    console.log('Route calculation:', {
      totalDistance: totalDistance.toFixed(1) + ' nm',
      actualBearing: actualBearing.toFixed(1) + '°',
      vesselCourse: vessel.course + '°',
      routeBearing: routeBearing.toFixed(1) + '°',
      shouldAdjustCourse
    });

    // Create waypoints every 6 hours along the route
    const hoursInterval = 6;
    const totalHours = totalDistance / vessel.speed;

    for (let hour = hoursInterval; hour <= totalHours; hour += hoursInterval) {
      const distanceCovered = vessel.speed * hour;
      const progress = Math.min(distanceCovered / totalDistance, 1);

      let waypoint;
      if (progress >= 1) {
        // Destination reached
        waypoint = destinationCoords;
      } else {
        // Interpolate position along great circle route
        waypoint = projectPoint(vessel.latitude, vessel.longitude, routeBearing, distanceCovered);
      }

      const estimatedTime = new Date(currentTime.getTime() + hour * 60 * 60 * 1000);

      route.push({
        lat: waypoint.lat,
        lng: waypoint.lng,
        estimatedTime,
        distanceFromStart: distanceCovered
      });

      if (progress >= 1) break;
    }
  } else {
    console.log('No destination, projecting based on current course:', vessel.course + '°');

    // No destination provided, project based on current course
    // Create waypoints every 6 hours for next 72 hours
    for (let hour = 6; hour <= 72; hour += 6) {
      const distanceCovered = vessel.speed * hour;
      const waypoint = projectPoint(vessel.latitude, vessel.longitude, vessel.course, distanceCovered);
      const estimatedTime = new Date(currentTime.getTime() + hour * 60 * 60 * 1000);

      route.push({
        lat: waypoint.lat,
        lng: waypoint.lng,
        estimatedTime,
        distanceFromStart: distanceCovered
      });
    }
  }

  console.log('Generated route with', route.length, 'waypoints');
  return route;
};

// Analyze weather risks along the route
export const analyzeWeatherRisks = (route: RoutePoint[], weatherData: any): RiskAssessment[] => {
  const risks: RiskAssessment[] = [];

  route.forEach((point, index) => {
    if (!point.weather) return;

    const weather = point.weather;
    const timeframe = point.estimatedTime.toLocaleDateString() + ' ' + point.estimatedTime.toLocaleTimeString();

    // Wind risk analysis
    if (weather.windSpeed > 25) { // Strong winds (>25 knots)
      const severity = Math.min(10, Math.floor(weather.windSpeed / 5));
      const level = weather.windSpeed > 50 ? 'severe' :
                    weather.windSpeed > 35 ? 'high' : 'medium';

      risks.push({
        level,
        type: 'wind',
        description: `Strong winds expected: ${weather.windSpeed.toFixed(1)} knots from ${weather.windDirection}°`,
        recommendation: weather.windSpeed > 50 ?
          'Consider shelter or route alteration. Extreme weather conditions.' :
          'Monitor conditions closely. Reduce speed if necessary.',
        location: { lat: point.lat, lng: point.lng },
        timeframe,
        severity
      });
    }

    // Head wind analysis (opposing vessel course)
    if (route[0] && index > 0) {
      const vesselCourse = calculateBearing(route[0].lat, route[0].lng, point.lat, point.lng);
      const windDirection = weather.windDirection;
      const windAngle = Math.abs(((windDirection - vesselCourse + 180) % 360) - 180);

      if (windAngle < 45 && weather.windSpeed > 15) {
        // Head winds
        const severity = Math.min(10, Math.floor(weather.windSpeed / 3 + windAngle / 10));
        risks.push({
          level: windAngle < 30 && weather.windSpeed > 25 ? 'high' : 'medium',
          type: 'wind',
          description: `Head winds: ${weather.windSpeed.toFixed(1)} knots opposing course by ${windAngle.toFixed(0)}°`,
          recommendation: 'Expect reduced speed and increased fuel consumption. Consider course adjustment.',
          location: { lat: point.lat, lng: point.lng },
          timeframe,
          severity
        });
      }
    }

    // Wave height risk
    if (weather.waveHeight && weather.waveHeight > 3) {
      const severity = Math.min(10, Math.floor(weather.waveHeight * 2));
      const level = weather.waveHeight > 6 ? 'severe' :
                    weather.waveHeight > 4 ? 'high' : 'medium';

      risks.push({
        level,
        type: 'waves',
        description: `High waves expected: ${weather.waveHeight.toFixed(1)}m`,
        recommendation: weather.waveHeight > 6 ?
          'Extreme sea conditions. Consider route alteration or delay.' :
          'Rough seas expected. Secure cargo and reduce speed.',
        location: { lat: point.lat, lng: point.lng },
        timeframe,
        severity
      });
    }

    // Visibility risk
    if (weather.visibility && weather.visibility < 2) {
      const severity = Math.min(10, 10 - weather.visibility * 4);
      const level = weather.visibility < 0.5 ? 'severe' :
                    weather.visibility < 1 ? 'high' : 'medium';

      risks.push({
        level,
        type: 'visibility',
        description: `Poor visibility: ${weather.visibility.toFixed(1)}km`,
        recommendation: weather.visibility < 0.5 ?
          'Extremely poor visibility. Consider anchoring until conditions improve.' :
          'Reduced visibility. Use radar and reduce speed.',
        location: { lat: point.lat, lng: point.lng },
        timeframe,
        severity
      });
    }

    // Precipitation risk
    if (weather.precipitation && weather.precipitation > 5) {
      const severity = Math.min(8, Math.floor(weather.precipitation / 2));
      risks.push({
        level: weather.precipitation > 15 ? 'high' : 'medium',
        type: 'weather',
        description: `Heavy precipitation: ${weather.precipitation.toFixed(1)}mm/h`,
        recommendation: 'Reduced visibility and deck conditions. Monitor weather closely.',
        location: { lat: point.lat, lng: point.lng },
        timeframe,
        severity
      });
    }
  });

  return risks;
};

// Generate route recommendations
export const generateRecommendations = (analysis: RouteAnalysis): string[] => {
  const recommendations: string[] = [];
  const highRisks = analysis.risks.filter(r => r.level === 'high' || r.level === 'severe');
  const windRisks = analysis.risks.filter(r => r.type === 'wind');
  const waveRisks = analysis.risks.filter(r => r.type === 'waves');

  if (highRisks.length === 0) {
    recommendations.push('✅ Current route shows acceptable weather conditions');
  }

  if (highRisks.length > 0) {
    recommendations.push(`⚠️ ${highRisks.length} high-risk weather event(s) identified along route`);
  }

  if (windRisks.length > 2) {
    recommendations.push('🌪️ Multiple wind events expected - consider speed adjustments');
  }

  if (waveRisks.length > 0) {
    recommendations.push('🌊 Rough seas forecast - secure all deck equipment');
  }

  const headWindEvents = analysis.risks.filter(r =>
    r.type === 'wind' && r.description.includes('Head winds')
  );

  if (headWindEvents.length > 0) {
    recommendations.push('⛵ Head winds will impact arrival time - inform port of possible delays');
  }

  const severeRisks = analysis.risks.filter(r => r.level === 'severe');
  if (severeRisks.length > 0) {
    recommendations.push('🚨 SEVERE weather conditions identified - consider route alteration or delay');
  }

  return recommendations;
};

// Main route analysis function
export const analyzeVesselRoute = async (vessel: Vessel, weatherData: any): Promise<RouteAnalysis> => {
  console.log('Analyzing route for vessel:', {
    name: vessel.name,
    position: [vessel.latitude, vessel.longitude],
    course: vessel.course,
    speed: vessel.speed,
    destination: vessel.destination
  });

  const { route: projectedRoute, type: routeType } = await fetchMaritimeRoute(vessel);

  console.log('Generated route:', {
    type: routeType,
    waypoints: projectedRoute.length,
    firstPoint: projectedRoute[0],
    lastPoint: projectedRoute[projectedRoute.length - 1]
  });

  // Fetch actual weather data along the route
  let routeWithWeather = projectedRoute;

  try {
    // Import the route weather service
    const { fetchRouteWeatherForecast } = await import('./routeWeatherService');

    console.log('Fetching weather along route...');
    const routeWeatherForecast = await fetchRouteWeatherForecast(projectedRoute);

    // Merge route points with weather data
    routeWithWeather = projectedRoute.map((point, index) => {
      console.log(`Processing waypoint ${index}: ${point.lat.toFixed(3)}, ${point.lng.toFixed(3)} at ${new Date(point.estimatedTime).toISOString()}`);

      // Find the closest weather data point (by time and location)
      const closestWeather = routeWeatherForecast.routeWeather.find(w => {
        const timeDiff = Math.abs(new Date(w.time).getTime() - new Date(point.estimatedTime).getTime());
        const locationMatch = Math.abs(w.lat - point.lat) < 0.1 && Math.abs(w.lng - point.lng) < 0.1;
        const timeMatch = timeDiff < 6 * 60 * 60 * 1000; // Within 6 hours

        return locationMatch && timeMatch;
      });

      if (closestWeather) {
        console.log(`Found weather data for waypoint ${index}:`, {
          source: closestWeather.source,
          time: new Date(closestWeather.time).toISOString(),
          hasData: !!closestWeather.current
        });

        // Extract weather data from the API response
        const current = closestWeather.current || {};
        const stormglass = closestWeather.stormglass || {};

        // Log the actual weather values being used
        const weatherData = {
          windSpeed: current.wind_kph || stormglass.windSpeed?.sg || 15,
          windDirection: current.wind_degree || stormglass.windDirection?.sg || 180,
          waveHeight: stormglass.waveHeight?.sg || current.wave_height_m || 1.5,
          visibility: current.vis_km || stormglass.visibility?.sg || 10,
          precipitation: current.precip_mm || 0,
          temperature: current.temp_c || 15,
          pressure: current.pressure_mb || 1013,
          humidity: current.humidity || 70
        };

        console.log(`Weather values for waypoint ${index}:`, weatherData);

        return {
          ...point,
          weather: {
            lat: point.lat,
            lng: point.lng,
            timestamp: point.estimatedTime.toISOString(),
            ...weatherData,
            source: closestWeather.source
          }
        };
      } else {
        console.warn(`No weather data found for waypoint ${index}, using time-varying fallback`);

        // Fallback to time-varying mock data if no weather available
        const hoursFromNow = (new Date(point.estimatedTime).getTime() - Date.now()) / (1000 * 60 * 60);
        const dayFactor = Math.sin(hoursFromNow / 12) * 0.3; // Simulate daily variation
        const positionFactor = Math.sin((point.lat + point.lng) / 50) * 0.2; // Location-based variation
        const randomFactor = (Math.random() - 0.5) * 0.4;

        return {
          ...point,
          weather: {
            lat: point.lat,
            lng: point.lng,
            timestamp: point.estimatedTime.toISOString(),
            windSpeed: Math.max(5, 15 + dayFactor * 10 + positionFactor * 8 + randomFactor * 15),
            windDirection: 180 + dayFactor * 60 + positionFactor * 45 + randomFactor * 90,
            waveHeight: Math.max(0.5, 1.5 + dayFactor * 1.5 + positionFactor * 1 + randomFactor * 2),
            visibility: Math.max(2, 8 + dayFactor * 3 + positionFactor * 2 + randomFactor * 5),
            precipitation: Math.max(0, dayFactor + positionFactor + randomFactor * 3),
            temperature: 15 + dayFactor * 5 + positionFactor * 3 + randomFactor * 8,
            pressure: 1013 + dayFactor * 8 + positionFactor * 5 + randomFactor * 10,
            humidity: Math.max(30, Math.min(90, 65 + dayFactor * 10 + positionFactor * 5 + randomFactor * 20)),
            source: 'mock-time-varying'
          }
        };
      }
    });

    console.log(`Weather data fetched for ${routeWeatherForecast.routeWeather.length} route points`);

  } catch (error) {
    console.warn('Route weather service unavailable, using mock data:', error);

    // Fallback to mock weather data
    routeWithWeather = projectedRoute.map(point => {
      return {
        ...point,
        weather: {
          lat: point.lat,
          lng: point.lng,
          timestamp: point.estimatedTime.toISOString(),
          windSpeed: 15 + Math.random() * 20,
          windDirection: 180 + Math.random() * 90,
          waveHeight: 1 + Math.random() * 3,
          visibility: 5 + Math.random() * 10,
          precipitation: Math.random() * 3,
          temperature: 15 + Math.random() * 10,
          pressure: 1010 + Math.random() * 15,
          humidity: 60 + Math.random() * 25,
          source: 'fallback'
        }
      };
    });
  }

  const risks = analyzeWeatherRisks(routeWithWeather, weatherData);

  // Calculate overall risk level
  const maxSeverity = Math.max(...risks.map(r => r.severity), 0);
  const overallRisk = maxSeverity >= 8 ? 'severe' :
                     maxSeverity >= 6 ? 'high' :
                     maxSeverity >= 3 ? 'medium' : 'low';

  const totalDistance = projectedRoute.length > 0 ?
    projectedRoute[projectedRoute.length - 1].distanceFromStart : 0;

  const routeDuration = totalDistance / vessel.speed;

  const analysis: RouteAnalysis = {
    vessel,
    projectedRoute: routeWithWeather,
    risks,
    overallRisk,
    recommendations: [],
    alternativeActions: [],
    routeDuration,
    totalDistance,
    routeType
  };

  analysis.recommendations = generateRecommendations(analysis);

  // Generate alternative actions
  if (overallRisk === 'severe' || overallRisk === 'high') {
    analysis.alternativeActions = [
      'Consider delaying departure by 12-24 hours',
      'Alter course to avoid high-risk areas',
      'Reduce speed to improve safety margins',
      'Seek shelter at nearest suitable port',
      'Monitor weather updates every 3 hours'
    ];
  } else if (overallRisk === 'medium') {
    analysis.alternativeActions = [
      'Monitor weather conditions closely',
      'Prepare for possible course adjustments',
      'Ensure all safety equipment is ready',
      'Maintain communication with weather routing services'
    ];
  }

  return analysis;
};