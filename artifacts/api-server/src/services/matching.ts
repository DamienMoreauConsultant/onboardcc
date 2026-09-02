import type { PoolClient, QueryResult } from 'pg';
import pool from '../db-pg';

type DbClient = Pick<PoolClient, 'query'>;

type Criterion = {
  critere: string;
  valeurPoste: unknown;
  valeurCandidat: unknown;
  note: number;
  composante: 'contexte' | 'mission' | 'warning';
};

export type MatchingResult = {
  id_opportunite: number;
  note_contexte: number;
  note_mission: number;
  note_warning: number;
  etat: 'Provisoire' | 'Rejeté système';
};

const SCORE_KEYS = [
  'MATCH_SCORE_REGION_P1',
  'MATCH_SCORE_REGION_P2',
  'MATCH_SCORE_REGION_P3',
  'MATCH_SCORE_REGION_P4',
  'MATCH_SCORE_REGION_P5',
  'MATCH_SCORE_REGION_P6',
  'MATCH_SCORE_REGION_NON',
  'MATCH_SCORE_EXACT',
  'MATCH_SCORE_ADJACENT',
  'MATCH_SCORE_HOUSING_PARTNER',
  'MATCH_SCORE_HOUSING_NEARBY',
  'MATCH_SCORE_LANGUAGE_DIFFERENT_LEVEL',
  'MATCH_SCORE_LANGUAGE_NEW',
  'MATCH_SCORE_SKILLS_ALL',
  'MATCH_SCORE_SKILLS_SOME',
  'MATCH_SCORE_SKILLS_DOMAIN',
  'MATCH_SCORE_WARNING_OK',
  'MATCH_SCORE_WARNING_KO',
  'MATCH_SCORE_DATE_EXACT',
  'MATCH_SCORE_DATE_ONE_MONTH',
  'MATCH_SCORE_DATE_THREE_MONTHS',
  'MATCH_SCORE_DATE_SIX_MONTHS',
  'MATCH_SCORE_DATE_OTHER',
] as const;

type ScoreKey = (typeof SCORE_KEYS)[number];

function scoreConfig(): Record<ScoreKey, number> {
  return Object.fromEntries(SCORE_KEYS.map((key) => {
    const raw = process.env[key];
    if (raw === undefined || raw.trim() === '' || !Number.isFinite(Number(raw))) {
      throw new Error(`Configuration de scoring absente ou invalide : ${key}`);
    }
    return [key, Number(raw)];
  })) as Record<ScoreKey, number>;
}

function short(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const rendered = Array.isArray(value) ? value.join(', ') : String(value);
  return rendered.slice(0, 50);
}

async function stateId(client: DbClient, designation: string): Promise<number> {
  const result = await client.query(
    'SELECT id_etat_opportunite FROM etat_opportunite WHERE designation=$1 AND COALESCE(active,true)',
    [designation],
  );
  if (!result.rows.length) throw new Error(`État d'opportunité introuvable : ${designation}`);
  return result.rows[0].id_etat_opportunite;
}

