import React, { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  Home,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plane,
  RotateCcw,
  ShieldAlert,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { postesApi, type PosteContact, type PosteDetail as PosteDetailData } from '@/api/postes';
import { candidatsApi, type ReferenceOption } from '@/api/candidats';
import { ReferenceMultiSelect } from '@/pages/candidats/components/ReferenceMultiSelect';
import { formatDateFR } from '@/lib/date';
import { OpportunityList } from '@/pages/opportunites/OpportunityList';

type Props = { mode: 'recruteur' | 'cm' };

const closeable = ['À pourvoir', 'Pré-affecté', 'Pré-réservé', 'Réservé'];
const reopenable = ['Pré-affecté', 'Fermé'];

function displayValue(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function yesNo(value: unknown) {
  if (value === true || value === 'true' || value === 1) return 'Oui';
  if (value === false || value === 'false' || value === 0) return 'Non';
  return '—';
}

function Field({
  label,
  value,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: unknown;
  icon?: React.ElementType;
  emphasis?: boolean;
}) {
  return (
    <div className={`min-w-0 ${emphasis ? 'rounded-lg border border-accent/40 bg-accent/10 p-4' : ''}`}>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
        {label}
      </dt>
      <dd className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${emphasis ? 'font-semibold text-foreground' : 'text-foreground'}`}>
        {displayValue(value)}
      </dd>
    </div>
  );
}

function ContactCard({
  title,
  contact,
  roles,
  nameOverride,
}: {
  title: string;
  contact?: PosteContact;
  roles?: string;
  nameOverride?: string;
}) {
  const address = contact
    ? [contact.adresse1, contact.adresse2, [contact.code_postal, contact.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : null;
  const name = nameOverride || (contact ? [contact.prenom, contact.nom].filter(Boolean).join(' ') : null);

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h3>
      {roles && <p className="text-xs text-muted-foreground">{roles}</p>}
      <dl className="space-y-2 border-l border-border pl-4 text-sm">
        <dd className="flex items-center gap-2"><UserRound className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{displayValue(name)}</dd>
        <dd className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{displayValue(address)}</dd>
        <dd className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{displayValue(contact?.telephone)}</dd>
        <dd className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{displayValue(contact?.email)}</dd>
      </dl>
    </div>
  );
}

export default function PosteDetail({ mode }: Props) {
  const [, params] = useRoute(`${mode === 'cm' ? '/cm' : '/recruteur'}/postes/:id`);
  const [poste, setPoste] = useState<PosteDetailData | null>(null);
  const [environmentOptions, setEnvironmentOptions] = useState<ReferenceOption[]>([]);
  const [environmentValues, setEnvironmentValues] = useState<Array<{ id: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'fermer' | 'reouvrir' | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    return tab === 'opportunites' ? 'opportunites' : 'informations';
  });

  const [opportunityRefreshKey, setOpportunityRefreshKey] = useState(0);

  const refreshPoste = async () => {
    if (!poste) return;
    try {
      setPoste(await postesApi.detail(poste.id_poste));
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Poste introuvable.');
    }
  };

  useEffect(() => {
    if (!params?.id) return;
    void Promise.all([postesApi.detail(Number(params.id)), candidatsApi.voeuxReferences()])
      .then(([nextPoste, references]) => {
        setPoste(nextPoste);
        setEnvironmentOptions(references.environnements);
        const environments = Array.isArray(nextPoste.environnements_json) ? nextPoste.environnements_json : [];
        setEnvironmentValues(
          environments
            .map((environment: { crm_key?: string; designation?: string }) => {
              const option = references.environnements.find((item) => item.label === environment.designation);
              return option ? { id: option.id } : null;
            })
            .filter((value): value is { id: number } => value !== null),
        );
      })
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Poste introuvable.'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const submitAction = async () => {
    if (!poste || !action || !commentaire.trim()) return;
    setSaving(true);
    try {
      if (action === 'fermer') await postesApi.close(poste.id_poste, commentaire, files);
      else await postesApi.reopen(poste.id_poste, commentaire, files);
      await refreshPoste();
      setOpportunityRefreshKey((current) => current + 1);
      setAction(null);
      setCommentaire('');
      setFiles([]);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Action impossible.');
    } finally {
      setSaving(false);
    }
  };

  const contacts = useMemo(
    () => (Array.isArray(poste?.contacts_json) ? poste.contacts_json : []),
    [poste?.contacts_json],
  );
  const cmContacts = contacts.filter((contact) => ['CM1', 'CM2'].includes(contact.role));
  const cmContact = cmContacts[0];
  const cmLabel = cmContacts.map((contact) => [contact.prenom, contact.nom].filter(Boolean).join(' ')).filter(Boolean).join(' · ');
  const contactForRole = (role: string) => contacts.find((contact) => contact.role === role);
  const chzContact = contactForRole('CHZ');
  const groupedCompetences = useMemo(() => {
    const groups = new Map<string, string[]>();
    const competences = Array.isArray(poste?.competences_json) ? poste.competences_json : [];
    for (const competence of competences) {
      const domain = competence.domaine || 'Domaine non renseigné';
      const current = groups.get(domain) ?? [];
      if (competence.designation && !current.includes(competence.designation)) current.push(competence.designation);
      groups.set(domain, current);
    }
    return Array.from(groups, ([domaine, competences]) => ({ domaine, competences }));
  }, [poste?.competences_json]);
  const canAct = mode === 'recruteur' && !!poste && closeable.includes(poste.etat_designation);
  const canReopen = mode === 'recruteur' && !!poste && reopenable.includes(poste.etat_designation);
  const listPath = `${mode === 'cm' ? '/cm' : '/recruteur'}/postes`;

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }
  if (!poste) {
    return <div className="p-8"><p className="text-destructive">{error || 'Poste introuvable.'}</p></div>;
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <div className="border-b bg-primary/[0.04] px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link href={listPath}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Retour à la liste">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-display text-2xl font-bold tracking-tight">{poste.crm_key}</h1>
            <Badge variant="outline" className="border-primary/30 bg-background/70">{poste.etat_designation}</Badge>
            <Badge variant="secondary">Statut : {displayValue(poste.statut_volontaire)}</Badge>
            {poste.candidat_preaffecte && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                {displayValue(poste.nom_candidat || 'Candidat pré-affecté')}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {displayValue(poste.ong)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {canAct && <Button size="sm" variant="outline" onClick={() => setAction('fermer')}><Lock className="mr-2 h-4 w-4" />Fermer le poste</Button>}
              {canReopen && <Button size="sm" variant="outline" onClick={() => setAction('reouvrir')}><RotateCcw className="mr-2 h-4 w-4" />Réouvrir le poste</Button>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-primary/10 pt-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground"><BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" />{displayValue(poste.fonction)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{displayValue(poste.pays_designation)}</span>
            <span>Domaine : {displayValue(poste.domaine_designation)}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />{formatDateFR(poste.date_arrivee_souhaitee)}</span>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="informations">Informations générales</TabsTrigger>
          <TabsTrigger value="detail">Détail du poste</TabsTrigger>
          <TabsTrigger value="opportunites">Liste des opportunités</TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl"><UsersRound className="h-5 w-5 text-primary" />Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <ContactCard title="Chargé de mission" contact={cmContact} nameOverride={cmLabel} />
                <ContactCard title="Chargé de zone" contact={chzContact} />
                <Separator className="lg:col-span-2" />
                <ContactCard title="Contact partenaire" contact={contactForRole('PAR')} />
                <ContactCard title="Contact mission" contact={contactForRole('MIS')} />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl"><BriefcaseBusiness className="h-5 w-5 text-primary" />Compétences requises</CardTitle>
            </CardHeader>
            <CardContent>
              {groupedCompetences.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune compétence requise renseignée</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border-2 border-black">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <caption className="sr-only">Compétences requises regroupées par domaine</caption>
                    <thead className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide">
                      <tr className="border-b-2 border-black">
                        <th scope="col" className="w-[30%] border-r-2 border-black p-3">Domaine</th>
                        <th scope="col" className="p-3">Compétences</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedCompetences.map((group) => (
                        <tr key={group.domaine} className="border-b-2 border-black last:border-b-0">
                          <th scope="row" className="border-r-2 border-black bg-muted/30 p-3 text-left align-top font-semibold">{group.domaine}</th>
                          <td className="p-3">{group.competences.join(' · ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl"><ShieldAlert className="h-5 w-5 text-primary" />Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Date de demande" value={formatDateFR(poste.date_demande)} icon={CalendarDays} />
                <Field label="Priorité" value={poste.priorite} />
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Plane className="h-4 w-4 text-primary" aria-hidden="true" />Billet d’avion</dt>
                  <dd className="mt-2"><Badge variant="secondary">{displayValue(poste.billet_avion_designation)}</Badge></dd>
                </div>
                <Field label="Indemnité partenaire" value={poste.indemnite_mensuelle_partenaire} />
                <Field label="Indemnité DCC" value={poste.indemnite_mensuelle_dcc} />
                <Field label="Gîte et couvert" value={poste.gite_et_couvert} icon={Home} />
                <Field label="Hébergement" value={poste.hebergement_detail} />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Environnement</dt>
                  <dd className="mt-2">
                    <ReferenceMultiSelect
                      options={environmentOptions}
                      value={environmentValues}
                      onChange={setEnvironmentValues}
                      readOnly
                    />
                  </dd>
                </div>
                <Field label="Deuxième poste possible — partenaire" value={yesNo(poste.deuxieme_poste_possible_partenaire)} />
                <Field label="Deuxième poste possible — alentours" value={yesNo(poste.deuxieme_poste_possible_alentour)} />
                <Field label="Préférence de genre" value={poste.preference_genre} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl"><FileText className="h-5 w-5 text-primary" />Détail du poste</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-7">
                <Field label="ODD lié" value={poste.odd_lie} icon={ShieldAlert} emphasis />
                <Field label="Langue requise" value={poste.langue_designation} />
                <Field label="Niveau requis" value={poste.langue_niveau_requis} />
                <Field label="Contexte de mission" value={poste.contexte_mission} />
                <Field label="Objectifs" value={poste.objectifs_mission} />
                <Field label="Tâches" value={poste.taches} />
                <Field label="Compétences" value={poste.competences_detail} />
                <Field label="Dimension ecclésiale" value={poste.dimension_ecclesial} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunites">
          <OpportunityList
            mode={mode}
            postId={poste.id_poste}
            refreshKey={opportunityRefreshKey}
            onChanged={refreshPoste}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'fermer' ? 'Fermer le poste' : 'Réouvrir le poste'}</DialogTitle>
            <DialogDescription>Un commentaire est obligatoire pour historiser cette action. Vous pouvez joindre jusqu’à 2 pièces.</DialogDescription>
          </DialogHeader>
          <textarea value={commentaire} onChange={(event) => setCommentaire(event.target.value)} placeholder="Justification obligatoire..." className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 2))} />
          <p className="text-xs text-muted-foreground">{files.length}/2 pièce(s) sélectionnée(s)</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Annuler</Button>
            <Button disabled={!commentaire.trim() || saving} onClick={() => void submitAction()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}