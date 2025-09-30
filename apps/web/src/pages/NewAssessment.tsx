import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { dashboardRoute } from "@/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Autocomplete from "@/components/ui/autocomplete";
import { Label } from "@/components/ui/label";
import { BookOpen, Upload, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const NewAssessment = () => {
    // `title` represents the content/topic for generated questions (labelled in the UI as Conteúdo das questões)
    const [title, setTitle] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [questionTypes, setQuestionTypes] = useState<Array<"mcq" | "tf" | "dissertativa" | "somatoria" | "ligacao">>([
        "mcq",
    ]);
    const [count, setCount] = useState<number>(10);
    const [category, setCategory] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>("starter");

    type UsageInfo = {
        plan?: string;
        allowedTypes?: string[];
        monthlyLimit?: number;
        used?: number;
        remaining?: number;
        perCategory?: Record<string, { used: number; remaining: number }>;
    };

    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = dashboardRoute.useNavigate();
    const { toast } = useToast();
    const loc = useLocation();

    // quota/usage info removed from this screen; moved to /usage page
    const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
    const [titleOptions, setTitleOptions] = useState<string[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const fileList = e.target.files;
            if (!fileList || fileList.length === 0) return;
            const pdfs = Array.from(fileList);

            // enforce per-file and total size client-side
            const MAX_PER_FILE = 5 * 1024 * 1024;
            const MAX_TOTAL = 50 * 1024 * 1024;
            if (pdfs.some((f) => f.size > MAX_PER_FILE)) {
                toast({ title: "Erro", description: "Cada arquivo deve ter no máximo 5MB.", variant: "destructive" });
                e.currentTarget.value = "";
                return;
            }
            const newTotal = [...files, ...pdfs].reduce((s, f) => s + f.size, 0);
            if (newTotal > MAX_TOTAL) {
                toast({ title: "Erro", description: "O total dos arquivos excede 50MB.", variant: "destructive" });
                e.currentTarget.value = "";
                return;
            }

            // simulate import processing and show a loading indicator while we "import" the PDFs
            setImporting(true);
            setTimeout(() => {
                setFiles((prev) => [...prev, ...pdfs].slice(0, 20));
                setImporting(false);
            }, 600);
            e.currentTarget.value = "";
        },
        [files, toast]
    );

    const memoizedTitleOptions = useMemo(() => titleOptions.map((t) => ({ label: t })), [titleOptions]);
    // create preview URLs for files to show miniaturas (thumbnails)
    const previews = useMemo(
        () => files.map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) })),
        [files]
    );

    // revoke blob URLs on unmount or when previews change
    useEffect(() => {
        return () => {
            previews.forEach((p) => {
                try {
                    URL.revokeObjectURL(p.url);
                } catch (e) {
                    // ignore
                }
            });
        };
    }, [previews]);

    // show confirmation toast if user was redirected after upgrading (e.g. /new-assessment?upgraded=1)
    useEffect(() => {
        try {
            const params = new URLSearchParams(loc.search);
            if (params.get("upgraded") === "1") {
                toast({ title: "Plano atualizado", description: "Seu plano foi atualizado com sucesso." });
                // remove query param from URL without reloading (history replace)
                const url = new URL(window.location.href);
                url.searchParams.delete("upgraded");
                window.history.replaceState({}, "", url.toString());
            }
        } catch (e) {
            // ignore
        }
    }, [loc.search, toast]);

    useEffect(() => {
        // fetch all titles and categories once on mount so the frontend can paginate/filter locally
        let mounted = true;
        (async () => {
            try {
                const headers: Record<string, string> = { "Content-Type": "application/json" };

                const [titlesRes, catsRes] = await Promise.all([
                    apiFetch("/api/rpc/query", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            table: "assessments",
                            select: "distinct title",
                            order: { by: "created_at", direction: "desc" },
                        }),
                    }),
                    apiFetch("/api/rpc/query", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            table: "categories",
                            select: "name",
                            order: { by: "name", direction: "asc" },
                        }),
                    }),
                ]);

                if (!mounted) return;

                if (titlesRes.ok) {
                    const j = await titlesRes.json();
                    const data = Array.isArray(j?.data) ? (j.data as Array<{ title?: string }>) : [];
                    const unique = Array.from(new Set(data.map((d) => d.title).filter(Boolean) as string[]));
                    setTitleOptions(unique);
                }

                if (catsRes.ok) {
                    const j = await catsRes.json();
                    const data = Array.isArray(j?.data) ? (j.data as Array<{ name?: string }>) : [];
                    const unique = Array.from(new Set(data.map((d) => d.name).filter(Boolean) as string[]));
                    setCategoryOptions(unique);
                }
                // fetch profile plan to enforce frontend limits (best-effort)
                try {
                    // If user is authenticated, server will read session from cookies
                    const token = null;
                    if (token) {
                        // get current user id
                        try {
                            const meRes = await apiFetch("/api/auth/me", {
                                method: "GET",
                                headers: {},
                            });
                            let userId: string | undefined = undefined;
                            if (meRes.ok) {
                                const meJson = await meRes.json();
                                userId = meJson?.user?.id;
                            }

                            const body = {
                                table: "profiles",
                                select: "plan, plan_expire_at",
                                filter: userId ? { user_id: userId } : {},
                            };
                            const me = await apiFetch("/api/rpc/query", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                            });
                            if (me.ok) {
                                const mj = await me.json();
                                const p =
                                    Array.isArray(mj?.data) && mj.data[0]
                                        ? (mj.data[0].plan as string | undefined)
                                        : undefined;
                                if (p) setUserPlan(p || "starter");
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                } catch (e) {
                    // ignore
                }
            } catch (e) {
                // ignore failures, UI will show empty lists
            } finally {
                if (mounted) setInitialLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // NOTE: we intentionally do NOT fetch global usage/limits on mount anymore.
    // The API /api/usage/with-limits will be called only when a category is selected
    // so the UI can present accurate per-category quotas. This keeps initial
    // traffic lower and matches the requested behavior.

    // Intentionally no per-category quota checks on this page.
    // Quota monitoring and progress are now available in the dedicated /usage page.

    const handleSubmit = (e: React.FormEvent) => {
        // Prevent form submit via Enter; POST happens only when clicking the explicit button
        e.preventDefault();
    };

    const createAssessment = async () => {
        if (!title.trim()) {
            toast({ title: "Erro", description: "O conteúdo é obrigatório.", variant: "destructive" });
            return;
        }

        setUploading(true);

        try {
            // The server authenticates using httpOnly cookies. Attempt to create the assessment and
            // if the server responds 401 we redirect to /auth.

            // prepare files metadata only (do NOT include base64 PDF data)
            const filePayloads = files.map((f) => ({ name: f.name, size: f.size, mime: f.type }));

            const res = await apiFetch("/api/assessments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    files: filePayloads,
                    questionTypes: questionTypes,
                    category: category,
                    count: count,
                }),
            });
            const payload = await res.json();
            if (!res.ok) {
                if (res.status === 401) {
                    navigate({ to: "/auth" });
                    return;
                }
                throw new Error(payload?.error || "Erro ao gerar questões");
            }
            toast({ title: "Sucesso", description: "Questões geradas com sucesso!" });
            navigate({ to: "/my-assessments" });
        } catch (error: unknown) {
            console.error("Erro ao gerar questões:", error);
            const message = error instanceof Error ? error.message : String(error);
            toast({
                title: "Erro",
                description: message || "Não foi possível gerar as questões. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    // derived usage values for the selected category (safe typed helpers)
    // No quota-derived values on this page
    const displayedMonthlyLimit: number | null = null;
    const displayedUsed: number | null = null;
    const displayedRemaining: number | null = null;
    const isQuotaExhausted = false;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">Criar Questões</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Criar Questões
                            </CardTitle>
                            <CardDescription>
                                Selecione o conteúdo e os PDFs de referência para gerar questões automaticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Conteúdo das questões *</Label>
                                    {initialLoading ? (
                                        <div className="text-sm text-muted-foreground">Carregando opções...</div>
                                    ) : (
                                        <Autocomplete
                                            options={memoizedTitleOptions}
                                            value={title || null}
                                            onChange={(v) => setTitle(v ?? "")}
                                            placeholder="Ex: Segunda Guerra Mundial"
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="count">Quantidade de questões</Label>
                                        <Input
                                            id="count"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={count}
                                            onChange={(e) => setCount(Number(e.target.value || 1))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Matéria</Label>
                                        <Autocomplete
                                            options={categoryOptions.map((c) => ({ label: c }))}
                                            value={category || null}
                                            onChange={(v) => setCategory(v ?? "")}
                                            placeholder="Ex: História"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="file">Upload do PDF (opcional)</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <div className="space-y-2">
                                            {importing ? (
                                                <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Importando...
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex gap-2 flex-wrap justify-center">
                                                        {previews.length > 0 ? (
                                                            previews.map((p, idx) => (
                                                                <div key={p.url} className="w-28 text-center relative">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Remover ${p.name}`}
                                                                        onClick={() =>
                                                                            setFiles((prev) =>
                                                                                prev.filter(
                                                                                    (f) =>
                                                                                        f.name !== p.name ||
                                                                                        f.size !== p.size
                                                                                )
                                                                            )
                                                                        }
                                                                        className="absolute -top-1 -right-1 z-10 bg-white rounded-full p-0.5 border"
                                                                    >
                                                                        <span className="text-xs font-bold">×</span>
                                                                    </button>
                                                                    <div className="h-20 w-20 mx-auto mb-1 border rounded overflow-hidden bg-white">
                                                                        <object
                                                                            data={p.url}
                                                                            type="application/pdf"
                                                                            className="h-full w-full"
                                                                        >
                                                                            <div className="flex h-full w-full items-center justify-center bg-muted">
                                                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                                            </div>
                                                                        </object>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground truncate">
                                                                        {p.name}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">
                                                                Arraste arquivos PDF aqui ou clique para selecionar
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Observação: os PDFs enviados NÃO são armazenados permanentemente. Apenas
                                                metadados (nome, tamanho, tipo) são mantidos para gerar as questões.
                                            </p>
                                            <Input
                                                id="file"
                                                ref={(el: HTMLInputElement | null) => (fileInputRef.current = el)}
                                                type="file"
                                                multiple
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                Selecionar PDFs (múltiplos)
                                            </Button>
                                            {files.length > 0 && (
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    <strong>Tamanho total:</strong>{" "}
                                                    {(files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(2)}{" "}
                                                    MB
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="types">Tipos de Questão</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { key: "mcq" as const, label: "Múltipla escolha" },
                                            { key: "tf" as const, label: "Verdadeiro ou Falso" },
                                            { key: "dissertativa" as const, label: "Dissertativa" },
                                            { key: "somatoria" as const, label: "Somatória" },
                                            { key: "ligacao" as const, label: "Ligue as colunas" },
                                        ].map((t) => {
                                            const k = t.key as "mcq" | "tf" | "dissertativa" | "somatoria" | "ligacao";
                                            const allowed =
                                                !usageInfo || Array.isArray(usageInfo.allowedTypes)
                                                    ? (usageInfo?.allowedTypes || []).includes(k)
                                                    : true;
                                            const active = questionTypes.includes(k);
                                            const planName = usageInfo?.plan || userPlan || "seu plano";
                                            const tooltip = allowed
                                                ? undefined
                                                : `Seu plano (${planName}) não permite este tipo de questão.`;
                                            const button = (
                                                <Button
                                                    key={k}
                                                    variant={active ? "default" : "outline"}
                                                    onClick={() => {
                                                        if (!allowed) return; // do nothing if not allowed by plan
                                                        setQuestionTypes((prev) =>
                                                            prev.includes(k)
                                                                ? prev.filter((p) => p !== k)
                                                                : [...prev, k]
                                                        );
                                                    }}
                                                    disabled={!allowed}
                                                >
                                                    {t.label}
                                                </Button>
                                            );

                                            if (!allowed) {
                                                // When a button is disabled, native pointer events don't fire on it in some browsers.
                                                // Wrap it in a focusable span (asChild) so TooltipTrigger can attach hover/focus listeners.
                                                return (
                                                    <Tooltip key={k}>
                                                        <TooltipTrigger asChild>
                                                            <span tabIndex={0} className="inline-block">
                                                                {button}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <div className="text-sm">
                                                                Seu plano <strong>{usageInfo?.plan || userPlan}</strong>{" "}
                                                                não permite este tipo de questão.
                                                            </div>
                                                            <div className="mt-2 flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                                                    onClick={() =>
                                                                        navigate({
                                                                            to: "/plan?redirect=/new-assessment",
                                                                        })
                                                                    }
                                                                >
                                                                    Atualizar plano
                                                                </Button>
                                                                {/* Removed the Fechar button */}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return button;
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate({ to: "/dashboard" })}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <div className="flex-1">
                                        {/* Submit button: only guard client-side for required fields */}
                                        {(() => {
                                            const reasons: string[] = [];
                                            if (!category) reasons.push("Selecione uma matéria.");
                                            if (!title.trim()) reasons.push("Informe o conteúdo das questões.");
                                            if (questionTypes.length === 0)
                                                reasons.push("Selecione ao menos um tipo de questão.");
                                            if (uploading) reasons.push("Em andamento: gerando questões...");

                                            console.log({
                                                reasons,
                                                uploading,
                                                title: title.trim(),
                                                category,
                                                questionTypes,
                                            });
                                            const disabled =
                                                uploading || !title.trim() || !category || questionTypes.length === 0;
                                            const tooltipMessage = reasons.length > 0 ? reasons.join(" ") : undefined;

                                            const button = (
                                                <Button
                                                    type="button"
                                                    disabled={disabled}
                                                    className="w-full"
                                                    onClick={createAssessment}
                                                >
                                                    {uploading ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Gerando...
                                                        </>
                                                    ) : (
                                                        "Gerar Questões"
                                                    )}
                                                </Button>
                                            );

                                            if (disabled && tooltipMessage) {
                                                return (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-block w-full">{button}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <div className="text-sm">{tooltipMessage}</div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return button;
                                        })()}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default NewAssessment;
