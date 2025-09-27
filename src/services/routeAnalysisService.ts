interface Vessel {
  latitude: number;
  longitude: number;
  course: number;
  speed: number;
  destination?: string;
  eta?: string;
  etaUtc?: string;
  name: string;
  unlocode_destination?: string;
  unlocode_lastport?: string;
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
export const parseDestinationCoordinates = async (destination: string): Promise<{ lat: number; lng: number } | null> => {
  // Use the Supabase port lookup service instead of hardcoded coordinates
  try {
    console.log('Attempting to import portService for destination:', destination);
    const { searchPorts } = await import('./portService');
    console.log('Successfully imported portService, searching for:', destination);

    const ports = await searchPorts(destination);
    console.log('Port search results:', ports);

    if (ports && ports.length > 0) {
      const port = ports[0]; // Take the first/best match
      console.log('Found port via Supabase:', port);
      return {
        lat: port.latitude,
        lng: port.longitude
      };
    }

    console.log('No port found in Supabase for:', destination);
    return null;
  } catch (error) {
    console.error('Error looking up port coordinates:', error);

    // Temporary fallback for critical ports while debugging Supabase issue
    const fallbackPorts: Record<string, { lat: number; lng: number }> = {
      'BEZEE': { lat: 51.3333, lng: 3.2167 },
      'Zeebrugge, Belgium': { lat: 51.3333, lng: 3.2167 },
      'USCLE': { lat: 41.4993, lng: -81.6944 },
      'Cleveland, United States (USA)': { lat: 41.4993, lng: -81.6944 }
    };

    if (fallbackPorts[destination]) {
      console.log('Using fallback coordinates for:', destination, fallbackPorts[destination]);
      return fallbackPorts[destination];
    }

    return null;
  }
};

// Fetch route from Python searoute service
export const fetchMaritimeRoute = async (vessel: Vessel): Promise<{route: RoutePoint[], type: 'maritime' | 'great-circle'}> => {
  const ROUTE_SERVICE_URL = 'http://localhost:5000';

  // Check if vessel is stationary or has no destination - use local forecast generation
  const isStationary = vessel.speed <= 1;
  const hasDestination = vessel.destination && vessel.destination.trim().length > 0;

  if (isStationary || !hasDestination) {
    console.log('Vessel is stationary or has no destination, generating local forecast waypoints');
    const route = await projectVesselRouteGreatCircle(vessel);
    return { route, type: 'stationary-forecast' as any };
  }

  try {
    // Prioritize UNLOCODE destination, then fall back to regular destination
    const destinationToUse = vessel.unlocode_destination || vessel.destination;

    // First, resolve the destination coordinates using our port service
    const destinationCoords = await parseDestinationCoordinates(destinationToUse);

    if (!destinationCoords) {
      console.warn('Could not resolve destination coordinates for:', destinationToUse);
      const route = await projectVesselRouteGreatCircle(vessel);
      return { route, type: 'great-circle' };
    }

    console.log('Route request:', {
      destination: destinationToUse,
      unlocode_destination: vessel.unlocode_destination,
      regular_destination: vessel.destination,
      using: vessel.unlocode_destination ? 'UNLOCODE' : 'regular destination',
      resolvedCoords: destinationCoords
    });

    const response = await fetch(`${ROUTE_SERVICE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_lat: vessel.latitude,
        start_lng: vessel.longitude,
        end_lat: destinationCoords.lat,
        end_lng: destinationCoords.lng,
        destination: destinationToUse,
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
    const route = await projectVesselRouteGreatCircle(vessel);
    return { route, type: 'great-circle' };
  }
};

// Enhanced ETA parsing function to handle various formats
const parseVesselETA = (etaString: string): Date | null => {
  if (!etaString) return null;

  console.log('Parsing ETA string:', etaString);

  // Handle format like "Oct 16, 22:00 (in 19 days)" or "ETA: Oct 16, 22:00 (in 19 days)"
  const inDaysMatch = etaString.match(/in (\d+) days?\)/i);
  if (inDaysMatch) {
    const daysFromNow = parseInt(inDaysMatch[1]);
    console.log(`ETA indicates ${daysFromNow} days from now`);

    // Extract the date and time part
    const dateTimeMatch = etaString.match(/([A-Z][a-z]{2}) (\d{1,2}),?\s*(\d{1,2}:\d{2})/i);
    if (dateTimeMatch) {
      const [, month, day, time] = dateTimeMatch;
      console.log('Extracted date components:', { month, day, time });

      // Calculate the target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysFromNow);

      // Parse the time
      const [hours, minutes] = time.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);

      console.log('Calculated ETA:', targetDate.toISOString());
      return targetDate;
    }
  }

  // Handle format like "2024-10-16T22:00:00Z" or ISO dates
  try {
    const date = new Date(etaString);
    if (!isNaN(date.getTime())) {
      console.log('Parsed as ISO date:', date.toISOString());
      return date;
    }
  } catch (error) {
    console.warn('Failed to parse as ISO date:', error);
  }

  // Handle format like "Oct 16, 2024 22:00" without "in X days"
  try {
    const cleanedString = etaString.replace(/ETA:\s*/i, '').replace(/\(.*?\)/g, '').trim();
    const date = new Date(cleanedString);
    if (!isNaN(date.getTime())) {
      console.log('Parsed as cleaned date string:', date.toISOString());
      return date;
    }
  } catch (error) {
    console.warn('Failed to parse as cleaned date string:', error);
  }

  console.warn('Could not parse ETA format:', etaString);
  return null;
};

// Fallback: Project vessel route using great circle calculation (original method)
export const projectVesselRouteGreatCircle = async (vessel: Vessel): Promise<RoutePoint[]> => {
  const route: RoutePoint[] = [];
  const currentTime = new Date();

  // Parse ETA if available to determine forecast duration
  let etaTime: Date | null = null;
  if (vessel.etaUtc || vessel.eta) {
    etaTime = parseVesselETA(vessel.etaUtc || vessel.eta || '');
    if (etaTime) {
      console.log('Successfully parsed vessel ETA:', etaTime.toISOString());
      console.log('Hours until ETA:', (etaTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
    } else {
      console.warn('Could not parse ETA:', vessel.etaUtc || vessel.eta);
    }
  }

  // For great circle fallback, still use weather API limits for safety
  // But searoute routes will show complete path to destination
  const maxApiForecastDays = 10; // WeatherAPI/StormGlass practical limit for fallback only
  const etaDays = etaTime ? Math.ceil((etaTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const forecastDays = Math.min(etaDays || maxApiForecastDays, maxApiForecastDays);
  const maxForecastHours = forecastDays * 24;

  console.log('API forecast planning:', {
    etaDays,
    forecastDays,
    maxForecastHours,
    apiLimitDays: maxApiForecastDays,
    note: 'Only real API data will be used'
  });

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
  // Prioritize UNLOCODE destination, then fall back to regular destination
  const destinationToUse = vessel.unlocode_destination || vessel.destination;

  console.log('Route analysis destination logic:', {
    vessel_unlocode_destination: vessel.unlocode_destination,
    vessel_regular_destination: vessel.destination,
    destinationToUse: destinationToUse,
    willUseUnlocode: !!vessel.unlocode_destination,
    vesselSpeed: vessel.speed,
    isStationary: vessel.speed <= 1
  });

  if (destinationToUse) {
    console.log('Attempting to parse destination:', destinationToUse, {
      unlocode_destination: vessel.unlocode_destination,
      regular_destination: vessel.destination,
      using: vessel.unlocode_destination ? 'UNLOCODE' : 'regular destination'
    });
    destinationCoords = await parseDestinationCoordinates(destinationToUse);
    console.log('Parsed destination coordinates:', destinationCoords);
  } else {
    console.log('No destination provided - neither UNLOCODE nor regular destination available');
  }

  if (isStationary) {
    console.log('Vessel appears stationary, creating extended forecast waypoints at current position');

    // For stationary vessels, create waypoints at the same location but different times
    // This allows weather forecasting at the vessel's current position over time
    const intervalHours = 6; // Standard 6-hour intervals for API data
    const maxHours = maxForecastHours; // Limited by API availability

    console.log(`Creating stationary forecast: ${intervalHours}h intervals up to ${maxHours}h (${maxHours/24} days)`);

    // Generate more forecast points for stationary vessels
    for (let hour = intervalHours; hour <= maxHours; hour += intervalHours) {
      const estimatedTime = new Date(currentTime.getTime() + hour * 60 * 60 * 1000);

      route.push({
        lat: vessel.latitude,
        lng: vessel.longitude,
        estimatedTime,
        distanceFromStart: 0
      });
    }

    console.log(`Generated ${route.length - 1} forecast waypoints for stationary vessel`);
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

    // Create waypoints along the route - use dynamic intervals and ETA if available
    const totalHours = etaTime
      ? (etaTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
      : totalDistance / vessel.speed;

    // Use standard intervals for API data reliability
    const hoursInterval = 6; // Standard 6-hour intervals for API data
    const maxHours = Math.min(totalHours, maxForecastHours);

    console.log(`Route planning: ${totalHours.toFixed(1)}h total, ${hoursInterval}h intervals, ${maxHours.toFixed(1)}h forecast (API data only)`);

    for (let hour = hoursInterval; hour <= maxHours; hour += hoursInterval) {
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
    console.log('No destination provided');

    // Check if vessel is effectively stationary (speed very low or zero)
    if (vessel.speed <= 2) {
      console.log('Low speed vessel - generating stationary forecast waypoints');

      // For low-speed vessels without destination, create forecast at current position
      const intervalHours = 6; // Standard 6-hour intervals for API data
      const maxHours = maxForecastHours; // Limited by API availability

      console.log(`Creating stationary forecast: ${intervalHours}h intervals up to ${maxHours}h (${maxHours/24} days)`);

      for (let hour = intervalHours; hour <= maxHours; hour += intervalHours) {
        const estimatedTime = new Date(currentTime.getTime() + hour * 60 * 60 * 1000);

        route.push({
          lat: vessel.latitude,
          lng: vessel.longitude,
          estimatedTime,
          distanceFromStart: 0
        });
      }

      console.log(`Generated ${route.length - 1} forecast waypoints for low-speed vessel without destination`);
    } else {
      console.log('Projecting course-based route for vessel at', vessel.course + '°');

      // No destination provided, project based on current course
      // Use standard intervals for API data reliability
      const intervalHours = 6; // Standard 6-hour intervals for API data
      const maxHours = maxForecastHours; // Limited by API availability

      console.log(`Course projection: ${intervalHours}h intervals for ${maxHours}h (${maxHours/24} days)`);

      for (let hour = intervalHours; hour <= maxHours; hour += intervalHours) {
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

// Weather-aware routing analysis
export const analyzeWeatherAwareRouting = async (vessel: Vessel, routeAnalysis: RouteAnalysis): Promise<any> => {
  try {
    const WeatherAwareRoutingService = await import('./weatherAwareRoutingService');
    return await WeatherAwareRoutingService.default.analyzeWeatherAwareRouting(vessel, routeAnalysis);
  } catch (error) {
    console.warn('Weather-aware routing service unavailable:', error);
    return null;
  }
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
    console.log(`Starting weather data merging for ${projectedRoute.length} waypoints...`);
    routeWithWeather = projectedRoute.map((point, index) => {
      const timeHours = (new Date(point.estimatedTime).getTime() - Date.now()) / (1000 * 60 * 60);
      console.log(`Processing waypoint ${index}: ${point.lat.toFixed(3)}, ${point.lng.toFixed(3)} at ${new Date(point.estimatedTime).toISOString()} (${timeHours.toFixed(1)}h from now)`);

      // Find the closest weather data point (by time and location)
      const closestWeather = routeWeatherForecast.routeWeather.find(w => {
        const timeDiff = Math.abs(new Date(w.time).getTime() - new Date(point.estimatedTime).getTime());
        const locationMatch = Math.abs(w.lat - point.lat) < 0.1 && Math.abs(w.lng - point.lng) < 0.1;
        const timeMatch = timeDiff < 6 * 60 * 60 * 1000; // Within 6 hours

        return locationMatch && timeMatch;
      });

      if (closestWeather) {
        console.log(`✅ Found weather data for waypoint ${index}:`, {
          source: closestWeather.source,
          time: new Date(closestWeather.time).toISOString(),
          hasData: !!closestWeather.current
        });
      } else {
        console.log(`❌ NO weather data found for waypoint ${index} at ${new Date(point.estimatedTime).toISOString()}`);
        console.log(`   Available weather data points: ${routeWeatherForecast.routeWeather.length}`);
        console.log(`   Looking for location match within 0.1° and time match within 6h`);

        // Show what weather data is available around this time
        const nearbyWeather = routeWeatherForecast.routeWeather.filter(w => {
          const timeDiff = Math.abs(new Date(w.time).getTime() - new Date(point.estimatedTime).getTime());
          return timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
        });
        console.log(`   Weather data within 24h: ${nearbyWeather.length} points`);
        nearbyWeather.forEach(w => {
          const timeDiff = Math.abs(new Date(w.time).getTime() - new Date(point.estimatedTime).getTime()) / (1000 * 60 * 60);
          console.log(`     - ${new Date(w.time).toISOString()} (${timeDiff.toFixed(1)}h diff, source: ${w.source})`);
        });
      }

      if (closestWeather) {

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
        // Keep the waypoint but without weather data - show complete route
        const timeHoursFromNow = (new Date(point.estimatedTime).getTime() - Date.now()) / (1000 * 60 * 60);
        if (timeHoursFromNow <= 240) { // Only log for waypoints within 10 days
          console.log(`No weather data for waypoint ${index} at ${timeHoursFromNow.toFixed(1)}h from now, keeping waypoint without weather`);
        }
        return {
          ...point,
          weather: undefined // No weather data available, but keep the waypoint
        };
      }
    }); // Keep ALL waypoints - show complete searoute path

    console.log(`Real weather data available for ${routeWithWeather.length} of ${projectedRoute.length} route points`);

  } catch (error) {
    console.warn('Route weather service unavailable, showing complete route without weather data:', error);

    // Show complete route without weather data when service is unavailable
    routeWithWeather = projectedRoute.map(point => ({
      ...point,
      weather: undefined // No weather data available, but show complete route
    }));

    console.log(`No weather API available - showing complete route with ${routeWithWeather.length} waypoints`);
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