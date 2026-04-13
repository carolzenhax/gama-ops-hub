import { motion } from "framer-motion";
import viaturaImg from "@/assets/viatura-ram.jpg";

const positions = [
  { id: "P1", role: "Motorista", desc: "Conduz a viatura, responsável por manobras táticas e posicionamento.", x: "15%", y: "50%" },
  { id: "P2", role: "Navegador", desc: "Coordena rotas e comunicação com a central.", x: "30%", y: "35%" },
  { id: "P3", role: "Atirador 1", desc: "Cobertura lateral direita, primeiro a desembarcar.", x: "55%", y: "30%" },
  { id: "P4", role: "Atirador 2", desc: "Cobertura lateral esquerda, proteção de retaguarda.", x: "55%", y: "70%" },
  { id: "P5", role: "Médico Tático", desc: "Suporte médico e primeiros socorros em campo.", x: "75%", y: "35%" },
  { id: "P6", role: "Líder de Equipe", desc: "Comando operacional, última decisão tática.", x: "75%", y: "65%" },
];

const Viatura = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold tracking-wider">Sistema de Viatura</h1>
      <p className="text-sm text-muted-foreground">Posições e funções na viatura tática</p>
    </div>

    {/* Vehicle image with interactive points */}
    <div className="relative overflow-hidden rounded-xl border border-border">
      <img src={viaturaImg} alt="Viatura tática RAM 4x4" className="w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
      {positions.map((p, i) => (
        <motion.div
          key={p.id}
          className="group absolute"
          style={{ left: p.x, top: p.y }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + i * 0.1 }}
        >
          <div className="flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent/20 font-display text-xs font-bold text-accent transition-transform hover:scale-125">
            {p.id}
          </div>
          <div className="pointer-events-none absolute left-4 top-4 z-10 w-48 rounded-lg border border-border bg-card p-3 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            <p className="font-display text-xs font-bold text-accent">{p.id} — {p.role}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{p.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Grid overview */}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {positions.map((p, i) => (
        <motion.div
          key={p.id}
          className="rounded-xl border border-border bg-card p-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 font-display text-xs font-bold text-accent">
              {p.id}
            </span>
            <div>
              <p className="font-medium text-foreground">{p.role}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Viatura;