async function fetchOpportunityData(client: DbClient, idOpportunity: number) {
  const base = await client.query(
    `SELECT
       o.id_opportunite, o.id_fiche_de_voeux, o.id_poste,
       eo.designation AS etat_actuel,
       f.date_depart_possible, f.date_depart_souhaite, f.date_voeux_definitifs,
       f.part_seul, f.nouvelle_langue,
       f.zone_orange, f.conditions_spartiates, f.hopital_proche,
       p.date_arrivee_souhaitee,p.deuxieme_poste_possible_partenaire,p.deuxieme_poste_possible_alentour,
       p.flag_zone_orange, p.flag_condition_spartiates, p.flag_hopital_proche,
       p.id_region, p.region_designation, p.id_hebergement, p.hebergement_designation,
       p.id_duree, p.duree_designation, p.id_domaine, p.domaine_designation
     FROM opportunite o
     JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
     JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=o.id_fiche_de_voeux
     JOIN (
       SELECT fp.*,
              py.id_region, r.designation AS region_designation,
              h.designation AS hebergement_designation,
              d.periode AS duree_designation,
              dom.designation AS domaine_designation
       FROM fiche_de_poste fp
       JOIN pays py ON py.id_pays=fp.id_pays
       JOIN region r ON r.id_region=py.id_region
       JOIN hebergement h ON h.id_hebergement=fp.id_hebergement
       JOIN duree d ON d.id_duree=fp.id_duree
       JOIN domaine dom ON dom.id_domaine=fp.id_domaine
     ) p ON p.id_poste=o.id_poste
     WHERE o.id_opportunite=$1`,
    [idOpportunity],
  );
  if (!base.rows.length) throw new Error('OPPORTUNITY_NOT_FOUND');
  const row = base.rows[0];
  const ficheId = row.id_fiche_de_voeux;
  const postId = row.id_poste;

  const relations: Record<string, QueryResult> = {};
  const queries: Array<[string, string, unknown[]]> = [
    ['region', `SELECT va.degre, r.designation FROM veut_aller_a va JOIN region r ON r.id_region=va.id_region WHERE va.id_fiche_de_voeux=$1 AND va.id_region=$2`, [ficheId, row.id_region]],
    ['candidateEnvironments', `SELECT e.id_environnement,e.designation,e.niveau FROM veut_vivre_dans v JOIN environnement e ON e.id_environnement=v.id_environnement WHERE v.id_fiche_de_voeux=$1`, [ficheId]],
    ['postEnvironments', `SELECT e.id_environnement,e.designation,e.niveau FROM evolue_dans v JOIN environnement e ON e.id_environnement=v.id_environnement WHERE v.id_poste=$1`, [postId]],
    ['housing', `SELECT h.id_hebergement,h.designation FROM veut_habiter_dans v JOIN hebergement h ON h.id_hebergement=v.id_hebergement WHERE v.id_fiche_de_voeux=$1`, [ficheId]],
    ['durations', `SELECT d.id_duree,d.periode,d.niveau FROM veut_partir_pour v JOIN duree d ON d.id_duree=v.id_duree WHERE v.id_fiche_de_voeux=$1`, [ficheId]],
    ['candidateLanguages', `SELECT p.id_langue,l.designation,p.id_niveau_langue,n.designation AS niveau,n.ordre FROM parle p JOIN langue l ON l.id_langue=p.id_langue LEFT JOIN niveau_langue n ON n.id_niveau_langue=p.id_niveau_langue WHERE p.id_fiche_de_voeux=$1`, [ficheId]],
    ['postLanguage', `SELECT p.id_langue,l.designation,p.id_niveau_langue,n.designation AS niveau,n.ordre FROM langue_poste p JOIN langue l ON l.id_langue=p.id_langue LEFT JOIN niveau_langue n ON n.id_niveau_langue=p.id_niveau_langue WHERE p.id_poste=$1`, [postId]],
    ['candidateSkills', `SELECT c.id_competences,c.designation FROM a_la_competence_de a JOIN competences c ON c.id_competences=a.id_competences WHERE a.id_fiche_de_voeux=$1`, [ficheId]],
    ['postSkills', `SELECT c.id_competences,c.id_domaine,c.designation FROM recherche r JOIN competences c ON c.id_competences=r.id_competences WHERE r.id_poste=$1`, [postId]],
    ['education', `SELECT d.id_domaine,d.designation FROM a_etudie_dans a JOIN domaine d ON d.id_domaine=a.id_domaine WHERE a.id_fiche_de_voeux=$1`, [ficheId]],
    ['experience', `SELECT d.id_domaine,d.designation FROM a_travaille_dans a JOIN domaine d ON d.id_domaine=a.id_domaine WHERE a.id_fiche_de_voeux=$1`, [ficheId]],
  ];
  for (const [name, sql, params] of queries) relations[name] = await client.query(sql, params);
  return { row, relations };
}

