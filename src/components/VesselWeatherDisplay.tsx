import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Sun, Moon, Wind, Thermometer, Droplets, Eye, Gauge, Zap, TreePine, AlertTriangle } from "lucide-react";

interface WeatherDisplayProps {
  weatherData: any;
  isFetchingWeather: boolean;
}

export const VesselWeatherDisplay = ({ weatherData, isFetchingWeather }: WeatherDisplayProps) => {
  if (isFetchingWeather) {
    return (
      <div className="text-center py-12">
        <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
        <p className="text-muted-foreground">Loading weather data...</p>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Click on a vessel above to view weather conditions</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="weatherapi" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="weatherapi" disabled={!weatherData.weatherapi}>
          Current
        </TabsTrigger>
        <TabsTrigger value="forecast" disabled={!weatherData.weatherapi?.forecast}>
          Forecast
        </TabsTrigger>
        <TabsTrigger value="stormglass" disabled={!weatherData.stormglass}>
          Marine
        </TabsTrigger>
        <TabsTrigger value="windy" disabled={!weatherData.windy}>
          Windy
        </TabsTrigger>
        <TabsTrigger value="raw">Raw Data</TabsTrigger>
      </TabsList>

      {weatherData.stormglass && (
        <TabsContent value="stormglass" className="space-y-3">
          <h4 className="font-semibold">StormGlass Marine Weather Data</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {weatherData.stormglass.hours?.[0] &&
              Object.entries(weatherData.stormglass.hours[0]).map(([key, value]: [string, any]) => {
                if (key === "time") return null;
                const displayValue =
                  typeof value === "object"
                    ? value.sg || value.noaa || value.icon || value.dwd || "N/A"
                    : value;
                return (
                  <div key={key} className="p-2 border rounded">
                    <div className="font-medium text-maritime-deep">{key.replace(/_/g, " ")}</div>
                    <div className="text-maritime-medium">
                      {typeof displayValue === "number"
                        ? displayValue.toFixed(2)
                        : displayValue || "N/A"}
                    </div>
                  </div>
                );
              })}
          </div>
        </TabsContent>
      )}

      {weatherData.weatherapi && (
        <TabsContent value="weatherapi" className="space-y-4">
          {weatherData.weatherapi.current && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Current Weather Conditions
              </h4>

              {/* Main Weather Overview */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{weatherData.weatherapi.current.temp_c}°C</div>
                    <div className="text-muted-foreground">{weatherData.weatherapi.current.condition?.text}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Feels like</div>
                    <div className="text-xl font-semibold">{weatherData.weatherapi.current.feelslike_c}°C</div>
                  </div>
                </div>
              </Card>

              {/* Temperature Details */}
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperature Details
                </h5>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <div className="font-medium text-red-900 dark:text-red-300">Heat Index</div>
                    <div className="text-red-700 dark:text-red-400">{weatherData.weatherapi.current.heatindex_c}°C</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="font-medium text-blue-900 dark:text-blue-300">Wind Chill</div>
                    <div className="text-blue-700 dark:text-blue-400">{weatherData.weatherapi.current.windchill_c}°C</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                    <div className="font-medium text-purple-900 dark:text-purple-300">Dew Point</div>
                    <div className="text-purple-700 dark:text-purple-400">{weatherData.weatherapi.current.dewpoint_c}°C</div>
                  </div>
                </div>
              </div>

              {/* Wind Information */}
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Wind Information
                </h5>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 border rounded">
                    <div className="font-medium">Wind Speed</div>
                    <div>{weatherData.weatherapi.current.wind_kph} km/h</div>
                    <div className="text-xs text-muted-foreground">{weatherData.weatherapi.current.wind_dir} ({weatherData.weatherapi.current.wind_degree}°)</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium">Wind Gusts</div>
                    <div>{weatherData.weatherapi.current.gust_kph} km/h</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium">Pressure</div>
                    <div>{weatherData.weatherapi.current.pressure_mb} mb</div>
                  </div>
                </div>
              </div>

              {/* Atmospheric Conditions */}
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Atmospheric Conditions
                </h5>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="p-3 border rounded">
                    <div className="font-medium">Humidity</div>
                    <div>{weatherData.weatherapi.current.humidity}%</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium">Cloud Cover</div>
                    <div>{weatherData.weatherapi.current.cloud}%</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Visibility
                    </div>
                    <div>{weatherData.weatherapi.current.vis_km} km</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium">Precipitation</div>
                    <div>{weatherData.weatherapi.current.precip_mm} mm</div>
                  </div>
                </div>
              </div>

              {/* UV & Solar Radiation */}
              {(weatherData.weatherapi.current.uv || weatherData.weatherapi.current.short_rad) && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Solar & UV Information
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <div className="font-medium text-yellow-900 dark:text-yellow-300">UV Index</div>
                      <div className="text-yellow-700 dark:text-yellow-400">{weatherData.weatherapi.current.uv}</div>
                    </div>
                    {weatherData.weatherapi.current.short_rad && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <div className="font-medium text-orange-900 dark:text-orange-300">Solar Radiation</div>
                        <div className="text-orange-700 dark:text-orange-400">{weatherData.weatherapi.current.short_rad} W/m²</div>
                      </div>
                    )}
                  </div>
                  {(weatherData.weatherapi.current.diff_rad || weatherData.weatherapi.current.dni || weatherData.weatherapi.current.gti) && (
                    <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                      {weatherData.weatherapi.current.diff_rad && (
                        <div className="p-2 border rounded">
                          <div className="font-medium text-xs">Diffuse Radiation</div>
                          <div>{weatherData.weatherapi.current.diff_rad} W/m²</div>
                        </div>
                      )}
                      {weatherData.weatherapi.current.dni && (
                        <div className="p-2 border rounded">
                          <div className="font-medium text-xs">Direct Normal</div>
                          <div>{weatherData.weatherapi.current.dni} W/m²</div>
                        </div>
                      )}
                      {weatherData.weatherapi.current.gti && (
                        <div className="p-2 border rounded">
                          <div className="font-medium text-xs">Global Tilt</div>
                          <div>{weatherData.weatherapi.current.gti} W/m²</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Air Quality */}
              {weatherData.weatherapi.current.air_quality && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <TreePine className="h-4 w-4" />
                    Air Quality
                  </h5>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <div className="font-medium text-green-900 dark:text-green-300">US EPA Index</div>
                      <div className="text-green-700 dark:text-green-400">{weatherData.weatherapi.current.air_quality['us-epa-index']}</div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-blue-900 dark:text-blue-300">UK DEFRA Index</div>
                      <div className="text-blue-700 dark:text-blue-400">{weatherData.weatherapi.current.air_quality['gb-defra-index']}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 border rounded">
                      <div className="font-medium text-xs">CO</div>
                      <div>{weatherData.weatherapi.current.air_quality.co?.toFixed(1)} μg/m³</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium text-xs">NO₂</div>
                      <div>{weatherData.weatherapi.current.air_quality.no2?.toFixed(2)} μg/m³</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium text-xs">O₃</div>
                      <div>{weatherData.weatherapi.current.air_quality.o3?.toFixed(1)} μg/m³</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium text-xs">SO₂</div>
                      <div>{weatherData.weatherapi.current.air_quality.so2?.toFixed(3)} μg/m³</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium text-xs">PM2.5</div>
                      <div>{weatherData.weatherapi.current.air_quality.pm2_5?.toFixed(2)} μg/m³</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium text-xs">PM10</div>
                      <div>{weatherData.weatherapi.current.air_quality.pm10?.toFixed(2)} μg/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      )}

      {/* Separate Forecast Tab */}
      {weatherData.weatherapi?.forecast?.forecastday && (
        <TabsContent value="forecast" className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather Forecast
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {weatherData.weatherapi.forecast.forecastday.map((day: any) => (
              <Card key={day.date} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-lg">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h5>
                    <div className="text-sm text-muted-foreground">{day.day.condition?.text}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="font-medium text-red-900 dark:text-red-300">High</div>
                      <div className="text-red-700 dark:text-red-400">{day.day.maxtemp_c}°C</div>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="font-medium text-blue-900 dark:text-blue-300">Low</div>
                      <div className="text-blue-700 dark:text-blue-400">{day.day.mintemp_c}°C</div>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="font-medium text-green-900 dark:text-green-300">Rain</div>
                      <div className="text-green-700 dark:text-green-400">{day.day.totalprecip_mm}mm</div>
                      <div className="text-xs text-green-600 dark:text-green-500">{day.day.daily_chance_of_rain}% chance</div>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <div className="font-medium text-purple-900 dark:text-purple-300">Wind</div>
                      <div className="text-purple-700 dark:text-purple-400">{day.day.maxwind_kph} km/h</div>
                    </div>
                  </div>

                  {day.astro && (
                    <div>
                      <h6 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Sun className="h-3 w-3" />
                        Astronomical Data
                      </h6>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                          <div className="font-medium text-yellow-900 dark:text-yellow-300">Sunrise</div>
                          <div className="text-yellow-700 dark:text-yellow-400">{day.astro.sunrise}</div>
                        </div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                          <div className="font-medium text-orange-900 dark:text-orange-300">Sunset</div>
                          <div className="text-orange-700 dark:text-orange-400">{day.astro.sunset}</div>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
                          <div className="font-medium text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                            <Moon className="h-3 w-3" />
                            Moon Phase
                          </div>
                          <div className="text-indigo-700 dark:text-indigo-400">{day.astro.moon_phase}</div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-500">{day.astro.moon_illumination}% illuminated</div>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded border border-slate-200 dark:border-slate-800">
                          <div className="font-medium text-slate-900 dark:text-slate-300">Moonrise/set</div>
                          <div className="text-slate-700 dark:text-slate-400 text-xs">
                            Rise: {day.astro.moonrise}<br/>
                            Set: {day.astro.moonset}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {day.day.air_quality && (
                    <div>
                      <h6 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <TreePine className="h-3 w-3" />
                        Daily Air Quality
                      </h6>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 border rounded">
                          <div className="font-medium">US EPA</div>
                          <div>{day.day.air_quality['us-epa-index']}</div>
                        </div>
                        <div className="p-2 border rounded">
                          <div className="font-medium">UK DEFRA</div>
                          <div>{day.day.air_quality['gb-defra-index']}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      )}

      {weatherData.windy && (
        <TabsContent value="windy" className="space-y-3">
          <h4 className="font-semibold">Windy Forecast Data</h4>
          <div className="space-y-2 text-sm">
            {Object.entries(weatherData.windy).map(([key, value]: [string, any]) => (
              <div key={key} className="p-2 border rounded">
                <div className="font-medium text-maritime-deep">{key}</div>
                <pre className="text-xs overflow-x-auto mt-1">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </TabsContent>
      )}

      <TabsContent value="raw" className="space-y-3">
        <h4 className="font-semibold">Raw API Response Data</h4>
        <div className="space-y-4">
          {weatherData.errors && weatherData.errors.length > 0 && (
            <div className="p-2 border border-red-500 rounded bg-red-50">
              <div className="font-medium text-red-700">API Errors:</div>
              <ul className="text-sm text-red-600">
                {weatherData.errors.map((error: string, idx: number) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <details className="border rounded p-2">
              <summary className="font-medium cursor-pointer">StormGlass Response</summary>
              <pre className="text-xs mt-2 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(weatherData.stormglass, null, 2)}
              </pre>
            </details>

            <details className="border rounded p-2">
              <summary className="font-medium cursor-pointer">WeatherAPI Response</summary>
              <pre className="text-xs mt-2 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(weatherData.weatherapi, null, 2)}
              </pre>
            </details>

            <details className="border rounded p-2">
              <summary className="font-medium cursor-pointer">Windy Response</summary>
              <pre className="text-xs mt-2 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(weatherData.windy, null, 2)}
              </pre>
            </details>

            <details className="border rounded p-2">
              <summary className="font-medium cursor-pointer">Location Info</summary>
              <pre className="text-xs mt-2 overflow-x-auto">
                {JSON.stringify(weatherData.location, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};