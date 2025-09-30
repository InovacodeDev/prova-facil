import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiFetch } from "../lib/api";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type UsageItem = {
    name: string;
    used: number;
    remaining: number;
};

const UsagePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<string | null>(null);
    const [monthlyLimit, setMonthlyLimit] = useState<number | null>(null);
    const [items, setItems] = useState<UsageItem[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        let mounted = true;
        void (async () => {
            try {
                setLoading(true);
                const res = await apiFetch("/api/usage/with-limits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                if (!mounted) return;
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || "Falha ao carregar cotas");
                }
                const j = await res.json();
                const data = j?.data || {};

                setPlan(data.plan || null);
                setMonthlyLimit(typeof data.monthlyLimit === "number" ? data.monthlyLimit : null);

                const perCat: Record<string, { used?: number; remaining?: number }> = data.perCategory || {};
                const list: UsageItem[] = Object.entries(perCat).map(([name, v]) => ({
                    name,
                    used: typeof v?.used === "number" ? v.used : 0,
                    remaining: typeof v?.remaining === "number" ? v.remaining : 0,
                }));
                setItems(list);
            } catch (e: unknown) {
                console.error(e);
                toast({ title: "Erro", description: "Não foi possível carregar as cotas.", variant: "destructive" });
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [toast]);

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Uso de Cotas</CardTitle>
                            <CardDescription>
                                Visão geral do uso de cotas por matéria. Cada barra mostra o progresso de 0% (nenhum
                                uso) até 100% (cota esgotada).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Carregando...</div>
                            ) : items.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    Nenhuma matéria com uso registrado ainda.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((it) => {
                                        const total = monthlyLimit ?? it.used + it.remaining;
                                        const percent =
                                            total > 0 ? Math.min(100, Math.round((it.used / total) * 100)) : 0;
                                        return (
                                            <div key={it.name} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">{it.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {it.used}/{total}
                                                    </div>
                                                </div>
                                                <Progress value={percent} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default UsagePage;
