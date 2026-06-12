import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Chatbot } from "@/components/Chatbot";
import ChatbotTest from "@/components/ChatbotTest";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Canteen from "./pages/Canteen";
import Academic from "./pages/Academic";
import Campus from "./pages/Campus";
import NotFound from "./pages/NotFound";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import CanteenDashboard from "./pages/CanteenDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import CampusConnectApp from "./pages/CampusConnectApp";
import Settings from "./pages/Settings";
import Verification from "./pages/Verification";
import AdminDashboard from "./pages/AdminDashboard";
import { useState } from "react";

import { useRealtimeSync } from "@/hooks/useRealtimeSync";

// ⚡ Optimized QueryClient for fast loading with minimal delays
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5s - keep it fresh for sync
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true, // Enable for better sync
      refetchOnReconnect: true,
      refetchOnMount: true, // Enable for better sync
    },
    mutations: {
      retry: 1,
    },
  },
});

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  useRealtimeSync(user?.id);

  return (
    <div className="min-h-screen">
      <Navigation />
      {children}
      <Chatbot />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ChatbotProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Student', 'Admin']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
                <Route path="/librarian" element={<ProtectedRoute allowedRoles={['Librarian', 'Admin']}><Layout><LibrarianDashboard /></Layout></ProtectedRoute>} />
                <Route path="/canteen-incharge" element={<ProtectedRoute allowedRoles={['Canteen Staff', 'Admin']}><Layout><CanteenDashboard /></Layout></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
                <Route path="/canteen" element={<ProtectedRoute><Layout><Canteen /></Layout></ProtectedRoute>} />
                <Route path="/academic" element={<ProtectedRoute><Layout><Academic /></Layout></ProtectedRoute>} />
                <Route path="/campus" element={<ProtectedRoute><Layout><Campus /></Layout></ProtectedRoute>} />
                <Route path="/faculty" element={<ProtectedRoute allowedRoles={['Professor', 'Admin']}><Layout><FacultyDashboard /></Layout></ProtectedRoute>} />
                <Route path="/canteen-integrated" element={<ProtectedRoute><Layout><CampusConnectApp /></Layout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                <Route path="/chatbot-test" element={<ProtectedRoute><Layout><ChatbotTest /></Layout></ProtectedRoute>} />
                <Route path="/verify" element={<ProtectedRoute><Layout><Verification /></Layout></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ChatbotProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
