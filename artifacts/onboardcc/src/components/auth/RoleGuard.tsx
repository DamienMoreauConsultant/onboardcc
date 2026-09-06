import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { SessionUser } from '@/api/auth';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export const RoleGuard = ({ allowedRoles, children }: { allowedRoles: SessionUser['role_applicatif'][], children: ReactNode }) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation('/login');
      } else if (!allowedRoles.includes(user.role_applicatif)) {
        // Redirect to appropriate home
        switch (user.role_applicatif) {
          case 'RECRUTEUR': setLocation('/recruteur'); break;
          case 'CM': setLocation('/cm'); break;
          case 'CANDIDAT': setLocation('/candidat/accueil'); break;
          case 'ADMIN': setLocation('/admin/referentiels'); break;
          default: setLocation('/login');
        }
      }
    }
  }, [user, loading, allowedRoles, setLocation]);

  if (loading || !user || !allowedRoles.includes(user.role_applicatif)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};
