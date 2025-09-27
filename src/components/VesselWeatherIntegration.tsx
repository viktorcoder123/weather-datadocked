import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, MapPin, Clock, Search, Anchor, Cloud, Wind, Waves, Thermometer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  atd?: string;
  callsign?: string;
  draught?: string;
}

interface WeatherData {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  current: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    visibility: number;
    weather: string;
    timestamp: string;
  };
  forecast: Array<{
    date: string;
    temperature: { min: number; max: number };
    windSpeed: number;
    waveHeight: number;
    weather: string;
  }>;
}

export const VesselWeatherIntegration = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const { toast } = useToast();

  const searchVessels = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-vessels', {
        body: { query: searchQuery }
      });

      if (error) throw error;
      
      const vesselResults = data?.vessels || [];
      setVessels(vesselResults);
      
      if (vesselResults.length === 0) {
        toast({
          title: "No Results",
          description: "No vessels found for your search query.",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search vessels. Please check your API configuration.",
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
      const { data, error } = await supabase.functions.invoke('weather-data', {
        body: { lat: vessel.latitude.toString(), lng: vessel.longitude.toString() }
      });

      if (error) throw error;
      
      setWeatherData(data);
      toast({
        title: "Weather Data Loaded",
        description: `Fetched weather data for ${vessel.name}`,
      });
    } catch (error) {
      toast({
        title: "Weather Error",
        description: "Failed to fetch weather data. Please check your API configuration.",
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

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return directions[Math.round(degrees / 22.5) % 16];
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
              placeholder="Search by vessel name, IMO, or MMSI..."
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-maritime-deep">{vessel.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(vessel.status)}>
                          {vessel.status}
                        </Badge>
                        {selectedVessel?.id === vessel.id && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Anchor className="h-3 w-3" />
                        Speed: {vessel.speed} kts
                      </div>
                      <div>IMO: {vessel.imo}</div>
                      <div>MMSI: {vessel.mmsi}</div>
                    </div>
                    
                    {vessel.destination && (
                      <div className="text-sm text-muted-foreground">
                        Destination: {vessel.destination}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last update: {new Date(vessel.lastUpdate).toLocaleString()}
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
            {isFetchingWeather ? (
              <div className="text-center py-8">
                <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-muted-foreground">Loading weather data...</p>
              </div>
            ) : weatherData ? (
              <Tabs defaultValue="current" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="current">Current Conditions</TabsTrigger>
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                </TabsList>
                
                <TabsContent value="current" className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="font-semibold text-maritime-deep">
                      {selectedVessel.latitude.toFixed(4)}, {selectedVessel.longitude.toFixed(4)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Weather conditions at vessel location
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="h-4 w-4 text-maritime-accent" />
                        <span className="text-sm font-medium">Temperature</span>
                      </div>
                      <div className="text-2xl font-bold text-maritime-deep">
                        {weatherData.current.temperature}°C
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="h-4 w-4 text-maritime-accent" />
                        <span className="text-sm font-medium">Wind</span>
                      </div>
                      <div className="text-2xl font-bold text-maritime-deep">
                        {weatherData.current.windSpeed.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        m/s {getWindDirection(weatherData.current.windDirection)}
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Waves className="h-4 w-4 text-maritime-accent" />
                        <span className="text-sm font-medium">Wave Height</span>
                      </div>
                      <div className="text-2xl font-bold text-maritime-deep">
                        {weatherData.current.waveHeight.toFixed(1)}m
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-4 w-4 text-maritime-accent" />
                        <span className="text-sm font-medium">Visibility</span>
                      </div>
                      <div className="text-2xl font-bold text-maritime-deep">
                        {weatherData.current.visibility.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">km</div>
                    </Card>
                  </div>

                  <div className="text-center">
                    <Badge variant="secondary" className="text-sm">
                      {weatherData.current.weather}
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="forecast" className="space-y-3">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {weatherData.forecast.map((day, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {new Date(day.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">{day.weather}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              {day.temperature.min}° - {day.temperature.max}°C
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Wind className="h-3 w-3" />
                              {day.windSpeed.toFixed(1)} m/s
                              <Waves className="h-3 w-3" />
                              {day.waveHeight.toFixed(1)}m
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Click on a vessel above to view weather conditions</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};