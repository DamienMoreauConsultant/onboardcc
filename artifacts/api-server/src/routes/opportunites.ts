import { Router, type Request } from 'express';
import { requireRole } from '../middleware/requireRole';
import pool from '../db-pg';
import { Opportunite } from '../services/matching';
import { actionUpload, cleanupUploadedFiles, uploadedFileUrls, verifyUploadedFiles } from '../lib/actionUploads';

const router = Router();
const ALL_ROLES = ['RECRUTEUR', 'CM', 'ADMIN', 'CANDIDAT'];
const STAFF_ROLES = ['RECRUTEUR', 'CM', 'ADMIN'];
const opportunityActionUpload = actionUpload('opportunites');

const BASE_SELECT = `
  SELECT
    o.id_opportunite,o.id_poste,o.id_fiche_de_voeux,
    o.note_contexte,o.note_mission,o.note_warning,
    o.historique,
    o.flag_opportunite_proposee_a_cm,o.flag_opportunite_retenue,
    o.flag_opportunite_non_retenu,o.flag_opportunite_obsolete,
    eo.designation AS etat_designation,
    cand.id_candidat,co.nom_contact,co.prenom_contact,co.date_naissance,
    cand.id_etat_candidat AS etat_candidat_code,
    ec.designation AS etat_candidat_designation,fdv.date_depart_possible,
    fp.crm_key AS poste_crm_key,fp.ong,fp.fonction,fp.date_arrivee_souhaitee,
    fp.contexte_mission,fp.objectifs_mission,fp.taches,fp.competences_detail,
    fp.odd_lie,fp.dimension_ecclesial,
    ep.designation AS etat_poste_designation,
    p.designation AS pays_designation,r.designation AS region_designation,
    dom.designation AS domaine_designation,
    (SELECT string_agg(DISTINCT dpost.designation, ', ' ORDER BY dpost.designation)
     FROM recherche rech
     JOIN competences cp ON cp.id_competences=rech.id_competences
     JOIN domaine dpost ON dpost.id_domaine=cp.id_domaine
     WHERE rech.id_poste=o.id_poste) AS domaines_poste,
    (SELECT string_agg(DISTINCT cp.designation, ', ' ORDER BY cp.designation)
     FROM recherche rech JOIN competences cp ON cp.id_competences=rech.id_competences
     WHERE rech.id_poste=o.id_poste) AS competences_poste,
    (SELECT string_agg(DISTINCT lp.designation, ', ' ORDER BY lp.designation)
     FROM langue_poste lpost JOIN langue lp ON lp.id_langue=lpost.id_langue
     WHERE lpost.id_poste=o.id_poste) AS langues_poste,
    (SELECT string_agg(DISTINCT dc.designation, ', ' ORDER BY dc.designation)
     FROM (
       SELECT a.id_domaine FROM a_etudie_dans a WHERE a.id_fiche_de_voeux=o.id_fiche_de_voeux
       UNION
       SELECT a.id_domaine FROM a_travaille_dans a WHERE a.id_fiche_de_voeux=o.id_fiche_de_voeux
       UNION
       SELECT cp.id_domaine
       FROM a_la_competence_de acomp
       JOIN competences cp ON cp.id_competences=acomp.id_competences
       WHERE acomp.id_fiche_de_voeux=o.id_fiche_de_voeux
     ) source_domaine
     JOIN domaine dc ON dc.id_domaine=source_domaine.id_domaine) AS domaines_candidat,
    (SELECT string_agg(DISTINCT cc.designation, ', ' ORDER BY cc.designation)
     FROM a_la_competence_de acomp JOIN competences cc ON cc.id_competences=acomp.id_competences
     WHERE acomp.id_fiche_de_voeux=o.id_fiche_de_voeux) AS competences_candidat,
    (SELECT string_agg(DISTINCT lc.designation, ', ' ORDER BY lc.designation)
     FROM parle pc JOIN langue lc ON lc.id_langue=pc.id_langue
     WHERE pc.id_fiche_de_voeux=o.id_fiche_de_voeux) AS langues_candidat,
    (SELECT COUNT(*)::int FROM opportunite oc
     WHERE oc.id_poste=o.id_poste
       AND NOT COALESCE(oc.flag_opportunite_obsolete,false)
       AND NOT COALESCE(oc.flag_opportunite_non_retenu,false)
       AND COALESCE(oc.note_mission,0)>=5) AS nb_candidats,
    (SELECT COUNT(*)::int FROM opportunite op
     WHERE op.id_fiche_de_voeux=o.id_fiche_de_voeux
       AND NOT COALESCE(op.flag_opportunite_obsolete,false)
       AND NOT COALESCE(op.flag_opportunite_non_retenu,false)
       AND COALESCE(op.note_mission,0)>=5) AS nb_postes,
     (SELECT json_build_object(
               'nom', cm.nom_contact,
               'prenom', cm.prenom_contact,
               'telephone', cm.tel_contact,
               'email', cm.email_contact)
      FROM gere_poste gp
      JOIN contact cm ON cm.id_contact=gp.id_contact
      WHERE gp.id_poste=o.id_poste AND cm.role IN ('CM1','CM2')
      ORDER BY CASE cm.role WHEN 'CM1' THEN 1 ELSE 2 END
      LIMIT 1) AS cm_contact_json
  FROM opportunite o
  JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
  JOIN fiche_de_voeux fdv ON fdv.id_fiche_de_voeux=o.id_fiche_de_voeux
  JOIN candidat cand ON cand.id_candidat=fdv.id_candidat
  JOIN contact co ON co.id_contact=cand.id_contact
  JOIN etat_candidat ec ON ec.id_etat_candidat=cand.id_etat_candidat
  JOIN fiche_de_poste fp ON fp.id_poste=o.id_poste
  JOIN etat_poste ep ON ep.id_etat_poste=fp.id_etat_poste
  JOIN pays p ON p.id_pays=fp.id_pays
  JOIN region r ON r.id_region=p.id_region
  JOIN domaine dom ON dom.id_domaine=fp.id_domaine
`;

