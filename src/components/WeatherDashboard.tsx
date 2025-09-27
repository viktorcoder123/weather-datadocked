import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Wind, Waves, Thermometer, Eye, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchWeatherData = async () => {
    if (!coordinates.lat || !coordinates.lng) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/weather-data?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else {
        throw new Error("Failed to fetch weather data");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  return (
    <Card className="border-maritime-medium/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-maritime-medium" />
          Weather & Marine Conditions
        </CardTitle>
        <CardDescription>
          Get comprehensive weather data from multiple sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Latitude"
            value={coordinates.lat}
            onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
            type="number"
            step="any"
          />
          <Input
            placeholder="Longitude"
            value={coordinates.lng}
            onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
            type="number"
            step="any"
          />
        </div>
        
        <Button onClick={fetchWeatherData} disabled={isLoading} className="w-full gap-2">
          <MapPin className="h-4 w-4" />
          {isLoading ? "Loading..." : "Get Weather Data"}
        </Button>

        {weatherData ? (
          <Tabs defaultValue="current" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-maritime-deep">{weatherData.location.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {weatherData.location.lat.toFixed(4)}, {weatherData.location.lng.toFixed(4)}
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
                    {weatherData.current.windSpeed}
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
                    {weatherData.current.waveHeight}m
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-maritime-accent" />
                    <span className="text-sm font-medium">Visibility</span>
                  </div>
                  <div className="text-2xl font-bold text-maritime-deep">
                    {weatherData.current.visibility}
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
                          {day.windSpeed} m/s
                          <Waves className="h-3 w-3" />
                          {day.waveHeight}m
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
            <p>Enter coordinates to view weather conditions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};