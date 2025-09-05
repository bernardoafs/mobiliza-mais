import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Download, Share2, Image, Video, FileText, Megaphone, AlertTriangle, Upload, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
}

const AdminMaterials = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchCampaigns();
  }, [isAdmin, navigate]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('name');

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as campanhas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const materialsCategories = [
    {
      title: 'Posts para Redes Sociais',
      description: 'Conteúdos prontos para Instagram, Facebook e TikTok',
      icon: <Image className="h-6 w-6" />,
      items: [
        { name: 'Stories Informativos', type: 'Imagem', size: '1080x1920', count: 15 },
        { name: 'Posts Quadrados', type: 'Imagem', size: '1080x1080', count: 20 },
        { name: 'Carrosséis Educativos', type: 'Imagem', size: '1080x1080', count: 8 },
      ]
    },
    {
      title: 'Vídeos e Reels',
      description: 'Conteúdo audiovisual para engajamento',
      icon: <Video className="h-6 w-6" />,
      items: [
        { name: 'Reels Motivacionais', type: 'Vídeo', size: 'HD', count: 12 },
        { name: 'Vídeos Explicativos', type: 'Vídeo', size: 'Full HD', count: 6 },
        { name: 'Stories Animados', type: 'Vídeo', size: 'HD', count: 10 },
      ]
    },
    {
      title: 'Materiais Informativos',
      description: 'Documentos e infográficos educativos',
      icon: <FileText className="h-6 w-6" />,
      items: [
        { name: 'Cartilha de Direitos', type: 'PDF', size: 'A4', count: 1 },
        { name: 'Infográficos', type: 'Imagem', size: '1080x1350', count: 25 },
        { name: 'Guia de Participação', type: 'PDF', size: 'A4', count: 1 },
      ]
    },
    {
      title: 'Campanhas Especiais',
      description: 'Materiais para campanhas temáticas',
      icon: <Megaphone className="h-6 w-6" />,
      items: [
        { name: 'Campanha Educação', type: 'Kit', size: 'Variado', count: 8 },
        { name: 'Campanha Saúde', type: 'Kit', size: 'Variado', count: 6 },
        { name: 'Campanha Meio Ambiente', type: 'Kit', size: 'Variado', count: 10 },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Gerenciar Materiais
            </h1>
            <p className="text-muted-foreground">
              Gerencie materiais de campanha e distribua via WhatsApp
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Material
          </Button>
        </div>

        {/* Campaign Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar por Campanha</CardTitle>
            <CardDescription>
              Selecione uma campanha para ver os materiais relacionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as campanhas</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Enviar Arquivos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {materialsCategories.map((category, index) => (
            <Card key={index} className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.size}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item.count} arquivos
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                <h4 className="font-semibold text-primary mb-2">1. Vincule à Campanha</h4>
                <p className="text-sm text-muted-foreground">
                  Cada material é vinculado a uma campanha específica com interesses definidos
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <h4 className="font-semibold text-success mb-2">2. Identificação de Usuários</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema identifica usuários com interesses compatíveis com a campanha
                </p>
              </div>
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <h4 className="font-semibold text-warning mb-2">3. Envio Automático</h4>
                <p className="text-sm text-muted-foreground">
                  Materiais são enviados automaticamente via WhatsApp para usuários selecionados
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