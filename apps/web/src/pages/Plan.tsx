import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ChartPie } from "lucide-react";
import { dashboardRoute } from "@/router";
import { useToast } from "@/hooks/use-toast";
import usePlanAnalytics from "@/hooks/use-plan-analytics";
import { Loader2 } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

const availablePlans = [
    { id: "starter", name: "Starter", price: "Grátis", features: ["Gerar 10 questões/mês", "PDF import básico"] },
    {
        id: "pro",
        name: "Pro",
        price: "R$29/mês",
        features: ["Gerar 500 questões/mês", "Import de PDFs avançado", "Tipos extras"],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Sob consulta",
        features: ["Cotas customizadas", "Suporte dedicado"],
    },
];

export default function Plan() {
    const loc = useLocation();
    const params = new URLSearchParams(loc.search);
    const redirect = params.get("redirect");
    const navigate = dashboardRoute.useNavigate();
    const headerNavigate = dashboardRoute.useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        // default select the first paid plan (Pro) to encourage upgrade, but it's optional
        setSelected("pro");
    }, []);

    usePlanAnalytics(redirect);

    const handleUpgrade = async () => {
        if (!selected)
            return toast({
                title: "Selecione um plano",
                description: "Escolha um plano para prosseguir.",
                variant: "destructive",
            });
        setLoading(true);
        try {
            // Here you would call your billing API / open Stripe Checkout etc.
            // We'll simulate success with a timeout
            await new Promise((res) => setTimeout(res, 900));
            toast({ title: "Plano atualizado", description: `Você foi migrado para o plano ${selected}.` });

            // After successful upgrade, navigate back to redirect if provided, otherwise to dashboard
            if (redirect && redirect.startsWith("/")) {
                navigate({ to: redirect });
            } else {
                navigate({ to: "/dashboard" });
            }
        } catch (e) {
            toast({ title: "Erro", description: "Não foi possível atualizar o plano.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => headerNavigate({ to: "/dashboard" })}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                        </Button>
                        <div className="flex items-center gap-2 flex-1">
                            <ChartPie className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">Planos</span>
                        </div>
                        <div className="ml-auto">
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Planos</CardTitle>
                            <CardDescription>Escolha um plano para desbloquear mais recursos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {availablePlans.map((p) => (
                                    <div
                                        key={p.id}
                                        className={`p-4 border rounded-lg cursor-pointer flex flex-col justify-between ${
                                            selected === p.id ? "border-primary bg-muted" : "border-border"
                                        }`}
                                        onClick={() => setSelected(p.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && setSelected(p.id)}
                                    >
                                        <div>
                                            <div className="text-lg font-semibold">{p.name}</div>
                                            <div className="text-sm text-muted-foreground">{p.price}</div>
                                            <ul className="mt-2 text-sm list-disc list-inside">
                                                {p.features.map((f) => (
                                                    <li key={f}>{f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="mt-4">
                                            <Button
                                                variant={selected === p.id ? "default" : "outline"}
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelected(p.id);
                                                }}
                                            >
                                                {selected === p.id ? "Selecionado" : "Selecionar"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleUpgrade} disabled={loading || !selected}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...
                                        </>
                                    ) : (
                                        "Atualizar plano"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
