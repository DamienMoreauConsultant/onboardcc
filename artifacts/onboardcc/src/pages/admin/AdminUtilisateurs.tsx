import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Loader2, Mail, Pencil, Plus, Search, Users } from 'lucide-react';
import { adminApi, type CreateUserAccountInput, type InvitationStatus, type UpdateUserAccountInput, type UserAccount } from '@/api/admin';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

/* Contacts dont l'identité est maîtrisée dans Passerelle : seuls leurs nom, prénom et email se modifient ici.
   Les CM et CZ sont mis à jour par l'import des postes, les candidats depuis leur écran État civil. */
const EDITABLE_CONTACT_ROLES = ['ADMIN', 'REC'];
/* Désactivation en masse : candidats et CM uniquement (les comptes Admin et Recruteur se désactivent un par un). */
const BULK_ROLES = ['CANDIDAT', 'CM'];
const PAGE_SIZE = 50;
const ALL = '__tous__';
const NO_STATE = '__aucun__';

const invitationMessage = (status: InvitationStatus | undefined, sent: string) =>
  status === 'sent' ? sent
    : status === 'failed' ? 'L’invitation n’a pas pu être envoyée (adresse refusée ou messagerie indisponible) : utilisez « Renvoyer l’invitation » après avoir vérifié l’adresse.'
      : 'L’invitation reste à envoyer car la messagerie n’est pas configurée.';

