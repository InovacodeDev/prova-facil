"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SubjectOption {
    value: string;
    label: string;
}

interface SubjectAutocompleteProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SubjectOption[];
    placeholder?: string;
    emptyText?: string;
    searchPlaceholder?: string;
}

export function SubjectAutocomplete({
    value,
    onValueChange,
    options,
    placeholder = "Selecione uma opção...",
    emptyText = "Nenhuma opção encontrada.",
    searchPlaceholder = "Buscar...",
}: SubjectAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!searchValue) {
            // Show first 5 options when no search
            return options.slice(0, 5);
        }
        return options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()));
    }, [options, searchValue]);

    // Get display label for selected value
    const selectedLabel = React.useMemo(() => {
        const selected = options.find((option) => option.value === value);
        return selected?.label || value || placeholder;
    }, [value, options, placeholder]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {!searchValue && options.length > 5 && (
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                    Mostrando 5 de {options.length} opções. Digite para buscar mais.
                                </div>
                            )}
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue === value ? "" : option.label);
                                        setOpen(false);
                                        setSearchValue("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                            {searchValue && !filteredOptions.some((opt) => opt.label === searchValue) && (
                                <CommandItem
                                    value={searchValue}
                                    onSelect={() => {
                                        onValueChange(searchValue);
                                        setOpen(false);
                                        setSearchValue("");
                                    }}
                                    className="text-primary font-medium"
                                >
                                    <Check className="mr-2 h-4 w-4 opacity-0" />
                                    ✏️ Usar "{searchValue}" (personalizado)
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
