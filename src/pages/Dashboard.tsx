import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, CheckCircle, Clock, Target, Copy, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  first_name: string;
  last_name: string;
  city: string;
  state: string;
  whatsapp_phone: string;
}

interface UserInterest {
  personal_interests: {
    name: string;
  };
}

interface Campaign {
  id: string;
  name: string;
}

interface WhatsAppLink {
  id: string;
  campaign_id: string | null;
  whatsapp_link: string;
  created_at: string;
  campaigns?: {
    name: string;
  };
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsAppLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, city, state, whatsapp_phone')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Fetch user interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select(`
          personal_interests (
            name
          )
        `)
        .eq('user_id', user.id);

      if (interestsError) {
        console.error('Error fetching interests:', interestsError);
      } else {
        setUserInterests(interestsData || []);
      }

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name', { ascending: true });

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
      } else {
        setCampaigns(campaignsData || []);
      }

      // Fetch WhatsApp links
      const { data: linksData, error: linksError } = await supabase
        .from('whatsapp_links')
        .select(`
          id, 
          campaign_id, 
          whatsapp_link, 
          created_at,
          campaigns (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (linksError) {
        console.error('Error fetching WhatsApp links:', linksError);
      } else {
        setWhatsappLinks(linksData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppLink = (campaignName: string) => {
    if (!profile || !user) return '';
    
    const baseUrl = 'https://api.whatsapp.com/send';
    const phone = profile.whatsapp_phone.replace(/\D/g, ''); // Remove non-digits
    const message = `Oi, o ${profile.first_name} ${profile.last_name} (${user.id}) me indicou para participar da mobilização da campanha ${campaignName}.`;
    
    return `${baseUrl}?phone=${phone}&text=${encodeURIComponent(message)}`;
  };

  const createWhatsAppLink = async () => {
    if (!selectedCampaignId || !user || !profile) return;

    const whatsappLink = generateWhatsAppLink(selectedCampaign.name);
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_links')
        .insert({
          user_id: user.id,
          campaign_id: selectedCampaignId,
          whatsapp_link: whatsappLink
        })
        .select(`
          id, 
          campaign_id, 
          whatsapp_link, 
          created_at,
          campaigns (
            name
          )
        `)
        .single();

      if (error) {
        console.error('Error creating WhatsApp link:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o link do WhatsApp.',
          variant: 'destructive',
        });
        return;
      }

      setWhatsappLinks(prev => [data, ...prev]);
      setSelectedCampaignId('');
      toast({
        title: 'Link criado',
        description: 'Link do WhatsApp criado com sucesso!',
      });
    } catch (error) {
      console.error('Error creating WhatsApp link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o link do WhatsApp.',
        variant: 'destructive',
      });
    }
  };

  const deleteWhatsAppLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('Error deleting WhatsApp link:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o link.',
          variant: 'destructive',
        });
        return;
      }

      setWhatsappLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: 'Link excluído',
        description: 'Link do WhatsApp excluído com sucesso!',
      });
    } catch (error) {
      console.error('Error deleting WhatsApp link:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: 'Link copiado para a área de transferência.',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
    });
    navigate('/');
  };

  const handleCompleteProfile = () => {
    navigate('/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no profile exists, redirect to complete registration
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Complete seu perfil
              </CardTitle>
              <CardDescription>
                Para continuar, você precisa completar suas informações pessoais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCompleteProfile} className="w-full">
                Completar Cadastro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Olá, {profile.first_name}!
            </h1>
            <p className="text-muted-foreground">
              {profile.city}, {profile.state}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% do mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Aguardando sua ação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontuação</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total de pontos ganhos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Seus Interesses</CardTitle>
              <CardDescription>
                Áreas de interesse para mobilização política
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userInterests.map((userInterest, index) => (
                  <Badge key={index} variant="secondary">
                    {userInterest.personal_interests.name}
                  </Badge>
                ))}
                {userInterests.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Nenhum interesse cadastrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarefas Recentes</CardTitle>
              <CardDescription>
                Suas atividades de mobilização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Compartilhar conteúdo no Instagram</p>
                    <p className="text-sm text-muted-foreground">
                      Pendente - Prazo: 2 dias
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-warning rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Participar de pesquisa</p>
                    <p className="text-sm text-muted-foreground">
                      Pendente - Prazo: 5 dias
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Convidar 3 amigos</p>
                    <p className="text-sm text-muted-foreground">
                      Pendente - Prazo: 1 semana
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="mr-2 h-5 w-5" />
                Links de Mobilização WhatsApp
              </CardTitle>
              <CardDescription>
                Crie links personalizados para compartilhar e mobilizar contatos via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="campaign">Selecionar Campanha</Label>
                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma campanha..." />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={createWhatsAppLink}
                      disabled={!selectedCampaignId}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Link
                    </Button>
                  </div>
                </div>

                {whatsappLinks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Seus Links:</h4>
                    {whatsappLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{link.campaigns?.name || 'Campanha não encontrada'}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {link.whatsapp_link}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(link.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(link.whatsapp_link)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(link.whatsapp_link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteWhatsAppLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {whatsappLinks.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Nenhum link criado ainda. Crie seu primeiro link de mobilização!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/materials')} 
            className="h-12"
            variant="default"
          >
            Acessar Materiais de Divulgação
          </Button>
          <Button 
            onClick={() => navigate('/register')} 
            className="h-12"
            variant="outline"
          >
            Atualizar Perfil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;