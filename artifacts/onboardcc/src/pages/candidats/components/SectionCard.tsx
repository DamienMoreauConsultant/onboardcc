import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CandidatDetail as Detail, VoeuxReferences } from '@/api/candidats';
import { ReferenceMultiSelect } from './ReferenceMultiSelect';
import { BooleanControl } from './BooleanControl';
import { CompetencesProposees } from './CompetencesProposees';

type Section = 'etat-civil' | 'projet' | 'voeux';
type Field = [string, string];

const etatCivilSections: { title: string; fields: Field[] }[] = [
  {
    title: 'Identité',
    fields: [
      ['nom_contact', 'Nom'], ['nom_naissance', 'Nom de naissance'], ['prenom_contact', 'Prénom'], ['genre', 'Genre'],
      ['date_naissance', 'Date de naissance'], ['lieu_naissance', 'Lieu de naissance'], ['nationalite', 'Nationalité'],
      ['perso_etat_de_vie', 'État de vie'], ['perso_date_mariage', 'Date de mariage'],
    ],
  },
  {
    title: 'Coordonnées',
    fields: [
      ['adresse1', 'Adresse'], ['adresse2', 'Complément d’adresse'], ['code_postal', 'Code postal'], ['ville', 'Ville'],
      ['pays', 'Pays'], ['tel_contact', 'Téléphone'], ['email_contact', 'Email'],
    ],
  },
];

const projetSections: { title: string; fields: Field[] }[] = [
  {
    title: 'A — Démarche de volontariat',
    fields: [
      ['projet_date_depart_souhaitee', 'Date de disponibilité'], ['projet_duree_mission_souhaitee', 'Durée prévisionnelle souhaitée'],
      ['projet_numero_offre_mission', 'Numéro d’offre'], ['projet_motivations', 'Motivations'], ['projet_questionnements', 'Questionnements'],
      ['projet_avancement', 'Avancement de ton projet'], ['projet_experience_interculturelle', 'Expérience interculturelle'],
      ['projet_formation_dialogue_interculturel', 'Formations suivies'], ['projet_experience_de_volontariat', 'Expérience de volontariat'],
      ['projet_raison_du_depart_avec_la_dcc', 'Raison du départ avec la DCC'], ['connait_la_dcc_par', 'Comment connais-tu la DCC'],
      ['projet_attente_de_la_dcc', 'Attentes envers la DCC'], ['projet_lien_avec_une_autre_structure', 'Lien avec une autre structure'],
      ['projet_lien_avec_une_autre_structure_detail', 'Détail autre structure'],
    ],
  },
  {
    title: 'B — Expérience personnelle et professionnelle',
    fields: [
      ['profil_statut', 'Statut professionnel'], ['profil_statut_administration_de_tutelle', 'Administration de tutelle'],
      ['profil_experience_engagement', 'Expérience d’engagement'], ['profil_experience_engagement_detail', 'Détail des engagements'],
      ['domaines_formation', 'Domaines de formation'], ['domaines_experience', 'Domaines d’expérience'],
    ],
  },
  {
    title: 'C — Prochaines étapes',
    fields: [
      ['candidature_information_du_candidat', 'Informations complémentaires'],
      ['candidature_disponibilite_du_candidat', 'Disponibilités de contact'],
      ['candidature_preference_session_choisir', 'Sessions Choisir préférentielles'],
    ],
  },
];

