import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ship, MapPin, Clock, Search, Anchor, Cloud, Navigation, Calendar, Radio, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchDataDockedVessels, fetchAllWeatherData, getApiKeys } from "@/services/apiService";
import { VesselWeatherDisplay } from "./VesselWeatherDisplay";
import { RouteAnalysisComponent } from "./RouteAnalysis";
import { RouteWeatherTimeline } from "./RouteWeatherTimeline";
import { RouteMap } from "./RouteMap";
import { WeatherAwareRouting } from "./WeatherAwareRouting";

interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  type: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: string;
  lastUpdate: string;
  destination?: string;
  lastPort?: string;
  eta?: string;
  etaUtc?: string;
  atd?: string;
  atdUtc?: string;
  callsign?: string;
  draught?: string;
  navigationalStatus?: string;
  positionReceived?: string;
  updateTime?: string;
  unlocode_destination?: string;
  unlocode_lastport?: string;
}

interface WeatherData {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  stormglass?: any;
  weatherapi?: any;
  windy?: any;
  errors?: string[];
}

interface RouteAnalysisData {
  projectedRoute: any[];
  risks: any[];
  overallRisk: string;
  recommendations: string[];
}

export const VesselWeatherIntegration = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisData | null>(null);
  const [selectedAlternativeRoute, setSelectedAlternativeRoute] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const { toast } = useToast();

  const searchVessels = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const apiKeys = getApiKeys();
      if (!apiKeys) {
        toast({
          title: "Configuration Required",
          description: "Please configure your API keys in the API Setup section first.",
          variant: "destructive",
        });
        return;
      }

      const data = await fetchDataDockedVessels(searchQuery);

      // Handle different response formats
      let vesselResults: Vessel[] = [];

      if (data.vessels && data.vessels.length > 0) {
        vesselResults = data.vessels.map((v: any) => ({
          id: v.id || v.mmsi || v.imo,
          name: v.name || "Unknown Vessel",
          imo: v.imo || "N/A",
          mmsi: v.mmsi || "N/A",
          type: v.type || "Unknown",
          latitude: v.latitude,
          longitude: v.longitude,
          speed: v.speed || 0,
          course: v.course || 0,
          status: v.status || v.navigationalStatus || "Unknown",
          lastUpdate: v.lastUpdate || v.updateTime || new Date().toISOString(),
          destination: v.destination,
          lastPort: v.lastPort,
          eta: v.eta,
          etaUtc: v.etaUtc,
          atd: v.atd,
          atdUtc: v.atdUtc,
          callsign: v.callsign,
          draught: v.draught,
          navigationalStatus: v.navigationalStatus,
          positionReceived: v.positionReceived,
          updateTime: v.updateTime,
          unlocode_destination: v.unlocode_destination,
          unlocode_lastport: v.unlocode_lastport
        }));
      }

      setVessels(vesselResults);

      if (vesselResults.length === 0) {
        // Check if we got a helpful message from the API
        if (data.message) {
          toast({
            title: "Search Guidance",
            description: data.message,
            variant: "default",
          });
        } else {
          toast({
            title: "No Results",
            description: "No vessels found. Please try entering an IMO or MMSI number.",
          });
        }
      } else {
        toast({
          title: "Vessel Found",
          description: `Found vessel: ${vesselResults[0].name}`,
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search vessels. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const fetchWeatherForVessel = async (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setIsFetchingWeather(true);

    try {
      const apiKeys = getApiKeys();
      if (!apiKeys) {
        toast({
          title: "Configuration Required",
          description: "Please configure your API keys in the API Setup section first.",
          variant: "destructive",
        });
        return;
      }

      const weatherResults = await fetchAllWeatherData(vessel.latitude, vessel.longitude);

      const weatherData: WeatherData = {
        location: {
          lat: vessel.latitude,
          lng: vessel.longitude,
          name: vessel.destination || "Open Sea"
        },
        ...weatherResults
      };

      setWeatherData(weatherData);

      if (weatherResults.errors.length > 0) {
        toast({
          title: "Weather Data Loaded",
          description: `Fetched available weather data. Some APIs had errors: ${weatherResults.errors.join(', ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Weather Data Loaded",
          description: `Successfully fetched weather data from all sources for ${vessel.name}`,
        });
      }
    } catch (error: any) {
      console.error('Weather fetch error:', error);
      toast({
        title: "Weather Error",
        description: error.message || "Failed to fetch weather data.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "underway":
      case "under way":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "anchored":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "moored":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };


  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-maritime-deep">Vessel & Weather Integration</h2>
        <p className="text-muted-foreground">
          Search for vessels and get real-time weather conditions at their location
        </p>
      </div>

      {/* Vessel Search */}
      <Card className="border-maritime-medium/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-maritime-medium" />
            Vessel Search
          </CardTitle>
          <CardDescription>
            Search by vessel name, IMO, or MMSI number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter vessel IMO or MMSI number (e.g., 9856189)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchVessels()}
              className="flex-1"
            />
            <Button onClick={searchVessels} disabled={isSearching} className="gap-2">
              <Search className="h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {vessels.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vessels.map((vessel) => (
                <Card key={vessel.id} className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => fetchWeatherForVessel(vessel)}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-maritime-deep text-lg">{vessel.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(vessel.navigationalStatus || vessel.status)}>
                          {vessel.navigationalStatus || vessel.status}
                        </Badge>
                        {selectedVessel?.id === vessel.id && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                    </div>

                    {/* Primary Vessel Information */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="p-2 bg-accent/30 rounded">
                        <div className="font-medium text-maritime-deep">IMO</div>
                        <div className="text-muted-foreground">{vessel.imo}</div>
                      </div>
                      <div className="p-2 bg-accent/30 rounded">
                        <div className="font-medium text-maritime-deep">MMSI</div>
                        <div className="text-muted-foreground">{vessel.mmsi}</div>
                      </div>
                      <div className="p-2 bg-accent/30 rounded">
                        <div className="font-medium text-maritime-deep flex items-center gap-1">
                          <Radio className="h-3 w-3" />
                          Callsign
                        </div>
                        <div className="text-muted-foreground">{vessel.callsign || "N/A"}</div>
                      </div>
                    </div>

                    {/* Position & Navigation */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="p-2 bg-accent/30 rounded">
                        <div className="font-medium text-maritime-deep flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Position
                        </div>
                        <div className="text-muted-foreground">
                          {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div className="p-2 bg-accent/30 rounded">
                        <div className="font-medium text-maritime-deep flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          Course
                        </div>
                        <div className="text-muted-foreground">
                          {vessel.course}°
                        </div>
                      </div>
                      <div className="p-2 bg-accent/30 rounded">
                        <div className="font-medium text-maritime-deep flex items-center gap-1">
                          <Anchor className="h-3 w-3" />
                          Speed
                        </div>
                        <div className="text-muted-foreground">
                          {vessel.speed} kts
                        </div>
                      </div>
                    </div>

                    {/* Vessel Details */}
                    {vessel.draught && (
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="p-2 bg-accent/30 rounded">
                          <div className="font-medium text-maritime-deep flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            Draught
                          </div>
                          <div className="text-muted-foreground">{vessel.draught}</div>
                        </div>
                      </div>
                    )}

                    {/* Ports & Schedule */}
                    {(vessel.destination || vessel.lastPort) && (
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {vessel.destination && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <div className="font-medium text-blue-900 dark:text-blue-300">Destination</div>
                            <div className="text-blue-700 dark:text-blue-400">{vessel.destination}</div>
                            {vessel.unlocode_destination && (
                              <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                UNLOCODE: {vessel.unlocode_destination}
                              </div>
                            )}
                          </div>
                        )}
                        {vessel.lastPort && (
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            <div className="font-medium text-green-900 dark:text-green-300">Last Port</div>
                            <div className="text-green-700 dark:text-green-400">{vessel.lastPort}</div>
                            {vessel.unlocode_lastport && (
                              <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                                UNLOCODE: {vessel.unlocode_lastport}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ETA & ATD */}
                    {(vessel.etaUtc || vessel.eta || vessel.atdUtc || vessel.atd) && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {(vessel.etaUtc || vessel.eta) && (
                          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                            <div className="font-medium text-orange-900 dark:text-orange-300 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              ETA
                            </div>
                            <div className="text-orange-700 dark:text-orange-400 text-xs">
                              {vessel.etaUtc || vessel.eta}
                            </div>
                          </div>
                        )}
                        {(vessel.atdUtc || vessel.atd) && (
                          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                            <div className="font-medium text-purple-900 dark:text-purple-300 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              ATD
                            </div>
                            <div className="text-purple-700 dark:text-purple-400 text-xs">
                              {vessel.atdUtc || vessel.atd}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Position Update Info */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-2">
                      {vessel.positionReceived && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Position: {vessel.positionReceived}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated: {new Date(vessel.updateTime || vessel.lastUpdate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather Data Display */}
      {selectedVessel && (
        <Card className="border-maritime-medium/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-maritime-medium" />
              Weather at {selectedVessel.name}
            </CardTitle>
            <CardDescription>
              Current weather and marine conditions at vessel location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VesselWeatherDisplay weatherData={weatherData} isFetchingWeather={isFetchingWeather} />
          </CardContent>
        </Card>
      )}

      {/* Route Analysis */}
      {selectedVessel && weatherData && (
        <RouteAnalysisComponent
          vessel={selectedVessel}
          weatherData={weatherData}
          onAnalysisComplete={(analysis: RouteAnalysisData) => setRouteAnalysis(analysis)}
        />
      )}

      {/* Weather-Aware Routing */}
      {selectedVessel && routeAnalysis && (
        <WeatherAwareRouting
          vessel={selectedVessel}
          routeAnalysis={routeAnalysis}
          onRouteSelected={(route) => {
            console.log('Selected weather-aware route:', route);
            setSelectedAlternativeRoute(route);
            toast({
              title: "Alternative Route Selected",
              description: `${route.type === 'primary' ? 'Direct' : route.type} route selected. Map updated.`,
            });
          }}
        />
      )}

      {/* Route Weather Timeline */}
      {selectedVessel && routeAnalysis && routeAnalysis.projectedRoute && (
        <RouteWeatherTimeline
          routeWeather={routeAnalysis.projectedRoute}
          vesselName={selectedVessel.name}
        />
      )}

      {/* Interactive Map */}
      {selectedVessel && routeAnalysis && routeAnalysis.projectedRoute && (
        <RouteMap
          vessel={selectedVessel}
          routeWeather={routeAnalysis.projectedRoute}
          analysis={routeAnalysis}
          alternativeRoute={selectedAlternativeRoute}
        />
      )}
    </div>
  );
};