import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Route, Clock, Gauge, Shield, MapPin, Navigation2, ChevronRight, CheckCircle } from "lucide-react";
import { analyzeWeatherAwareRouting } from "@/services/routeAnalysisService";

interface WeatherAwareRoutingProps {
  vessel: any;
  routeAnalysis: any;
  onRouteSelected?: (route: any) => void;
}

export const WeatherAwareRouting = ({ vessel, routeAnalysis, onRouteSelected }: WeatherAwareRoutingProps) => {
  const [weatherRouting, setWeatherRouting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('primary');

  useEffect(() => {
    if (vessel && routeAnalysis) {
      analyzeWeatherAwareRoutes();
    }
  }, [vessel, routeAnalysis]);

  const analyzeWeatherAwareRoutes = async () => {
    setLoading(true);
    try {
      const analysis = await analyzeWeatherAwareRouting(vessel, routeAnalysis);
      setWeatherRouting(analysis);
      if (analysis?.recommendedRoute) {
        setSelectedRoute(analysis.recommendedRoute.id);
      }
    } catch (error) {
      console.error('Weather-aware routing analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelection = (route: any) => {
    setSelectedRoute(route.id);
    onRouteSelected?.(route);
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'direct': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'weather_avoidance': return <Route className="w-5 h-5 text-yellow-500" />;
      case 'delay_recommended': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'emergency_diversion': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Navigation2 className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'primary': return <CheckCircle className="w-4 h-4" />;
      case 'northern': return <Navigation2 className="w-4 h-4" />;
      case 'southern': return <Navigation2 className="w-4 h-4" />;
      case 'delayed': return <Clock className="w-4 h-4" />;
      case 'coastal': return <MapPin className="w-4 h-4" />;
      default: return <Route className="w-4 h-4" />;
    }
  };

  const getSafetyBadgeColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800";
    if (score >= 6) return "bg-yellow-100 text-yellow-800";
    if (score >= 4) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Weather-Aware Routing
          </CardTitle>
          <CardDescription>Analyzing alternative routes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherRouting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Weather-Aware Routing
          </CardTitle>
          <CardDescription>Weather-aware routing analysis not available</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={analyzeWeatherAwareRoutes} variant="outline" className="w-full">
            <Route className="w-4 h-4 mr-2" />
            Analyze Alternative Routes
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { primaryRoute, alternatives, recommendedRoute, weatherObstacles, overallAssessment, routingStrategy } = weatherRouting;
  const allRoutes = [primaryRoute, ...alternatives].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStrategyIcon(routingStrategy)}
            Weather-Aware Routing Analysis
          </CardTitle>
          <CardDescription>{overallAssessment}</CardDescription>
        </CardHeader>
        <CardContent>
          {weatherObstacles.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Weather Obstacles Detected ({weatherObstacles.length})
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {weatherObstacles.slice(0, 3).map((obstacle, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{obstacle.type}</span>: {obstacle.description}
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      Risk: {obstacle.severity}/10
                    </Badge>
                  </div>
                ))}
                {weatherObstacles.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{weatherObstacles.length - 3} more obstacles...
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Alternatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Route Alternatives ({allRoutes.length})
          </CardTitle>
          <CardDescription>
            Compare routes based on safety, efficiency, and weather conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allRoutes.map((route, index) => (
              <div
                key={route.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRoute === route.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${recommendedRoute?.id === route.id ? 'ring-2 ring-green-200' : ''}`}
                onClick={() => handleRouteSelection(route)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getRouteTypeIcon(route.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {route.type === 'primary' ? 'Direct Route' : `${route.type} Alternative`}
                        </span>
                        {recommendedRoute?.id === route.id && (
                          <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{route.recommendation}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    selectedRoute === route.id ? 'rotate-90' : ''
                  }`} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium">Safety</div>
                      <Badge className={getSafetyBadgeColor(route.safetyScore)}>
                        {route.safetyScore}/10
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium">Efficiency</div>
                      <div className="text-sm text-gray-600">{route.fuelEfficiency}/10</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm text-gray-600">
                        {formatDuration(route.duration)}
                        {route.additionalTime > 0 && (
                          <span className="text-orange-600"> (+{formatDuration(route.additionalTime)})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Distance</div>
                      <div className="text-sm text-gray-600">
                        {Math.round(route.distance)} nm
                        {route.additionalDistance > 0 && (
                          <span className="text-orange-600"> (+{Math.round(route.additionalDistance)})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {route.weatherRisks.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg">
                    <div className="text-sm font-medium text-red-800 mb-1">
                      Weather Risks ({route.weatherRisks.length})
                    </div>
                    <div className="text-sm text-red-600">
                      {route.weatherRisks.map(risk => risk.description).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedRoute && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => {
                  const route = allRoutes.find(r => r.id === selectedRoute);
                  if (route) handleRouteSelection(route);
                }}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Use {allRoutes.find(r => r.id === selectedRoute)?.type === 'primary' ? 'Direct' : 'Alternative'} Route
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherAwareRouting;