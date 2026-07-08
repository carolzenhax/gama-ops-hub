import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Option { id: string; nome: string; }

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  onCreate?: (nome: string) => Promise<Option>;
  placeholder?: string;
}

export function MultiSelect({ options, value, onChange, onCreate, placeholder = "Selecionar..." }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selected = options.filter((o) => value.includes(o.id));
  const exactMatch = options.some((o) => o.nome.toLowerCase() === search.trim().toLowerCase());
  const filteredOptions = options.filter((o) => o.nome.toLowerCase().includes(search.trim().toLowerCase()));

  const handleCreate = async () => {
    if (!onCreate || !search.trim() || exactMatch) return;
    setCreating(true);
    try {
      const created = await onCreate(search.trim());
      onChange([...value, created.id]);
      setSearch("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between bg-muted/50 font-normal"
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((o) => (
                <Badge key={o.id} variant="secondary" className="gap-1">
                  {o.nome}
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); toggle(o.id); }}
                    className="cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={onCreate ? "Procurar ou criar..." : "Procurar..."} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {onCreate && search.trim() ? (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <Plus className="h-3.5 w-3.5" /> Criar "{search.trim()}"
                </button>
              ) : (
                "Nenhum resultado."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((o) => (
                <CommandItem key={o.id} value={o.id} onSelect={() => toggle(o.id)}>
                  <Check className={cn("mr-2 h-4 w-4", value.includes(o.id) ? "opacity-100" : "opacity-0")} />
                  {o.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
