import { motion } from "framer-motion";
import { AlertTriangle, Activity, Users, Radio } from "lucide-react";

const cards = [
  { title: "Status", value: "OPERACIONAL", icon: Activity, color: "text-green-500" },
  { title: "Efetivo Ativo", value: "28 / 32", icon: Users, color: "text-foreground" },
  { title: "Operações (Mês)", value: "12", icon: Radio, color: "text-tactical-blue" },
  { title: "Alertas", value: "2", icon: AlertTriangle, color: "text-accent" },
];

const notices = [
  { date: "12/04/2026", text: "Treinamento tático agendado para sábado 0600h." },
  { date: "10/04/2026", text: "Novas diretrizes de abordagem publicadas no manual." },
  { date: "08/04/2026", text: "Operação Tempestade Árida concluída com êxito." },
];

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold tracking-wider">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Visão geral operacional da GAMA</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          className="rounded-xl border border-border bg-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.title}</p>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </div>
          <p className="mt-2 font-display text-xl font-bold tracking-wider">{card.value}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      className="rounded-xl border border-border bg-card p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider">Avisos Internos</h2>
      <div className="space-y-3">
        {notices.map((n, i) => (
          <div key={i} className="flex gap-4 rounded-lg border border-border bg-muted/30 p-3">
            <span className="shrink-0 font-display text-xs text-accent">{n.date}</span>
            <p className="text-sm text-foreground">{n.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default Dashboard;
