import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Database, User, Briefcase, GraduationCap, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'REC':
        return [
          { label: 'Candidats', href: '/recruteur/candidats', icon: Users },
          { label: 'Postes', href: '/recruteur/postes', icon: Briefcase },
        ];
      case 'CM1':
      case 'CM2':
      case 'CHZ':
        return [
          { label: 'Missions', href: '/cm', icon: Briefcase },
          { label: 'Mes postes', href: '/cm/postes', icon: Briefcase },
        ];
      case 'CAN':
        return [
          { label: 'Mon espace', href: '/candidat/accueil', icon: GraduationCap },
          { label: 'Ma fiche de vœux', href: '/candidat/voeux', icon: User },
        ];
      case 'ADMIN':
        return [
          { label: 'Référentiels', href: '/admin/referentiels', icon: Database },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-sidebar-primary rounded-md flex items-center justify-center shadow-sm">
            <span className="text-sidebar-primary-foreground font-display font-bold text-xl tracking-wider">DCC</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-wide">onboard<span className="text-sidebar-primary">cc</span></h1>
            <p className="text-xs text-sidebar-foreground/70 opacity-80 uppercase tracking-widest font-medium">Recrutement</p>
          </div>
        </div>
        
        <Separator className="bg-sidebar-border" />
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm ${location.startsWith(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/80 hover:bg-sidebar-border hover:text-sidebar-foreground'}`}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 bg-sidebar-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9 border border-sidebar-border/50">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {getInitials(user.prenom, user.nom)}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user.prenom} {user.nom}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate font-medium uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </div>
      </main>
    </div>
  );
};
