import * as React from "react";
import { cn } from "@/lib/utils";

export function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
    return (
        <span className={cn("inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm")}>
            <span className="truncate">{children}</span>
            {onRemove && (
                <button
                    type="button"
                    aria-label="Remover"
                    onClick={onRemove}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-hover"
                >
                    ✕
                </button>
            )}
        </span>
    );
}

export default Chip;
