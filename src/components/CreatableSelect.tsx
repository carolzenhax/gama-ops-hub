import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Option { id: string; nome: string; }

interface CreatableSelectProps {
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
  onCreate?: (nome: string) => Promise<Option>;
  placeholder?: string;
}

export function CreatableSelect({ options, value, onChange, onCreate, placeholder = "Selecionar..." }: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = options.find((o) => o.id === value);
  const exactMatch = options.some((o) => o.nome.toLowerCase() === search.trim().toLowerCase());

  const handleCreate = async () => {
    if (!onCreate || !search.trim() || exactMatch) return;
    setCreating(true);
    try {
      const created = await onCreate(search.trim());
      onChange(created.id);
      setSearch("");
      setOpen(false);
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
          className="w-full justify-between bg-muted/50 font-normal"
        >
          {selected ? selected.nome : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Procurar ou criar..." value={search} onValueChange={setSearch} />
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
              {options
                .filter((o) => o.nome.toLowerCase().includes(search.trim().toLowerCase()))
                .map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.id}
                    onSelect={() => {
                      onChange(o.id);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
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
