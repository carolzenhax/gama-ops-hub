import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Manual from "./pages/Manual";
import Membros from "./pages/Membros";
import Inscricoes from "./pages/Inscricoes";
import Galeria from "./pages/Galeria";
import Viatura from "./pages/Viatura";
import Tatica from "./pages/Tatica";
import Curso from "./pages/Curso";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const STAFF_ROLES = ["admin", "operador"] as const;
const ALL_ROLES = ["admin", "operador", "visitante"] as const;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscricoes" element={<Inscricoes />} />
            <Route path="/manual" element={<DashboardLayout><Manual /></DashboardLayout>} />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
                <DashboardLayout><Dashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/manual" element={
              <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
                <DashboardLayout><Manual /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/galeria" element={
              <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
                <DashboardLayout><Galeria /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/curso" element={
              <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
                <DashboardLayout><Curso /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/membros" element={
              <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                <DashboardLayout><Membros /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/inscricoes" element={
              <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                <DashboardLayout><Inscricoes /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/viatura" element={
              <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                <DashboardLayout><Viatura /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/tatica" element={
              <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                <DashboardLayout><Tatica /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
