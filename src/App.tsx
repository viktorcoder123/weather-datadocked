import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const BACKEND_URL = 'https://weather-datadocked.onrender.com';
const KEEPALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

const App = () => {
  useEffect(() => {
    // Ping backend immediately on app load
    const pingBackend = async () => {
      try {
        await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
        console.log('Backend keepalive ping sent');
      } catch (error) {
        console.log('Backend keepalive ping failed:', error);
      }
    };

    pingBackend();

    // Set up interval to ping every 10 minutes
    const interval = setInterval(pingBackend, KEEPALIVE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
