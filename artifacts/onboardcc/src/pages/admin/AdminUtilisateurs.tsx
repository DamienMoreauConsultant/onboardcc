import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Loader2, Plus, Users } from 'lucide-react';
import { adminApi, type CreateUserAccountInput, type UserAccount } from '@/api/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

/* CM est créé automatiquement à l'import des postes (jamais depuis ce module — voir routes/postes.ts). */
const applicationRoles = ['ADMIN', 'RECRUTEUR'] as const;
type ApplicationRole = typeof applicationRoles[number];

const userSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire.'),
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire.'),
  email: z.string().trim().email('Saisissez une adresse e-mail valide.'),
  telephone: z.string().trim().min(1, 'Le téléphone est obligatoire.'),
  genre: z.string().trim().min(1, 'Le genre est obligatoire.'),
  role_contact: z.enum(['ADMIN', 'REC', 'CHZ']),
});
type UserFormValues = z.infer<typeof userSchema>;

const emptyForm: UserFormValues = { nom: '', prenom: '', email: '', telephone: '', genre: '', role_contact: 'ADMIN' };

function contactRoleOptions(role: ApplicationRole) {
  if (role === 'RECRUTEUR') return [['REC', 'REC — Recruteur'], ['CHZ', 'CHZ — Chargé de zone']] as const;
  return [['ADMIN', 'ADMIN']] as const;
}

