import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Ship, Cloud, Waves } from "lucide-react";
import { ApiKeySetup } from "@/components/ApiKeySetup";
import { VesselWeatherIntegration } from "@/components/VesselWeatherIntegration";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "setup">("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-maritime-wave via-background to-maritime-light">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Waves className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Maritime Weather</h1>
                <p className="text-sm text-muted-foreground">Vessel tracking & weather insights</p>
              </div>
            </div>
            <Button
              variant={activeTab === "setup" ? "default" : "outline"}
              onClick={() => setActiveTab(activeTab === "setup" ? "dashboard" : "setup")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {activeTab === "setup" ? "Back to Dashboard" : "API Setup"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "setup" ? (
          <ApiKeySetup />
        ) : (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-maritime-medium/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ship className="h-5 w-5 text-maritime-medium" />
                    Active Vessels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-maritime-deep">--</div>
                  <CardDescription>Tracked vessels</CardDescription>
                </CardContent>
              </Card>

              <Card className="border-maritime-medium/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Cloud className="h-5 w-5 text-maritime-medium" />
                    Weather Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-maritime-deep">--</div>
                  <CardDescription>Active weather areas</CardDescription>
                </CardContent>
              </Card>

              <Card className="border-maritime-medium/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Waves className="h-5 w-5 text-maritime-medium" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-maritime-accent">--</div>
                  <CardDescription>Active weather alerts</CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <VesselWeatherIntegration />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;