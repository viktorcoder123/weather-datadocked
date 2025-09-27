interface WeatherObstacle {
  location: { lat: number; lng: number };
  severity: number; // 1-10
  type: 'wind' | 'waves' | 'storm' | 'visibility';
  description: string;
  timeframe: string;
  recommendedAction: 'avoid' | 'delay' | 'reduce_speed' | 'monitor';
}

interface RouteAlternative {
  id: string;
  type: 'primary' | 'northern' | 'southern' | 'delayed' | 'coastal';
  waypoints: Array<{ lat: number; lng: number; estimatedTime: Date }>;
  distance: number; // nautical miles
  duration: number; // hours
  safetyScore: number; // 1-10 (10 = safest)
  fuelEfficiency: number; // 1-10 (10 = most efficient)
  weatherRisks: WeatherObstacle[];
  recommendation: string;
  additionalTime: number; // hours compared to primary route
  additionalDistance: number; // nm compared to primary route
}

interface WeatherAwareRouteAnalysis {
  primaryRoute: RouteAlternative;
  alternatives: RouteAlternative[];
  recommendedRoute: RouteAlternative;
  weatherObstacles: WeatherObstacle[];
  overallAssessment: string;
  routingStrategy: 'direct' | 'weather_avoidance' | 'delay_recommended' | 'emergency_diversion';
}

export class WeatherAwareRoutingService {

