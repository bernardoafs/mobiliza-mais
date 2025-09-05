import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Target, 
  Megaphone, 
  Smartphone, 
  BarChart3, 
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Mobilização Organizada',
      description: 'Conecte-se com outros ativistas e coordene ações políticas eficazes'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Campanhas Direcionadas',
      description: 'Participe de campanhas específicas baseadas em seus interesses políticos'
    },
    {
      icon: <Megaphone className="h-6 w-6" />,
      title: 'Materiais de Divulgação',
      description: 'Acesse conteúdos prontos para compartilhar em suas redes sociais'
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: 'Integração Social',
      description: 'Conecte suas redes sociais para maximizar o alcance das mensagens'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Acompanhamento',
      description: 'Monitore o impacto de suas ações e veja estatísticas em tempo real'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Segurança e Privacidade',
      description: 'Seus dados estão protegidos com as melhores práticas de segurança'
    }
  ];

  const benefits = [
    'Participe de uma rede nacional de ativistas digitais',
    'Receba materiais exclusivos e atualizados regularmente',
    'Acompanhe o impacto das suas ações em tempo real',
    'Conecte-se com pessoas que compartilham seus interesses',
    'Contribua para mudanças políticas significativas'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary opacity-90"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Mobilização Digital
            <span className="block text-primary-foreground/90">que Transforma</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Junte-se à maior plataforma de mobilização política digital do país. 
            Sua voz pode fazer a diferença.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/dashboard')}
              >
                Ir para Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="text-lg px-8 py-4"
                  onClick={() => navigate('/auth')}
                >
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => navigate('/auth')}
                >
                  Fazer Login
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Como Funciona a Plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Uma ferramenta completa para organizar, executar e medir o impacto 
              de suas ações políticas digitais
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Por que Participar?
            </h2>
            <p className="text-xl text-muted-foreground">
              Benefícios exclusivos para membros da nossa comunidade
            </p>
          </div>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                <div className="p-2 bg-success/10 rounded-full">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <p className="text-lg font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <Card className="p-8">
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <p className="text-muted-foreground">Ativistas Conectados</p>
              </CardContent>
            </Card>
            <Card className="p-8">
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Campanhas Realizadas</p>
              </CardContent>
            </Card>
            <Card className="p-8">
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-primary mb-2">2M+</div>
                <p className="text-muted-foreground">Pessoas Alcançadas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Fazer a Diferença?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Cadastre-se agora e comece a participar de campanhas que realmente importam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/auth')}
              >
                Criar Conta Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-muted/30 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Mobilização Digital
              </h3>
              <p className="text-muted-foreground">
                Conectando ativistas para transformar a política através da tecnologia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Como funciona</li>
                <li>Campanhas</li>
                <li>Materiais</li>
                <li>Comunidade</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Central de Ajuda</li>
                <li>Contato</li>
                <li>Privacidade</li>
                <li>Termos de Uso</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>&copy; 2024 Mobilização Digital. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
