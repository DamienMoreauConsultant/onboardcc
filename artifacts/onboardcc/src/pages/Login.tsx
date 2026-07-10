import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      switch (user.role) {
        case 'REC': setLocation('/recruteur'); break;
        case 'CM1':
        case 'CM2':
        case 'CHZ': setLocation('/cm'); break;
        case 'CAN': setLocation('/candidat/accueil'); break;
        case 'ADMIN': setLocation('/admin/referentiels'); break;
      }
    }
  }, [user, loading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) return;
    
    setIsSubmitting(true);
    try {
      await login({ login: loginId, password });
    } catch (error) {
      // Error is handled by context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null; // Prevent flash before redirect

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left side - Branding */}
      <div className="md:w-1/2 bg-sidebar text-sidebar-foreground flex flex-col p-8 md:p-16 justify-between relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sidebar-accent rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sidebar-primary rounded-full blur-[100px] opacity-20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 bg-sidebar-primary rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-sidebar-primary-foreground font-display font-bold text-2xl tracking-wider">DCC</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wide">onboard<span className="text-sidebar-primary">cc</span></h1>
            <p className="text-xs text-sidebar-foreground/70 uppercase tracking-widest font-medium">Portail de recrutement</p>
          </div>
        </div>

        <div className="relative z-10 my-16 md:my-0">
          <Globe className="h-16 w-16 text-sidebar-primary mb-6 opacity-90" />
          <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-4">
            Le volontariat <br/>qui change le monde.
          </h2>
          <p className="text-lg text-sidebar-foreground/80 max-w-md leading-relaxed">
            Connectez-vous pour gérer les candidatures, organiser les missions et accompagner nos volontaires dans leur parcours d'engagement.
          </p>
        </div>

        <div className="relative z-10 text-sm text-sidebar-foreground/50 font-medium">
          &copy; {new Date().getFullYear()} Délégation Catholique pour la Coopération
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-muted/20">
        <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">Bon retour</h3>
            <p className="text-muted-foreground text-sm">Saisissez vos identifiants pour accéder à votre espace de travail.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login">Identifiant ou Email</Label>
              <Input 
                id="login" 
                placeholder="prenom.nom@ladcc.org" 
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">Mot de passe oublié?</a>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isSubmitting || !loginId || !password}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connexion en cours...</>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