export default function AdminUtilisateurs() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<ApplicationRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);
  const { toast } = useToast();
  const form = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: emptyForm });

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      setAccounts(await adminApi.getUtilisateurs());
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Impossible de charger les comptes utilisateurs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAccounts(); }, []);

  const openCreateDialog = () => {
    form.reset(emptyForm);
    setSelectedRole(null);
    setStep(1);
    setDialogOpen(true);
  };

  const chooseRole = (role: ApplicationRole) => {
    setSelectedRole(role);
    form.setValue('role_contact', role === 'ADMIN' ? 'ADMIN' : 'REC');
    setStep(2);
  };

  const createAccount = async (values: UserFormValues) => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const payload: CreateUserAccountInput = { ...values, role_applicatif: selectedRole };
      const created = await adminApi.createUtilisateur(payload);
      const invitationMessage = created.invitation === 'sent'
        ? 'Le compte a été créé et l’invitation a été envoyée.'
        : created.invitation === 'failed'
          ? 'Le compte a été créé, mais l’invitation n’a pas pu être envoyée.'
          : 'Le compte a été créé. L’invitation reste à envoyer car la messagerie n’est pas configurée.';
      toast({ title: 'Utilisateur créé', description: invitationMessage });
      setDialogOpen(false);
      await loadAccounts();
    } catch (err: any) {
      toast({ title: 'Création impossible', description: err?.response?.data?.error ?? 'Une erreur est survenue lors de la création du compte.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (account: UserAccount) => {
    setChangingId(account.id_user);
    try {
      await adminApi.setUtilisateurActif(account.id_user, !account.active);
      toast({ title: account.active ? 'Compte désactivé' : 'Compte réactivé', description: `${account.prenom} ${account.nom} a été ${account.active ? 'désactivé' : 'réactivé'}.` });
      await loadAccounts();
    } catch (err: any) {
      toast({ title: 'Modification impossible', description: err?.response?.data?.error ?? 'Le statut du compte n’a pas pu être modifié.', variant: 'destructive' });
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Users className="h-6 w-6 text-primary" /> Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Créez et gérez les comptes des administrateurs, recruteurs et chargés de mission.</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-user"><Plus className="mr-2 h-4 w-4" />Ajouter un utilisateur</Button>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader>
          <CardTitle>Comptes utilisateurs</CardTitle>
          <CardDescription>Les comptes désactivés ne peuvent plus se connecter.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-users" /></div> : error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-destructive" data-testid="error-users"><AlertCircle className="h-8 w-8" /><p>{error}</p><Button variant="outline" onClick={() => void loadAccounts()} data-testid="button-retry-users">Réessayer</Button></div>
          ) : accounts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground" data-testid="empty-users">Aucun compte utilisateur trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50"><TableRow><TableHead>Nom</TableHead><TableHead>Prénom</TableHead><TableHead>E-mail</TableHead><TableHead>Rôle applicatif</TableHead><TableHead>Rôle contact</TableHead><TableHead>Actif</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {accounts.map((account) => <TableRow key={account.id_user} className={!account.active ? 'bg-muted/30 opacity-70' : ''} data-testid={`row-user-${account.id_user}`}>
                    <TableCell className="font-medium" data-testid={`text-user-name-${account.id_user}`}>{account.nom}</TableCell>
                    <TableCell>{account.prenom}</TableCell><TableCell>{account.email}</TableCell>
                    <TableCell><Badge data-testid={`badge-application-role-${account.id_user}`}>{account.role_applicatif}</Badge></TableCell>
                    <TableCell><Badge variant="outline" data-testid={`badge-contact-role-${account.id_user}`}>{account.role_contact}</Badge></TableCell>
                    <TableCell><Badge variant={account.active ? 'default' : 'secondary'} className={account.active ? 'bg-green-600 hover:bg-green-700' : ''} data-testid={`status-user-${account.id_user}`}>{account.active ? 'Oui' : 'Non'}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant={account.active ? 'outline' : 'default'} size="sm" disabled={changingId === account.id_user} onClick={() => void updateStatus(account)} data-testid={`button-toggle-user-${account.id_user}`}>{changingId === account.id_user && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{account.active ? 'Désactiver' : 'Réactiver'}</Button></TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{step === 1 ? 'Ajouter un utilisateur' : `Nouvel utilisateur ${selectedRole}`}</DialogTitle><DialogDescription>{step === 1 ? 'Étape 1 sur 2 — Choisissez son rôle applicatif.' : 'Étape 2 sur 2 — Renseignez ses coordonnées. Les champs sont obligatoires.'}</DialogDescription></DialogHeader>
          {step === 1 ? <div className="grid gap-3 py-4">
            {applicationRoles.map((role) => <Button key={role} variant="outline" className="h-auto justify-start p-4 text-left" onClick={() => chooseRole(role)} data-testid={`button-role-${role}`}><span><strong>{role}</strong><span className="mt-1 block text-xs font-normal text-muted-foreground">{role === 'ADMIN' ? 'Administration de l’application.' : 'Accès complet aux écrans recruteur.'}</span></span></Button>)}
          </div> : <Form {...form}><form onSubmit={form.handleSubmit(createAccount)} className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="nom" render={({ field }) => <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} data-testid="input-user-nom" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="prenom" render={({ field }) => <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} data-testid="input-user-prenom" /></FormControl><FormMessage /></FormItem>} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input {...field} type="email" autoComplete="email" data-testid="input-user-email" /></FormControl><FormMessage /></FormItem>} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="telephone" render={({ field }) => <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} type="tel" autoComplete="tel" data-testid="input-user-telephone" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="genre" render={({ field }) => <FormItem><FormLabel>Genre</FormLabel><FormControl><Input {...field} data-testid="input-user-genre" /></FormControl><FormMessage /></FormItem>} />
            </div>
            {selectedRole === 'ADMIN' ? <div className="rounded-md border bg-muted/40 p-3 text-sm"><span className="font-medium">Rôle contact :</span> ADMIN</div> : <FormField control={form.control} name="role_contact" render={({ field }) => <FormItem><FormLabel>Rôle contact</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger data-testid="select-user-contact-role"><SelectValue /></SelectTrigger></FormControl><SelectContent>{contactRoleOptions(selectedRole!).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setStep(1)} disabled={submitting} data-testid="button-back-role">Retour</Button><Button type="submit" disabled={submitting} data-testid="button-create-user">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Créer et inviter</Button></DialogFooter>
          </form></Form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}