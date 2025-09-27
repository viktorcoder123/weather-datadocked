import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Cloud, MapPin, Navigation, Ship } from "lucide-react";
import { ApiKeySetup } from "@/components/ApiKeySetup";
import { VesselWeatherIntegration } from "@/components/VesselWeatherIntegration";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "setup">("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-primary-foreground/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-white/10">
                <Cloud className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Weather Docked
                </h1>
                <p className="text-sm text-white/70">
                  Maritime Weather Intelligence for Vessel Routes
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setActiveTab(activeTab === "setup" ? "dashboard" : "setup")}
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              {activeTab === "setup" ? "Dashboard" : "Setup"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "setup" ? (
          <div className="max-w-6xl mx-auto">
            <div className="bg-card rounded-xl border border-border p-8">
              <ApiKeySetup />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clean Hero Section */}
            <div className="text-center py-8 border-b border-border">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Ship className="h-6 w-6 text-primary" />
                <Navigation className="h-5 w-5 text-primary/70" />
                <MapPin className="h-5 w-5 text-primary/70" />
              </div>
              <h2 className="text-3xl font-semibold text-foreground mb-3">
                Maritime Weather Intelligence
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-3">
                Get precise weather intelligence based on any vessel's current position and predicted journey.
                Analyze conditions ahead, monitor route-specific forecasts, and receive targeted weather insights for maritime operations.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Powered by</span>
                <span className="font-semibold text-primary">Data Docked</span>
              </div>
            </div>

            {/* Main Integration */}
            <VesselWeatherIntegration onNavigateToSetup={() => setActiveTab("setup")} />
          </div>
        )}
      </main>

      {/* Footer with Data Docked Attribution */}
      <footer className="mt-auto py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Weather Docked • Powered by{" "}
              <a
                href="https://datadocked.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Data Docked
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;