async function insertDetails(client: DbClient, opportunityId: number, details: Criterion[]) {
  for (const detail of details) {
    await client.query(
      `INSERT INTO criteres_detailles
       (date_evaluation,critere,valeur_poste,valeur_candidat,note_obtenue,id_opportunite)
       VALUES(CURRENT_DATE,$1,$2,$3,$4,$5)`,
      [short(detail.critere), short(detail.valeurPoste), short(detail.valeurCandidat), detail.note, opportunityId],
    );
  }
}

async function scoreOpportunity(client: DbClient, idOpportunity: number): Promise<MatchingResult> {
  const cfg = scoreConfig();
  const { row, relations } = await fetchOpportunityData(client, idOpportunity);
  const details: Criterion[] = [];
  const add = (
    critere: string,
    valeurPoste: unknown,
    valeurCandidat: unknown,
    note: number,
    composante: Criterion['composante'],
  ) => details.push({ critere, valeurPoste, valeurCandidat, note, composante });

  const region = relations.region.rows[0];
  const regionKey = region?.degre ? `MATCH_SCORE_REGION_${region.degre.toUpperCase()}` as ScoreKey : null;
  add('Région', row.region_designation, region?.degre ?? 'Non renseigné', regionKey && regionKey in cfg ? cfg[regionKey] : 0, 'contexte');

  let environmentScore = 0;
  for (const postEnvironment of relations.postEnvironments.rows) {
    for (const candidateEnvironment of relations.candidateEnvironments.rows) {
      const pairScore = postEnvironment.id_environnement === candidateEnvironment.id_environnement
        ? cfg.MATCH_SCORE_EXACT
        : postEnvironment.niveau !== null && candidateEnvironment.niveau !== null
          && Math.abs(Number(postEnvironment.niveau) - Number(candidateEnvironment.niveau)) === 1
          ? cfg.MATCH_SCORE_ADJACENT
          : 0;
      environmentScore = Math.max(environmentScore, pairScore);
    }
  }
  add('Environnement', relations.postEnvironments.rows.map((item) => item.designation), relations.candidateEnvironments.rows.map((item) => item.designation), environmentScore, 'contexte');

  const housingMatch = relations.housing.rows.some((item) => item.id_hebergement === row.id_hebergement);
  const housingScore = row.part_seul
    ? (housingMatch ? cfg.MATCH_SCORE_EXACT : 0)
    : row.deuxieme_poste_possible_partenaire
      ? cfg.MATCH_SCORE_HOUSING_PARTNER
      : row.deuxieme_poste_possible_alentour
        ? cfg.MATCH_SCORE_HOUSING_NEARBY
        : 0;
  add('Logement / couple', row.hebergement_designation, row.part_seul ? relations.housing.rows.map((item) => item.designation) : 'Départ en couple/famille', housingScore, 'contexte');

  let durationScore = 0;
  const postDuration = await client.query('SELECT niveau FROM duree WHERE id_duree=$1', [row.id_duree]);
  for (const duration of relations.durations.rows) {
    const pairScore = duration.id_duree === row.id_duree
      ? cfg.MATCH_SCORE_EXACT
      : duration.niveau !== null && postDuration.rows[0]?.niveau !== null
        && Math.abs(Number(duration.niveau) - Number(postDuration.rows[0].niveau)) === 1
        ? cfg.MATCH_SCORE_ADJACENT
        : 0;
    durationScore = Math.max(durationScore, pairScore);
  }
  add('Durée', row.duree_designation, relations.durations.rows.map((item) => item.periode), durationScore, 'contexte');

  const departureDate = row.date_depart_possible ?? row.date_depart_souhaite;
  const monthIndex = (value: string | Date) => {
    const date = new Date(value);
    return date.getUTCFullYear() * 12 + date.getUTCMonth();
  };
  const departureDiff = departureDate && row.date_arrivee_souhaitee
    ? Math.abs(monthIndex(departureDate) - monthIndex(row.date_arrivee_souhaitee))
    : null;
  const departureScore = departureDiff === 0
    ? cfg.MATCH_SCORE_DATE_EXACT
    : departureDiff === 1
      ? cfg.MATCH_SCORE_DATE_ONE_MONTH
      : departureDiff !== null && departureDiff <= 3
        ? cfg.MATCH_SCORE_DATE_THREE_MONTHS
        : departureDiff !== null && departureDiff <= 6
          ? cfg.MATCH_SCORE_DATE_SIX_MONTHS
          : cfg.MATCH_SCORE_DATE_OTHER;
  add('Date de départ', row.date_arrivee_souhaitee, departureDate, departureScore, 'contexte');

  const requiredLanguage = relations.postLanguage.rows[0];
  let languageScore = cfg.MATCH_SCORE_EXACT;
  if (requiredLanguage) {
    const spoken = relations.candidateLanguages.rows.find((item) => item.id_langue === requiredLanguage.id_langue);
    languageScore = spoken
      ? (spoken.id_niveau_langue === requiredLanguage.id_niveau_langue ? cfg.MATCH_SCORE_EXACT : cfg.MATCH_SCORE_LANGUAGE_DIFFERENT_LEVEL)
      : row.nouvelle_langue
        ? cfg.MATCH_SCORE_LANGUAGE_NEW
        : 0;
    add('Langue', `${requiredLanguage.designation} (${requiredLanguage.niveau ?? '—'})`, spoken ? `${spoken.designation} (${spoken.niveau ?? '—'})` : row.nouvelle_langue ? 'Prêt à apprendre' : 'Non parlée', languageScore, 'contexte');
  } else {
    add('Langue', 'Aucune exigence', '—', languageScore, 'contexte');
  }

  const candidateSkills = new Set(relations.candidateSkills.rows.map((item) => item.id_competences));
  const postSkills = relations.postSkills.rows;
  const coveredCount = postSkills.filter((skill) => candidateSkills.has(skill.id_competences)).length;
  const candidateDomains = new Set([...relations.education.rows, ...relations.experience.rows].map((item) => item.id_domaine));
  const domainCovered = postSkills.some((skill) => candidateDomains.has(skill.id_domaine));
  const skillsScore = postSkills.length === 0 || coveredCount === postSkills.length
    ? cfg.MATCH_SCORE_SKILLS_ALL
    : coveredCount > 0
      ? cfg.MATCH_SCORE_SKILLS_SOME
      : domainCovered
        ? cfg.MATCH_SCORE_SKILLS_DOMAIN
        : 0;
  add('Compétences', postSkills.map((item) => item.designation), relations.candidateSkills.rows.map((item) => item.designation), skillsScore, 'mission');

  const warnings: Array<[string, boolean]> = [
    ['Zone orange', !row.flag_zone_orange || row.zone_orange],
    ['Conditions spartiates', !row.flag_condition_spartiates || row.conditions_spartiates],
    ['Hôpital proche', row.flag_hopital_proche || !row.hopital_proche],
  ];
  for (const [label, compatible] of warnings) {
    add(label, compatible ? 'Compatible' : 'Incompatible', 'Préférence candidat', compatible ? cfg.MATCH_SCORE_WARNING_OK : cfg.MATCH_SCORE_WARNING_KO, 'warning');
  }

  const contextNotes = [details.find((item) => item.critere === 'Région')!.note, environmentScore, housingScore, durationScore, languageScore];
  const noteContexte = contextNotes.reduce((sum, note) => sum + note, 0) / contextNotes.length;
  const noteMission = skillsScore;
  const noteWarning = Math.min(...details.filter((detail) => detail.composante === 'warning').map((detail) => detail.note));

  await client.query(
    `UPDATE opportunite
     SET note_contexte=$1,note_mission=$2,note_warning=$3
     WHERE id_opportunite=$4`,
    [noteContexte, noteMission, noteWarning, idOpportunity],
  );
  await insertDetails(client, idOpportunity, details);
  return {
    id_opportunite: idOpportunity,
    note_contexte: noteContexte,
    note_mission: noteMission,
    note_warning: noteWarning,
    etat: 'Provisoire',
  };
}

