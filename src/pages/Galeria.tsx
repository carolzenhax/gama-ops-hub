import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { CreatableSelect } from "@/components/CreatableSelect";

interface Album { id: string; nome: string; }
interface Photo { id: string; src: string; title: string; album: Album | null; }

const EMPTY_FORM = { src: "", title: "", albumId: null as string | null };
const SEM_ALBUM = "sem-album";

async function fetchAlbuns(): Promise<Album[]> {
  const { data, error } = await supabase.from("galeria_albuns").select("id, nome").order("nome");
  if (error) throw error;
  return data;
}

async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase.from("galeria_fotos").select("id, src, titulo, album:galeria_albuns(id, nome)");
  if (error) throw error;
  return (data as unknown as Array<{ id: string; src: string; titulo: string; album: Album | null }>).map((p) => ({
    id: p.id, src: p.src, title: p.titulo, album: p.album,
  }));
}

const Galeria = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: albuns = [] } = useQuery({ queryKey: ["galeria_albuns"], queryFn: fetchAlbuns });
  const { data: photos = [], isLoading } = useQuery({ queryKey: ["galeria_fotos"], queryFn: fetchPhotos });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["galeria_fotos"] });

  const createAlbum = async (nome: string): Promise<Album> => {
    const { data, error } = await supabase.from("galeria_albuns").insert({ nome }).select("id, nome").single();
    if (error) throw error;
    queryClient.setQueryData<Album[]>(["galeria_albuns"], (prev = []) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const addPhoto = useMutation({
    mutationFn: async (form: typeof EMPTY_FORM) => {
      const { error } = await supabase.from("galeria_fotos").insert({ src: form.src, titulo: form.title, album_id: form.albumId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deletePhoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("galeria_fotos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const photosSemAlbum = photos.filter((p) => !p.album);
  const albumCards = [
    ...albuns.map((a) => ({ id: a.id, nome: a.nome, fotos: photos.filter((p) => p.album?.id === a.id) })),
    ...(photosSemAlbum.length > 0 ? [{ id: SEM_ALBUM, nome: "Sem Álbum", fotos: photosSemAlbum }] : []),
  ];

  const currentAlbumCard = albumCards.find((a) => a.id === selectedAlbum);
  const currentPhotos = currentAlbumCard?.fotos ?? [];

  const handleAdd = () => {
    if (!form.src.trim() || !form.title.trim() || !form.albumId) return;
    addPhoto.mutate(form);
    setForm(EMPTY_FORM);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deletePhoto.mutate(id);
    setLightbox(null);
  };

  const openAddDialog = () => {
    setForm({ ...EMPTY_FORM, albumId: selectedAlbum && selectedAlbum !== SEM_ALBUM ? selectedAlbum : null });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {selectedAlbum ? (
            <button
              onClick={() => setSelectedAlbum(null)}
              className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos álbuns
            </button>
          ) : null}
          <h1 className="font-display text-2xl font-bold tracking-wider">
            {currentAlbumCard ? currentAlbumCard.nome : "Galeria"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentAlbumCard ? `${currentPhotos.length} foto(s)` : "Registros visuais da unidade"}
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={openAddDialog} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Adicionar Foto
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="aspect-video animate-pulse rounded-xl border border-border bg-muted/30" />)}
        </div>
      ) : !selectedAlbum ? (
        albumCards.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum álbum criado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albumCards.map((album, i) => (
              <motion.div
                key={album.id}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/40"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedAlbum(album.id)}
              >
                <div className="relative aspect-video overflow-hidden bg-muted/30">
                  {album.fotos[0] ? (
                    <img
                      src={album.fotos[0].src}
                      alt={album.nome}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="font-display text-sm tracking-wider text-foreground">{album.nome}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{album.fotos.length} foto(s)</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : currentPhotos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma foto nesse álbum ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentPhotos.map((photo, i) => (
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
      )}

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
              src={currentPhotos[lightbox]?.src}
              alt={currentPhotos[lightbox]?.title}
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
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Álbum</Label>
              <CreatableSelect
                options={albuns}
                value={form.albumId}
                onChange={(id) => setForm((f) => ({ ...f, albumId: id }))}
                onCreate={createAlbum}
                placeholder="Selecione ou crie um álbum"
              />
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
