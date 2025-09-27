import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ExternalLink, Ship, Cloud, Wind, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ApiKeyData {
  datadocked: string;
  stormglass: string;
  weatherapi: string;
  windy: string;
}

export const ApiKeySetup = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyData>({
    datadocked: "",
    stormglass: "",
    weatherapi: "",
    windy: "",
  });
  const [showKeys, setShowKeys] = useState<Record<keyof ApiKeyData, boolean>>({
    datadocked: false,
    stormglass: false,
    weatherapi: false,
    windy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .single();

      if (data && !error) {
        setApiKeys({
          datadocked: data.datadocked_api_key || "",
          stormglass: data.stormglass_api_key || "",
          weatherapi: data.weatherapi_key || "",
          windy: data.windy_api_key || ""
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign in to save API keys.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          datadocked_api_key: apiKeys.datadocked,
          stormglass_api_key: apiKeys.stormglass,
          weatherapi_key: apiKeys.weatherapi,
          windy_api_key: apiKeys.windy
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API keys have been saved securely.",
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
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-maritime-deep">API Configuration</h2>
        <p className="text-muted-foreground">
          Configure your API keys to integrate vessel tracking and weather data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apiConfigs.map(({ key, title, description, icon: Icon, url, placeholder }) => (
          <Card key={key} className="border-maritime-medium/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-maritime-medium" />
                  {title}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor={key}>API Key</Label>
              <div className="relative">
                <Input
                  id={key}
                  type={showKeys[key] ? "text" : "password"}
                  placeholder={placeholder}
                  value={apiKeys[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="pr-10"
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

      <div className="flex justify-center">
        <Button
          onClick={handleSaveKeys}
          disabled={isLoading || !Object.values(apiKeys).some(key => key.trim())}
          className="min-w-32"
        >
          {isLoading ? "Saving..." : "Save API Keys"}
        </Button>
      </div>
    </div>
  );
};