async function insertAndScore(client: DbClient, ficheId: number, postId: number): Promise<MatchingResult | null> {
  const exists = await client.query('SELECT 1 FROM opportunite WHERE id_fiche_de_voeux=$1 AND id_poste=$2', [ficheId, postId]);
  if (exists.rows.length) return null;
  const provisional = await stateId(client, 'Provisoire');
  const inserted = await client.query(
    `INSERT INTO opportunite(id_etat_opportunite,id_poste,id_fiche_de_voeux,flag_opportunite_obsolete)
     VALUES($1,$2,$3,false)
     RETURNING id_opportunite`,
    [provisional, postId, ficheId],
  );
  return scoreOpportunity(client, inserted.rows[0].id_opportunite);
}

export class Opportunite {
  static async evaluer(idOpportunity: number, client: DbClient = pool): Promise<MatchingResult> {
    return scoreOpportunity(client, idOpportunity);
  }

  static async creerPourCandidat(idFiche: number, client: DbClient = pool): Promise<MatchingResult[]> {
    const posts = await client.query(
      `SELECT fp.id_poste
       FROM fiche_de_poste fp
       JOIN etat_poste ep ON ep.id_etat_poste=fp.id_etat_poste
       WHERE ep.designation='À pourvoir' AND NOT fp.candidat_preaffecte`,
    );
    const results: MatchingResult[] = [];
    for (const post of posts.rows) {
      const result = await insertAndScore(client, idFiche, post.id_poste);
      if (result) results.push(result);
    }
    await client.query('UPDATE fiche_de_voeux SET flag_create_opportunity=false,flag_update_score=false WHERE id_fiche_de_voeux=$1', [idFiche]);
    return results;
  }