const booleans = ['profil_experience_engagement', 'projet_lien_avec_une_autre_structure', 'zone_orange', 'conditions_spartiates', 'hopital_proche', 'fonctionnaire_dispo_demandee', 'nouveau_poste', 'nouvelle_langue', 'part_seul'];
const structured = ['domaines_formation', 'domaines_experience'];
const dateFields = ['date_naissance', 'perso_date_mariage', 'projet_date_depart_souhaitee', 'date_depart_souhaite'];
const longTextFields = [
  'profil_experience_engagement_detail', 'projet_motivations', 'projet_questionnements', 'projet_avancement',
  'projet_experience_interculturelle', 'projet_formation_dialogue_interculturel', 'projet_experience_de_volontariat',
  'projet_raison_du_depart_avec_la_dcc', 'projet_attente_de_la_dcc', 'projet_lien_avec_une_autre_structure_detail',
  'candidature_information_du_candidat', 'engagements', 'annonces_recherchees', 'competences_a_developper', 'centres_interret',
];
const candidateOnly = [
  'langues', 'date_depart_souhaite', 'durees', 'regions', 'zone_orange', 'conditions_spartiates', 'hopital_proche',
  'fonctionnaire_dispo_demandee', 'environnements', 'hebergements', 'competences', 'nouveau_poste', 'nouvelle_langue',
  'competences_a_developper', 'centres_interret', 'categorie_ecclesiale', 'categorie_ecclesiale_detail',
];

function initialValue(key: string, detail: Detail): unknown {
  if (key === 'pays') return detail.pays_designation ?? detail.pays ?? '';
  if (dateFields.includes(key)) return detail[key]?.slice?.(0, 10) ?? '';
  if (booleans.includes(key)) return detail[key] ?? null;
  if (['domaines_formation', 'domaines_experience'].includes(key)) return detail[key] ?? [];
  return detail[key] ?? '';
}

function readValue(value: unknown, key: string, refs?: VoeuxReferences): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (!Array.isArray(value)) return String(value);
  if (refs) {
    const lookup = (items: any[], id: unknown) => items.find((item) => item.id === id)?.label;
    if (key === 'langues') return value.map((item) => `${lookup(refs.langues, item.id_langue) ?? ''} (${item.niveau || '?'})`).filter(Boolean).join(', ') || '—';
    if (key === 'domaines_formation' || key === 'domaines_experience') return value.map((item) => lookup(refs.domaines, item.id ?? item.id_domaine)).filter(Boolean).join(', ') || '—';
    if (key === 'durees') return value.map((item) => lookup(refs.durees, item.id ?? item.id_duree)).filter(Boolean).join(', ') || '—';
    if (key === 'environnements') return value.map((item) => lookup(refs.environnements, item.id ?? item.id_environnement)).filter(Boolean).join(', ') || '—';
    if (key === 'hebergements') return value.map((item) => lookup(refs.hebergements, item.id ?? item.id_hebergement)).filter(Boolean).join(', ') || '—';
    if (key === 'regions') return value.map((item) => `${lookup(refs.regions, item.id_region) ?? ''} (${item.degre || 'Non'})`).filter(Boolean).join(', ') || '—';
  }
  return value.map((item) => typeof item === 'object' && item !== null ? (item.designation ?? item.periode ?? item.type_stage ?? item.crm_key ?? '—') : String(item)).join(', ') || '—';
}

function boolValue(value: unknown) {
  return value === true || value === 'true' || value === 'Oui' || value === 'oui';
}

function parseChildren(raw: unknown): Array<Record<string, unknown>> {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')) : [];
  } catch {
    return [];
  }
}

function dateLabel(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex items-center gap-3"><h3 className="text-sm font-bold tracking-wide text-primary">{children}</h3><div className="h-px flex-1 bg-border" /></div>;
}

type Props = {
  section: Section;
  detail: Detail;
  editable: boolean;
  canEdit: boolean;
  candidateMode: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onEdit: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  refs?: VoeuxReferences;
};

