import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CandidatDetail as Detail, VoeuxReferences } from '@/api/candidats';
import { ReferenceMultiSelect } from './ReferenceMultiSelect';
import { BooleanControl } from './BooleanControl';

type Section = 'etat-civil' | 'projet' | 'voeux';

const read = (v: unknown, key: string, refs?: VoeuxReferences) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  
  if (Array.isArray(v)) {
    if (refs) {
      if (key === 'langues') {
         return v.map(item => {
           const idLangue = item.id_langue;
           const l = refs.langues.find(r => r.id === idLangue)?.label;
           const n = item.niveau;
           return l ? `${l} (${n || '?'})` : '';
         }).filter(Boolean).join(', ') || '—';
      }
      if (key === 'competences') {
         return v.map(item => {
           const idComp = item.id_competences ?? item.id_competence;
           const c = refs.competences.find(r => r.id === idComp)?.label;
           return c ? `${c} - ${item.niveau}` : '';
         }).filter(Boolean).join(', ') || '—';
      }
      if (key === 'regions') {
         return v.map(item => {
           const idRegion = item.id_region;
           const r = refs.regions.find(ref => ref.id === idRegion)?.label;
           return r ? `${r} (${item.degre || 'neutre'})` : '';
         }).filter(Boolean).join(', ') || '—';
      }
      if (['domaines_formation','domaines_experience'].includes(key)) {
         return v.map(item => refs.domaines.find(r => r.id === (item.id ?? item.id_domaine))?.label).filter(Boolean).join(', ') || '—';
      }
      if (key === 'durees') return v.map(item => refs.durees.find(r => r.id === (item.id ?? item.id_duree))?.label).filter(Boolean).join(', ') || '—';
      if (key === 'environnements') return v.map(item => refs.environnements.find(r => r.id === (item.id ?? item.id_environnement))?.label).filter(Boolean).join(', ') || '—';
      if (key === 'hebergements') return v.map(item => refs.hebergements.find(r => r.id === (item.id ?? item.id_hebergement))?.label).filter(Boolean).join(', ') || '—';
    }
    return v.map((item) => typeof item === 'object' && item !== null ? (item.designation ?? item.periode ?? item.type_stage ?? item.crm_key ?? '—') : String(item)).join(', ') || '—';
  }
  return String(v);
};

const fieldSets: Record<Section, [string, string][]> = {
  'etat-civil': [
    ['nom_contact','Nom'],['nom_naissance','Nom de naissance'],['prenom_contact','Prénom'],['genre','Genre'],
    ['date_naissance','Date de naissance'],['lieu_naissance','Lieu de naissance'],['nationalite','Nationalité'],
    ['perso_etat_de_vie','État de vie'],['perso_nom_prenom_conjoint','Conjoint'],['perso_date_mariage','Date de mariage'],
    ['adresse1','Adresse'],['ville','Ville'],['tel_contact','Téléphone'],['email_contact','Email']
  ],
  projet: [
    ['profil_statut','Statut professionnel'],
    ['profil_experience_engagement','Expérience d’engagement'],
    ['profil_experience_engagement_detail','Détail des engagements'],
    ['domaines_formation','Domaines de formation'],
    ['domaines_experience','Domaines d’expérience'],
    ['projet_date_depart_souhaitee','Date de disponibilité'],
    ['projet_numero_offre_mission','Numéro d’offre'],
    ['projet_motivations','Motivations'],
    ['projet_questionnements','Questionnements'],
    ['projet_avancement','Avancement'],
    ['projet_experience_interculturelle','Expérience interculturelle'],
    ['projet_formation_dialogue_interculturel','Formations suivies'],
    ['projet_experience_de_volontariat','Expérience de volontariat'],
    ['projet_raison_du_depart_avec_la_dcc','Raison du départ avec la DCC'],
    ['projet_attente_de_la_dcc','Attentes envers la DCC'],
    ['projet_lien_avec_une_autre_structure','Lien avec une autre structure'],
    ['projet_lien_avec_une_autre_structure_detail','Détail autre structure'],
    ['profil_statut_administration_de_tutelle','Administration de tutelle'],
    ['candidature_information_du_candidat','Informations complémentaires'],
    ['candidature_disponibilite_du_candidat','Disponibilités de contact'],
    ['candidature_preference_session_choisir','Sessions Choisir proposées']
  ],
  voeux: [
    ['engagements','Engagements — note recruteur'],
    ['langues','Langues parlées'],
    ['date_depart_souhaite','Date de départ souhaitée'],
    ['durees','Durée'],
    ['regions','Destinations'],
    ['zone_orange','Zone orange'],
    ['conditions_spartiates','Conditions spartiates'],
    ['hopital_proche','Hôpital proche'],
    ['fonctionnaire_dispo_demandee','Disponibilité fonctionnaire demandée'],
    ['environnements','Milieu souhaité'],
    ['hebergements','Logement'],
    ['competences','Compétences à mettre au service'],
    ['annonces_recherchees','Annonces repérées'],
    ['nouveau_poste','Nouveau poste'],
    ['nouvelle_langue','Nouvelle langue'],
    ['competences_a_developper','Compétences à développer'],
    ['centres_interret','Centres d’intérêt'],
    ['categorie_ecclesiale','Catégorie ecclésiale'],
    ['categorie_ecclesiale_detail','Détail catégorie ecclésiale'],
    ['part_seul','Part seul']
  ]
};

