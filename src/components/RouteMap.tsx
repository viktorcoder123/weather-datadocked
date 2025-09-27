import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Layers, MapPin, Navigation, Wind } from "lucide-react";

interface RouteMapProps {
  vessel: any;
  routeWeather: any[];
  analysis?: any;
}

export const RouteMap = ({ vessel, routeWeather, analysis }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [showWeather, setShowWeather] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default;

        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setIsLoaded(true);
        return L;
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        return null;
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !vessel || !routeWeather.length) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!mapInstance) {
        const map = L.map(mapRef.current).setView([vessel.latitude, vessel.longitude], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        setMapInstance(map);
      }
    };

    initMap();
  }, [isLoaded, vessel, routeWeather, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !vessel || !routeWeather.length) return;

    const updateMap = async () => {
      const L = (await import('leaflet')).default;

      // Clear existing layers
      mapInstance.eachLayer((layer: any) => {
        if (layer.options?.attribution) return; // Keep base tiles
        mapInstance.removeLayer(layer);
      });

      // Add vessel position marker
      const vesselIcon = L.divIcon({
        html: '🚢',
        iconSize: [30, 30],
        className: 'vessel-marker'
      });

      L.marker([vessel.latitude, vessel.longitude], { icon: vesselIcon })
        .addTo(mapInstance)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vessel.name}</h3>
            <div><strong>Position:</strong> ${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)}</div>
            <div><strong>Course:</strong> ${vessel.course}°</div>
            <div><strong>Speed:</strong> ${vessel.speed} knots</div>
            ${vessel.destination ? `<div><strong>Destination:</strong> ${vessel.destination}</div>` : ''}
          </div>
        `);

      // Add route line if vessel is moving
      if (showRoute && routeWeather.length > 1) {
        const routeCoords = routeWeather.map(point => [point.lat, point.lng]);

        // Check if vessel is stationary
        const isStationary = routeWeather.every(point =>
          Math.abs(point.lat - vessel.latitude) < 0.001 &&
          Math.abs(point.lng - vessel.longitude) < 0.001
        );

        if (!isStationary) {
          L.polyline(routeCoords, {
            color: '#2563eb',
            weight: 3,
            opacity: 0.7
          }).addTo(mapInstance);
        }
      }

      // Add weather markers along route
      if (showWeather) {
        routeWeather.forEach((point, index) => {
          if (!point.weather) return;

          const weather = point.weather;
          const windSpeed = weather.windSpeed || 0;
          const waveHeight = weather.waveHeight || 0;

          // Determine marker color based on conditions
          let markerColor = '#22c55e'; // Green (good)
          if (windSpeed > 35 || waveHeight > 4) {
            markerColor = '#ef4444'; // Red (severe)
          } else if (windSpeed > 25 || waveHeight > 2) {
            markerColor = '#f97316'; // Orange (high)
          } else if (windSpeed > 15 || waveHeight > 1) {
            markerColor = '#eab308'; // Yellow (medium)
          }

          // Create weather icon
          const weatherIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${markerColor};
                border: 2px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: white;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                ${index + 1}
              </div>
            `,
            iconSize: [20, 20],
            className: 'weather-marker'
          });

          const timeStr = new Date(point.estimatedTime).toLocaleDateString() + ' ' +
                         new Date(point.estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          L.marker([point.lat, point.lng], { icon: weatherIcon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="min-width: 250px;">
                <h4 style="margin: 0 0 8px 0; font-weight: bold;">
                  ${index === 0 ? 'Current Position' :
                    index === routeWeather.length - 1 ? 'Destination' :
                    `Waypoint ${index}`}
                </h4>
                <div style="margin-bottom: 8px;"><strong>Time:</strong> ${timeStr}</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
                  <div><strong>🌬️ Wind:</strong> ${windSpeed.toFixed(1)} kts</div>
                  <div><strong>🌊 Waves:</strong> ${waveHeight.toFixed(1)} m</div>
                  <div><strong>👁️ Visibility:</strong> ${(weather.visibility || 10).toFixed(1)} km</div>
                  <div><strong>🌡️ Temp:</strong> ${(weather.temperature || 20).toFixed(1)}°C</div>
                </div>

                <div style="margin-top: 8px; font-size: 11px; color: #666;">
                  Source: ${weather.source || 'api'}
                </div>
              </div>
            `);
        });
      }

      // Fit map bounds to show all points
      if (routeWeather.length > 0) {
        const bounds = L.latLngBounds(routeWeather.map(point => [point.lat, point.lng]));
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }
    };

    updateMap();
  }, [mapInstance, vessel, routeWeather, showWeather, showRoute]);

  if (!isLoaded) {
    return (
      <Card className="border-maritime-medium/20">
        <CardContent className="p-8 text-center">
          <Map className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Loading map...</p>
        </CardContent>
      </Card>
    );
  }

  const isStationary = routeWeather.length > 1 && routeWeather.every(point =>
    Math.abs(point.lat - vessel.latitude) < 0.001 &&
    Math.abs(point.lng - vessel.longitude) < 0.001
  );

  return (
    <Card className="border-maritime-medium/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5 text-maritime-medium" />
          {isStationary ? 'Port Location Map' : 'Route & Weather Map'} - {vessel.name}
        </CardTitle>
        <CardDescription>
          {isStationary
            ? 'Vessel location and weather conditions at port'
            : 'Interactive map showing vessel route and weather conditions along the way'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="controls">Map Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            {/* Map Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={showWeather ? "default" : "outline"}
                size="sm"
                onClick={() => setShowWeather(!showWeather)}
                className="gap-2"
              >
                <Wind className="h-4 w-4" />
                Weather Points
              </Button>

              {!isStationary && (
                <Button
                  variant={showRoute ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowRoute(!showRoute)}
                  className="gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Route Line
                </Button>
              )}

              <Badge variant="outline" className="ml-auto">
                {routeWeather.length} waypoints
              </Badge>
            </div>

            {/* Map Container */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ minHeight: '400px' }}
              />

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-xs z-[1000]">
                <h4 className="font-semibold mb-2">Legend</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>🚢</span>
                    <span>Vessel Position</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Good Conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Moderate Conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Challenging Conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Severe Conditions</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Map Layers
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showWeather}
                      onChange={(e) => setShowWeather(e.target.checked)}
                      className="rounded"
                    />
                    Weather Waypoints
                  </label>
                  {!isStationary && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showRoute}
                        onChange={(e) => setShowRoute(e.target.checked)}
                        className="rounded"
                      />
                      Route Line
                    </label>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Map Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Vessel:</span> {vessel.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {isStationary ? 'At Port' : 'Underway'}
                  </div>
                  <div>
                    <span className="font-medium">Waypoints:</span> {routeWeather.length}
                  </div>
                  {analysis && (
                    <div>
                      <span className="font-medium">Risk Level:</span>{' '}
                      <Badge variant="outline">{analysis.overallRisk?.toUpperCase()}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">How to Use the Map</h4>
              <div className="space-y-2 text-sm">
                <div>• <strong>Click markers</strong> to see detailed weather information</div>
                <div>• <strong>Drag to pan</strong> and <strong>scroll to zoom</strong> the map</div>
                <div>• <strong>Toggle layers</strong> using the controls above</div>
                <div>• <strong>Color coding</strong> shows weather severity at each point</div>
                {!isStationary && (
                  <div>• <strong>Blue line</strong> shows the projected vessel route</div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};