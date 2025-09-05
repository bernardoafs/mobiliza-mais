import { useAuth } from './useAuth';

export const useAdmin = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.email === 'bernardoafs@gmail.com';
  
  return { isAdmin };
};