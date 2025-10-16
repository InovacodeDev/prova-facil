'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { Cookie } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

interface CookieBannerProps {
  onAccept?: (preferences: CookiePreferences) => void;
  onReject?: () => void;
}

export function CookieBanner({ onAccept, onReject }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true
    analytics: false,
    preferences: false,
    marketing: false,
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkCookieConsent();
  }, []);

  const checkCookieConsent = async () => {
    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // For non-logged in users, check localStorage
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) {
        setShowBanner(true);
      }
    } else {
      // For logged-in users, check database
      const { data, error } = await supabase
        .from('profiles')
        .select('allowed_cookies')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data || !data.allowed_cookies) {
        setShowBanner(true);
      }
    }
  };

  const handleAcceptAll = async () => {
    const allPreferences: CookiePreferences = {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true,
    };

    await savePreferences(allPreferences);
    setShowBanner(false);
    if (onAccept) onAccept(allPreferences);
  };

  const handleRejectAll = async () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
    };

    // For non-authenticated users, rejecting all cookies blocks access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Block non-authenticated users
      localStorage.setItem('cookie_consent', 'rejected');
      alert(
        'Para utilizar a plataforma Prova Fácil, é necessário aceitar pelo menos os cookies essenciais. Sem eles, não é possível fazer login.'
      );
      if (onReject) onReject();
      // Don't close the banner, force user to accept at least essential
      return;
    }

    // For authenticated users, save essential only
    await savePreferences(essentialOnly);
    setShowBanner(false);
    if (onAccept) onAccept(essentialOnly);
  };

  const handleSavePreferences = async () => {
    await savePreferences(preferences);
    setShowBanner(false);
    if (onAccept) onAccept(preferences);
  };

  const savePreferences = async (prefs: CookiePreferences) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Save to database for logged-in users
      await supabase.from('profiles').update({ allowed_cookies: prefs }).eq('user_id', user.id);
    } else {
      // Save to localStorage for non-logged in users
      localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    }
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cookie className="h-6 w-6 text-primary" />
              <CardTitle>Preferências de Cookies</CardTitle>
            </div>
            {/* Don't allow closing without making a choice */}
          </div>
          <CardDescription>
            Utilizamos cookies para melhorar sua experiência. Cookies essenciais são obrigatórios para o funcionamento
            da plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!showDetails ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Respeitamos sua privacidade. Você pode escolher quais cookies deseja aceitar. Para mais informações,
                consulte nossa{' '}
                <a href="/privacy" className="text-primary hover:underline" target="_blank">
                  Política de Privacidade
                </a>{' '}
                e{' '}
                <a href="/cookies" className="text-primary hover:underline" target="_blank">
                  Política de Cookies
                </a>
                .
              </p>

              <Button variant="link" className="p-0 h-auto" onClick={() => setShowDetails(true)}>
                Ver detalhes e personalizar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                ← Voltar
              </Button>

              <Separator />

              {/* Essential Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="essential" className="text-base font-semibold">
                    Cookies Essenciais
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Necessários para autenticação, segurança e funcionalidades básicas. Não podem ser desativados.
                  </p>
                </div>
                <Switch id="essential" checked={true} disabled />
              </div>

              <Separator />

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer">
                    Cookies de Análise
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nos ajudam a entender como você usa a plataforma para melhorarmos a experiência.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={() => togglePreference('analytics')}
                />
              </div>

              <Separator />

              {/* Preference Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="preferences" className="text-base font-semibold cursor-pointer">
                    Cookies de Preferências
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Guardam suas configurações e preferências pessoais na plataforma.
                  </p>
                </div>
                <Switch
                  id="preferences"
                  checked={preferences.preferences}
                  onCheckedChange={() => togglePreference('preferences')}
                />
              </div>

              <Separator />

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                    Cookies de Marketing
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Utilizados para personalizar anúncios e medir a eficácia de campanhas.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={() => togglePreference('marketing')}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {!showDetails ? (
            <>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleRejectAll}>
                Rejeitar Todos
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowDetails(true)}>
                Personalizar
              </Button>
              <Button className="w-full sm:flex-1" onClick={handleAcceptAll}>
                Aceitar Todos
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleRejectAll}>
                Apenas Essenciais
              </Button>
              <Button className="w-full sm:flex-1" onClick={handleSavePreferences}>
                Salvar Preferências
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