  static async calculerDateDepartPossible(idFiche: number, definitive: boolean, client: DbClient = pool) {
    const current = await client.query('SELECT date_depart_souhaite FROM fiche_de_voeux WHERE id_fiche_de_voeux=$1', [idFiche]);
    if (!current.rows.length) return;
    const now = new Date();
    const nowMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
    const stageMonths = [{ stage: 0, departure: 1 }, { stage: 6, departure: 7 }];
    const sessionMonths = [2, 5, 9];
    const nextOccurrence = (months: number[], minimum: number) => {
      for (let year = Math.floor(minimum / 12); year <= Math.floor(minimum / 12) + 3; year += 1) {
        for (const month of months) {
          const value = year * 12 + month;
          if (value >= minimum) return value;
        }
      }
      return minimum;
    };
    let computed: number;
    if (definitive) {
      const stage = nextOccurrence(stageMonths.map((item) => item.stage), nowMonth + 1);
      const pair = stageMonths.find((item) => item.stage === stage % 12)!;
      computed = Math.floor(stage / 12) * 12 + pair.departure;
    } else {
      const session = nextOccurrence(sessionMonths, nowMonth + 1);
      const stage = nextOccurrence(stageMonths.map((item) => item.stage), session + 1);
      const pair = stageMonths.find((item) => item.stage === stage % 12)!;
      computed = Math.floor(stage / 12) * 12 + pair.departure;
    }
    const desired = current.rows[0].date_depart_souhaite
      ? new Date(current.rows[0].date_depart_souhaite).getUTCFullYear() * 12 + new Date(current.rows[0].date_depart_souhaite).getUTCMonth()
      : computed;
    const finalMonth = Math.max(computed, desired);
    const iso = `${Math.floor(finalMonth / 12)}-${String(finalMonth % 12 + 1).padStart(2, '0')}-01`;
    await client.query('UPDATE fiche_de_voeux SET date_depart_possible=$1 WHERE id_fiche_de_voeux=$2', [iso, idFiche]);
  }

