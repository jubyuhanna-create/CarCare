import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import CarsList from "@/pages/CarsList";
import CarDetail from "@/pages/CarDetail";
import GaragesList from "@/pages/GaragesList";
import GarageDetail from "@/pages/GarageDetail";
import BookingsList from "@/pages/BookingsList";
import ServiceHistory from "@/pages/ServiceHistory";
import GarageDashboard from "@/pages/GarageDashboard";
import GarageBookingDetail from "@/pages/GarageBookingDetail";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, role }: { component: any, role?: "user" | "garage_owner" }) {
  // Simplistic auth check for MVP
  const token = localStorage.getItem("token");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) {
      setLocation("/");
    }
  }, [token, setLocation]);

  if (!token) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* User Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} role="user" />}
      </Route>
      <Route path="/cars">
        {() => <ProtectedRoute component={CarsList} role="user" />}
      </Route>
      <Route path="/cars/:id">
        {() => <ProtectedRoute component={CarDetail} role="user" />}
      </Route>
      <Route path="/garages">
        {() => <ProtectedRoute component={GaragesList} role="user" />}
      </Route>
      <Route path="/garages/:id">
        {() => <ProtectedRoute component={GarageDetail} role="user" />}
      </Route>
      <Route path="/bookings">
        {() => <ProtectedRoute component={BookingsList} role="user" />}
      </Route>
      <Route path="/service-records/:carId">
        {() => <ProtectedRoute component={ServiceHistory} role="user" />}
      </Route>

      {/* Garage Owner Routes */}
      <Route path="/garage-dashboard">
        {() => <ProtectedRoute component={GarageDashboard} role="garage_owner" />}
      </Route>
      <Route path="/garage-dashboard/bookings/:id">
        {() => <ProtectedRoute component={GarageBookingDetail} role="garage_owner" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
