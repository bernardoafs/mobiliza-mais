import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Download, Share2, AlertTriangle, Upload, Plus, ExternalLink, Trash2, Settings } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CampaignWithData {
  id: string;
  name: string;
  interests: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  posts: Array<{
    id: string;
    post_url: string;
    post_type: string;
    created_at: string;
    links_created?: number;
    total_clicks?: number;
  }>;
}

const AdminMaterials = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [campaignsWithData, setCampaignsWithData] = useState<CampaignWithData[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaignForLink, setSelectedCampaignForLink] = useState<string>('');
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newPostType, setNewPostType] = useState('');
  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignLink, setNewCampaignLink] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<Array<{id: string, name: string, description: string | null}>>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchCampaignsWithData();
    fetchAvailableInterests();
  }, [isAdmin, navigate]);

  const fetchAvailableInterests = async () => {
    try {
      const { data: interests, error } = await supabase
        .from('personal_interests')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableInterests(interests || []);
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const fetchCampaignsWithData = async () => {
    try {
      setLoading(true);
      
      // Buscar campanhas com seus interesses e posts
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('name');

      if (campaignsError) throw campaignsError;

      const campaignsWithData = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          // Buscar interesses da campanha
          const { data: campaignInterests, error: interestsError } = await supabase
            .from('campaign_interests')
            .select(`
              personal_interests (
                id,
                name,
                description
              )
            `)
            .eq('campaign_id', campaign.id);

          if (interestsError) throw interestsError;

          // Buscar posts da campanha
          const { data: campaignPosts, error: postsError } = await supabase
            .from('campaign_posts')
            .select('*')
            .eq('campaign_id', campaign.id)
            .order('created_at', { ascending: false });

          if (postsError) throw postsError;

          // Buscar estatísticas de cliques para cada post
          const postsWithStats = await Promise.all(
            (campaignPosts || []).map(async (post) => {
              const { data: linkStats, error: statsError } = await supabase
                .from('shortened_links')
                .select('click_count')
                .eq('campaign_post_id', post.id);

              if (statsError) {
                console.error('Error fetching link stats:', statsError);
                return {
                  ...post,
                  links_created: 0,
                  total_clicks: 0
                };
              }

              const links_created = linkStats?.length || 0;
              const total_clicks = linkStats?.reduce((sum, link) => sum + (link.click_count || 0), 0) || 0;

              return {
                ...post,
                links_created,
                total_clicks
              };
            })
          );

          return {
            ...campaign,
            interests: campaignInterests?.map(ci => ci.personal_interests).filter(Boolean) || [],
            posts: postsWithStats
          };
        })
      );

      setCampaignsWithData(campaignsWithData);
    } catch (error) {
      console.error('Error fetching campaigns data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados das campanhas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName || !newCampaignLink || selectedInterests.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos e selecione pelo menos um interesse.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create campaign
      const { data: newCampaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaignName
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Link interests to campaign
      const interestLinks = selectedInterests.map(interestId => ({
        campaign_id: newCampaign.id,
        interest_id: interestId
      }));

      const { error: interestsError } = await supabase
        .from('campaign_interests')
        .insert(interestLinks);

      if (interestsError) throw interestsError;

      // Create initial post with the provided link
      const { data: newPost, error: postError } = await supabase
        .from('campaign_posts')
        .insert({
          campaign_id: newCampaign.id,
          post_url: newCampaignLink,
          post_type: 'link'
        })
        .select()
        .single();

      if (postError) throw postError;

      // Generate shortened links
      try {
        const { data: linksResponse, error: linksError } = await supabase.functions.invoke('generate-shortened-links', {
          body: {
            campaign_post_id: newPost.id,
            post_url: newCampaignLink,
          },
        });

        if (linksError) {
          console.error('Error generating shortened links:', linksError);
        }
      } catch (linksError) {
        console.error('Error calling generate-shortened-links function:', linksError);
      }

      toast({
        title: 'Sucesso',
        description: 'Campanha criada com sucesso!',
      });

      setCreateCampaignDialogOpen(false);
      setNewCampaignName('');
      setNewCampaignLink('');
      setSelectedInterests([]);
      fetchCampaignsWithData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a campanha.',
        variant: 'destructive',
      });
    }
  };

  const handleAddPost = async () => {
    if (!selectedCampaignForLink || !newPostUrl || !newPostType) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: newPost, error } = await supabase
        .from('campaign_posts')
        .insert({
          campaign_id: selectedCampaignForLink,
          post_url: newPostUrl,
          post_type: newPostType
        })
        .select()
        .single();

      if (error) throw error;

      // Generate shortened links for all users
      try {
        const { data: linksResponse, error: linksError } = await supabase.functions.invoke('generate-shortened-links', {
          body: {
            campaign_post_id: newPost.id,
            post_url: newPostUrl,
          },
        });

        if (linksError) {
          console.error('Error generating shortened links:', linksError);
          toast({
            title: 'Aviso',
            description: 'Link adicionado, mas houve erro ao gerar links reduzidos.',
            variant: 'destructive',
          });
        } else if (linksResponse) {
          const totalClicks = linksResponse.links?.reduce((sum: number, link: any) => sum + (link.click_count || 0), 0) || 0;
          toast({
            title: 'Sucesso',
            description: `Link adicionado! ${linksResponse.links_created} links reduzidos gerados, ${totalClicks} cliques no total.`,
          });
        } else {
          toast({
            title: 'Sucesso',
            description: 'Link adicionado e links reduzidos gerados para todos os usuários.',
          });
        }
      } catch (linksError) {
        console.error('Error calling generate-shortened-links function:', linksError);
        toast({
          title: 'Aviso',
          description: 'Link adicionado, mas houve erro ao gerar links reduzidos.',
          variant: 'destructive',
        });
      }

      setDialogOpen(false);
      setNewPostUrl('');
      setNewPostType('');
      setSelectedCampaignForLink('');
      fetchCampaignsWithData();
    } catch (error) {
      console.error('Error adding post:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o link.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return;

    try {
      const { error } = await supabase
        .from('campaign_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Link removido com sucesso!',
      });

      fetchCampaignsWithData();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover link.',
        variant: 'destructive',
      });
    }
  };

  // Test Short.io API
  const testShortIoApi = async () => {
    try {
      const testUrl = 'https://www.instagram.com/reel/test123/';
      
      const { data, error } = await supabase.functions.invoke('test-shortio', {
        body: { url: testUrl }
      });

      if (error) {
        console.error('Error testing Short.io API:', error);
        toast({
          title: "Erro",
          description: `Erro ao testar API: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Sucesso",
          description: `Link encurtado: ${data.shortUrl}`,
        });
      } else {
        toast({
          title: "Erro",
          description: data?.error || "Erro desconhecido na API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao chamar função de teste",
        variant: "destructive",
      });
    }
  };

  // Regenerate all shortened links
  const regenerateAllLinks = async () => {
    if (!confirm('Tem certeza que deseja regenerar todos os links encurtados? Esta operação pode demorar alguns minutos.')) return;

    try {
      toast({
        title: 'Processando',
        description: 'Regenerando todos os links encurtados...',
      });

      // Get all campaign posts
      const { data: allPosts, error: postsError } = await supabase
        .from('campaign_posts')
        .select('id, post_url');

      if (postsError) throw postsError;

      let successCount = 0;
      let errorCount = 0;

      // Process each post
      for (const post of allPosts || []) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-shortened-links', {
            body: {
              campaign_post_id: post.id,
              post_url: post.post_url,
            },
          });

          if (error) {
            console.error(`Error processing post ${post.id}:`, error);
            errorCount++;
          } else {
            console.log(`Successfully processed post ${post.id}:`, data);
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Concluído',
        description: `${successCount} posts processados com sucesso, ${errorCount} erros. Atualizando dados...`,
      });

      // Refresh data
      fetchCampaignsWithData();
    } catch (error) {
      console.error('Error regenerating links:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao regenerar links encurtados.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
            <h2 className="text-xl font-semibold">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Gerenciar Materiais de Campanha
            </h1>
            <p className="text-muted-foreground">
              Gerencie links e materiais por campanha para distribuição via WhatsApp
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={testShortIoApi}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Testar API Short.io
            </Button>
            <Button 
              variant="default" 
              onClick={regenerateAllLinks}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Regenerar Todos Links
            </Button>
            <Dialog open={createCampaignDialogOpen} onOpenChange={setCreateCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Campanha</DialogTitle>
                  <DialogDescription>
                    Crie uma nova campanha com interesses e link inicial
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaignName">Nome da Campanha</Label>
                    <Input
                      id="campaignName"
                      placeholder="Ex: Saúde em Minas"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaignLink">Link Inicial</Label>
                    <Input
                      id="campaignLink"
                      placeholder="https://..."
                      value={newCampaignLink}
                      onChange={(e) => setNewCampaignLink(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Interesses Vinculados</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                      {availableInterests.map((interest) => (
                        <label key={interest.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedInterests.includes(interest.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInterests([...selectedInterests, interest.id]);
                              } else {
                                setSelectedInterests(selectedInterests.filter(id => id !== interest.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span>{interest.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateCampaign} className="w-full">
                    Criar Campanha
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Link</DialogTitle>
                  <DialogDescription>
                    Adicione um novo link de material para uma campanha
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign">Campanha</Label>
                    <Select value={selectedCampaignForLink} onValueChange={setSelectedCampaignForLink}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma campanha..." />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignsWithData.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="url">URL do Material</Label>
                    <Input
                      id="url"
                      placeholder="https://..."
                      value={newPostUrl}
                      onChange={(e) => setNewPostUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo de Material</Label>
                    <Select value={newPostType} onValueChange={setNewPostType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddPost} className="w-full">
                    Adicionar Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Campaign Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Campanhas</CardTitle>
            <CardDescription>
              Selecione uma campanha específica ou visualize todas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma campanha..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as campanhas</SelectItem>
                {campaignsWithData.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaignsWithData
            .filter(campaign => selectedCampaign === 'all' || campaign.id === selectedCampaign)
            .map((campaign) => (
            <Card key={campaign.id} className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      {campaign.name}
                    </CardTitle>
                    <CardDescription>
                      {campaign.interests.length} interesse(s) vinculado(s) • {campaign.posts.length} link(s) disponível(is)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Interesses vinculados */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Interesses Vinculados:</h4>
                  {campaign.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {campaign.interests.map((interest) => (
                        <Badge key={interest.id} variant="secondary" className="text-xs">
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum interesse vinculado</p>
                  )}
                </div>

                {/* Links/Materiais */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Links de Materiais:</h4>
                  {campaign.posts.length > 0 ? (
                    <div className="space-y-2">
                      {campaign.posts.map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {post.post_type}
                              </Badge>
                              <span className="truncate text-muted-foreground">
                                {post.post_url}
                              </span>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>📊 {post.links_created || 0} links criados</span>
                              <span>👆 {post.total_clicks || 0} cliques ({post.links_created && post.links_created > 0 ? Math.round(((post.total_clicks || 0) / post.links_created) * 100) : 0}%)</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(post.post_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum link cadastrado</p>
                  )}
                </div>

                {/* Botão para adicionar novo link */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedCampaignForLink(campaign.id);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {campaignsWithData.filter(campaign => selectedCampaign === 'all' || campaign.id === selectedCampaign).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma campanha encontrada.</p>
            </CardContent>
          </Card>
        )}

        {/* Distribution Info */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona a distribuição</CardTitle>
            <CardDescription>
              Entenda como os materiais são enviados automaticamente via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">1. Vincule Interesses</h4>
                <p className="text-sm text-muted-foreground">
                  Cada campanha deve ter interesses definidos para identificar o público-alvo
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <h4 className="font-semibold text-success mb-2">2. Adicione Materiais</h4>
                <p className="text-sm text-muted-foreground">
                  Cadastre links de materiais (imagens, vídeos, documentos) para cada campanha
                </p>
              </div>
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <h4 className="font-semibold text-warning mb-2">3. Distribuição Automática</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema identifica usuários com interesses compatíveis e envia materiais via WhatsApp
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMaterials;