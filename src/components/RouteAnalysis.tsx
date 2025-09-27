import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Route,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Wind,
  Waves,
  Eye,
  CloudRain,
  Navigation,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { analyzeVesselRoute, RouteAnalysis } from "@/services/routeAnalysisService";

interface RouteAnalysisProps {
  vessel: any;
  weatherData: any;
  onAnalysisComplete?: (analysis: any) => void;
}

export const RouteAnalysisComponent = ({ vessel, weatherData, onAnalysisComplete }: RouteAnalysisProps) => {
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (vessel && weatherData) {
      performRouteAnalysis();
    }
  }, [vessel, weatherData]);

  const performRouteAnalysis = async () => {
    if (!vessel) return;

    setIsAnalyzing(true);
    try {
      const routeAnalysis = await analyzeVesselRoute(vessel, weatherData);
      setAnalysis(routeAnalysis);

      // Pass analysis data to parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(routeAnalysis);
      }
    } catch (error) {
      console.error('Route analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'severe':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-500';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-500';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-500';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'wind':
        return <Wind className="h-4 w-4" />;
      case 'waves':
        return <Waves className="h-4 w-4" />;
      case 'visibility':
        return <Eye className="h-4 w-4" />;
      case 'weather':
        return <CloudRain className="h-4 w-4" />;
      case 'navigation':
        return <Navigation className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-maritime-medium/20">
        <CardContent className="p-8 text-center">
          <Route className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Analyzing route and weather conditions...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="border-maritime-medium/20">
        <CardContent className="p-8 text-center">
          <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No route analysis available</p>
          <Button onClick={performRouteAnalysis} className="mt-4">
            Analyze Route
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { projectedRoute, risks, overallRisk, recommendations, alternativeActions } = analysis;

  return (
    <Card className="border-maritime-medium/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-maritime-medium" />
          Route Analysis & Risk Assessment
        </CardTitle>
        <CardDescription>
          Weather conditions and risks along projected vessel route
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="route">Route</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Overall Risk</span>
                </div>
                <Badge className={getRiskColor(overallRisk)}>
                  {overallRisk.toUpperCase()}
                </Badge>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-lg font-semibold">{analysis.routeDuration.toFixed(1)}h</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-lg font-semibold">{analysis.totalDistance.toFixed(0)} nm</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Risk Events</span>
                </div>
                <p className="text-lg font-semibold">{risks.length}</p>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Route Summary
                <Badge variant="outline" className="ml-2">
                  {analysis.routeType === 'maritime' ? '🚢 Maritime Route' : '📐 Great Circle'}
                </Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vessel:</span> {vessel.name}
                </div>
                <div>
                  <span className="font-medium">Current Position:</span> {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}
                </div>
                <div>
                  <span className="font-medium">Course:</span> {vessel.course}°
                </div>
                <div>
                  <span className="font-medium">Speed:</span> {vessel.speed} knots
                </div>
                {vessel.destination && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Destination:</span> {vessel.destination}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Key Recommendations</h4>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-maritime-medium">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            {risks.length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold text-green-700 dark:text-green-400">No Significant Risks Identified</h3>
                <p className="text-muted-foreground">Current weather conditions along the route are within acceptable parameters.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {risks
                  .sort((a, b) => b.severity - a.severity)
                  .map((risk, index) => (
                    <Card key={index} className={`p-4 border-l-4 ${getRiskColor(risk.level)}`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getRiskIcon(risk.type)}
                            <Badge className={getRiskColor(risk.level)}>
                              {risk.level.toUpperCase()}
                            </Badge>
                            <span className="font-medium capitalize">{risk.type} Risk</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Severity: {risk.severity}/10
                          </span>
                        </div>

                        <div>
                          <p className="font-medium text-sm">{risk.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">{risk.recommendation}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {risk.location.lat.toFixed(3)}, {risk.location.lng.toFixed(3)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {risk.timeframe}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="route" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Projected Route Waypoints</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {projectedRoute.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index === 0 ? 'START' : `WP${index}`}</Badge>
                      <div className="text-sm">
                        <div className="font-medium">
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </div>
                        <div className="text-muted-foreground">
                          {point.estimatedTime.toLocaleDateString()} {point.estimatedTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{point.distanceFromStart.toFixed(0)} nm</div>
                      {point.weather && (
                        <div className="text-muted-foreground">
                          {point.weather.windSpeed.toFixed(0)} kts, {point.weather.waveHeight?.toFixed(1)}m
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {alternativeActions.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Alternative Actions
                </h4>
                <div className="space-y-2">
                  {alternativeActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <span className="text-orange-600">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Weather Monitoring</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="font-medium">Monitor frequency:</span> Every 3-6 hours during transit
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="font-medium">Key parameters:</span> Wind speed/direction, wave height, visibility
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span className="font-medium">Communication:</span> Maintain contact with weather routing services
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Safety Preparations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 border rounded">
                  <span className="font-medium">Deck Equipment:</span> Secure all loose items
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium">Safety Gear:</span> Check all equipment is operational
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium">Communications:</span> Test emergency communication systems
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium">Fuel Planning:</span> Account for weather-related consumption
                </div>
              </div>
            </Card>

            <Button onClick={performRouteAnalysis} className="w-full">
              <Route className="h-4 w-4 mr-2" />
              Re-analyze Route
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};