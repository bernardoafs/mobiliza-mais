import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PersonalInterest {
  id: string;
  name: string;
  description: string | null;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const Register = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState<PersonalInterest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    const { data, error } = await supabase
      .from('personal_interests')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching interests:', error);
    } else {
      setInterests(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const profileData = {
      user_id: user.id,
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      voting_state: formData.get('votingState') as string,
      whatsapp_phone: formData.get('whatsappPhone') as string,
      instagram_user: formData.get('instagramUser') as string,
      tiktok_user: formData.get('tiktokUser') as string,
      was_candidate: formData.get('wasCandidate') === 'on',
      will_be_candidate: formData.get('willBeCandidate') === 'on',
      political_party: formData.get('politicalParty') as string || null,
    };

    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) throw profileError;

      // Create user interests relationships
      if (selectedInterests.length > 0) {
        const userInterests = selectedInterests.map(interestId => ({
          user_id: user.id,
          interest_id: interestId,
        }));

        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(userInterests);

        if (interestsError) throw interestsError;
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Seu perfil foi criado. Bem-vindo à plataforma!',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInterestChange = (interestId: string, checked: boolean) => {
    if (checked) {
      setSelectedInterests([...selectedInterests, interestId]);
    } else {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Complete seu Cadastro
            </CardTitle>
            <CardDescription>
              Preencha suas informações para participar da mobilização digital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Primeiro Nome *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="João"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Silva"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade onde mora *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado onde mora *</Label>
                  <Select name="state" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="votingState">Estado onde vota *</Label>
                <Select name="votingState" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado onde vota" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappPhone">Número do WhatsApp *</Label>
                <Input
                  id="whatsappPhone"
                  name="whatsappPhone"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagramUser">Usuário do Instagram *</Label>
                  <Input
                    id="instagramUser"
                    name="instagramUser"
                    placeholder="@seuperfil"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktokUser">Usuário do TikTok *</Label>
                  <Input
                    id="tiktokUser"
                    name="tiktokUser"
                    placeholder="@seuperfil"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Interesses Pessoais *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {interests.map((interest) => (
                    <div key={interest.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest.id}
                        checked={selectedInterests.includes(interest.id)}
                        onCheckedChange={(checked) =>
                          handleInterestChange(interest.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={interest.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {interest.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Informações Políticas (Opcional)</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="wasCandidate" name="wasCandidate" />
                  <Label htmlFor="wasCandidate" className="text-sm font-normal">
                    Já foi candidato
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="willBeCandidate" name="willBeCandidate" />
                  <Label htmlFor="willBeCandidate" className="text-sm font-normal">
                    Será candidato na próxima eleição
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="politicalParty">Partido político (se filiado)</Label>
                  <Input
                    id="politicalParty"
                    name="politicalParty"
                    placeholder="Ex: PT, PSDB, etc."
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalizar Cadastro
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;