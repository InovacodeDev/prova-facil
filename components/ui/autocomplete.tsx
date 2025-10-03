"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface AutocompleteOption {
    value: string;
    label: string;
    description?: string;
}

export interface AutocompleteProps {
    value: string;
    onValueChange: (value: string) => void;
    options: AutocompleteOption[];
    placeholder?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    maxStaticOptions?: number;
    allowCustomValue?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
}

export function Autocomplete({
    value,
    onValueChange,
    options,
    placeholder = "Selecione uma opção...",
    emptyText = "Nenhuma opção encontrada.",
    searchPlaceholder = "Buscar...",
    maxStaticOptions = 6,
    allowCustomValue = true,
    disabled = false,
    id,
    className,
}: AutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const normalizedOptions = React.useMemo(() => {
        const seen = new Set<string>();

        return options.filter((option) => {
            if (!option || !option.value) {
                return false;
            }

            if (seen.has(option.value)) {
                return false;
            }

            seen.add(option.value);
            return true;
        });
    }, [options]);

    const filteredOptions = React.useMemo(() => {
        if (!searchValue.trim()) {
            return normalizedOptions.slice(0, maxStaticOptions);
        }

        const term = searchValue.toLowerCase();
        return normalizedOptions.filter((option) => option.label.toLowerCase().includes(term));
    }, [normalizedOptions, searchValue, maxStaticOptions]);

    const selectedOption = React.useMemo(
        () => normalizedOptions.find((option) => option.value === value),
        [normalizedOptions, value]
    );

    const displayLabel = selectedOption?.label || value || placeholder;

    const hasCustomValue = React.useMemo(() => {
        if (!allowCustomValue) return false;
        if (!searchValue.trim()) return false;

        const normalizedSearch = searchValue.toLowerCase();
        return !normalizedOptions.some((option) => option.label.toLowerCase() === normalizedSearch);
    }, [allowCustomValue, normalizedOptions, searchValue]);

    const closePopover = React.useCallback(() => {
        setOpen(false);
        setSearchValue("");
    }, []);

    const handleSelect = React.useCallback(
        (nextValue: string) => {
            onValueChange(nextValue);
            closePopover();
        },
        [closePopover, onValueChange]
    );

    const handleCustomSelect = React.useCallback(() => {
        onValueChange(searchValue.trim());
        closePopover();
    }, [closePopover, onValueChange, searchValue]);

    const handleOpenChange = React.useCallback(
        (nextOpen: boolean) => {
            if (disabled) {
                return;
            }

            if (!nextOpen) {
                closePopover();
            } else {
                setOpen(true);
            }
        },
        [closePopover, disabled]
    );

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", disabled && "opacity-50 cursor-not-allowed", className)}
                    disabled={disabled}
                >
                    <span className={cn("truncate", !value && "text-muted-foreground")}>{displayLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                        disabled={disabled}
                    />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {!searchValue && normalizedOptions.length > maxStaticOptions && (
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                    Mostrando {maxStaticOptions} de {normalizedOptions.length} opções. Digite para
                                    buscar mais.
                                </div>
                            )}
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.description && (
                                            <span className="text-xs text-muted-foreground">{option.description}</span>
                                        )}
                                    </span>
                                </CommandItem>
                            ))}
                            {hasCustomValue && (
                                <CommandItem
                                    value={`custom-${searchValue}`}
                                    onSelect={handleCustomSelect}
                                    className="text-primary font-medium"
                                >
                                    <Check className="mr-2 h-4 w-4 opacity-0" />
                                    ✏️ Usar "{searchValue.trim()}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
