import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Skill = { domaine?: string; competence?: string; niveau?: string | null };

type Props = {
  criterion: { valeur_poste: string | null; valeur_candidat: string | null };
};

function parseSkills(value: string | null | undefined): Skill[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Détail du critère "Compétences" : une ligne par compétence (poste et/ou candidat), plutôt que
 * la liste jointe en une seule cellule qui se retrouvait tronquée à l'affichage — voir Retour_09.
 */
export function SkillsMatchTable({ criterion }: Props) {
  const postSkills = parseSkills(criterion.valeur_poste);
  const candidateSkills = parseSkills(criterion.valeur_candidat);

  // Ligne calculée avant la migration du 19/09/2026 (texte simple, pas du JSON) : on l'affiche
  // telle quelle plutôt que de perdre l'information, en invitant à recalculer.
  const isLegacyFormat = Boolean((criterion.valeur_poste || criterion.valeur_candidat) && postSkills.length === 0 && candidateSkills.length === 0);
  if (isLegacyFormat) {
    return (
      <div className="space-y-2 p-6 text-sm">
        <p className="text-muted-foreground">
          Détail indisponible dans ce format (calculé avant la mise à jour du 19/09/2026) —
          cliquez sur "Recalculer" pour l'obtenir.
        </p>
        <p><span className="font-medium">Poste :</span> {criterion.valeur_poste || '—'}</p>
        <p><span className="font-medium">Candidat :</span> {criterion.valeur_candidat || '—'}</p>
      </div>
    );
  }

  const byKey = new Map<string, { domaine: string; competence: string; requis: boolean; niveau: string | null }>();
  for (const skill of postSkills) {
    const key = `${skill.domaine ?? ''}::${skill.competence ?? ''}`;
    byKey.set(key, { domaine: skill.domaine ?? '—', competence: skill.competence ?? '—', requis: true, niveau: null });
  }
  for (const skill of candidateSkills) {
    const key = `${skill.domaine ?? ''}::${skill.competence ?? ''}`;
    const existing = byKey.get(key);
    if (existing) existing.niveau = skill.niveau ?? null;
    else byKey.set(key, { domaine: skill.domaine ?? '—', competence: skill.competence ?? '—', requis: false, niveau: skill.niveau ?? null });
  }

  const rows = [...byKey.values()].sort((a, b) => a.domaine.localeCompare(b.domaine) || a.competence.localeCompare(b.competence));

  if (rows.length === 0) {
    return <p className="p-6 text-center text-sm text-muted-foreground">Aucune compétence requise ni proposée.</p>;
  }

  return (
    <Table>
      <TableHeader className="bg-transparent">
        <TableRow className="hover:bg-transparent border-b-0">
          <TableHead>Domaine</TableHead>
          <TableHead>Compétence</TableHead>
          <TableHead>Requis par le poste</TableHead>
          <TableHead>Proposé par le candidat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.domaine}::${row.competence}`}>
            <TableCell className="text-muted-foreground">{row.domaine}</TableCell>
            <TableCell className="font-medium">{row.competence}</TableCell>
            <TableCell>{row.requis ? 'OUI' : 'NON'}</TableCell>
            <TableCell className="text-muted-foreground">{row.niveau ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