const booleans = ['profil_experience_engagement','projet_lien_avec_une_autre_structure','zone_orange', 'conditions_spartiates', 'hopital_proche', 'fonctionnaire_dispo_demandee', 'nouveau_poste', 'nouvelle_langue', 'part_seul'];
const structured = ['domaines_formation','domaines_experience','langues','durees','regions','environnements','hebergements','competences'];
const candidateOnly = ['langues','date_depart_souhaite','durees','regions','zone_orange','conditions_spartiates','hopital_proche','fonctionnaire_dispo_demandee','environnements','hebergements','competences','nouveau_poste','nouvelle_langue','competences_a_developper','centres_interret','categorie_ecclesiale','categorie_ecclesiale_detail'];
const dateFields = ['date_naissance','perso_date_mariage','projet_date_depart_souhaitee','date_depart_souhaite'];
const longTextFields = ['profil_experience_engagement_detail','projet_motivations','projet_questionnements','projet_avancement','projet_experience_interculturelle','projet_formation_dialogue_interculturel','projet_experience_de_volontariat','projet_raison_du_depart_avec_la_dcc','projet_attente_de_la_dcc','candidature_information_du_candidat','engagements','competences_a_developper','centres_interret'];

type Props = {
  section: Section;
  detail: Detail;
  editable: boolean;
  canEdit: boolean;
  candidateMode: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onEdit: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  refs?: VoeuxReferences;
};

