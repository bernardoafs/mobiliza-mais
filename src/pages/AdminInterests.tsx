import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

interface PersonalInterest {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const AdminInterests = () => {
  const { toast } = useToast();
  const [interests, setInterests] = useState<PersonalInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<PersonalInterest | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('personal_interests')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching interests:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar interesses',
        variant: 'destructive',
      });
    } else {
      setInterests(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      if (editingInterest) {
        // Update existing interest
        const { error } = await supabase
          .from('personal_interests')
          .update({ name, description: description || null })
          .eq('id', editingInterest.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Interesse atualizado com sucesso',
        });
      } else {
        // Create new interest
        const { error } = await supabase
          .from('personal_interests')
          .insert({ name, description: description || null });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Interesse criado com sucesso',
        });
      }

      setDialogOpen(false);
      setEditingInterest(null);
      fetchInterests();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (interest: PersonalInterest) => {
    setEditingInterest(interest);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este interesse?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('personal_interests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Interesse excluído com sucesso',
      });
      fetchInterests();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingInterest(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Administração de Interesses
            </h1>
            <p className="text-muted-foreground">
              Gerencie os interesses pessoais disponíveis para os usuários
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingInterest(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Interesse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingInterest ? 'Editar Interesse' : 'Novo Interesse'}
                </DialogTitle>
                <DialogDescription>
                  {editingInterest 
                    ? 'Edite as informações do interesse' 
                    : 'Adicione um novo interesse pessoal para os usuários'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Educação"
                    defaultValue={editingInterest?.name || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descrição do interesse..."
                    defaultValue={editingInterest?.description || ''}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={formLoading}>
                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingInterest ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interesses Cadastrados</CardTitle>
            <CardDescription>
              Total de {interests.length} interesses disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interests.map((interest) => (
                  <TableRow key={interest.id}>
                    <TableCell className="font-medium">
                      {interest.name}
                    </TableCell>
                    <TableCell>
                      {interest.description || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(interest.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(interest)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(interest.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {interests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum interesse cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminInterests;