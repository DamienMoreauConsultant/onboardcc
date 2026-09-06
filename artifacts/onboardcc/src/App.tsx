import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { AppLayout } from '@/components/layout/AppLayout';

import Login from '@/pages/Login';
import ChargeMission from '@/pages/ChargeMission';
import Candidate from '@/pages/Candidate';
import AdminReferentiels from '@/pages/admin/AdminReferentiels';
import AdminUtilisateurs from '@/pages/admin/AdminUtilisateurs';
import PostesList from '@/pages/postes/PostesList';
import PosteImport from '@/pages/postes/PosteImport';
import PosteDetail from '@/pages/postes/PosteDetail';
import CandidatsList from '@/pages/candidats/CandidatsList';
import CandidatImport from '@/pages/candidats/CandidatImport';
import CandidatDetail from '@/pages/candidats/CandidatDetail';
import OpportuniteDetail from '@/pages/opportunites/OpportuniteDetail';
import Recruiter from '@/pages/Recruiter';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/recruteur">
        <RoleGuard allowedRoles={['RECRUTEUR']}>
          <AppLayout>
            <Recruiter />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/recruteur/candidats/import">
        <RoleGuard allowedRoles={['RECRUTEUR']}><AppLayout><CandidatImport /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/opportunites/:id">
        <RoleGuard allowedRoles={['RECRUTEUR']}><AppLayout><OpportuniteDetail mode="recruteur" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/candidats/:id">
        <RoleGuard allowedRoles={['RECRUTEUR']}><AppLayout><CandidatDetail mode="recruteur" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/candidats">
        <RoleGuard allowedRoles={['RECRUTEUR']}><AppLayout><CandidatsList /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/postes/import">
        <RoleGuard allowedRoles={['RECRUTEUR']}>
          <AppLayout><PosteImport /></AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/recruteur/postes/:id">
        <RoleGuard allowedRoles={['RECRUTEUR']}>
          <AppLayout><PosteDetail mode="recruteur" /></AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/recruteur/postes">
        <RoleGuard allowedRoles={['RECRUTEUR']}>
          <AppLayout><PostesList mode="recruteur" /></AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/cm">
        <RoleGuard allowedRoles={['CM']}>
          <AppLayout>
            <ChargeMission />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/cm/postes/:id">
        <RoleGuard allowedRoles={['CM']}>
          <AppLayout><PosteDetail mode="cm" /></AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/cm/opportunites/:id">
        <RoleGuard allowedRoles={['CM']}><AppLayout><OpportuniteDetail mode="cm" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/cm/candidats/:id">
        <RoleGuard allowedRoles={['CM']}><AppLayout><CandidatDetail mode="cm" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/cm/postes">
        <RoleGuard allowedRoles={['CM']}>
          <AppLayout><PostesList mode="cm" /></AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/candidat/accueil">
        <RoleGuard allowedRoles={['CANDIDAT']}>
          <AppLayout>
            <Candidate />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/candidat/opportunites/:id">
        <RoleGuard allowedRoles={['CANDIDAT']}><AppLayout><OpportuniteDetail mode="candidat" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/candidat/voeux">
        <RoleGuard allowedRoles={['CANDIDAT']}><AppLayout><CandidatDetail mode="candidat" initialSection="voeux" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/candidat/etat-civil">
        <RoleGuard allowedRoles={['CANDIDAT']}><AppLayout><CandidatDetail mode="candidat" initialSection="etat-civil" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/candidat/projet">
        <RoleGuard allowedRoles={['CANDIDAT']}><AppLayout><CandidatDetail mode="candidat" initialSection="projet" /></AppLayout></RoleGuard>
      </Route>

      <Route path="/admin/referentiels">
        <RoleGuard allowedRoles={['ADMIN']}>
          <AppLayout>
            <AdminReferentiels />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/admin/utilisateurs">
        <RoleGuard allowedRoles={['ADMIN']}>
          <AppLayout>
            <AdminUtilisateurs />
          </AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/">
        <Login />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
