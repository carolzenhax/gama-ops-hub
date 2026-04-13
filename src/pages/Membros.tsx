import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const membersData = [
  { name: "Cpt. Rodrigo Almeida", cargo: "Comandante", classe: "Oficial" },
  { name: "Ten. Marcos Vieira", cargo: "Subcomandante", classe: "Oficial" },
  { name: "Sgt. Lucas Ferreira", cargo: "Chefe de Operações", classe: "Graduado" },
  { name: "Sgt. Ana Torres", cargo: "Líder de Equipe Alpha", classe: "Graduado" },
  { name: "Cb. Pedro Santos", cargo: "Operador Sênior", classe: "Graduado" },
  { name: "Cb. Rafael Mendes", cargo: "Operador Sênior", classe: "Graduado" },
  { name: "Sd. João Silva", cargo: "Operador", classe: "Praça" },
  { name: "Sd. Maria Oliveira", cargo: "Operadora", classe: "Praça" },
  { name: "Sd. Felipe Costa", cargo: "Operador", classe: "Praça" },
  { name: "Sd. Bruno Lima", cargo: "Aspirante", classe: "Praça" },
];

const classes = ["Todos", "Oficial", "Graduado", "Praça"];

const Membros = () => {
  const [filter, setFilter] = useState("Todos");
  const filtered = filter === "Todos" ? membersData : membersData.filter((m) => m.classe === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Membros</h1>
          <p className="text-sm text-muted-foreground">Efetivo da unidade GAMA</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m, i) => (
          <motion.div
            key={m.name}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.cargo}</p>
                <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.classe}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Membros;