  /**
   * Analyze weather obstacles along a route
   */
  static analyzeWeatherObstacles(routePoints: any[], weatherData: any[]): WeatherObstacle[] {
    const obstacles: WeatherObstacle[] = [];

    routePoints.forEach((point, index) => {
      if (!point.weather) return;

      const weather = point.weather;
      const timeframe = new Date(point.estimatedTime).toLocaleString();

      // Severe wind obstacles
      if (weather.windSpeed > 35) {
        obstacles.push({
          location: { lat: point.lat, lng: point.lng },
          severity: Math.min(10, Math.floor(weather.windSpeed / 5)),
          type: 'wind',
          description: `Severe winds: ${weather.windSpeed.toFixed(1)} knots`,
          timeframe,
          recommendedAction: weather.windSpeed > 50 ? 'avoid' : 'reduce_speed'
        });
      }

      // High wave obstacles
      if (weather.waveHeight && weather.waveHeight > 4) {
        obstacles.push({
          location: { lat: point.lat, lng: point.lng },
          severity: Math.min(10, Math.floor(weather.waveHeight * 2)),
          type: 'waves',
          description: `High waves: ${weather.waveHeight.toFixed(1)}m`,
          timeframe,
          recommendedAction: weather.waveHeight > 6 ? 'avoid' : 'reduce_speed'
        });
      }

      // Storm conditions (combined wind + waves + precipitation)
      if (weather.windSpeed > 25 && weather.waveHeight > 3 && weather.precipitation > 10) {
        obstacles.push({
          location: { lat: point.lat, lng: point.lng },
          severity: 9,
          type: 'storm',
          description: `Storm conditions: ${weather.windSpeed.toFixed(1)}kn winds, ${weather.waveHeight?.toFixed(1)}m waves, heavy rain`,
          timeframe,
          recommendedAction: 'avoid'
        });
      }

      // Poor visibility
      if (weather.visibility && weather.visibility < 1) {
        obstacles.push({
          location: { lat: point.lat, lng: point.lng },
          severity: Math.min(10, 10 - weather.visibility * 8),
          type: 'visibility',
          description: `Poor visibility: ${weather.visibility.toFixed(1)}km`,
          timeframe,
          recommendedAction: weather.visibility < 0.5 ? 'avoid' : 'reduce_speed'
        });
      }
    });

    // Sort by severity (highest first)
    return obstacles.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Generate alternative routes based on weather obstacles
   */
  static async generateAlternativeRoutes(
    vessel: any,
    primaryRoute: any,
    weatherObstacles: WeatherObstacle[]
  ): Promise<RouteAlternative[]> {
    const alternatives: RouteAlternative[] = [];

    // Create primary route alternative
    const primarySafetyScore = this.calculateSafetyScore(primaryRoute.waypoints, weatherObstacles);
    const primaryAlternative: RouteAlternative = {
      id: 'primary',
      type: 'primary',
      waypoints: primaryRoute.waypoints,
      distance: primaryRoute.totalDistance || 0,
      duration: primaryRoute.estimatedDuration || 0,
      safetyScore: primarySafetyScore,
      fuelEfficiency: 10, // Primary route is most fuel efficient
      weatherRisks: weatherObstacles.filter(obs => obs.severity >= 6),
      recommendation: primarySafetyScore >= 7 ? 'Recommended primary route' : 'Consider alternatives due to weather',
      additionalTime: 0,
      additionalDistance: 0
    };
    alternatives.push(primaryAlternative);

    // Generate weather avoidance routes if there are significant obstacles
    const severeObstacles = weatherObstacles.filter(obs => obs.severity >= 7);

    if (severeObstacles.length > 0) {
      // Northern alternative route
      const northernRoute = await this.generateNorthernAlternative(vessel, primaryRoute, severeObstacles);
      if (northernRoute) alternatives.push(northernRoute);

      // Southern alternative route
      const southernRoute = await this.generateSouthernAlternative(vessel, primaryRoute, severeObstacles);
      if (southernRoute) alternatives.push(southernRoute);

      // Delayed departure alternative
      const delayedRoute = this.generateDelayedAlternative(vessel, primaryRoute, severeObstacles);
      if (delayedRoute) alternatives.push(delayedRoute);
    }

    return alternatives;
  }

  /**
   * Generate northern alternative route
   */
  static async generateNorthernAlternative(
    vessel: any,
    primaryRoute: any,
    obstacles: WeatherObstacle[]
  ): Promise<RouteAlternative | null> {
    try {
      // Calculate northern waypoints by adding latitude offset
      const northernWaypoints = primaryRoute.waypoints.map((wp: any, index: number) => {
        // Add 1-3 degrees latitude north, more offset near obstacles
        const nearObstacle = obstacles.some(obs =>
          Math.abs(obs.location.lat - wp.lat) < 1 && Math.abs(obs.location.lng - wp.lng) < 1
        );
        const latOffset = nearObstacle ? 2.5 : 1.0;

        return {
          ...wp,
          lat: wp.lat + latOffset,
          estimatedTime: new Date(wp.estimatedTime.getTime() + (index * 30 * 60 * 1000)) // Add 30 min per waypoint
        };
      });

      const additionalDistance = primaryRoute.totalDistance * 0.15; // ~15% longer
      const additionalTime = primaryRoute.estimatedDuration * 0.2; // ~20% longer

      return {
        id: 'northern',
        type: 'northern',
        waypoints: northernWaypoints,
        distance: primaryRoute.totalDistance + additionalDistance,
        duration: primaryRoute.estimatedDuration + additionalTime,
        safetyScore: 8, // Higher safety due to weather avoidance
        fuelEfficiency: 7, // Lower efficiency due to longer route
        weatherRisks: [], // Assumed fewer risks in northern route
        recommendation: 'Northern route avoiding severe weather areas',
        additionalTime: additionalTime,
        additionalDistance: additionalDistance
      };
    } catch (error) {
      console.warn('Could not generate northern alternative:', error);
      return null;
    }
  }

  /**
   * Generate southern alternative route
   */
  static async generateSouthernAlternative(
    vessel: any,
    primaryRoute: any,
    obstacles: WeatherObstacle[]
  ): Promise<RouteAlternative | null> {
    try {
      // Calculate southern waypoints by subtracting latitude offset
      const southernWaypoints = primaryRoute.waypoints.map((wp: any, index: number) => {
        const nearObstacle = obstacles.some(obs =>
          Math.abs(obs.location.lat - wp.lat) < 1 && Math.abs(obs.location.lng - wp.lng) < 1
        );
        const latOffset = nearObstacle ? 2.5 : 1.0;

        return {
          ...wp,
          lat: wp.lat - latOffset,
          estimatedTime: new Date(wp.estimatedTime.getTime() + (index * 25 * 60 * 1000)) // Add 25 min per waypoint
        };
      });

      const additionalDistance = primaryRoute.totalDistance * 0.12; // ~12% longer
      const additionalTime = primaryRoute.estimatedDuration * 0.18; // ~18% longer

      return {
        id: 'southern',
        type: 'southern',
        waypoints: southernWaypoints,
        distance: primaryRoute.totalDistance + additionalDistance,
        duration: primaryRoute.estimatedDuration + additionalTime,
        safetyScore: 8, // Higher safety due to weather avoidance
        fuelEfficiency: 7.5, // Slightly better than northern route
        weatherRisks: [], // Assumed fewer risks in southern route
        recommendation: 'Southern route avoiding severe weather areas',
        additionalTime: additionalTime,
        additionalDistance: additionalDistance
      };
    } catch (error) {
      console.warn('Could not generate southern alternative:', error);
      return null;
    }
  }

  /**
   * Generate delayed departure alternative
   */
  static generateDelayedAlternative(
    vessel: any,
    primaryRoute: any,
    obstacles: WeatherObstacle[]
  ): RouteAlternative | null {
    // Find the earliest severe weather obstacle
    const earliestObstacle = obstacles
      .filter(obs => obs.severity >= 8)
      .sort((a, b) => new Date(a.timeframe).getTime() - new Date(b.timeframe).getTime())[0];

    if (!earliestObstacle) return null;

    // Delay departure by 24-48 hours to avoid the worst weather
    const delayHours = obstacles.some(obs => obs.severity >= 9) ? 48 : 24;
    const delayedWaypoints = primaryRoute.waypoints.map((wp: any) => ({
      ...wp,
      estimatedTime: new Date(wp.estimatedTime.getTime() + (delayHours * 60 * 60 * 1000))
    }));

    return {
      id: 'delayed',
      type: 'delayed',
      waypoints: delayedWaypoints,
      distance: primaryRoute.totalDistance,
      duration: primaryRoute.estimatedDuration,
      safetyScore: 9, // High safety due to weather avoidance
      fuelEfficiency: 10, // Same route, just delayed
      weatherRisks: [], // Assumed weather has passed
      recommendation: `Delay departure by ${delayHours} hours to avoid severe weather`,
      additionalTime: delayHours,
      additionalDistance: 0
    };
  }

  /**
   * Calculate safety score for a route based on weather obstacles
   */
  static calculateSafetyScore(waypoints: any[], obstacles: WeatherObstacle[]): number {
    if (obstacles.length === 0) return 10;

    let totalRisk = 0;
    let riskPoints = 0;

    waypoints.forEach(wp => {
      obstacles.forEach(obs => {
        // Check if obstacle is near this waypoint (within ~50km)
        const distance = Math.abs(wp.lat - obs.location.lat) + Math.abs(wp.lng - obs.location.lng);
        if (distance < 0.5) { // Roughly 50km
          totalRisk += obs.severity;
          riskPoints++;
        }
      });
    });

    if (riskPoints === 0) return 10;

    const averageRisk = totalRisk / riskPoints;
    return Math.max(1, 10 - averageRisk);
  }

  /**
   * Analyze routes and recommend the best option
   */
  static analyzeAndRecommend(alternatives: RouteAlternative[]): WeatherAwareRouteAnalysis {
    if (alternatives.length === 0) {
      throw new Error('No route alternatives provided');
    }

    const primaryRoute = alternatives.find(alt => alt.type === 'primary') || alternatives[0];
    const otherAlternatives = alternatives.filter(alt => alt.type !== 'primary');

    // Score each route based on safety, efficiency, and time
    const scoredAlternatives = alternatives.map(alt => ({
      ...alt,
      overallScore: (alt.safetyScore * 0.5) + (alt.fuelEfficiency * 0.3) + ((10 - alt.additionalTime/24) * 0.2)
    }));

    // Find the best overall route
    const recommendedRoute = scoredAlternatives.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    );

    // Collect all weather obstacles
    const allObstacles = alternatives.reduce((obs, alt) => [...obs, ...alt.weatherRisks], [] as WeatherObstacle[]);
    const uniqueObstacles = allObstacles.filter((obs, index, arr) =>
      arr.findIndex(o => o.location.lat === obs.location.lat && o.location.lng === obs.location.lng) === index
    );

    // Determine routing strategy
    let routingStrategy: 'direct' | 'weather_avoidance' | 'delay_recommended' | 'emergency_diversion';
    const maxSeverity = Math.max(...uniqueObstacles.map(obs => obs.severity), 0);

    if (maxSeverity >= 9) {
      routingStrategy = 'emergency_diversion';
    } else if (maxSeverity >= 7) {
      routingStrategy = 'weather_avoidance';
    } else if (maxSeverity >= 5 && recommendedRoute.type === 'delayed') {
      routingStrategy = 'delay_recommended';
    } else {
      routingStrategy = 'direct';
    }

    // Generate overall assessment
    let overallAssessment: string;
    if (routingStrategy === 'direct') {
      overallAssessment = '✅ Primary route recommended - acceptable weather conditions';
    } else if (routingStrategy === 'weather_avoidance') {
      overallAssessment = '⚠️ Alternative route recommended - avoiding severe weather areas';
    } else if (routingStrategy === 'delay_recommended') {
      overallAssessment = '🕐 Delayed departure recommended - severe weather expected';
    } else {
      overallAssessment = '🚨 Emergency planning required - extreme weather conditions';
    }

    return {
      primaryRoute,
      alternatives: otherAlternatives,
      recommendedRoute,
      weatherObstacles: uniqueObstacles,
      overallAssessment,
      routingStrategy
    };
  }

