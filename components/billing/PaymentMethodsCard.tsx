'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddPaymentMethodDialog } from './AddPaymentMethodDialog';

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export function PaymentMethodsCard() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/stripe/payment-methods');
      if (!response.ok) throw new Error('Failed to fetch payment methods');

      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddDialog(true);
  };

  const handlePaymentMethodAdded = async () => {
    // Refresh payment methods list
    await fetchPaymentMethods();
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    setIsRemoving(paymentMethodId);
    try {
      const response = await fetch(`/api/stripe/payment-methods?id=${paymentMethodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove payment method');

      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error removing payment method:', error);
      alert('Erro ao remover método de pagamento');
    } finally {
      setIsRemoving(null);
    }
  };

  const getBrandIcon = (brand?: string) => {
    // You can add specific brand icons here
    return <CreditCard className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Formas de Pagamento
        </CardTitle>
        <CardDescription>Gerencie seus métodos de pagamento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Nenhum método de pagamento cadastrado</p>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartão
              </Button>
            </div>
          ) : (
            <>
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getBrandIcon(pm.brand)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {pm.brand?.toUpperCase()} •••• {pm.last4}
                        </p>
                        {pm.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expira em {pm.expMonth}/{pm.expYear}
                      </p>
                    </div>
                  </div>

                  {!pm.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isRemoving === pm.id}>
                          {isRemoving === pm.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover método de pagamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover este cartão? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemovePaymentMethod(pm.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Cartão
              </Button>
            </>
          )}
        </div>
      </CardContent>

      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handlePaymentMethodAdded}
      />
    </Card>
  );
}