function hideCandidateScoring(row: Record<string, unknown>) {
  const {
    note_contexte: _noteContexte,
    note_mission: _noteMission,
    note_warning: _noteWarning,
    ...safe
  } = row;
  return safe;
}

function roleScope(req: Request, params: unknown[]) {
  const role = req.user!.role_applicatif;
  if (role === 'CANDIDAT') {
    params.push(req.user!.id_candidat);
    return ` AND cand.id_candidat=$${params.length}
      AND eo.designation IN ('Mise en lien','Accord de principe','Accepté','Affecté','Refus candidat','Refus partenaire')`;
  }
  if (role === 'CM') {
    params.push(req.user!.id_contact);
    return ` AND EXISTS(SELECT 1 FROM gere_poste gp WHERE gp.id_poste=o.id_poste AND gp.id_contact=$${params.length})
      AND eo.designation NOT IN ('Provisoire','Non qualifié','Rejeté système','Rejeté recruteur')`;
  }
  return '';
}

async function canAccess(req: Request, opportunityId: number): Promise<boolean> {
  const params: unknown[] = [opportunityId];
  const scope = roleScope(req, params);
  const result = await pool.query(`${BASE_SELECT} WHERE o.id_opportunite=$1 ${scope}`, params);
  return result.rows.length > 0;
}

