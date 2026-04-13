import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-gama.jpg";
import viaturaImg from "@/assets/viatura-ram.jpg";

const categories = ["Todas", "Operações", "Treinamentos", "Viaturas", "Equipe"];

const photos = [
  { src: heroImg, category: "Equipe", title: "Formação tática" },
  { src: viaturaImg, category: "Viaturas", title: "RAM 4x4 Tática" },
  { src: heroImg, category: "Operações", title: "Operação Tempestade" },
  { src: viaturaImg, category: "Viaturas", title: "Viatura em campo" },
  { src: heroImg, category: "Treinamentos", title: "Treinamento noturno" },
  { src: viaturaImg, category: "Operações", title: "Patrulha montanhosa" },
];

const Galeria = () => {
  const [filter, setFilter] = useState("Todas");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const filtered = filter === "Todas" ? photos : photos.filter((p) => p.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider">Galeria</h1>
        <p className="text-sm text-muted-foreground">Registros visuais da unidade</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((photo, i) => (
          <motion.div
            key={i}
            className="group cursor-pointer overflow-hidden rounded-xl border border-border"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setLightbox(i)}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={photo.src}
                alt={photo.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-3 left-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-display text-xs tracking-wider text-foreground">{photo.title}</p>
                <p className="text-[10px] uppercase text-muted-foreground">{photo.category}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="absolute right-6 top-6 text-foreground" onClick={() => setLightbox(null)}>
              <X className="h-6 w-6" />
            </button>
            <motion.img
              src={filtered[lightbox]?.src}
              alt={filtered[lightbox]?.title}
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Galeria;