export function SectionCard({ section, detail, editable, canEdit, candidateMode, onSave, onEdit, onCancel, onDirtyChange, refs }: Props) {
  const allFields = section === 'etat-civil' ? etatCivilSections.flatMap((group) => group.fields) : projetSections.flatMap((group) => group.fields);
  const voeuxFields: Field[] = [
    ['domaines_formation', 'Domaines de formation'], ['domaines_experience', 'Domaines d’expérience'],
    ['profil_experience_engagement_detail', 'Détail des engagements'],
    ['langues', 'Langues parlées'], ['date_depart_souhaite', 'Date de départ souhaitée'], ['durees', 'Durée de la mission'],
    ['fonctionnaire_dispo_demandee', 'Disponibilité fonctionnaire demandée'], ['nouvelle_langue', 'Nouvelle langue'], ['nouveau_poste', 'Nouveau poste'],
    ['environnements', 'Milieu souhaité'], ['hebergements', 'Logement'], ['zone_orange', 'Zone orange'],
    ['conditions_spartiates', 'Conditions spartiates'], ['hopital_proche', 'Hôpital proche'], ['regions', 'Destinations'],
    ['competences', 'Compétences à mettre au service'], ['competences_a_developper', 'Compétences à développer'],
    ['centres_interret', 'Centres d’intérêt'], ['part_seul', 'Part seul'], ['annonces_recherchees', 'Annonces repérées'],
    ['engagements', 'Engagements'], ['categorie_ecclesiale', 'Catégorie ecclésiale'], ['categorie_ecclesiale_detail', 'Détail de la catégorie ecclésiale'],
  ];
  const keys = section === 'voeux' ? voeuxFields.map(([key]) => key) : allFields.map(([key]) => key);
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!editable) setValues(Object.fromEntries(keys.map((key) => [key, initialValue(key, detail)])));
  }, [detail, editable, section]);

  useEffect(() => {
    if (!editable) {
      onDirtyChange?.(false);
      return;
    }
    const initial = Object.fromEntries(keys.map((key) => [key, initialValue(key, detail)]));
    onDirtyChange?.(JSON.stringify(values) !== JSON.stringify(initial));
  }, [detail, editable, onDirtyChange, section, values]);

  const setValue = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const updateReference = (key: string, value: any[]) => setValue(key, value);
  const idOf = (item: any) => item.id ?? item.id_domaine ?? item.id_duree ?? item.id_environnement ?? item.id_hebergement;

  const handleSave = () => {
    const payload: Record<string, unknown> = { ...values };
    if (section === 'etat-civil') delete payload.pays;
    if (section === 'projet') {
      payload.domaines_formation = (values.domaines_formation ?? []).map(idOf).map((id: number) => ({ id }));
      payload.domaines_experience_pro = (values.domaines_experience ?? []).map(idOf).map((id: number) => ({ id }));
      delete payload.domaines_experience;
      delete payload.connait_la_dcc_par;
    }
    if (section === 'voeux') {
      payload.langues = (values.langues ?? []).map((item: any) => ({ id_langue: item.id_langue, niveau: item.niveau || null, autre_langue: item.autre_langue || null }));
      payload.competences = (values.competences ?? []).map((item: any) => ({ id: item.id ?? item.id_competences ?? item.id_competence, niveau: item.niveau || null, autre_competence: item.autre_competence || null }));
      payload.regions = regionValues.map((item) => ({ id: item.id_region, degre: item.degre }));
      for (const key of ['durees', 'environnements', 'hebergements']) payload[key] = (values[key] ?? []).map((item: any) => ({ id: idOf(item), ...(key === 'durees' && item.projet_duree_specifique ? { projet_duree_specifique: item.projet_duree_specifique } : {}) }));
      if (candidateMode) {
        Object.keys(payload).forEach((key) => { if (!candidateOnly.includes(key)) delete payload[key]; });
      } else {
        delete payload.domaines_formation;
        delete payload.domaines_experience;
        delete payload.profil_experience_engagement_detail;
      }
    }
    onSave(payload);
  };

  const renderEditor = (key: string, label: string, forcedReadOnly = false) => {
    const allowed = editable && canEdit && !forcedReadOnly;
    if (!allowed) return <dd className="whitespace-pre-wrap text-sm">{readValue(values[key], key, refs)}</dd>;
    if (booleans.includes(key)) return <BooleanControl value={boolValue(values[key])} onChange={(value) => setValue(key, value)} />;
    if (refs && (structured.includes(key) || ['langues', 'durees', 'environnements', 'hebergements'].includes(key))) {
      const options = key === 'domaines_formation' || key === 'domaines_experience' ? refs.domaines
        : key === 'langues' ? refs.langues
          : key === 'durees' ? refs.durees
            : key === 'environnements' ? refs.environnements
              : key === 'hebergements' ? refs.hebergements : [];
      return <ReferenceMultiSelect options={options} value={values[key] ?? []} onChange={(value) => updateReference(key, value)} mode={key === 'langues' ? 'langue' : 'simple'} levelOptions={key === 'langues' ? refs.niveauxLangue : []} />;
    }
    if (longTextFields.includes(key)) return <Textarea className="min-h-24 bg-background" value={String(values[key] ?? '')} onChange={(event) => setValue(key, event.target.value)} />;
    return <Input type={dateFields.includes(key) ? 'date' : 'text'} className="bg-background" value={String(values[key] ?? '')} onChange={(event) => setValue(key, event.target.value)} />;
  };

  const fieldBlock = (key: string, label: string, forcedReadOnly = false, className = '') => (
    <div className={`rounded-lg bg-muted/40 p-3 ${className}`} key={key}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      {renderEditor(key, label, forcedReadOnly)}
    </div>
  );

  const regionValues = useMemo(() => (refs?.regions ?? []).map((region) => {
    const current = (values.regions ?? []).find((item: any) => (item.id ?? item.id_region) === region.id);
    const oldDegree = current?.degre;
    const degre = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Non'].includes(oldDegree) ? oldDegree : oldDegree === 'veut aller' ? 'P1' : 'Non';
    return { id_region: region.id, degre };
  }), [refs?.regions, values.regions]);

  const updateRegion = (id: number, degre: string) => setValue('regions', regionValues.map((region) => region.id_region === id ? { ...region, degre } : region));

  if (section === 'voeux') {
    const experienceFields: Field[] = [
      ['domaines_formation', 'Domaines de formation'], ['domaines_experience', 'Domaines d’expérience'],
      ['profil_experience_engagement_detail', 'Détail des engagements'], ['langues', 'Langues parlées'], ['centres_interret', 'Centres d’intérêt'],
    ];
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vœux</CardTitle>
          {canEdit && (
            <div className="flex items-center gap-2">
              {editable && <Button size="sm" variant="outline" onClick={onCancel}>Annuler</Button>}
              <Button size="sm" variant={editable ? 'default' : 'outline'} onClick={() => editable ? handleSave() : onEdit()}>
                {editable ? 'Enregistrer' : <><Pencil className="mr-2 h-4 w-4" />Éditer</>}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-4">
            <section className="space-y-3">
              <SectionHeading>Expérience</SectionHeading>
              {experienceFields.map(([key, label]) => {
                const readonly = key !== 'langues' && key !== 'centres_interret';
                return fieldBlock(key, label, readonly);
              })}
            </section>
            <section className="space-y-3 lg:col-span-3">
              <SectionHeading>Conditions</SectionHeading>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-3">
                  {fieldBlock('date_depart_souhaite', 'Date de départ souhaitée')}
                  {fieldBlock('durees', 'Durée de la mission')}
                  {fieldBlock('fonctionnaire_dispo_demandee', 'Disponibilité fonctionnaire demandée')}
                  <div className="hidden min-h-3 md:block" aria-hidden="true" />
                  {fieldBlock('nouvelle_langue', 'Nouvelle langue')}
                  {fieldBlock('nouveau_poste', 'Nouveau poste')}
                </div>
                <div className="space-y-3">
                  {fieldBlock('environnements', 'Milieu souhaité')}
                  {fieldBlock('hebergements', 'Logement')}
                  {fieldBlock('zone_orange', 'Zone orange')}
                  {fieldBlock('conditions_spartiates', 'Conditions spartiates')}
                  {fieldBlock('hopital_proche', 'Hôpital proche')}
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destinations</dt>
                    <div className="mt-2 space-y-2">
                      {regionValues.map((region) => (
                        <div key={region.id_region} className="flex items-center justify-between gap-2 text-sm">
                          <span>{refs?.regions.find((item) => item.id === region.id_region)?.label}</span>
                          {editable && canEdit ? (
                            <Select value={region.degre} onValueChange={(value) => updateRegion(region.id_region, value)}>
                              <SelectTrigger className="h-8 w-24 bg-background"><SelectValue /></SelectTrigger>
                              <SelectContent>{['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Non'].map((degree) => <SelectItem key={degree} value={degree}>{degree}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : <span className="font-medium">{region.degre}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <SectionHeading>Compétences proposées</SectionHeading>
            {refs ? <CompetencesProposees value={values.competences ?? []} refs={refs} editable={editable && canEdit} onChange={(value) => setValue('competences', value)} /> : <p className="text-sm text-muted-foreground">Chargement des référentiels…</p>}
            {fieldBlock('competences_a_developper', 'Compétences à développer')}
          </section>

          {!candidateMode && (
            <section className="space-y-3">
              <SectionHeading>Avis DCC</SectionHeading>
              <div className="grid gap-3 md:grid-cols-4">
                {fieldBlock('part_seul', 'Part seul')}
                {fieldBlock('annonces_recherchees', 'Annonces repérées')}
                <div className="md:col-span-2">{fieldBlock('engagements', 'Engagements')}</div>
                <div className="rounded-lg bg-muted/40 p-3 md:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catégorie ecclésiale</dt>
                  <div className="mt-2 flex items-start gap-3">
                    <button
                      type="button"
                      title="Le candidat est-il sensible à la démarche ecclésiale du partenaire ?"
                      aria-label="Modifier la catégorie ecclésiale"
                      disabled={!editable || !canEdit}
                      onClick={() => setValue('categorie_ecclesiale', !boolValue(values.categorie_ecclesiale))}
                      className="rounded-full p-1 transition hover:bg-background disabled:cursor-default"
                    >
                      {boolValue(values.categorie_ecclesiale) ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-destructive" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground">Détail</span>
                      {renderEditor('categorie_ecclesiale_detail', 'Détail de la catégorie ecclésiale')}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{section === 'etat-civil' ? 'État civil' : 'Dossier de candidature'}</CardTitle>
        {canEdit && (
          <div className="flex items-center gap-2">
            {editable && <Button size="sm" variant="outline" onClick={onCancel}>Annuler</Button>}
            <Button size="sm" variant={editable ? 'default' : 'outline'} onClick={() => editable ? handleSave() : onEdit()}>
              {editable ? 'Enregistrer' : <><Pencil className="mr-2 h-4 w-4" />Éditer</>}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {section === 'etat-civil' ? (
          <>
            {etatCivilSections.map((group) => (
              <section key={group.title}>
                <SectionHeading>{group.title}</SectionHeading>
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {group.fields
                    .filter(([key]) => key !== 'perso_date_mariage' || String(values.perso_etat_de_vie ?? detail.perso_etat_de_vie).toLowerCase().includes('mari'))
                    .map(([key, label]) => fieldBlock(key, label, key === 'pays', key === 'adresse1' || key === 'adresse2' || key === 'email_contact' ? 'sm:col-span-2 lg:col-span-2' : ''))}
                </dl>
              </section>
            ))}
            {(() => {
              const children = parseChildren(detail.perso_enfants_consolides);
              const spouse = detail.perso_nom_prenom_conjoint;
              if (!spouse && children.length === 0) return null;
              return (
                <section>
                  <SectionHeading>Famille</SectionHeading>
                  <div className="grid gap-3 md:grid-cols-2">
                    {spouse && <div className="rounded-lg bg-muted/40 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conjoint</dt><dd className="mt-1 text-sm">{spouse}</dd></div>}
                    {children.length > 0 && <div className="rounded-lg bg-muted/40 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enfants</dt><dd className="mt-1 space-y-1 text-sm">{children.map((child, index) => <div key={index}>{[child.prenom, child.nom].filter(Boolean).join(' ') || '—'} · {String(child.genre ?? '—')} · {dateLabel(child.date_naissance ?? child.dateNaissance)}</div>)}</dd></div>}
                  </div>
                </section>
              );
            })()}
          </>
        ) : (
          projetSections.map((group) => (
            <section key={group.title}>
              <SectionHeading>{group.title}</SectionHeading>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {group.fields.map(([key, label]) => fieldBlock(key, label, key === 'pays' || key === 'connait_la_dcc_par', longTextFields.includes(key) ? 'sm:col-span-2 lg:col-span-2' : ''))}
              </dl>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}