  /**
   * Main function to analyze vessel route and generate weather-aware alternatives
   */
  static async analyzeWeatherAwareRouting(
    vessel: any,
    routeAnalysis: any
  ): Promise<WeatherAwareRouteAnalysis> {
    // Extract route data
    const routePoints = routeAnalysis.projectedRoute;

    // Analyze weather obstacles
    const weatherObstacles = this.analyzeWeatherObstacles(routePoints, []);

    console.log(`Found ${weatherObstacles.length} weather obstacles along route`);
    weatherObstacles.forEach(obs => {
      console.log(`- ${obs.type}: ${obs.description} (severity: ${obs.severity}/10)`);
    });

    // Generate alternative routes
    const alternatives = await this.generateAlternativeRoutes(vessel, {
      waypoints: routePoints,
      totalDistance: routeAnalysis.totalDistance,
      estimatedDuration: routeAnalysis.routeDuration
    }, weatherObstacles);

    // Analyze and recommend
    const analysis = this.analyzeAndRecommend(alternatives);

    console.log(`Weather-aware routing analysis complete:`);
    console.log(`- ${alternatives.length} route alternatives generated`);
    console.log(`- Recommended route: ${analysis.recommendedRoute.type}`);
    console.log(`- Strategy: ${analysis.routingStrategy}`);

    return analysis;
  }
}

export default WeatherAwareRoutingService;