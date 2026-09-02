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
import PostesList from '@/pages/postes/PostesList';
import PosteImport from '@/pages/postes/PosteImport';
import PosteDetail from '@/pages/postes/PosteDetail';
import CandidatsList from '@/pages/candidats/CandidatsList';
import CandidatImport from '@/pages/candidats/CandidatImport';
import CandidatDetail from '@/pages/candidats/CandidatDetail';
import OpportuniteDetail from '@/pages/opportunites/OpportuniteDetail';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/recruteur">
        <RoleGuard allowedRoles={['REC']}>
          <AppLayout>
            <CandidatsList />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/recruteur/candidats/import">
        <RoleGuard allowedRoles={['REC']}><AppLayout><CandidatImport /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/opportunites/:id">
        <RoleGuard allowedRoles={['REC', 'CHZ']}><AppLayout><OpportuniteDetail mode="recruteur" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/candidats/:id">
        <RoleGuard allowedRoles={['REC']}><AppLayout><CandidatDetail mode="recruteur" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/candidats">
        <RoleGuard allowedRoles={['REC']}><AppLayout><CandidatsList /></AppLayout></RoleGuard>
      </Route>
      <Route path="/recruteur/postes/import">
        <RoleGuard allowedRoles={['REC', 'CHZ']}>
          <AppLayout><PosteImport /></AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/recruteur/postes/:id">
        <RoleGuard allowedRoles={['REC', 'CHZ']}>
          <AppLayout><PosteDetail mode="recruteur" /></AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/recruteur/postes">
        <RoleGuard allowedRoles={['REC', 'CHZ']}>
          <AppLayout><PostesList mode="recruteur" /></AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/cm">
        <RoleGuard allowedRoles={['CM1', 'CM2', 'CHZ']}>
          <AppLayout>
            <ChargeMission />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/cm/postes/:id">
        <RoleGuard allowedRoles={['CM1', 'CM2', 'CHZ']}>
          <AppLayout><PosteDetail mode="cm" /></AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/cm/opportunites/:id">
        <RoleGuard allowedRoles={['CM1', 'CM2', 'CHZ']}><AppLayout><OpportuniteDetail mode="cm" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/cm/postes">
        <RoleGuard allowedRoles={['CM1', 'CM2', 'CHZ']}>
          <AppLayout><PostesList mode="cm" /></AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/candidat/accueil">
        <RoleGuard allowedRoles={['CAN']}>
          <AppLayout>
            <Candidate />
          </AppLayout>
        </RoleGuard>
      </Route>
      <Route path="/candidat/opportunites/:id">
        <RoleGuard allowedRoles={['CAN']}><AppLayout><OpportuniteDetail mode="candidat" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/candidat/voeux">
        <RoleGuard allowedRoles={['CAN']}><AppLayout><CandidatDetail mode="candidat" initialSection="voeux" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/candidat/etat-civil">
        <RoleGuard allowedRoles={['CAN']}><AppLayout><CandidatDetail mode="candidat" initialSection="etat-civil" /></AppLayout></RoleGuard>
      </Route>
      <Route path="/candidat/projet">
        <RoleGuard allowedRoles={['CAN']}><AppLayout><CandidatDetail mode="candidat" initialSection="projet" /></AppLayout></RoleGuard>
      </Route>

      <Route path="/admin/referentiels">
        <RoleGuard allowedRoles={['ADMIN']}>
          <AppLayout>
            <AdminReferentiels />
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
