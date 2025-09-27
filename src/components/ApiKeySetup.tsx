import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ExternalLink, Ship, Cloud, Wind, MapPin, Waves, Thermometer } from "lucide-react";

interface ApiKeyData {
  datadocked: string;
  stormglass: string;
  weatherapi: string;
  windy: string;
  openweathermap: string;
  worldtides: string;
}

export const ApiKeySetup = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyData>({
    datadocked: "",
    stormglass: "",
    weatherapi: "",
    windy: "",
    openweathermap: "",
    worldtides: "",
  });
  const [showKeys, setShowKeys] = useState<Record<keyof ApiKeyData, boolean>>({
    datadocked: false,
    stormglass: false,
    weatherapi: false,
    windy: false,
    openweathermap: false,
    worldtides: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      // Load from localStorage for testing
      const storedKeys = localStorage.getItem('api_keys');
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        setApiKeys({
          datadocked: parsedKeys.datadocked || "",
          stormglass: parsedKeys.stormglass || "",
          weatherapi: parsedKeys.weatherapi || "",
          windy: parsedKeys.windy || "",
          openweathermap: parsedKeys.openweathermap || "",
          worldtides: parsedKeys.worldtides || ""
        });
      }
    } catch (error) {
      console.log('No existing API keys found');
    }
  };

  const handleInputChange = (key: keyof ApiKeyData, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowKey = (key: keyof ApiKeyData) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveKeys = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage for testing
      localStorage.setItem('api_keys', JSON.stringify(apiKeys));

      toast({
        title: "Success",
        description: "API keys have been saved locally for testing.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const apiConfigs = [
    {
      key: "datadocked" as keyof ApiKeyData,
      title: "DataDocked API",
      description: "Vessel location and vessel data",
      icon: Ship,
      url: "https://datadocked.com",
      placeholder: "Enter your DataDocked API key",
    },
    {
      key: "stormglass" as keyof ApiKeyData,
      title: "StormGlass API",
      description: "Marine weather and wave data",
      icon: Cloud,
      url: "https://stormglass.io",
      placeholder: "Enter your StormGlass API key",
    },
    {
      key: "weatherapi" as keyof ApiKeyData,
      title: "WeatherAPI",
      description: "Weather forecasts and conditions",
      icon: MapPin,
      url: "https://www.weatherapi.com",
      placeholder: "Enter your WeatherAPI key",
    },
    {
      key: "windy" as keyof ApiKeyData,
      title: "Windy API",
      description: "Wind patterns and forecasts",
      icon: Wind,
      url: "https://windy.com",
      placeholder: "Enter your Windy API key",
    },
    {
      key: "openweathermap" as keyof ApiKeyData,
      title: "OpenWeatherMap",
      description: "Marine weather & ocean data (Free tier available)",
      icon: Thermometer,
      url: "https://openweathermap.org/api",
      placeholder: "Enter your OpenWeatherMap API key",
    },
    {
      key: "worldtides" as keyof ApiKeyData,
      title: "WorldTides",
      description: "Global tidal predictions & extremes",
      icon: Waves,
      url: "https://www.worldtides.info",
      placeholder: "Enter your WorldTides API key",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-primary">API Configuration</h2>
        <p className="text-muted-foreground text-lg">
          Configure your API keys to integrate vessel tracking and weather data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {apiConfigs.map(({ key, title, description, icon: Icon, url, placeholder }) => (
          <Card key={key} className="border-border hover:border-primary/30 transition-colors flex flex-col">
            <CardHeader className="pb-4 flex-1">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold">{title}</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1 hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardTitle>
              <CardDescription className="text-sm mt-2 ml-12 min-h-[2.5rem]">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Label htmlFor={key} className="text-sm font-medium">API Key</Label>
              <div className="relative">
                <Input
                  id={key}
                  type={showKeys[key] ? "text" : "password"}
                  placeholder={placeholder}
                  value={apiKeys[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="pr-10 h-11 text-base font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => toggleShowKey(key)}
                >
                  {showKeys[key] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showKeys[key] ? "Hide" : "Show"} API key
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSaveKeys}
          disabled={isLoading || !Object.values(apiKeys).some(key => key.trim())}
          className="min-w-[200px] h-12 text-base bg-primary hover:bg-primary/90"
          size="lg"
        >
          {isLoading ? "Saving..." : "Save API Keys"}
        </Button>
      </div>
    </div>
  );
};