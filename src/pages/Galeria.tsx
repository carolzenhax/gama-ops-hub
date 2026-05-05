import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import heroImg from "@/assets/hero-gama.jpg";
import viaturaImg from "@/assets/viatura-ram.jpg";

const categories = ["Todas", "Operações", "Treinamentos", "Viaturas", "Equipe"];
const categoryOptions = ["Operações", "Treinamentos", "Viaturas", "Equipe"];

interface Photo { id: string; src: string; category: string; title: string; }

const DEFAULT_PHOTOS: Photo[] = [
  { id: "d1", src: heroImg, category: "Equipe", title: "Formação tática" },
  { id: "d2", src: viaturaImg, category: "Viaturas", title: "RAM 4x4 Tática" },
  { id: "d3", src: heroImg, category: "Operações", title: "Operação Tempestade" },
  { id: "d4", src: viaturaImg, category: "Viaturas", title: "Viatura em campo" },
  { id: "d5", src: heroImg, category: "Treinamentos", title: "Treinamento noturno" },
  { id: "d6", src: viaturaImg, category: "Operações", title: "Patrulha montanhosa" },
];

const EMPTY_FORM = { src: "", title: "", category: "Operações" };

const Galeria = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "admin";
  const [photos, setPhotos] = useLocalStorage<Photo[]>("gama-galeria", DEFAULT_PHOTOS);
  const [filter, setFilter] = useState("Todas");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = filter === "Todas" ? photos : photos.filter((p) => p.category === filter);

  const handleAdd = () => {
    if (!form.src.trim() || !form.title.trim()) return;
    setPhotos((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    setForm(EMPTY_FORM);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setLightbox(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Galeria</h1>
          <p className="text-sm text-muted-foreground">Registros visuais da unidade</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Adicionar Foto
          </Button>
        )}
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
            key={photo.id}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border"
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
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
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

      {/* Add photo dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Adicionar Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Imagem</Label>
              <Input value={form.src} onChange={(e) => setForm((f) => ({ ...f, src: e.target.value }))} placeholder="https://..." className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título da foto" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              >
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Galeria;
