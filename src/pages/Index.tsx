import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-gama.jpg";
import logoImg from "@/assets/gama-logo.png";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Giroflex overlay */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="giroflex-red absolute left-0 top-0 h-full w-1/2" />
        <div className="giroflex-blue absolute right-0 top-0 h-full w-1/2" />
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Equipe tática GAMA em formação"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <motion.img
            src={logoImg}
            alt="Emblema GAMA"
            className="mb-6 h-32 w-32 drop-shadow-2xl md:h-44 md:w-44"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          <motion.h1
            className="font-display text-5xl font-black tracking-[0.3em] text-foreground md:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            G.A.M.A
          </motion.h1>

          <motion.p
            className="mt-4 max-w-xl font-display text-xs tracking-[0.25em] text-muted-foreground md:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            GRUPAMENTO DE AÇÕES EM MONTANHA E AMBIENTE ÁRIDO
          </motion.p>

          <motion.p
            className="mt-6 max-w-md text-sm text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Unidade tática de elite especializada em operações em terrenos extremos.
            Disciplina. Precisão. Resiliência.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            <Button asChild size="lg" className="glow-green bg-primary font-display text-xs tracking-widest hover:bg-primary/80">
              <Link to="/login">
                <Shield className="mr-2 h-4 w-4" />
                ACESSAR SISTEMA
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border font-display text-xs tracking-widest text-foreground hover:bg-muted">
              <Link to="/manual">
                <BookOpen className="mr-2 h-4 w-4" />
                VER MANUAL
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
