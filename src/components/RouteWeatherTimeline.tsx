import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wind,
  Waves,
  Eye,
  Thermometer,
  Gauge,
  Clock,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Navigation
} from "lucide-react";

interface RouteWeatherTimelineProps {
  routeWeather: any[];
  vesselName: string;
}

export const RouteWeatherTimeline = ({ routeWeather, vesselName }: RouteWeatherTimelineProps) => {
  if (!routeWeather || routeWeather.length === 0) {
    return (
      <Card className="border-maritime-medium/20">
        <CardContent className="p-8 text-center">
          <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No route weather data available</p>
        </CardContent>
      </Card>
    );
  }

  // Check if vessel is stationary (all waypoints at same location)
  const firstPoint = routeWeather[0];
  const isStationary = routeWeather.every(point =>
    Math.abs(point.lat - firstPoint.lat) < 0.001 &&
    Math.abs(point.lng - firstPoint.lng) < 0.001
  );

  const getWindIcon = (speed: number) => {
    if (speed > 35) return "🌪️";
    if (speed > 25) return "💨";
    if (speed > 15) return "🌬️";
    return "🍃";
  };

  const getWaveIcon = (height: number) => {
    if (height > 4) return "🌊";
    if (height > 2) return "〰️";
    return "～";
  };

  const getVisibilityIcon = (vis: number) => {
    if (vis < 1) return "🌫️";
    if (vis < 5) return "🌁";
    return "👁️";
  };

  const getWeatherSeverity = (weather: any) => {
    const wind = weather.windSpeed || 0;
    const wave = weather.waveHeight || 0;
    const vis = weather.visibility || 10;

    let score = 0;
    if (wind > 35) score += 3;
    else if (wind > 25) score += 2;
    else if (wind > 15) score += 1;

    if (wave > 4) score += 3;
    else if (wave > 2) score += 1;

    if (vis < 1) score += 2;
    else if (vis < 5) score += 1;

    if (score >= 6) return 'severe';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const sortedWeather = [...routeWeather].sort((a, b) =>
    new Date(a.estimatedTime).getTime() - new Date(b.estimatedTime).getTime()
  );

  const weatherSummary = {
    maxWind: Math.max(...sortedWeather.map(w => w.weather?.windSpeed || 0)),
    maxWave: Math.max(...sortedWeather.map(w => w.weather?.waveHeight || 0)),
    minVis: Math.min(...sortedWeather.map(w => w.weather?.visibility || 10)),
    avgWind: sortedWeather.reduce((sum, w) => sum + (w.weather?.windSpeed || 0), 0) / sortedWeather.length
  };

  return (
    <Card className="border-maritime-medium/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-maritime-medium" />
          {isStationary ? 'Port Weather Forecast' : 'Route Weather Timeline'} - {vesselName}
        </CardTitle>
        <CardDescription>
          {isStationary
            ? 'Weather forecast at vessel\'s current port location over time'
            : 'Weather conditions along the vessel\'s projected route over time'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedWeather.map((point, index) => {
                const weather = point.weather;
                if (!weather) return null;

                const severity = getWeatherSeverity(weather);
                const timeStr = new Date(point.estimatedTime).toLocaleDateString() + ' ' +
                               new Date(point.estimatedTime).toLocaleTimeString();

                return (
                  <Card key={index} className={`p-4 border-l-4 ${getSeverityColor(severity).includes('red') ? 'border-red-500' :
                    getSeverityColor(severity).includes('orange') ? 'border-orange-500' :
                    getSeverityColor(severity).includes('yellow') ? 'border-yellow-500' : 'border-green-500'}`}>

                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(severity)}>
                            {severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">
                            {isStationary
                              ? `Port Forecast ${index === 0 ? '(Now)' : `(+${Math.floor((new Date(point.estimatedTime).getTime() - new Date(sortedWeather[0].estimatedTime).getTime()) / (1000 * 60 * 60))}h)`}`
                              : index === 0 ? 'Departure' :
                                index === sortedWeather.length - 1 ? 'Arrival' :
                                `Waypoint ${index}`
                            }
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {weather.source || 'api'}
                        </Badge>
                      </div>

                      {/* Time and Location */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{timeStr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{point.lat.toFixed(3)}, {point.lng.toFixed(3)}</span>
                        </div>
                      </div>

                      {/* Weather Conditions */}
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-accent/30 rounded">
                          <div className="flex items-center gap-1 font-medium mb-1">
                            <Wind className="h-3 w-3" />
                            Wind {getWindIcon(weather.windSpeed)}
                          </div>
                          <div>{weather.windSpeed?.toFixed(1)} kts</div>
                          <div className="text-xs text-muted-foreground">
                            {weather.windDirection?.toFixed(0)}°
                          </div>
                        </div>

                        <div className="p-2 bg-accent/30 rounded">
                          <div className="flex items-center gap-1 font-medium mb-1">
                            <Waves className="h-3 w-3" />
                            Waves {getWaveIcon(weather.waveHeight)}
                          </div>
                          <div>{weather.waveHeight?.toFixed(1)} m</div>
                        </div>

                        <div className="p-2 bg-accent/30 rounded">
                          <div className="flex items-center gap-1 font-medium mb-1">
                            <Eye className="h-3 w-3" />
                            Visibility {getVisibilityIcon(weather.visibility)}
                          </div>
                          <div>{weather.visibility?.toFixed(1)} km</div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          {weather.temperature?.toFixed(1)}°C
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {weather.pressure?.toFixed(0)} mb
                        </div>
                        <div className="text-muted-foreground">
                          {point.distanceFromStart?.toFixed(0)} nm
                        </div>
                      </div>

                      {/* Warnings */}
                      {severity !== 'low' && (
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-1 text-orange-800 dark:text-orange-300 text-sm">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-medium">
                              {severity === 'severe' ? 'DANGEROUS CONDITIONS' :
                               severity === 'high' ? 'Challenging conditions' :
                               'Monitor conditions'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Max Wind</span>
                </div>
                <p className="text-lg font-semibold">{weatherSummary.maxWind.toFixed(1)} kts</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Waves className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Max Waves</span>
                </div>
                <p className="text-lg font-semibold">{weatherSummary.maxWave.toFixed(1)} m</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Min Visibility</span>
                </div>
                <p className="text-lg font-semibold">{weatherSummary.minVis.toFixed(1)} km</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Avg Wind</span>
                </div>
                <p className="text-lg font-semibold">{weatherSummary.avgWind.toFixed(1)} kts</p>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">
                {isStationary ? 'Port Weather Assessment' : 'Route Weather Assessment'}
              </h4>

              {isStationary && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                    <span>ℹ️ Vessel appears to be at port. Showing weather forecast for current location over time.</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {weatherSummary.maxWind > 35 && (
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Strong winds over 35 knots expected {isStationary ? 'at port' : 'during voyage'}</span>
                  </div>
                )}
                {weatherSummary.maxWave > 4 && (
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Waves className="h-4 w-4" />
                    <span>Rough seas with waves over 4m anticipated</span>
                  </div>
                )}
                {weatherSummary.minVis < 2 && (
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <Eye className="h-4 w-4" />
                    <span>Periods of reduced visibility below 2km</span>
                  </div>
                )}
                {weatherSummary.maxWind <= 25 && weatherSummary.maxWave <= 3 && weatherSummary.minVis >= 5 && (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <span>✅ Generally favorable conditions {isStationary ? 'at port' : 'throughout the route'}</span>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Wind Trend
                </h4>
                <div className="space-y-2">
                  {sortedWeather.slice(0, 5).map((point, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{new Date(point.estimatedTime).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <span>{point.weather?.windSpeed?.toFixed(1)} kts</span>
                        <span className="text-muted-foreground">{point.weather?.windDirection?.toFixed(0)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Waves className="h-4 w-4" />
                  Wave Trend
                </h4>
                <div className="space-y-2">
                  {sortedWeather.slice(0, 5).map((point, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{new Date(point.estimatedTime).toLocaleDateString()}</span>
                      <span>{point.weather?.waveHeight?.toFixed(1)} m</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};