export function SectionCard({ section, detail, editable, canEdit, candidateMode, onSave, onEdit, onDirtyChange, refs }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (editable) return;
    setValues(Object.fromEntries(fieldSets[section].map(([key]) => [
      key,
      booleans.includes(key) ? detail[key] ?? null : dateFields.includes(key) ? detail[key]?.slice?.(0, 10) ?? '' : detail[key] ?? '',
    ])));
  }, [detail, section, editable]);

  useEffect(() => {
    if (!editable) {
      onDirtyChange?.(false);
      return;
    }
    const initial = Object.fromEntries(fieldSets[section].map(([key]) => [
      key,
      booleans.includes(key) ? detail[key] ?? null : dateFields.includes(key) ? detail[key]?.slice?.(0, 10) ?? '' : detail[key] ?? '',
    ]));
    onDirtyChange?.(JSON.stringify(values) !== JSON.stringify(initial));
  }, [detail, editable, onDirtyChange, section, values]);

  const handleSave = () => {
    let payload: Record<string, unknown> = { ...values };
    const id = (item: any) => item.id ?? item.id_domaine ?? item.id_duree ?? item.id_environnement ?? item.id_hebergement;
    if (section === 'projet') {
      payload.domaines_formation = ((values.domaines_formation as any[]) ?? []).map(item => ({ id: id(item) }));
      payload.domaines_experience_pro = ((values.domaines_experience as any[]) ?? []).map(item => ({ id: id(item) }));
      delete payload.domaines_experience;
    }
    if (section === 'voeux') {
      payload.langues = ((values.langues as any[]) ?? []).map(item => ({ id_langue: item.id_langue, niveau: item.niveau || null, autre_langue: item.autre_langue || null }));
      payload.competences = ((values.competences as any[]) ?? []).map(item => ({ id: item.id ?? item.id_competences ?? item.id_competence, niveau: item.niveau || null, autre_competence: item.autre_competence || null }));
      payload.regions = ((values.regions as any[]) ?? []).map(item => ({ id: item.id ?? item.id_region, degre: item.degre === 'neutre' ? null : item.degre }));
      for (const key of ['durees','environnements','hebergements']) {
        payload[key] = ((values[key] as any[]) ?? []).map(item => ({
          id: id(item),
          ...(key === 'durees' && item.projet_duree_specifique ? { projet_duree_specifique: item.projet_duree_specifique } : {}),
        }));
      }
      if (candidateMode) payload = Object.fromEntries(Object.entries(payload).filter(([key]) => candidateOnly.includes(key)));
    }
    onSave(payload);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{section === 'etat-civil' ? 'État civil' : section === 'projet' ? 'Dossier de candidature' : 'Vœux'}</CardTitle>
        {canEdit && (
          <Button size="sm" variant={editable ? 'default' : 'outline'} onClick={() => editable ? handleSave() : onEdit()}>
            {editable ? 'Enregistrer' : <><Pencil className="mr-2 h-4 w-4"/>Éditer</>}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 md:grid-cols-2">
          {fieldSets[section].map(([key, label]) => {
            const restricted = candidateMode && (section === 'voeux' || section === 'projet') && (section === 'projet' || !candidateOnly.includes(key));
            const allowed = editable && !restricted;

            return (
              <div className="rounded-lg bg-muted/40 p-4 flex flex-col gap-2" key={key}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                {allowed ? (
                  booleans.includes(key) ? (
                    <BooleanControl value={values[key] as boolean} onChange={(v) => setValues({ ...values, [key]: v })} disabled={!allowed} />
                  ) : structured.includes(key) && refs ? (
                    <ReferenceMultiSelect
                      options={
                        key === 'langues' ? refs.langues :
                        key === 'competences' ? refs.competences :
                        key === 'regions' ? refs.regions :
                        key === 'durees' ? refs.durees :
                        key === 'environnements' ? refs.environnements :
                        key === 'hebergements' ? refs.hebergements :
                        refs.domaines
                      }
                      levelOptions={key === 'langues' ? refs.niveauxLangue : []}
                      mode={key === 'langues' ? 'langue' : key === 'competences' ? 'competence' : key === 'regions' ? 'region' : 'simple'}
                      value={(values[key] as any[]) || []}
                      onChange={(v) => setValues({ ...values, [key]: v })}
                      disabled={!allowed}
                    />
                  ) : longTextFields.includes(key) ? (
                    <Textarea className="min-h-24 bg-background" value={String(values[key] ?? '')} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  ) : (
                    <Input type={dateFields.includes(key) ? 'date' : 'text'} className="bg-background" value={String(values[key] ?? '')} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  )
                ) : (
                  <dd className="whitespace-pre-wrap text-sm">{read(values[key], key, refs)}</dd>
                )}
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
