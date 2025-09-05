import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

export default function Redirect() {
  const { shortCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setError('Código inválido');
        setLoading(false);
        return;
      }

      try {
        // Find the shortened link
        const { data: link, error: linkError } = await supabase
          .from('shortened_links')
          .select('original_url, click_count, id')
          .eq('short_code', shortCode)
          .single();

        if (linkError || !link) {
          setError('Link não encontrado');
          setLoading(false);
          return;
        }

        // Update click count
        await supabase
          .from('shortened_links')
          .update({ click_count: link.click_count + 1 })
          .eq('id', link.id);

        // Redirect to original URL
        window.location.href = link.original_url;
      } catch (error) {
        console.error('Error handling redirect:', error);
        setError('Erro ao processar redirecionamento');
        setLoading(false);
      }
    };

    handleRedirect();
  }, [shortCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}