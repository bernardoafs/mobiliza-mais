import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Settings, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Card className="p-4 mb-6">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={isActive('/dashboard') ? 'default' : 'outline'}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
        
        <Button
          variant={isActive('/materials') ? 'default' : 'outline'}
          onClick={() => navigate('/materials')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Materiais
        </Button>
        
        {isAdmin && (
          <Button
            variant={isActive('/admin/interests') ? 'default' : 'outline'}
            onClick={() => navigate('/admin/interests')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Administração
          </Button>
        )}
      </div>
    </Card>
  );
};

export default Navigation;