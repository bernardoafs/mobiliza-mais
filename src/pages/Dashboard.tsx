import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, CheckCircle, Clock, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  first_name: string;
  last_name: string;
  city: string;
  state: string;
}

interface UserInterest {
  personal_interests: {
    name: string;
  };
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('first_name, last_name, city, state')
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
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
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