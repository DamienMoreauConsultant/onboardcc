import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle2, Circle, HeartHandshake, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { candidatsApi, type CandidatDetail } from '@/api/candidats';
import { opportunitesApi, type Opportunity } from '@/api/opportunites';

const nextStep: Record<string, string> = {
  '2ème appel téléphonique': 'Vous pouvez maintenant préparer et soumettre vos vœux provisoires.',
  'Session choisir': 'Vous pouvez finaliser vos vœux avant la validation de votre session Choisir.',
  'Attente affectation': 'Vos vœux sont étudiés par la DCC pour rechercher une mission adaptée.',
  'Mis en lien': 'Une proposition de mission est en cours d’étude avec votre chargé de mission.',
  'Accord de principe': 'Votre accord de principe est enregistré. La préparation se poursuit.',
  'Accepté': 'Votre candidature est acceptée. La DCC vous indiquera les prochaines démarches.',
  'Affecté': 'Votre affectation est confirmée.',
};
export default function Candidate() {
  const { user } = useAuth(); const [detail, setDetail] = useState<CandidatDetail | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  useEffect(() => {
    if (!user?.id_candidat) return;
    void Promise.all([
      candidatsApi.detail(user.id_candidat),
      opportunitesApi.list({ id_candidat: user.id_candidat }),
    ]).then(([candidate, items]) => {
      setDetail(candidate);
      setOpportunities(items);
    }).catch(() => setDetail(null));
  }, [user?.id_candidat]);
  const state = detail?.etat_designation;
  const actionable = opportunities.find((item) => ['Mise en lien', 'Accord de principe'].includes(item.etat_designation));
  return <div className="mx-auto max-w-3xl space-y-8 p-5 md:p-10"><header className="text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">DCC</div><h1 className="font-display text-3xl font-bold">Bonjour {user?.prenom}</h1><p className="mt-2 text-muted-foreground">Bienvenue dans votre espace candidat.</p></header>{user?.id_candidat && !detail ? <div className="flex justify-center"><Loader2 className="animate-spin text-primary"/></div> : <><Card><CardContent className="p-6"><h2 className="font-display text-xl font-bold">Votre parcours</h2><div className="mt-6 space-y-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-primary"/><div><p className="font-medium">{state || 'Votre candidature est en cours'}</p><p className="text-sm text-muted-foreground">{state ? nextStep[state] || 'La DCC vous accompagnera pour la prochaine étape.' : 'La DCC vous accompagne dans les prochaines étapes.'}</p></div></div><div className="flex gap-3"><Circle className="mt-0.5 h-5 w-5 text-muted-foreground"/><p className="text-sm text-muted-foreground">Vous serez informé dès qu’une action est attendue de votre part.</p></div></div></CardContent></Card>{actionable && <Card className="border-primary bg-primary/5"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><div><h2 className="font-display text-lg font-bold">Une décision est attendue</h2><p className="text-sm text-muted-foreground">{actionable.poste_crm_key} · {actionable.fonction}</p></div><Link href={`/candidat/opportunites/${actionable.id_opportunite}`}><Button>Voir la proposition</Button></Link></CardContent></Card>}<Card className="border-primary/20 bg-primary/[.03]"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><div><div className="flex items-center gap-2 font-semibold"><HeartHandshake className="h-5 w-5 text-primary"/>Ma fiche de vœux</div><p className="mt-1 text-sm text-muted-foreground">Consultez et complétez vos préférences lorsque cela est possible.</p></div><Link href="/candidat/voeux"><Button>Ma fiche de vœux</Button></Link></CardContent></Card></>}<p className="text-center text-sm text-muted-foreground">Votre chargé de recrutement reste à votre écoute si vous avez besoin d’aide.</p></div>;
}