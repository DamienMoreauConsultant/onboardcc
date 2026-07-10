import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { AppLayout } from '@/components/layout/AppLayout';

import Login from '@/pages/Login';
import Recruiter from '@/pages/Recruiter';
import ChargeMission from '@/pages/ChargeMission';
import Candidate from '@/pages/Candidate';
import AdminReferentiels from '@/pages/admin/AdminReferentiels';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/recruteur">
        <RoleGuard allowedRoles={['REC']}>
          <AppLayout>
            <Recruiter />
          </AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/cm">
        <RoleGuard allowedRoles={['CM1', 'CM2', 'CHZ']}>
          <AppLayout>
            <ChargeMission />
          </AppLayout>
        </RoleGuard>
      </Route>

      <Route path="/candidat/accueil">
        <RoleGuard allowedRoles={['CAN']}>
          <AppLayout>
            <Candidate />
          </AppLayout>
        </RoleGuard>
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
