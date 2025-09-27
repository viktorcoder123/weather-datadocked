import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ship, MapPin, Clock, Search, Anchor } from "lucide-react";
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
}

export const VesselDashboard = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchVessels = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-vessels', {
        body: { query: searchQuery }
      });

      if (error) throw error;
      
      setVessels(data?.vessels || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search vessels. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "underway":
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
    <Card className="border-maritime-medium/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5 text-maritime-medium" />
          Vessel Tracking
        </CardTitle>
        <CardDescription>
          Search and track maritime vessels using DataDocked API
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
          <Button onClick={searchVessels} disabled={isLoading} className="gap-2">
            <Search className="h-4 w-4" />
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {vessels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vessels found. Try searching for a vessel name or identifier.</p>
            </div>
          ) : (
            vessels.map((vessel) => (
              <Card key={vessel.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-maritime-deep">{vessel.name}</h4>
                    <Badge className={getStatusColor(vessel.status)}>
                      {vessel.status}
                    </Badge>
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
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last update: {new Date(vessel.lastUpdate).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};