export default function AdminUtilisateurs() {
  const { user: sessionUser } = useAuth();
  const myId = (sessionUser as { id_user?: number } | null)?.id_user;
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Création
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<ApplicationRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: emptyForm });

  // Liste : filtres, pagination, sélection
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [stateFilter, setStateFilter] = useState(ALL);
  const [activeFilter, setActiveFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Modification
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [editLogin, setEditLogin] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  /* Rechargement systématique depuis le serveur après toute modification (UAT-07) : l'écran reflète toujours la base. */
  const loadAccounts = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      setAccounts(await adminApi.getUtilisateurs());
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les comptes utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAccounts(); }, []);

  const stateOptions = useMemo(() => [...new Set(accounts.map((a) => a.etat_designation).filter((v): v is string => Boolean(v)))].sort(), [accounts]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (roleFilter !== ALL && a.role_applicatif !== roleFilter) return false;
      if (stateFilter === NO_STATE ? Boolean(a.etat_designation) : stateFilter !== ALL && a.etat_designation !== stateFilter) return false;
      if (activeFilter !== ALL && a.active !== (activeFilter === 'oui')) return false;
      if (needle && ![a.login, a.nom, a.prenom, a.email].some((v) => (v ?? '').toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [accounts, roleFilter, stateFilter, activeFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectable = useMemo(() => filtered.filter((a) => BULK_ROLES.includes(a.role_applicatif)), [filtered]);
  const allSelected = selectable.length > 0 && selectable.every((a) => selected.has(a.id_user));
  const someSelected = selectable.some((a) => selected.has(a.id_user));

  useEffect(() => { setPage(1); }, [roleFilter, stateFilter, activeFilter, search]);
  // Une sélection ne survit jamais à un changement de filtre : on ne désactive que ce que l'on voit.
  useEffect(() => { setSelected(new Set()); }, [roleFilter, stateFilter, activeFilter, search]);

  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(selectable.map((a) => a.id_user)) : new Set());
  const toggleOne = (id: number, checked: boolean) => setSelected((current) => {
    const next = new Set(current);
    if (checked) next.add(id); else next.delete(id);
    return next;
  });

  const bulkDeactivate = async () => {
    setBulkBusy(true);
    try {
      const result = await adminApi.desactiverUtilisateurs([...selected]);
      toast({ title: 'Comptes désactivés', description: `${result.desactives} compte(s) désactivé(s) : ces personnes ont perdu leurs accès à Passerelle.` });
      setSelected(new Set());
      setBulkOpen(false);
      await loadAccounts(false);
    } catch (err: any) {
      toast({ title: 'Désactivation impossible', description: err?.response?.data?.error ?? 'Une erreur est survenue.', variant: 'destructive' });
    } finally {
      setBulkBusy(false);
    }
  };

  const openEdit = (account: UserAccount) => {
    setEditing(account);
    setEditLogin(account.login);
    setEditActive(account.active);
    setEditNom(account.nom ?? '');
    setEditPrenom(account.prenom ?? '');
    setEditEmail(account.email ?? '');
    setEditError('');
  };

  const contactEditable = editing ? EDITABLE_CONTACT_ROLES.includes(editing.role_contact) : false;
  const isMe = editing ? editing.id_user === myId : false;

  const saveEdit = async () => {
    if (!editing) return;
    const payload: UpdateUserAccountInput = {};
    if (editLogin.trim().toLowerCase() !== editing.login) payload.login = editLogin;
    if (editActive !== editing.active) payload.active = editActive;
    if (contactEditable) {
      if (editNom.trim() !== editing.nom) payload.nom = editNom;
      if (editPrenom.trim() !== editing.prenom) payload.prenom = editPrenom;
      if (editEmail.trim().toLowerCase() !== (editing.email ?? '').toLowerCase()) payload.email = editEmail;
    }
    if (!Object.keys(payload).length) { setEditing(null); return; }
    setEditBusy(true);
    setEditError('');
    try {
      await adminApi.updateUtilisateur(editing.id_user, payload);
      toast({ title: 'Utilisateur enregistré', description: payload.active === false ? 'Le compte est désactivé : la personne a perdu ses accès immédiatement.' : `Les modifications de ${editNom || editing.nom} ont été enregistrées.` });
      setEditing(null);
      await loadAccounts(false);
    } catch (err: any) {
      setEditError(err?.response?.data?.error ?? 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setEditBusy(false);
    }
  };

  const resendInvitation = async () => {
    if (!editing) return;
    setResendBusy(true);
    setEditError('');
    try {
      const result = await adminApi.renvoyerInvitation(editing.id_user);
      toast({ title: 'Invitation', description: invitationMessage(result.invitation, 'Un nouveau mot de passe provisoire a été envoyé à la personne.') });
    } catch (err: any) {
      setEditError(err?.response?.data?.error ?? 'L’invitation n’a pas pu être renvoyée.');
    } finally {
      setResendBusy(false);
    }
  };

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
      toast({ title: 'Utilisateur créé', description: invitationMessage(created.invitation, 'Le compte a été créé et l’invitation a été envoyée.') });
      setDialogOpen(false);
      await loadAccounts(false);
    } catch (err: any) {
      toast({ title: 'Création impossible', description: err?.response?.data?.error ?? 'Une erreur est survenue lors de la création du compte.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Users className="h-6 w-6 text-primary" /> Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Créez et gérez les comptes des administrateurs, recruteurs, chargés de mission et candidats.</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-user"><Plus className="mr-2 h-4 w-4" />Ajouter un utilisateur</Button>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader>
          <CardTitle>Comptes utilisateurs</CardTitle>
          <CardDescription>Un compte désactivé perd ses accès immédiatement. Les comptes ne sont jamais supprimés.</CardDescription>
          <div className="flex flex-wrap items-end gap-3 pt-2">
            <div className="min-w-[14rem] flex-1">
              <Label htmlFor="user-search" className="text-xs">Recherche</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="user-search" className="pl-8" placeholder="Login, nom, prénom, e-mail…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-user-search" />
              </div>
            </div>
            <div className="w-44">
              <Label className="text-xs">Rôle applicatif</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger data-testid="filter-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les rôles</SelectItem>
                  {['ADMIN', 'RECRUTEUR', 'CM', 'CANDIDAT'].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Label className="text-xs">État (candidats)</Label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger data-testid="filter-etat"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les états</SelectItem>
                  <SelectItem value={NO_STATE}>Sans état (autres rôles)</SelectItem>
                  {stateOptions.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="text-xs">Actif</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger data-testid="filter-actif"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  <SelectItem value="oui">Actifs</SelectItem>
                  <SelectItem value="non">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="destructive" disabled={selected.size === 0} onClick={() => setBulkOpen(true)} data-testid="button-bulk-deactivate">
              Désactiver{selected.size > 0 ? ` (${selected.size})` : ''}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-users" /></div> : error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-destructive" data-testid="error-users"><AlertCircle className="h-8 w-8" /><p>{error}</p><Button variant="outline" onClick={() => void loadAccounts()} data-testid="button-retry-users">Réessayer</Button></div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground" data-testid="empty-users">Aucun compte ne correspond à ces critères.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                          onCheckedChange={(value) => toggleAll(value === true)}
                          disabled={selectable.length === 0}
                          aria-label="Tout sélectionner (candidats et CM affichés après filtre)"
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead>Login</TableHead><TableHead>Nom</TableHead><TableHead>Prénom</TableHead><TableHead>E-mail</TableHead>
                      <TableHead>Rôle applicatif</TableHead><TableHead>Rôle contact</TableHead><TableHead>État</TableHead><TableHead>Actif</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((account) => (
                      <TableRow key={account.id_user} className={!account.active ? 'bg-muted/30 opacity-70' : ''} data-testid={`row-user-${account.id_user}`}>
                        <TableCell>
                          {BULK_ROLES.includes(account.role_applicatif)
                            ? <Checkbox checked={selected.has(account.id_user)} onCheckedChange={(value) => toggleOne(account.id_user, value === true)} aria-label={`Sélectionner ${account.prenom} ${account.nom}`} data-testid={`checkbox-user-${account.id_user}`} />
                            : null}
                        </TableCell>
                        <TableCell className="font-mono text-xs" data-testid={`text-user-login-${account.id_user}`}>{account.login}</TableCell>
                        <TableCell className="font-medium" data-testid={`text-user-name-${account.id_user}`}>{account.nom}</TableCell>
                        <TableCell>{account.prenom}</TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell><Badge data-testid={`badge-application-role-${account.id_user}`}>{account.role_applicatif}</Badge></TableCell>
                        <TableCell><Badge variant="outline" data-testid={`badge-contact-role-${account.id_user}`}>{account.role_contact}</Badge></TableCell>
                        <TableCell className="text-sm" data-testid={`text-user-etat-${account.id_user}`}>{account.etat_designation ?? ''}</TableCell>
                        <TableCell><Badge variant={account.active ? 'default' : 'secondary'} className={account.active ? 'bg-green-600 hover:bg-green-700' : ''} data-testid={`status-user-${account.id_user}`}>{account.active ? 'Oui' : 'Non'}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openEdit(account)} data-testid={`button-edit-user-${account.id_user}`}><Pencil className="mr-2 h-3.5 w-3.5" />Modifier</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
                <span>{filtered.length} compte(s){selected.size > 0 ? ` — ${selected.size} sélectionné(s)` : ''}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Précédent</Button>
                  <span>Page {currentPage} / {pageCount}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Suivant</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Désactivation en masse : confirmation avec le nombre de comptes */}
      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver {selected.size} compte(s) ?</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive">
              Ces personnes perdront instantanément leurs accès à Passerelle. Le compte reste en base et peut être réactivé depuis « Modifier ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={bulkBusy} onClick={(event) => { event.preventDefault(); void bulkDeactivate(); }} data-testid="button-confirm-bulk">
              {bulkBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modification d'un compte */}
      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier l’utilisateur</DialogTitle>
            <DialogDescription>{editing ? `${editing.prenom} ${editing.nom} — rôle ${editing.role_applicatif}` : ''}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5 py-1">
              <div className="space-y-2">
                <Label htmlFor="edit-login">Login</Label>
                <Input id="edit-login" value={editLogin} onChange={(e) => setEditLogin(e.target.value)} data-testid="input-edit-login" />
                <p className="text-xs text-muted-foreground">Identifiant de connexion, enregistré en minuscules. Il n’est pas modifié automatiquement quand l’e-mail du contact change (depuis cet écran).</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rôle applicatif</Label>
                  <div><Badge data-testid="badge-edit-role">{editing.role_applicatif}</Badge> <span className="ml-1 text-xs text-muted-foreground">non modifiable</span></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-active">Actif</Label>
                  <div className="flex items-center gap-3">
                    <Switch id="edit-active" checked={editActive} onCheckedChange={setEditActive} disabled={isMe} data-testid="switch-edit-active" />
                    <span className="text-sm font-medium">{editActive ? 'Oui' : 'Non'}</span>
                  </div>
                  {isMe && <p className="text-xs text-muted-foreground">Vous ne pouvez pas désactiver votre propre compte.</p>}
                </div>
              </div>
              {editing.active && !editActive && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive" data-testid="warning-deactivate">
                  Lorsque vous sauvegarderez l’utilisateur perdra instantanément ses accès à Passerelle.
                </p>
              )}

              <div className="space-y-2">
                <Label>Contact associé</Label>
                <div className="overflow-hidden rounded-md border text-sm">
                  <dl className="divide-y">
                    <div className="grid grid-cols-3 items-center gap-2 px-3 py-2"><dt className="text-muted-foreground">CRM_KEY</dt><dd className="col-span-2 font-mono text-xs" data-testid="text-edit-crmkey">{editing.crm_key ?? '—'}</dd></div>
                    <div className="grid grid-cols-3 items-center gap-2 px-3 py-2"><dt className="text-muted-foreground">Nom</dt><dd className="col-span-2">{contactEditable ? <Input value={editNom} onChange={(e) => setEditNom(e.target.value)} data-testid="input-edit-nom" /> : editing.nom}</dd></div>
                    <div className="grid grid-cols-3 items-center gap-2 px-3 py-2"><dt className="text-muted-foreground">Prénom</dt><dd className="col-span-2">{contactEditable ? <Input value={editPrenom} onChange={(e) => setEditPrenom(e.target.value)} data-testid="input-edit-prenom" /> : editing.prenom}</dd></div>
                    <div className="grid grid-cols-3 items-center gap-2 px-3 py-2"><dt className="text-muted-foreground">Adresse e-mail</dt><dd className="col-span-2">{contactEditable ? <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} data-testid="input-edit-email" /> : editing.email}</dd></div>
                    <div className="grid grid-cols-3 items-center gap-2 px-3 py-2"><dt className="text-muted-foreground">Rôle métier</dt><dd className="col-span-2"><Badge variant="outline">{editing.role_contact}</Badge></dd></div>
                  </dl>
                </div>
                {!contactEditable && (
                  <p className="text-xs text-muted-foreground">
                    Ce contact est en lecture seule : {editing.role_applicatif === 'CANDIDAT'
                      ? 'son e-mail et son identité se corrigent depuis l’écran État civil du candidat (le login suit automatiquement l’e-mail).'
                      : 'il est géré dans le CRM et mis à jour par l’import des postes.'}
                  </p>
                )}
              </div>

              {editError && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" data-testid="error-edit-user">{editError}</p>}
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => void resendInvitation()} disabled={editBusy || resendBusy || !editing?.active} data-testid="button-resend-invitation">
              {resendBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Renvoyer l’invitation
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={editBusy}>Annuler</Button>
              <Button type="button" onClick={() => void saveEdit()} disabled={editBusy} data-testid="button-save-user">
                {editBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Création d'un compte Admin ou Recruteur */}
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
