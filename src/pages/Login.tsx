import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/gama-logo.png";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    const result = await login(id, password);
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Acesso autorizado", description: "Bem-vindo ao sistema GAMA." });
      navigate("/dashboard");
    } else {
      setErrorMsg(result.error ?? "Erro desconhecido.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Giroflex background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="giroflex-red absolute left-0 top-0 h-full w-1/2" />
        <div className="giroflex-blue absolute right-0 top-0 h-full w-1/2" />
      </div>

      {/* Scanline effect */}
      <div className="scanline pointer-events-none fixed inset-0" />

      <Link to="/" className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-xl border border-border bg-card/90 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center">
            <img src={logoImg} alt="GAMA" className="mb-4 h-20 w-20" />
            <h1 className="font-display text-xl font-bold tracking-[0.2em]">SISTEMA GAMA</h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Acesso restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-xs uppercase tracking-wider text-muted-foreground">
                Identificação
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Seu ID"
                  className="bg-muted/50 pl-10 border-border placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/50 pl-10 border-border placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="glow-green w-full bg-primary font-display text-xs tracking-widest hover:bg-primary/80"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  VERIFICANDO...
                </span>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  ENTRAR
                </>
              )}
            </Button>

            {errorMsg && (
              <p className="text-center text-xs text-destructive">{errorMsg}</p>
            )}
          </form>

          <div className="mt-6 text-center">
            <Link to="/inscricoes" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors">
              Solicitar acesso → Inscrição
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
