import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Users, FileText, Image, Truck, Crosshair, LogOut, Menu, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import logoImg from "@/assets/gama-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { canAccess } from "@/lib/permissions";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/dashboard/manual", icon: BookOpen, label: "Manual" },
  { to: "/dashboard/membros", icon: Users, label: "Membros" },
  { to: "/dashboard/inscricoes", icon: FileText, label: "Inscrições" },
  { to: "/dashboard/galeria", icon: Image, label: "Galeria" },
  { to: "/dashboard/viatura", icon: Truck, label: "Viatura" },
  { to: "/dashboard/tatica", icon: Crosshair, label: "Tática" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const visibleNavItems = user
    ? navItems.filter((item) => canAccess(user.papel, item.to))
    : [];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border p-4">
          <img src={logoImg} alt="GAMA" className="h-10 w-10" />
          <div>
            <p className="font-display text-sm font-bold tracking-wider">G.A.M.A</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sistema Tático</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/20 text-foreground font-medium border-l-2 border-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          {user && (
            <div className="px-3 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user.nome}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user.papel}</p>
            </div>
          )}
          <Button variant="ghost" onClick={logout} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Shield className="h-5 w-5 text-accent" />
          <span className="font-display text-xs tracking-widest text-muted-foreground">PAINEL OPERACIONAL</span>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