  static async evaluerSoumissionDefinitive(idFiche: number, client: DbClient = pool) {
    const rows = await client.query(
      `SELECT o.id_opportunite FROM opportunite o JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
       WHERE o.id_fiche_de_voeux=$1 AND eo.designation='Provisoire'`,
      [idFiche],
    );
    const qualified = await stateId(client, 'Non qualifié');
    const rejected = await stateId(client, 'Rejeté système');
    for (const row of rows.rows) {
      const result = await scoreOpportunity(client, row.id_opportunite);
      const accepted = result.note_mission >= 5;
      await client.query(
        'UPDATE opportunite SET id_etat_opportunite=$1,flag_opportunite_non_retenu=$2 WHERE id_opportunite=$3',
        [accepted ? qualified : rejected, !accepted, row.id_opportunite],
      );
    }
  }

  static async evaluerModificationVoeux(idFiche: number, client: DbClient = pool) {
    const rows = await client.query(
      `SELECT o.id_opportunite FROM opportunite o JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
       WHERE o.id_fiche_de_voeux=$1 AND eo.designation='Non qualifié'
         AND NOT COALESCE(o.flag_opportunite_obsolete,false)`,
      [idFiche],
    );
    const rejected = await stateId(client, 'Rejeté système');
    for (const row of rows.rows) {
      const result = await scoreOpportunity(client, row.id_opportunite);
      if (result.note_mission < 5) {
        await client.query(
          'UPDATE opportunite SET id_etat_opportunite=$1,flag_opportunite_non_retenu=true WHERE id_opportunite=$2',
          [rejected, row.id_opportunite],
        );
      }
    }
  }

  static async synchroniserPoste(idPost: number, client: DbClient = pool): Promise<MatchingResult[]> {
    const post = await client.query(
      `SELECT fp.flag_create_opportunity,fp.candidat_preaffecte,fp.date_maj_crm,fp.date_dernier_recalcul_score,
              ep.designation AS etat
       FROM fiche_de_poste fp JOIN etat_poste ep ON ep.id_etat_poste=fp.id_etat_poste
       WHERE fp.id_poste=$1`,
      [idPost],
    );
    if (!post.rows.length || post.rows[0].candidat_preaffecte || post.rows[0].etat !== 'À pourvoir') return [];
    const shouldRun = post.rows[0].flag_create_opportunity
      || String(post.rows[0].date_maj_crm ?? '') !== String(post.rows[0].date_dernier_recalcul_score ?? '');
    if (!shouldRun) return [];

    const results: MatchingResult[] = [];
    if (post.rows[0].flag_create_opportunity) {
      const wishes = await client.query(
      `SELECT f.id_fiche_de_voeux
       FROM fiche_de_voeux f
       JOIN candidat c ON c.id_candidat=f.id_candidat
       WHERE f.flag_fiche_de_voeux_soumise=true AND c.id_etat_candidat<>'AFF'`,
      );
      for (const wish of wishes.rows) {
        const result = await insertAndScore(client, wish.id_fiche_de_voeux, idPost);
        if (result) results.push(result);
      }
    }
    const existing = await client.query(
      `SELECT o.id_opportunite FROM opportunite o JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
       WHERE o.id_poste=$1 AND eo.designation<>'Affecté'
         AND NOT COALESCE(o.flag_opportunite_non_retenu,false) AND NOT COALESCE(o.flag_opportunite_obsolete,false)`,
      [idPost],
    );
    for (const opportunity of existing.rows) results.push(await scoreOpportunity(client, opportunity.id_opportunite));
    await client.query(
      'UPDATE fiche_de_poste SET flag_create_opportunity=false,date_dernier_recalcul_score=date_maj_crm WHERE id_poste=$1',
      [idPost],
    );
    return results;
  }

  static async marquerObsoletesPourPoste(idPost: number, client: DbClient = pool) {
    const obsolete = await stateId(client, 'Obsolète');
    await client.query(
      `UPDATE opportunite SET flag_opportunite_obsolete=true,id_etat_opportunite=$2
       WHERE id_poste=$1 AND id_etat_opportunite NOT IN (
         SELECT id_etat_opportunite FROM etat_opportunite WHERE designation IN ('Affecté','Refus candidat','Refus partenaire')
       )`,
      [idPost, obsolete],
    );
  }
}