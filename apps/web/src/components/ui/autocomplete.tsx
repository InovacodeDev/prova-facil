import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import Chip from "./chip";

type Option = { label: string; value?: string };

export function Autocomplete({
    options,
    value,
    onChange,
    placeholder,
    fetchOptions,
    maxResults = 50,
}: {
    options: Option[];
    value: string | null;
    onChange: (v: string | null) => void;
    placeholder?: string;
    // optional async fetcher for remote suggestions
    fetchOptions?: (q: string) => Promise<Option[]>;
    maxResults?: number;
}) {
    const [query, setQuery] = React.useState("");
    const [show, setShow] = React.useState(false);
    const [asyncOptions, setAsyncOptions] = React.useState<Option[] | null>(null);
    const ref = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        if (value) setQuery(value);
    }, [value]);

    // debounce async fetch
    React.useEffect(() => {
        if (!fetchOptions) return;
        let mounted = true;
        const q = query.trim();
        const handle = setTimeout(() => {
            if (!mounted) return;
            fetchOptions(q)
                .then((res) => {
                    if (!mounted) return;
                    setAsyncOptions(res.slice(0, maxResults));
                })
                .catch(() => {
                    if (!mounted) return;
                    setAsyncOptions([]);
                });
        }, 300);
        return () => {
            mounted = false;
            clearTimeout(handle);
        };
    }, [query, fetchOptions, maxResults]);

    const source = asyncOptions ?? options;

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return source;
        return source.filter((o) => o.label.toLowerCase().includes(q));
    }, [source, query]);

    const select = (label: string) => {
        onChange(label);
        setShow(false);
        ref.current?.blur();
    };

    return (
        <div className="relative">
            {value ? (
                <div className="flex items-center gap-2">
                    <Chip onRemove={() => onChange(null)}>{value}</Chip>
                </div>
            ) : (
                <>
                    <Input
                        ref={(el) => (ref.current = el)}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShow(true)}
                        onBlur={() => {
                            // on blur, if exact match exists, select it
                            const exact = source.find((o) => o.label.toLowerCase() === query.trim().toLowerCase());
                            if (exact) select(exact.label);
                            // hide after short delay to allow click
                            setTimeout(() => setShow(false), 150);
                        }}
                        placeholder={placeholder}
                    />
                    {show && filtered.length > 0 && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-card p-1">
                            {filtered.map((o) => (
                                <li key={o.label}>
                                    <button
                                        type="button"
                                        className="block w-full text-left p-2 hover:bg-muted-hover rounded"
                                        onMouseDown={(ev) => ev.preventDefault()}
                                        onClick={() => select(o.label)}
                                    >
                                        {o.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}

export default Autocomplete;
