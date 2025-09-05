import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Image, Video, FileText, Megaphone } from 'lucide-react';
import Navigation from '@/components/Navigation';

const Materials = () => {
  const navigate = useNavigate();

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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary">
            Materiais de Divulgação
          </h1>
        </div>
        <p className="text-muted-foreground">
          Acesse e baixe materiais prontos para suas redes sociais
        </p>

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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como usar os materiais</CardTitle>
            <CardDescription>
              Dicas importantes para maximizar o impacto dos seus posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <h4 className="font-semibold text-success mb-2">✓ Personalize</h4>
                <p className="text-sm text-muted-foreground">
                  Adicione sua marca pessoal aos materiais antes de compartilhar
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">📅 Planeje</h4>
                <p className="text-sm text-muted-foreground">
                  Use um cronograma para distribuir o conteúdo ao longo da semana
                </p>
              </div>
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <h4 className="font-semibold text-warning mb-2">💬 Engaje</h4>
                <p className="text-sm text-muted-foreground">
                  Responda comentários e compartilhe suas próprias experiências
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Materials;