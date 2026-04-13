import { motion } from "framer-motion";
import { Eye, Radio, MapPin, Shield, Crosshair, CheckCircle, FileText } from "lucide-react";

const steps = [
  { icon: Eye, title: "Reconhecimento", desc: "Análise do terreno, identificação de ameaças e pontos de entrada." },
  { icon: MapPin, title: "Posicionamento", desc: "Equipe se posiciona de acordo com o protocolo de formação tática." },
  { icon: Radio, title: "Comunicação", desc: "Contato com a central, confirmação de parâmetros operacionais." },
  { icon: Shield, title: "Aproximação", desc: "Avanço controlado com cobertura mútua entre os operadores." },
  { icon: Crosshair, title: "Contenção", desc: "Neutralização de ameaças e contenção da área operacional." },
  { icon: CheckCircle, title: "Verificação", desc: "Checagem de segurança, contagem de pessoal e busca no perímetro." },
  { icon: FileText, title: "Relatório", desc: "Documentação completa da operação e debrief com a equipe." },
];

const Tatica = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold tracking-wider">Abordagem Tática</h1>
      <p className="text-sm text-muted-foreground">Protocolo operacional padrão da GAMA</p>
    </div>

    <div className="relative ml-4 space-y-0 border-l-2 border-border pl-8">
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          className="relative pb-10 last:pb-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
        >
          {/* Timeline dot */}
          <div className="absolute -left-[2.65rem] flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-card">
            <step.icon className="h-4 w-4 text-accent" />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs text-accent">FASE {i + 1}</span>
              <h3 className="font-display text-sm font-bold tracking-wider">{step.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Tatica;
