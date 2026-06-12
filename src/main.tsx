import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load and validate environment variables
import { validateEnvironment, mongoClient } from "./lib/mongodb";
import { initializeAppPerformance } from "./lib/performance";
import { initializeSampleData } from "./lib/sample-data";
import { QueryClient } from "@tanstack/react-query";

// Validate environment variables on startup
try {
  validateEnvironment();
  
  // Log MongoDB connection info (development only)
  if (import.meta.env.DEV) {
    mongoClient.logConnectionInfo();
  }
} catch (error) {
  console.error("Environment validation failed:", error);
}

// ⚡ Initialize performance optimizations
const performanceQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

initializeSampleData();
initializeAppPerformance(performanceQueryClient).catch(console.debug);

createRoot(document.getElementById("root")!).render(<App />);
