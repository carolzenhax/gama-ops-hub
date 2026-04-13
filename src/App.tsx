import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Manual from "./pages/Manual";
import Membros from "./pages/Membros";
import Inscricoes from "./pages/Inscricoes";
import Galeria from "./pages/Galeria";
import Viatura from "./pages/Viatura";
import Tatica from "./pages/Tatica";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscricoes" element={<Inscricoes />} />
          <Route path="/manual" element={<DashboardLayout><Manual /></DashboardLayout>} />
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/manual" element={<DashboardLayout><Manual /></DashboardLayout>} />
          <Route path="/dashboard/membros" element={<DashboardLayout><Membros /></DashboardLayout>} />
          <Route path="/dashboard/inscricoes" element={<DashboardLayout><Inscricoes /></DashboardLayout>} />
          <Route path="/dashboard/galeria" element={<DashboardLayout><Galeria /></DashboardLayout>} />
          <Route path="/dashboard/viatura" element={<DashboardLayout><Viatura /></DashboardLayout>} />
          <Route path="/dashboard/tatica" element={<DashboardLayout><Tatica /></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