router.get('/', requireRole(ALL_ROLES), async (req, res) => {
  try {
    const params: unknown[] = [];
    const filters: string[] = ['1=1'];
    if (req.query.id_poste) {
      params.push(Number(req.query.id_poste));
      filters.push(`o.id_poste=$${params.length}`);
    }
    if (req.query.id_candidat) {
      params.push(Number(req.query.id_candidat));
      filters.push(`cand.id_candidat=$${params.length}`);
    }
    const approvalFilter = String(req.query.approbation ?? '');
    if (approvalFilter === 'proposee-au-cm') {
      filters.push(`eo.designation='Proposée au CM'`);
    } else if (approvalFilter === 'proposee-au-cm-historique') {
      filters.push(`COALESCE(o.flag_opportunite_proposee_a_cm,false)`);
    }
    const scope = roleScope(req, params);
    const result = await pool.query(
      `${BASE_SELECT}
       WHERE ${filters.join(' AND ')} ${scope}
       ORDER BY CASE
                  WHEN eo.designation='Accepté' THEN 0
                  WHEN eo.designation IN ('Mise en lien','Accord de principe') THEN 1
                  ELSE 2
                END,
                COALESCE(o.note_mission,0) DESC,
                o.id_opportunite DESC
       LIMIT 250`,
      params,
    );
    res.json(req.user!.role_applicatif === 'CANDIDAT' ? result.rows.map(hideCandidateScoring) : result.rows);
  } catch (err) {
    console.error('Erreur GET opportunites :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

const FILTER_COLUMNS: Record<string, string> = {
  etat_poste: 'etat_poste_designation',
  etat_poste_designation: 'etat_poste_designation',
  domaine: 'domaine_designation',
  domaine_designation: 'domaine_designation',
  competences_poste: 'competences_poste',
  langue_poste: 'langues_poste',
  langues_poste: 'langues_poste',
  etat_candidat: 'etat_candidat_designation',
  etat_candidat_designation: 'etat_candidat_designation',
  domaines_candidat: 'domaines_candidat',
  competences_candidat: 'competences_candidat',
  langues_candidat: 'langues_candidat',
};

router.get('/filtres/:colonne', requireRole(STAFF_ROLES), async (req, res) => {
  const column = FILTER_COLUMNS[String(req.params.colonne)];
  if (!column) return void res.status(400).json({error:'Filtre inconnu.'});
  try {
    const params: unknown[] = [];
    const scope = roleScope(req, params);
    const result = await pool.query(
      `SELECT DISTINCT ${column} AS value FROM (${BASE_SELECT} WHERE 1=1 ${scope}) liste
       WHERE ${column} IS NOT NULL AND ${column}<>''
       ORDER BY value`,
      params,
    );
    res.json({values:result.rows.map((row)=>row.value)});
  } catch (err) {
    console.error('Erreur GET filtres opportunités :', err);
    res.status(500).json({error:'Erreur interne du serveur.'});
  }
});

router.get('/:id', requireRole(ALL_ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || !(await canAccess(req, id))) {
      return void res.status(404).json({ error: 'Opportunité introuvable.' });
    }
    const [opportunity, details] = await Promise.all([
      pool.query(`${BASE_SELECT} WHERE o.id_opportunite=$1`, [id]),
      req.user!.role_applicatif === 'CANDIDAT' ? Promise.resolve({ rows: [] }) : pool.query(
        `SELECT DISTINCT ON (critere)
           id_criteres_detailles,date_evaluation,critere,valeur_poste,valeur_candidat,note_obtenue
         FROM criteres_detailles WHERE id_opportunite=$1
         ORDER BY critere,date_evaluation DESC,id_criteres_detailles DESC`,
        [id],
      ),
    ]);
    const payload = { ...opportunity.rows[0], criteres_detailles: details.rows };
    res.json(req.user!.role_applicatif === 'CANDIDAT' ? hideCandidateScoring(payload) : payload);
  } catch (err) {
    console.error('Erreur GET opportunite détail :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

type TransitionName =
  | 'proposer_cm'
  | 'approuver'
  | 'rejeter_cm'
  | 'rejeter_recruteur'
  | 'mettre_en_lien'
  | 'accord_de_principe'
  | 'accord_definitif'
  | 'decision_dcc'
  | 'refuser_candidat'
  | 'refuser_partenaire'
  | 'annuler_affectation';

const transitionRules: Record<TransitionName, {
  roles: string[];
  from: string[];
  to: string;
}> = {
  // 'Rejeté système' ajouté au 'from' le 23/09/2026 (Retour_26) : cet état était un cul-de-sac
  // (déclenché automatiquement par le scoring, aucune transition n'en sortait) — décision de
  // Damien : le recruteur doit pouvoir proposer au CM une opportunité rejetée par le système
  // (ex. départ en couple, compétences différentes mais utiles), exactement comme depuis
  // 'Non qualifié'. Reste masqué par défaut dans les listes (OpportunityList.tsx, filtre
  // note_mission < 5), révélé par le toggle "Tout afficher" déjà existant.
  proposer_cm: { roles: ['RECRUTEUR', 'ADMIN'], from: ['Non qualifié', 'Rejeté système'], to: 'Proposée au CM' },
  approuver: { roles: ['CM'], from: ['Proposée au CM'], to: 'Approuvé CM' },
  rejeter_cm: { roles: ['CM'], from: ['Proposée au CM'], to: 'Rejeté CM' },
  rejeter_recruteur: { roles: ['RECRUTEUR', 'ADMIN'], from: ['Non qualifié'], to: 'Rejeté recruteur' },
  mettre_en_lien: { roles: ['RECRUTEUR', 'ADMIN'], from: ['Approuvé CM'], to: 'Mise en lien' },
  accord_de_principe: { roles: ['CANDIDAT', 'RECRUTEUR', 'ADMIN'], from: ['Mise en lien'], to: 'Accord de principe' },
  accord_definitif: { roles: ['CANDIDAT', 'RECRUTEUR', 'ADMIN'], from: ['Accord de principe'], to: 'Accepté' },
  decision_dcc: { roles: ['RECRUTEUR', 'ADMIN'], from: ['Accepté'], to: 'Affecté' },
  refuser_candidat: { roles: ['CANDIDAT'], from: ['Mise en lien', 'Accord de principe'], to: 'Refus candidat' },
  refuser_partenaire: { roles: ['RECRUTEUR', 'ADMIN'], from: ['Accepté'], to: 'Refus partenaire' },
  annuler_affectation: { roles: ['RECRUTEUR', 'ADMIN'], from: ['Affecté'], to: 'Rejet après affectation' },
};

router.post('/:id/recalculer', requireRole(['RECRUTEUR', 'ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!(await canAccess(req, id))) return void res.status(404).json({ error: 'Opportunité introuvable.' });
    res.json(await Opportunite.evaluer(id));
  } catch (err) {
    console.error('Erreur recalcul opportunité :', err);
    res.status(500).json({ error: 'Recalcul impossible.' });
  }
});

router.post('/recalculer-liste', requireRole(['RECRUTEUR', 'ADMIN']), async (req, res) => {
  const idPoste = Number(req.body?.id_poste);
  const idCandidat = Number(req.body?.id_candidat);
  if (!Number.isInteger(idPoste) && !Number.isInteger(idCandidat)) {
    return void res.status(400).json({error:'Un poste ou un candidat doit être indiqué.'});
  }
  try {
    const params: unknown[] = [];
    const filters: string[] = [];
    if (Number.isInteger(idPoste)) {
      params.push(idPoste);
      filters.push(`o.id_poste=$${params.length}`);
    }
    if (Number.isInteger(idCandidat)) {
      params.push(idCandidat);
      filters.push(`cand.id_candidat=$${params.length}`);
    }
    const scope = roleScope(req, params);
    const rows = await pool.query(
      `${BASE_SELECT} WHERE ${filters.join(' AND ')} ${scope} ORDER BY o.id_opportunite`,
      params,
    );
    const recalcules = [];
    for (const row of rows.rows) recalcules.push(await Opportunite.evaluer(row.id_opportunite));
    res.json({recalcules:recalcules.length,opportunites:recalcules});
  } catch (err) {
    console.error('Erreur recalcul global des opportunités :', err);
    res.status(500).json({error:'Recalcul global impossible.'});
  }
});

router.post('/:id/:action', requireRole(ALL_ROLES), opportunityActionUpload.array('pieces_jointes', 2), async (req, res) => {
  const action = String(req.params.action).replaceAll('-', '_') as TransitionName;
  const rule = transitionRules[action];
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!rule) {
    await cleanupUploadedFiles(files);
    return void res.status(404).json({ error: 'Action inconnue.' });
  }
  if (!rule.roles.includes(req.user!.role_applicatif)) {
    await cleanupUploadedFiles(files);
    return void res.status(403).json({ error: 'Rôle non autorisé pour cette action.' });
  }
  const comment = typeof req.body?.commentaire === 'string' ? req.body.commentaire.trim() : '';
  const attachmentDescription = typeof req.body?.pj_description === 'string' ? req.body.pj_description.trim() : '';
  if (!comment) {
    await cleanupUploadedFiles(files);
    return void res.status(400).json({ error: 'Un commentaire est obligatoire.' });
  }
  const acceptanceAction = ['accord_de_principe', 'accord_definitif'].includes(action);
  if (comment.length > (acceptanceAction ? 1000 : 100)) {
    await cleanupUploadedFiles(files);
    return void res.status(400).json({ error: acceptanceAction ? 'Le texte de confirmation est limité à 1 000 caractères.' : 'Le commentaire est limité à 100 caractères.' });
  }
  if (files.length && !attachmentDescription) {
    await cleanupUploadedFiles(files);
    return void res.status(400).json({ error: 'La description est obligatoire lorsqu’une pièce jointe est fournie.' });
  }
  if (files.length && !['mettre_en_lien', 'accord_de_principe', 'accord_definitif', 'decision_dcc'].includes(action)) {
    await cleanupUploadedFiles(files);
    return void res.status(400).json({ error: 'Les pièces jointes ne sont pas disponibles pour cette action.' });
  }

  const client = await pool.connect();
  try {
    await verifyUploadedFiles(files);
    await client.query('BEGIN');
    const current = await client.query(
      `${BASE_SELECT} WHERE o.id_opportunite=$1 FOR UPDATE OF o,fdv,fp,cand`,
      [Number(req.params.id)],
    );
    if (!current.rows.length) throw new Error('NOT_FOUND');
    const opportunity = current.rows[0];
    if (!(await canAccess(req, opportunity.id_opportunite))) throw new Error('NOT_FOUND');
    if (!rule.from.includes(opportunity.etat_designation)) throw new Error('PRECONDITION');
    if (action === 'proposer_cm' && (
      opportunity.flag_opportunite_proposee_a_cm
      || opportunity.flag_opportunite_retenue
      || opportunity.flag_opportunite_non_retenu
      || opportunity.flag_opportunite_obsolete
    )) throw new Error('LOCKED');
    if (action === 'mettre_en_lien') {
      if (opportunity.etat_candidat_code !== 'ATA') throw new Error('CANDIDATE_NOT_ATA');
      const locks = await client.query(
        `SELECT fp.flag_poste_deja_mis_en_lien,fdv.flag_candidat_deja_mis_en_lien
         FROM fiche_de_poste fp CROSS JOIN fiche_de_voeux fdv
         WHERE fp.id_poste=$1 AND fdv.id_fiche_de_voeux=$2`,
        [opportunity.id_poste, opportunity.id_fiche_de_voeux],
      );
      if (locks.rows[0].flag_poste_deja_mis_en_lien || locks.rows[0].flag_candidat_deja_mis_en_lien) throw new Error('LOCKED');
    }

    const state = await client.query(
      'SELECT id_etat_opportunite FROM etat_opportunite WHERE designation=$1 AND COALESCE(active,true)',
      [rule.to],
    );
    if (!state.rows.length) throw new Error('STATE');
    if (action === 'annuler_affectation') {
      await client.query(
        `UPDATE opportunite
         SET flag_opportunite_obsolete=false,
             flag_opportunite_non_retenu=false
         WHERE id_opportunite<>$1
           AND (id_poste=$2 OR id_fiche_de_voeux=$3)
           AND (COALESCE(flag_opportunite_obsolete,false) OR COALESCE(flag_opportunite_non_retenu,false))`,
        [opportunity.id_opportunite, opportunity.id_poste, opportunity.id_fiche_de_voeux],
      );
    }
    const updates = ['id_etat_opportunite=$1'];
    const values: unknown[] = [state.rows[0].id_etat_opportunite];
    /* Historique unique (Retour_19, 19/09/2026) : remplace les anciennes colonnes
       appreciation_recruteur/commentaire_charge_mission (réécrites à chaque étape,
       donc perdant l'historique) — chaque transition, sans exception, enrichit ce
       journal plutôt qu'un champ dédié par rôle. Pas de pièce jointe ici : elles
       restent sur etape (candidat), voir plus bas. */
    const historiqueEntry = JSON.stringify([{
      role: req.user!.role_applicatif,
      nom: `${req.user!.prenom} ${req.user!.nom}`,
      date: new Date().toISOString(),
      etat: rule.to,
      commentaire: comment,
    }]);
    values.push(historiqueEntry);
    updates.push(`historique=historique || $${values.length}::jsonb`);
    if (action === 'proposer_cm') updates.push('flag_opportunite_proposee_a_cm=true');
    if (action === 'approuver') updates.push('flag_opportunite_retenue=true');
    if (action === 'annuler_affectation') {
      // Les opportunités sœurs sont rouvertes, mais l'opportunité annulée reste
      // explicitement non retenue et ne doit plus être considérée comme retenue.
      updates.push(
        'flag_opportunite_obsolete=false',
        'flag_opportunite_non_retenu=true',
        'flag_opportunite_retenue=false',
      );
    }
    if (['rejeter_cm', 'rejeter_recruteur', 'refuser_candidat', 'refuser_partenaire'].includes(action)) {
      updates.push('flag_opportunite_non_retenu=true');
    }
    values.push(opportunity.id_opportunite);
    await client.query(`UPDATE opportunite SET ${updates.join(',')} WHERE id_opportunite=$${values.length}`, values);

    if (action === 'approuver') {
      await client.query(`UPDATE fiche_de_poste SET id_etat_poste=(SELECT id_etat_poste FROM etat_poste WHERE designation='Pré-réservé') WHERE id_poste=$1`, [opportunity.id_poste]);
    }
    if (action === 'mettre_en_lien') {
      await client.query('UPDATE fiche_de_poste SET flag_poste_deja_mis_en_lien=true WHERE id_poste=$1', [opportunity.id_poste]);
      await client.query(`UPDATE fiche_de_poste SET id_etat_poste=(SELECT id_etat_poste FROM etat_poste WHERE designation='Réservé') WHERE id_poste=$1`, [opportunity.id_poste]);
      await client.query('UPDATE fiche_de_voeux SET flag_candidat_deja_mis_en_lien=true WHERE id_fiche_de_voeux=$1', [opportunity.id_fiche_de_voeux]);
      await client.query(`UPDATE candidat SET id_etat_candidat='MEL' WHERE id_candidat=$1`, [opportunity.id_candidat]);
    }
    if (action === 'accord_de_principe') {
      await client.query(`UPDATE candidat SET id_etat_candidat='ACP' WHERE id_candidat=$1`, [opportunity.id_candidat]);
    }
    if (action === 'accord_definitif') {
      await client.query(`UPDATE candidat SET id_etat_candidat='ACC' WHERE id_candidat=$1`, [opportunity.id_candidat]);
    }
    if (action === 'decision_dcc') {
      await client.query(`UPDATE candidat SET id_etat_candidat='AFF' WHERE id_candidat=$1`, [opportunity.id_candidat]);
      await client.query(
        `UPDATE fiche_de_poste SET id_etat_poste=(SELECT id_etat_poste FROM etat_poste WHERE designation='Pourvu') WHERE id_poste=$1`,
        [opportunity.id_poste],
      );
      await client.query(
        `UPDATE opportunite
         SET flag_opportunite_obsolete=true
         WHERE id_opportunite<>$1 AND (id_poste=$2 OR id_fiche_de_voeux=$3)`,
        [opportunity.id_opportunite, opportunity.id_poste, opportunity.id_fiche_de_voeux],
      );
    }
    if (action === 'annuler_affectation') {
      const ataState = await client.query(
        'SELECT delais_de_reponse FROM etat_candidat WHERE id_etat_candidat=$1',
        ['ATA'],
      );
      if (!ataState.rows.length) throw new Error('CANDIDATE_STATE');
      await client.query(
        `UPDATE candidat
         SET id_etat_candidat='ATA',
             date_revue=CASE WHEN $1::int IS NULL THEN NULL ELSE CURRENT_DATE+$1::int END
         WHERE id_candidat=$2`,
        [ataState.rows[0].delais_de_reponse, opportunity.id_candidat],
      );
      await client.query(
        'UPDATE fiche_de_voeux SET flag_candidat_deja_mis_en_lien=false WHERE id_fiche_de_voeux=$1',
        [opportunity.id_fiche_de_voeux],
      );
      await client.query(
        `UPDATE fiche_de_poste
         SET flag_poste_deja_mis_en_lien=false,
             id_etat_poste=(SELECT id_etat_poste FROM etat_poste WHERE designation=CASE
               WHEN EXISTS(
                 SELECT 1
                 FROM opportunite ox
                 JOIN etat_opportunite ex ON ex.id_etat_opportunite=ox.id_etat_opportunite
                 WHERE ox.id_poste=$1
                   AND ox.id_opportunite<>$2
                   AND ex.designation='Approuvé CM'
               ) THEN 'Pré-réservé' ELSE 'À pourvoir' END)
         WHERE id_poste=$1`,
        [opportunity.id_poste, opportunity.id_opportunite],
      );
      await client.query(
        'INSERT INTO etape(acteur,note_ecrite,id_etat_candidat,id_candidat) VALUES($1,$2,$3,$4)',
        [`${req.user!.prenom} ${req.user!.nom}`, comment, 'ATA', opportunity.id_candidat],
      );
    }
    if (['refuser_candidat', 'refuser_partenaire'].includes(action)) {
      await client.query('UPDATE opportunite SET flag_opportunite_retenue=false WHERE id_opportunite=$1', [opportunity.id_opportunite]);
      await client.query(`UPDATE candidat SET id_etat_candidat='ATA' WHERE id_candidat=$1`, [opportunity.id_candidat]);
      await client.query('UPDATE fiche_de_voeux SET flag_candidat_deja_mis_en_lien=false WHERE id_fiche_de_voeux=$1', [opportunity.id_fiche_de_voeux]);
      await client.query(
        `UPDATE fiche_de_poste
         SET flag_poste_deja_mis_en_lien=false,
             id_etat_poste=(SELECT id_etat_poste FROM etat_poste WHERE designation=CASE
               WHEN EXISTS(
                 SELECT 1 FROM opportunite ox JOIN etat_opportunite ex ON ex.id_etat_opportunite=ox.id_etat_opportunite
                 WHERE ox.id_poste=$1 AND ox.id_opportunite<>$2 AND ex.designation='Approuvé CM'
               ) THEN 'Pré-réservé' ELSE 'À pourvoir' END)
         WHERE id_poste=$1`,
        [opportunity.id_poste, opportunity.id_opportunite],
      );
    }
    if (['mettre_en_lien', 'accord_de_principe', 'accord_definitif', 'decision_dcc'].includes(action)) {
      const candidateState: Record<string, string> = {
        mettre_en_lien: 'MEL',
        accord_de_principe: 'ACP',
        accord_definitif: 'ACC',
        decision_dcc: 'AFF',
      };
      const attachmentUrls = uploadedFileUrls('opportunites', String(opportunity.id_opportunite), files);
      await client.query(
        'INSERT INTO etape(acteur,note_ecrite,id_etat_candidat,id_candidat,pj_description,url1_piece_jointe,url2_piece_jointe) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [`${req.user!.prenom} ${req.user!.nom}`, comment, candidateState[action], opportunity.id_candidat, attachmentDescription || null, attachmentUrls[0] ?? null, attachmentUrls[1] ?? null],
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Transition effectuée.', etat: rule.to });
  } catch (err: any) {
    await client.query('ROLLBACK');
    await cleanupUploadedFiles(files);
    console.error('Erreur transition opportunité :', { id: req.params.id, action, message: err.message });
    if (err.message === 'NOT_FOUND') return void res.status(404).json({ error: 'Opportunité introuvable.' });
    if (err.message === 'CANDIDATE_NOT_ATA') {
      return void res.status(409).json({ error: 'Le candidat doit être à l’état Attente affectation avant de pouvoir être mis en lien sur cette opportunité.' });
    }
    if (err.message === 'STATE') {
      return void res.status(409).json({ error: 'L’état cible de cette transition est indisponible.' });
    }
    if (err.message === 'CANDIDATE_STATE') {
      return void res.status(409).json({ error: 'L’état Attente affectation est indisponible.' });
    }
    if (['PRECONDITION', 'LOCKED'].includes(err.message)) return void res.status(409).json({ error: err.message === 'LOCKED' ? 'Le candidat ou le poste est déjà engagé dans une autre mise en lien.' : 'Cette transition n’est pas autorisée depuis l’état actuel.' });
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally {
    client.release();
  }
});

export default router;