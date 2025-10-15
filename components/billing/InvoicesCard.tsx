'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Download, FileText, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

export function InvoicesCard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (cursor?: string) => {
    try {
      const url = cursor ? `/api/stripe/invoices?starting_after=${cursor}&limit=10` : '/api/stripe/invoices?limit=10';
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();

      if (cursor) {
        setInvoices((prev) => [...prev, ...data.invoices]);
      } else {
        setInvoices(data.invoices);
      }

      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoadingMore || !hasMore) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

    // Load more when 80% scrolled
    if (scrollPercentage > 0.8 && nextCursor) {
      setIsLoadingMore(true);
      fetchInvoices(nextCursor);
    }
  }, [isLoadingMore, hasMore, nextCursor]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatPeriod = (start: number, end: number) => {
    const startDate = new Date(start * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
    const endDate = new Date(end * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${startDate} - ${endDate}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      paid: { variant: 'default', label: 'Pago' },
      open: { variant: 'secondary', label: 'Aberto' },
      void: { variant: 'outline', label: 'Cancelado' },
      uncollectible: { variant: 'destructive', label: 'Não cobrável' },
      draft: { variant: 'outline', label: 'Rascunho' },
    };

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Pagamento
          </CardTitle>
          <CardDescription>Suas últimas faturas</CardDescription>
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
          <Calendar className="h-5 w-5" />
          Histórico de Pagamento
        </CardTitle>
        <CardDescription>Suas últimas faturas</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma fatura encontrada</p>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal scroll container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
              style={{ scrollBehavior: 'smooth' }}
            >
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex-shrink-0 w-[200px] snap-start">
                  {/* Invoice card */}
                  <div className="border rounded-lg p-3 space-y-3 h-full flex flex-col hover:shadow-md transition-shadow">
                    {/* Period */}
                    <div className="text-xs text-muted-foreground font-medium">
                      {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                    </div>

                    {/* PDF Thumbnail with Preview */}
                    <a
                      href={invoice.hostedInvoiceUrl || invoice.invoicePdf || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative block rounded-md aspect-[3/4] overflow-hidden group bg-muted ${
                        !invoice.invoicePdf && !invoice.hostedInvoiceUrl ? 'pointer-events-none' : 'cursor-pointer'
                      }`}
                      onClick={(e) => {
                        // Prevent default if only PDF available, open in new tab manually
                        if (!invoice.hostedInvoiceUrl && invoice.invoicePdf) {
                          e.preventDefault();
                          window.open(invoice.invoicePdf, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      {invoice.invoicePdf ? (
                        <>
                          {/* PDF Preview using embed */}
                          <embed
                            src={`${invoice.invoicePdf}#view=FitH&toolbar=0&navpanes=0&scrollbar=0&page=1`}
                            type="application/pdf"
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{
                              transform: 'scale(1.5)',
                              transformOrigin: 'top left',
                            }}
                          />
                          {/* Overlay gradient for better badge visibility */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 z-10">{getStatusBadge(invoice.status)}</div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </a>

                    {/* Amount */}
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatCurrency(invoice.amountPaid, invoice.currency)}</p>
                      <p className="text-xs text-muted-foreground">{invoice.number || `#${invoice.id.slice(-8)}`}</p>
                    </div>

                    {/* Download button */}
                    <Button variant="outline" size="sm" className="w-full" asChild disabled={!invoice.invoicePdf}>
                      {invoice.invoicePdf ? (
                        <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </a>
                      ) : (
                        <span>
                          <Download className="h-4 w-4 mr-2" />
                          Indisponível
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              ))}

              {/* Loading indicator for infinite scroll */}
              {isLoadingMore && (
                <div className="flex-shrink-0 w-[200px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Scroll hint */}
            {invoices.length > 0 && (
              <div className="text-xs text-center text-muted-foreground mt-2">
                {hasMore
                  ? '← Deslize para ver mais faturas →'
                  : `${invoices.length} fatura${invoices.length !== 1 ? 's' : ''} no total`}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
