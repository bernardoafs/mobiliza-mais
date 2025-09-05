import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Globe } from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminDomains() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    fetchDomains();
  }, [isAdmin, navigate]);

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os domínios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um domínio válido.',
        variant: 'destructive',
      });
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    if (!domainRegex.test(newDomain.trim())) {
      toast({
        title: 'Erro',
        description: 'Formato de domínio inválido.',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('admin_domains')
        .insert({
          domain: newDomain.trim().toLowerCase(),
          is_active: domains.length === 0, // First domain becomes active automatically
        });

      if (error) throw error;

      setNewDomain('');
      await fetchDomains();
      toast({
        title: 'Sucesso',
        description: 'Domínio adicionado com sucesso.',
      });
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast({
        title: 'Erro',
        description: error.message === 'duplicate key value violates unique constraint "admin_domains_domain_key"' 
          ? 'Este domínio já está cadastrado.'
          : 'Não foi possível adicionar o domínio.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (domainId: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Deactivate all other domains first
        await supabase
          .from('admin_domains')
          .update({ is_active: false })
          .neq('id', domainId);
      }

      const { error } = await supabase
        .from('admin_domains')
        .update({ is_active: isActive })
        .eq('id', domainId);

      if (error) throw error;

      await fetchDomains();
      toast({
        title: 'Sucesso',
        description: isActive ? 'Domínio ativado com sucesso.' : 'Domínio desativado com sucesso.',
      });
    } catch (error) {
      console.error('Error toggling domain status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do domínio.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Tem certeza que deseja excluir este domínio? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      await fetchDomains();
      toast({
        title: 'Sucesso',
        description: 'Domínio excluído com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o domínio.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
              <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Domínios</h1>
          <p className="text-muted-foreground mt-2">
            Configure os domínios para geração de links reduzidos
          </p>
        </div>

        {/* Add New Domain */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Novo Domínio
            </CardTitle>
            <CardDescription>
              Digite o domínio que será usado para gerar os links reduzidos (ex: short.meusite.com)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  placeholder="exemplo.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddDomain} disabled={adding}>
                  {adding ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domains List */}
        <div className="grid gap-4">
          {domains.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum domínio cadastrado</h3>
                <p className="text-muted-foreground">
                  Adicione um domínio para começar a gerar links reduzidos
                </p>
              </CardContent>
            </Card>
          ) : (
            domains.map((domain) => (
              <Card key={domain.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{domain.domain}</h3>
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(domain.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {domain.is_active && (
                        <Badge variant="default">Ativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${domain.id}`} className="text-sm">
                          Ativo
                        </Label>
                        <Switch
                          id={`active-${domain.id}`}
                          checked={domain.is_active}
                          onCheckedChange={(checked) => handleToggleActive(domain.id, checked)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como configurar seu domínio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Configure o DNS</h4>
                <p className="text-muted-foreground">
                  Adicione um registro A no seu DNS apontando para o IP do servidor onde está hospedado o sistema de redirecionamento.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Ative o domínio</h4>
                <p className="text-muted-foreground">
                  Apenas um domínio pode estar ativo por vez. Ele será usado para gerar todos os novos links reduzidos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Links automáticos</h4>
                <p className="text-muted-foreground">
                  Quando você adicionar um novo material, o sistema automaticamente gerará links reduzidos personalizados para cada usuário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}