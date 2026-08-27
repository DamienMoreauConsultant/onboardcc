/**
 * routes/candidats.ts — Routes de gestion des candidats
 *
 * Ce fichier sera développé en détail dans le prompt 3 (module Candidat).
 * Pour l'instant, seuls des stubs sont fournis pour permettre à l'application
 * de démarrer sans erreur de routage.
 *
 * Architecture PATCH granulaire (conception.md §6.1.1) :
 *   L'édition se fait par onglet, pas par écran entier. Exemple :
 *   PATCH /api/candidats/:id/etat-civil  — ne touche que les colonnes de l'onglet État civil
 *   PATCH /api/candidats/:id/voeux       — ne touche que les colonnes fiche_de_voeux
 *   Cela évite d'écraser accidentellement des données d'un autre onglet.
 */

import { Router } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { requireRole } from '../middleware/requireRole';
import pool from '../db-pg';
import { parseFrenchDate } from '../lib/frenchDate';
import { sendCandidateInvitations, smtpIsConfigured, type CandidateInvitation } from '../lib/candidateInvitations';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 2 } });
const RECRUITERS = ['REC', 'ADMIN'];
const actionUpload = multer({ storage: multer.memoryStorage(), limits: { files: 2, fileSize: 10 * 1024 * 1024 } });

/* This order is the published CRM exchange contract.  Children deliberately do
 * not occur here: their import format has not been approved. */
const CSV_COLUMNS = [
  'ref_candidat','nom','nom_naissance','prenom','genre','date_naissance','lieu_naissance','nationalite','telephone','email',
  'adresse1','adresse2','code_postal','ville','pays','etat_de_vie','date_mariage','depart_en_couple','nom_prenom_conjoint',
  'est_parent','pars_avec_enfants','date_disponibilite','duree_souhaitee','duree_precision_si_autre','domaines_formation',
  'domaines_experience_pro','langues','references_offres','motivations','questionnements','avancement_demarche',
  'experience_interculturelle','formation_dialogue_interculturel','experience_volontariat','raison_depart_dcc','connait_dcc_par',
  'connait_dcc_detail','attentes_dcc','lien_autre_structure','lien_autre_structure_detail','statut_professionnel',
  'administration_tutelle','experience_engagement','experience_engagement_detail','info_complementaire','disponibilites_contact',
  'sessions_choisir_preference',
];
type Refs = Record<'pays'|'duree'|'domaine'|'langue'|'notoriete', Record<string, number>>;
const bool = (v?: string) => ['true', '1', 'oui', 'yes'].includes((v ?? '').trim().toLowerCase());
const validBool = (v?: string) => ['true','false','oui','non','yes','no','1','0'].includes((v ?? '').trim().toLowerCase());
const entries = (v?: string) => (v ?? '').split(';').map(x => x.trim()).filter(Boolean);
const text = (v?: string) => v?.trim() || null;
const mapRows = (rows: Array<{ crm_key?: string; designation?: string; id: number }>) =>
  Object.fromEntries(rows.map(r => [(r.crm_key ?? r.designation)!, r.id]));
async function refs(): Promise<Refs> {
  const [pays, duree, domaine, langue, notoriete] = await Promise.all([
    pool.query('SELECT crm_key,id_pays id FROM pays'), pool.query('SELECT crm_key,id_duree id FROM duree'),
    pool.query('SELECT crm_key,id_domaine id FROM domaine'), pool.query('SELECT crm_key,id_langue id FROM langue'),
    pool.query('SELECT designation,id_notoriete_dcc id FROM notoriete_dcc'),
  ]);
  return { pays: mapRows(pays.rows), duree: mapRows(duree.rows), domaine: mapRows(domaine.rows), langue: mapRows(langue.rows), notoriete: mapRows(notoriete.rows) };
}
function headers(fields?: string[]): string | null {
  const actual = (fields ?? []).map(x => x.trim());
  const missing = CSV_COLUMNS.filter(x => !actual.includes(x));
  const extra = actual.filter(x => !CSV_COLUMNS.includes(x));
  return missing.length || extra.length ? `En-tête CSV invalide (${missing.length ? `colonnes manquantes : ${missing.join(', ')}` : ''}${missing.length && extra.length ? ' ; ' : ''}${extra.length ? `colonnes inconnues : ${extra.join(', ')}` : ''}). Le template comporte exactement 47 colonnes.` : null;
}
function validate(row: Record<string,string>, line: number, r: Refs) {
  const errors: string[] = [];
  for (const f of ['ref_candidat','nom','prenom','genre','date_naissance','lieu_naissance','nationalite','telephone','email','adresse1','code_postal','ville','pays','etat_de_vie','depart_en_couple','est_parent','date_disponibilite','duree_souhaitee','motivations','avancement_demarche','experience_interculturelle','raison_depart_dcc','attentes_dcc','lien_autre_structure','statut_professionnel','experience_engagement','disponibilites_contact','sessions_choisir_preference']) if (!row[f]?.trim()) errors.push(`Champ obligatoire manquant : ${f}`);
  for (const f of ['date_naissance','date_mariage','date_disponibilite']) if (!parseFrenchDate(row[f]).valid) errors.push(`Date invalide ligne ${line} : ${f}="${row[f]?.trim() ?? ''}" — format attendu JJ/MM/AAAA`);
  for (const f of ['depart_en_couple','est_parent','pars_avec_enfants','lien_autre_structure','experience_engagement']) if (row[f]?.trim() && !validBool(row[f])) errors.push(`Booléen invalide : ${f} (TRUE/FALSE, OUI/NON, 1/0 attendus)`);
  if (row.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) errors.push('Email invalide');
  const limits: Record<string,number>={ref_candidat:50,nom:50,prenom:50,email:50,motivations:250,avancement_demarche:250,experience_interculturelle:250,raison_depart_dcc:250,attentes_dcc:250,sessions_choisir_preference:250,experience_engagement_detail:250};
  for(const [field,limit] of Object.entries(limits)) if((row[field]??'').length>limit) errors.push(`${field} dépasse ${limit} caractères`);
  if (row.pays?.trim() && !r.pays[row.pays.trim()]) errors.push(`Pays inconnu : crm_key=${row.pays.trim()} — créez-le d'abord`);
  if (row.duree_souhaitee?.trim() && !r.duree[row.duree_souhaitee.trim()]) errors.push(`Durée inconnue : crm_key=${row.duree_souhaitee.trim()} — créez-la d'abord`);
  for (const f of ['domaines_formation','domaines_experience_pro']) for (const k of entries(row[f])) if (!r.domaine[k]) errors.push(`Domaine inconnu : crm_key=${k} — créez-le d'abord`);
  for (const item of entries(row.langues)) { const [k, niveau] = item.split(':').map(x => x.trim()); if (!k || !niveau || !r.langue[k]) errors.push(`Langue invalide ou inconnue : ${item}`); }
  for (const k of entries(row.connait_dcc_par)) if (!r.notoriete[k]) errors.push(`Notoriété DCC inconnue : designation=${k} — créez-la d'abord`);
  if (row.etat_de_vie?.trim() === 'Marié' && !row.date_mariage?.trim()) errors.push('date_mariage est requis lorsque etat_de_vie = Marié');
  if (bool(row.depart_en_couple) && !row.nom_prenom_conjoint?.trim()) errors.push('nom_prenom_conjoint est requis lorsque depart_en_couple = TRUE');
  if (bool(row.est_parent) && !row.pars_avec_enfants?.trim()) errors.push('pars_avec_enfants est requis lorsque est_parent = TRUE');
  if (row.duree_souhaitee?.trim() === 'AUTRE' && !row.duree_precision_si_autre?.trim()) errors.push('duree_precision_si_autre est requis lorsque duree_souhaitee = AUTRE');
  if (bool(row.lien_autre_structure) && !row.lien_autre_structure_detail?.trim()) errors.push('lien_autre_structure_detail est requis lorsque lien_autre_structure = TRUE');
  if (row.statut_professionnel?.trim() === 'Fonctionnaire' && !row.administration_tutelle?.trim()) errors.push('administration_tutelle est requis lorsque statut_professionnel = Fonctionnaire');
  if (bool(row.experience_engagement) && !row.experience_engagement_detail?.trim()) errors.push('experience_engagement_detail est requis lorsque experience_engagement = TRUE');
  return { ligne: line, statut: errors.length ? 'erreur' as const : 'ok' as const, message: errors.length ? errors.join(' | ') : '✓' };
}
function parsed(req: any) { return Papa.parse<Record<string,string>>(req.file.buffer.toString('utf8'), { header: true, skipEmptyLines: true, transformHeader: h => h.trim() }); }
function validateAll(rows: Record<string,string>[], r: Refs) {
  const web = new Set<string>(), emails = new Set<string>();
  return rows.map((row,i) => { const result=validate(row,i+2,r); for(const [field,seen] of [['ref_candidat',web],['email',emails]] as const) { const value=(row[field]??'').trim().toLowerCase(); if(value && seen.has(value)) { result.statut='erreur'; result.message=result.message==='✓'?`Doublon dans le CSV : ${field}=${value}`:`${result.message} | Doublon dans le CSV : ${field}=${value}`; } seen.add(value); } return result; });
}
function self(req: any, id: string | string[]) { return req.user!.role !== 'CAN' || String(req.user!.id_candidat) === String(id); }
async function transition(client: any, id: string, state: string, actor: string, note: string) {
  const stateResult = await client.query('SELECT delais_de_reponse FROM etat_candidat WHERE id_etat_candidat=$1', [state]);
  await client.query(`UPDATE candidat SET id_etat_candidat=$2, date_revue=CASE WHEN $3::int IS NULL THEN NULL ELSE CURRENT_DATE+$3::int END WHERE id_candidat=$1`, [id, state, stateResult.rows[0].delais_de_reponse]);
  await client.query('INSERT INTO etape(acteur,note_ecrite,id_etat_candidat,id_candidat) VALUES($1,$2,$3,$4)', [actor, note, state, id]);
}

router.get('/import/template', requireRole(['REC','ADMIN']), (_req,res) => { res.type('text/csv').attachment('template_candidats_dcc.csv').send(`${CSV_COLUMNS.join(',')}\n`); });
router.post('/import/verifier', requireRole(['REC','ADMIN']), upload.single('file'), async (req,res) => {
  if (!req.file) return void res.status(400).json({ error: 'Aucun fichier reçu.' });
  try { const p = parsed(req); const h = headers(p.meta.fields); if (h) return void res.status(400).json({error:h}); if (p.errors.length) return void res.status(400).json({error:`Erreur de parsing CSV : ${p.errors[0].message}`}); const r=await refs(); res.json({ lignes:validateAll(p.data,r) }); } catch (e) { console.error(e); res.status(500).json({error:'Erreur interne du serveur.'}); }
});

/**
 * GET /api/candidats
 * Liste tous les candidats (recruteurs et CM uniquement).
 * Développé en détail au prompt 3.
 */
router.post('/import/executer', requireRole(['REC','ADMIN']), upload.single('file'), async (req,res) => {
  if (!req.file) return void res.status(400).json({error:'Aucun fichier reçu.'});
  const client = await pool.connect();
  try {
    const p=parsed(req), h=headers(p.meta.fields); if(h) return void res.status(400).json({error:h});
    if(p.errors.length) return void res.status(400).json({error:`Erreur de parsing CSV : ${p.errors[0].message}`});
    const r=await refs(), bad=validateAll(p.data,r).filter(x=>x.statut==='erreur');
    if(bad.length) return void res.status(422).json({error:'Des erreurs de validation ont été détectées — import annulé.',lignes_en_erreur:bad});
    await client.query('BEGIN'); const ids:number[]=[]; const invitations: CandidateInvitation[]=[];
    for(const row of p.data) {
      const birth=parseFrenchDate(row.date_naissance).iso, marriage=parseFrenchDate(row.date_mariage).iso, available=parseFrenchDate(row.date_disponibilite).iso;
      const existing=await client.query('SELECT c.id_candidat,c.id_contact,co.id_adresse FROM candidat c JOIN contact co ON co.id_contact=c.id_contact WHERE c.web_key=$1 FOR UPDATE',[row.ref_candidat.trim()]);
      let idContact:number, idCandidate:number, idAddress:number;
      if(existing.rows.length) {
        ({id_candidat:idCandidate,id_contact:idContact,id_adresse:idAddress}=existing.rows[0]);
        if (idAddress) {
          await client.query('UPDATE adresse SET adresse1=$1,adresse2=$2,code_postal=$3,ville=$4,id_pays=$5 WHERE id_adresse=$6',[text(row.adresse1),text(row.adresse2),text(row.code_postal),text(row.ville),r.pays[row.pays.trim()],idAddress]);
        } else {
          const address = await client.query('INSERT INTO adresse(adresse1,adresse2,code_postal,ville,id_pays) VALUES($1,$2,$3,$4,$5) RETURNING id_adresse',[text(row.adresse1),text(row.adresse2),text(row.code_postal),text(row.ville),r.pays[row.pays.trim()]]);
          idAddress = address.rows[0].id_adresse;
          await client.query('UPDATE contact SET id_adresse=$1 WHERE id_contact=$2',[idAddress,idContact]);
        }
      }
      else { const a=await client.query('INSERT INTO adresse(adresse1,adresse2,code_postal,ville,id_pays) VALUES($1,$2,$3,$4,$5) RETURNING id_adresse',[text(row.adresse1),text(row.adresse2),text(row.code_postal),text(row.ville),r.pays[row.pays.trim()]]); idAddress=a.rows[0].id_adresse; const c=await client.query(`INSERT INTO contact(crm_key,role,genre,nom_contact,nom_naissance,prenom_contact,tel_contact,email_contact,date_naissance,lieu_naissance,nationalite,id_adresse) VALUES($1,'CAN',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_contact`,[row.ref_candidat.trim(),text(row.genre),text(row.nom),text(row.nom_naissance),text(row.prenom),text(row.telephone),text(row.email),birth,text(row.lieu_naissance),text(row.nationalite),idAddress]); idContact=c.rows[0].id_contact; idCandidate=0; }
      await client.query('UPDATE contact SET genre=$1,nom_contact=$2,nom_naissance=$3,prenom_contact=$4,tel_contact=$5,email_contact=$6,date_naissance=$7,lieu_naissance=$8,nationalite=$9 WHERE id_contact=$10',[text(row.genre),text(row.nom),text(row.nom_naissance),text(row.prenom),text(row.telephone),text(row.email),birth,text(row.lieu_naissance),text(row.nationalite),idContact]);
      const candidateValues=[row.ref_candidat.trim(),bool(row.depart_en_couple),text(row.nom_prenom_conjoint),text(row.etat_de_vie),marriage,bool(row.est_parent),bool(row.pars_avec_enfants),available,text(row.references_offres),text(row.motivations),text(row.questionnements),text(row.avancement_demarche),text(row.experience_interculturelle),text(row.formation_dialogue_interculturel),text(row.experience_volontariat),text(row.raison_depart_dcc),text(row.attentes_dcc),bool(row.lien_autre_structure),text(row.lien_autre_structure_detail),text(row.statut_professionnel),text(row.administration_tutelle),bool(row.experience_engagement),text(row.experience_engagement_detail),text(row.info_complementaire),text(row.disponibilites_contact),text(row.sessions_choisir_preference),idContact];
      const q=`INSERT INTO candidat(web_key,perso_depart_en_couple,perso_nom_prenom_conjoint,perso_etat_de_vie,perso_date_mariage,perso_est_parent,perso_pars_avec_enfants,projet_date_depart_souhaitee,projet_numero_offre_mission,projet_motivations,projet_questionnements,projet_avancement,projet_experience_interculturelle,projet_formation_dialogue_interculturel,projet_experience_de_volontariat,projet_raison_du_depart_avec_la_dcc,projet_attente_de_la_dcc,projet_lien_avec_une_autre_structure,projet_lien_avec_une_autre_structure_detail,profil_statut,profil_statut_administration_de_tutelle,profil_experience_engagement,profil_experience_engagement_detail,candidature_information_du_candidat,candidature_disponibilite_du_candidat,candidature_preference_session_choisir,id_contact,id_etat_candidat,date_revue) VALUES(${candidateValues.map((_,i)=>'$'+(i+1)).join(',')},'AP2',CURRENT_DATE+(SELECT delais_de_reponse FROM etat_candidat WHERE id_etat_candidat='AP2')) ON CONFLICT(web_key) DO UPDATE SET perso_depart_en_couple=EXCLUDED.perso_depart_en_couple,perso_nom_prenom_conjoint=EXCLUDED.perso_nom_prenom_conjoint,perso_etat_de_vie=EXCLUDED.perso_etat_de_vie,perso_date_mariage=EXCLUDED.perso_date_mariage,perso_est_parent=EXCLUDED.perso_est_parent,perso_pars_avec_enfants=EXCLUDED.perso_pars_avec_enfants,projet_date_depart_souhaitee=EXCLUDED.projet_date_depart_souhaitee,projet_numero_offre_mission=EXCLUDED.projet_numero_offre_mission,projet_motivations=EXCLUDED.projet_motivations,projet_questionnements=EXCLUDED.projet_questionnements,projet_avancement=EXCLUDED.projet_avancement,projet_experience_interculturelle=EXCLUDED.projet_experience_interculturelle,projet_formation_dialogue_interculturel=EXCLUDED.projet_formation_dialogue_interculturel,projet_experience_de_volontariat=EXCLUDED.projet_experience_de_volontariat,projet_raison_du_depart_avec_la_dcc=EXCLUDED.projet_raison_du_depart_avec_la_dcc,projet_attente_de_la_dcc=EXCLUDED.projet_attente_de_la_dcc,projet_lien_avec_une_autre_structure=EXCLUDED.projet_lien_avec_une_autre_structure,projet_lien_avec_une_autre_structure_detail=EXCLUDED.projet_lien_avec_une_autre_structure_detail,profil_statut=EXCLUDED.profil_statut,profil_statut_administration_de_tutelle=EXCLUDED.profil_statut_administration_de_tutelle,profil_experience_engagement=EXCLUDED.profil_experience_engagement,candidature_information_du_candidat=EXCLUDED.candidature_information_du_candidat,candidature_disponibilite_du_candidat=EXCLUDED.candidature_disponibilite_du_candidat,candidature_preference_session_choisir=EXCLUDED.candidature_preference_session_choisir RETURNING id_candidat`;
      const isNew=!existing.rows.length; const cr=await client.query(q,candidateValues); idCandidate=cr.rows[0].id_candidat; await client.query('UPDATE candidat SET profil_experience_engagement_detail=$1 WHERE id_candidat=$2',[text(row.experience_engagement_detail),idCandidate]); ids.push(idCandidate);
      if(isNew) await client.query(`INSERT INTO etape(acteur,note_ecrite,id_etat_candidat,id_candidat) VALUES('Import CRM','Import initial','AP2',$1)`,[idCandidate]);
      const f=await client.query(`INSERT INTO fiche_de_voeux(id_candidat,part_seul,date_depart_souhaite) VALUES($1,$2,$3) ON CONFLICT(id_candidat) DO UPDATE SET part_seul=EXCLUDED.part_seul,date_depart_souhaite=EXCLUDED.date_depart_souhaite,date_modification=CURRENT_DATE RETURNING id_fiche_de_voeux`,[idCandidate,!bool(row.depart_en_couple),available]); const idF=f.rows[0].id_fiche_de_voeux;
      for (const table of ['veut_partir_pour','a_etudie_dans','a_travaille_dans','parle','connait_la_dcc_par']) {
        await client.query(
          `DELETE FROM ${table} WHERE ${table==='connait_la_dcc_par'?'id_candidat':'id_fiche_de_voeux'}=$1`,
          [table==='connait_la_dcc_par'?idCandidate:idF],
        );
      }
      await client.query('INSERT INTO veut_partir_pour(id_fiche_de_voeux,id_duree,projet_duree_specifique) VALUES($1,$2,$3)',[idF,r.duree[row.duree_souhaitee.trim()],text(row.duree_precision_si_autre)]);
      for(const k of entries(row.domaines_formation)) await client.query('INSERT INTO a_etudie_dans VALUES($1,$2)',[idF,r.domaine[k]]);
      for(const k of entries(row.domaines_experience_pro)) await client.query('INSERT INTO a_travaille_dans VALUES($1,$2)',[idF,r.domaine[k]]);
      for(const item of entries(row.langues)){const [k,n]=item.split(':').map(x=>x.trim());await client.query('INSERT INTO parle(id_fiche_de_voeux,id_langue,niveau) VALUES($1,$2,$3)',[idF,r.langue[k],n]);}
      for(const k of entries(row.connait_dcc_par)) await client.query('INSERT INTO connait_la_dcc_par(id_candidat,id_notoriete_dcc,detail,autre_designation) VALUES($1,$2,$3,$4)',[idCandidate,r.notoriete[k],text(row.connait_dcc_detail),text(row.connait_dcc_detail)]);
      const has=await client.query('SELECT 1 FROM user_ WHERE id_contact=$1',[idContact]);
      if(!has.rows.length) {
        const temporaryPassword = `Dcc-${randomBytes(12).toString('base64url')}`;
        await client.query('INSERT INTO user_(login,password,id_contact) VALUES($1,$2,$3)',[row.email.trim(),await bcrypt.hash(temporaryPassword,12),idContact]);
        invitations.push({ email: row.email.trim(), prenom: text(row.prenom), temporaryPassword });
      }
    }
    if(invitations.length && smtpIsConfigured()) await sendCandidateInvitations(invitations);
    await client.query('COMMIT');
    res.json({message:`Import réussi. ${ids.length} candidat(s) traité(s).`,nb_candidats:ids.length,ids_candidats:ids,invitations:invitations.length?(smtpIsConfigured()?'sent':'pending_smtp_configuration'):'not_required'});
  } catch(e) { await client.query('ROLLBACK'); console.error('Import candidats rollback',e); res.status(500).json({error:'Erreur interne — rollback complet effectué. Aucune donnée modifiée.'}); } finally { client.release(); }
});

router.get('/', requireRole(RECRUITERS), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const states = typeof req.query.etats === 'string' ? req.query.etats.split(',').map(x=>x.trim()).filter(Boolean) : [];
    const result = await pool.query(`
      SELECT
        c.id_candidat,
        c.trigram_candidat,
        co.nom_contact,
        co.prenom_contact,
        co.email_contact,
        ec.designation AS etat_designation,
        c.id_etat_candidat, c.date_revue,
        (c.date_revue IS NOT NULL AND c.date_revue <= CURRENT_DATE) AS alerte_revue,
        COALESCE((SELECT string_agg(DISTINCT d.designation, ', ') FROM a_etudie_dans ae JOIN domaine d ON d.id_domaine=ae.id_domaine JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=ae.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat),'') AS domaines,
        COALESCE((SELECT string_agg(DISTINCT l.designation, ', ') FROM parle pa JOIN langue l ON l.id_langue=pa.id_langue JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=pa.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat),'') AS langues,
        COALESCE((SELECT string_agg(DISTINCT r.designation, ', ') FROM veut_aller_a va JOIN region r ON r.id_region=va.id_region JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=va.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat),'') AS regions,
        (SELECT string_agg(DISTINCT d.periode, ', ') FROM veut_partir_pour vp JOIN duree d ON d.id_duree=vp.id_duree JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=vp.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat) AS duree,
        (SELECT COUNT(*)::int FROM opportunite o JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=o.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat AND o.id_etat_opportunite IN (2,4)) AS opportunites_a_qualifier,
        (SELECT COUNT(*)::int FROM opportunite o JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=o.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat AND o.id_etat_opportunite=5) AS opportunites_approuvees,
        (SELECT COUNT(*)::int FROM opportunite o JOIN fiche_de_voeux f ON f.id_fiche_de_voeux=o.id_fiche_de_voeux WHERE f.id_candidat=c.id_candidat AND o.id_etat_opportunite IN (6,7,8,9)) AS opportunites_affectation
      FROM candidat c
      JOIN contact co ON co.id_contact = c.id_contact
      JOIN etat_candidat ec ON ec.id_etat_candidat = c.id_etat_candidat
      WHERE (cardinality($1::text[])=0 AND ec.id_etat_candidat NOT IN ('AFF','NEL','NCA'))
         OR ec.designation=ANY($1::text[])
      ORDER BY co.nom_contact, co.prenom_contact LIMIT 20 OFFSET $2`, [states, (page - 1) * 20]);
    const total = await pool.query(`SELECT COUNT(*)::int total FROM candidat c JOIN etat_candidat ec ON ec.id_etat_candidat=c.id_etat_candidat WHERE (cardinality($1::text[])=0 AND ec.id_etat_candidat NOT IN ('AFF','NEL','NCA')) OR ec.designation=ANY($1::text[])`,[states]);
    res.json({ candidats: result.rows, page, page_size:20, total:total.rows[0].total });
  } catch (err) {
    console.error('Erreur GET candidats :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

router.get('/etats', requireRole(RECRUITERS), async (_req,res) => {
  try { res.json((await pool.query('SELECT id_etat_candidat,designation,delais_de_reponse FROM etat_candidat ORDER BY id_etat_candidat')).rows); } catch(e) { console.error(e);res.status(500).json({error:'Erreur interne du serveur.'}); }
});

/**
 * GET /api/candidats/:id
 * Détail complet d'un candidat.
 * Développé au prompt 3.
 */
router.get('/:id', requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN', 'CAN']), async (req, res) => {
  if (!self(req, req.params.id)) return void res.status(403).json({ error: 'Accès refusé à ce dossier.' });
  try {
    const result = await pool.query(
      `SELECT c.*, co.nom_contact, co.prenom_contact, co.email_contact, co.tel_contact,
               co.genre, co.date_naissance, co.nationalite,
                co.nom_naissance,co.lieu_naissance, co.id_adresse,
                a.adresse1,a.adresse2,a.code_postal,a.ville,a.id_pays,
                ec.designation AS etat_designation,
                f.id_fiche_de_voeux,f.flag_fiche_de_voeux_soumise,
                f.flag_candidat_deja_mis_en_lien,f.part_seul,f.zone_orange,
                f.conditions_spartiates,f.hopital_proche,f.fonctionnaire_dispo_demandee,
                f.date_depart_souhaite,f.nouveau_poste,f.nouvelle_langue,
                f.competences_a_developper,f.centres_interret,f.categorie_ecclesiale,
                f.categorie_ecclesiale_detail,f.acces_candidat,f.date_voeux_provisoires,
                f.date_voeux_definitifs,f.verrouille,f.verrouille_par,f.date_verrouillage,
               row_to_json(a) AS adresse, row_to_json(f) AS fiche_de_voeux,
               COALESCE((SELECT json_agg(x) FROM (SELECT l.*,p.niveau,p.autre_langue FROM parle p JOIN langue l ON l.id_langue=p.id_langue WHERE p.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') langues,
               COALESCE((SELECT json_agg(x) FROM (SELECT d.* FROM a_etudie_dans z JOIN domaine d ON d.id_domaine=z.id_domaine WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') domaines_formation,
               COALESCE((SELECT json_agg(x) FROM (SELECT d.* FROM a_travaille_dans z JOIN domaine d ON d.id_domaine=z.id_domaine WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') domaines_experience,
                COALESCE((SELECT json_agg(x) FROM (SELECT r.*,z.degre FROM veut_aller_a z JOIN region r ON r.id_region=z.id_region WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') regions,
                COALESCE((SELECT json_agg(x) FROM (SELECT d.*,z.projet_duree_specifique FROM veut_partir_pour z JOIN duree d ON d.id_duree=z.id_duree WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') durees,
                COALESCE((SELECT json_agg(x) FROM (SELECT e.* FROM veut_vivre_dans z JOIN environnement e ON e.id_environnement=z.id_environnement WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') environnements,
                COALESCE((SELECT json_agg(x) FROM (SELECT h.* FROM veut_habiter_dans z JOIN hebergement h ON h.id_hebergement=z.id_hebergement WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') hebergements,
                COALESCE((SELECT json_agg(x) FROM (SELECT cp.*,z.niveau,z.autre_competence FROM a_la_competence_de z JOIN competences cp ON cp.id_competences=z.id_competences WHERE z.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') competences,
               COALESCE((SELECT json_agg(x) FROM (SELECT s.* FROM inscrit_a ia JOIN stages s ON s.id_stages=ia.id_stages WHERE ia.id_fiche_de_voeux=f.id_fiche_de_voeux)x),'[]') stages,
               COALESCE((SELECT json_agg(x ORDER BY x.date_evenement DESC) FROM (SELECT e.*,es.designation FROM etape e JOIN etat_candidat es ON es.id_etat_candidat=e.id_etat_candidat WHERE e.id_candidat=c.id_candidat)x),'[]') historique,
               (SELECT COUNT(*)::int FROM opportunite o WHERE o.id_fiche_de_voeux=f.id_fiche_de_voeux) AS opportunites_total
       FROM candidat c
       JOIN contact co ON co.id_contact = c.id_contact
       JOIN etat_candidat ec ON ec.id_etat_candidat = c.id_etat_candidat
       LEFT JOIN adresse a ON a.id_adresse=co.id_adresse
       LEFT JOIN fiche_de_voeux f ON f.id_candidat=c.id_candidat
       WHERE c.id_candidat = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Candidat non trouvé.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur GET candidat :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/** Recruiter edits are explicitly whitelisted; candidate columns are never writable by CAN. */
router.patch('/:id/etat-civil', requireRole(RECRUITERS), async (req,res) => {
  const contactFields=['genre','nom_contact','nom_naissance','prenom_contact','tel_contact','email_contact','date_naissance','lieu_naissance','nationalite'];
  const candidateFields=['perso_depart_en_couple','perso_nom_prenom_conjoint','perso_etat_de_vie','perso_date_mariage','perso_est_parent','perso_pars_avec_enfants'];
  const addressFields=['adresse1','adresse2','code_postal','ville','id_pays'];
  const contacts=contactFields.filter(k=>k in req.body), candidates=candidateFields.filter(k=>k in req.body), addresses=addressFields.filter(k=>k in req.body);
  if(!contacts.length&&!candidates.length&&!addresses.length) return void res.status(400).json({error:'Aucun champ modifiable.'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const row=await client.query('SELECT c.id_contact,co.id_adresse FROM candidat c JOIN contact co ON co.id_contact=c.id_contact WHERE c.id_candidat=$1 FOR UPDATE',[req.params.id]);
    if(!row.rows.length){await client.query('ROLLBACK');return void res.status(404).json({error:'Candidat non trouvé.'});}
    if(contacts.length) await client.query(`UPDATE contact SET ${contacts.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id_contact=$${contacts.length+1}`,[...contacts.map(k=>req.body[k]||null),row.rows[0].id_contact]);
    let idAdresse=row.rows[0].id_adresse;
    if(addresses.length&&!idAdresse){const created=await client.query("INSERT INTO adresse(id_pays) VALUES((SELECT id_pays FROM pays ORDER BY id_pays LIMIT 1)) RETURNING id_adresse");idAdresse=created.rows[0].id_adresse;await client.query('UPDATE contact SET id_adresse=$1 WHERE id_contact=$2',[idAdresse,row.rows[0].id_contact]);}
    if(addresses.length) await client.query(`UPDATE adresse SET ${addresses.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id_adresse=$${addresses.length+1}`,[...addresses.map(k=>req.body[k]||null),idAdresse]);
    if(candidates.length) await client.query(`UPDATE candidat SET ${candidates.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id_candidat=$${candidates.length+1}`,[...candidates.map(k=>req.body[k]),req.params.id]);
    await client.query('COMMIT');res.json({message:'État civil mis à jour.'});
  } catch(e){await client.query('ROLLBACK');console.error(e);res.status(500).json({error:'Erreur interne du serveur.'});} finally {client.release();}
});
router.patch('/:id/projet', requireRole(RECRUITERS), async (req,res) => {
  const allowed=['engagements','annonces_recherchees','perso_depart_en_couple','perso_nom_prenom_conjoint','perso_etat_de_vie','perso_date_mariage','perso_est_parent','perso_pars_avec_enfants','projet_date_depart_souhaitee','projet_numero_offre_mission','projet_motivations','projet_questionnements','projet_avancement','projet_experience_interculturelle','projet_formation_dialogue_interculturel','projet_experience_de_volontariat','projet_raison_du_depart_avec_la_dcc','projet_attente_de_la_dcc','projet_lien_avec_une_autre_structure','projet_lien_avec_une_autre_structure_detail','profil_statut','profil_statut_administration_de_tutelle','profil_experience_engagement','profil_experience_engagement_detail','candidature_information_du_candidat','candidature_disponibilite_du_candidat','candidature_preference_session_choisir'];
  const keys=allowed.filter(k=>k in req.body); if(!keys.length)return void res.status(400).json({error:'Aucun champ modifiable.'});
  try { await pool.query(`UPDATE candidat SET ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id_candidat=$${keys.length+1}`,[...keys.map(k=>req.body[k]),req.params.id]);res.json({message:'Projet mis à jour.'}); }catch(e){console.error(e);res.status(500).json({error:'Erreur interne du serveur.'});}
});
router.patch('/:id/date-revue', requireRole(RECRUITERS), async (req,res) => {
  const date = typeof req.body.date_revue === 'string' ? req.body.date_revue : null;
  if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return void res.status(400).json({error:'Date ISO AAAA-MM-JJ requise.'});
  try { await pool.query('UPDATE candidat SET date_revue=$1,date_revue_modifiee_par=$2,date_revue_modifiee_le=CURRENT_DATE WHERE id_candidat=$3',[date,`${req.user!.prenom} ${req.user!.nom}`,req.params.id]);res.json({message:'Date de revue mise à jour.'}); }catch(e){console.error(e);res.status(500).json({error:'Erreur interne du serveur.'});}
});

async function action(req:any,res:any,target:string, extra?: (c:any)=>Promise<void>) {
  const client=await pool.connect(); try { await client.query('BEGIN'); const row=await client.query('SELECT c.id_etat_candidat,c.id_contact,f.id_fiche_de_voeux,f.flag_candidat_deja_mis_en_lien,f.date_voeux_definitifs FROM candidat c JOIN fiche_de_voeux f ON f.id_candidat=c.id_candidat WHERE c.id_candidat=$1 FOR UPDATE',[req.params.id]); if(!row.rows.length)throw new Error('NOT_FOUND'); const c=row.rows[0];
    if(!req.body?.commentaire?.trim())throw new Error('COMMENT'); if(target==='NEL'&&(c.id_etat_candidat!=='AP2'||c.flag_candidat_deja_mis_en_lien))throw new Error('PRE'); if(target==='CHO'&&c.id_etat_candidat!=='AP2')throw new Error('PRE'); if(target==='NCA'&&!['CHO','ATA'].includes(c.id_etat_candidat))throw new Error('PRE'); if(target==='ATA'&&(c.id_etat_candidat!=='CHO'||!c.date_voeux_definitifs))throw new Error('PRE');
    const files=(req.files as Express.Multer.File[]|undefined)??[]; await transition(client,req.params.id,target,`${req.user!.prenom} ${req.user!.nom}`,req.body.commentaire); await client.query('UPDATE etape SET pj_description=$1,url1_piece_jointe=$2,url2_piece_jointe=$3 WHERE id_historique=(SELECT max(id_historique) FROM etape WHERE id_candidat=$4)',[req.body.pj_description||null,files[0]?.originalname||null,files[1]?.originalname||null,req.params.id]); if(target==='CHO')await client.query('UPDATE fiche_de_voeux SET flag_fiche_de_voeux_soumise=false,verrouille=false,verrouille_par=NULL,date_verrouillage=NULL WHERE id_fiche_de_voeux=$1',[c.id_fiche_de_voeux]); if(['NEL','NCA'].includes(target))await client.query('UPDATE user_ SET active=false WHERE id_contact=$1',[c.id_contact]); if(target==='NCA')await client.query('UPDATE opportunite SET flag_opportunite_non_retenu=true WHERE id_fiche_de_voeux=$1',[c.id_fiche_de_voeux]); if(extra)await extra(c); await client.query('COMMIT');res.json({message:'Transition effectuée.',etat:target});
  }catch(e:any){await client.query('ROLLBACK'); const msg=e.message==='NOT_FOUND'?'Candidat non trouvé.':e.message==='COMMENT'?'Commentaire obligatoire.':'Transition non autorisée pour cet état.';res.status(e.message==='NOT_FOUND'?404:e.message==='COMMENT'?400:409).json({error:msg});}finally{client.release();}}
router.post('/:id/rejeter', requireRole(RECRUITERS), actionUpload.array('pieces_jointes',2), (req,res)=>action(req,res,'NEL'));
router.post('/:id/valider_appel2', requireRole(RECRUITERS), actionUpload.array('pieces_jointes',2), (req,res)=>action(req,res,'CHO'));
router.post('/:id/annulerCandidature', requireRole(RECRUITERS), actionUpload.array('pieces_jointes',2), (req,res)=>action(req,res,'NCA'));
router.post('/:id/valider_session_choisir', requireRole(RECRUITERS), actionUpload.array('pieces_jointes',2), (req,res)=>action(req,res,'ATA'));

/** Vœux are the only writable surface for a candidate, within the state-specific window. */
router.patch('/:id/voeux', requireRole(['CAN','REC','CM1','CM2','CHZ','ADMIN']), async (req,res) => {
  if(!self(req,req.params.id)) return void res.status(403).json({error:'Accès refusé à ce dossier.'});
  const client=await pool.connect();
  try { await client.query('BEGIN'); const found=await client.query('SELECT c.id_etat_candidat,f.* FROM candidat c JOIN fiche_de_voeux f ON f.id_candidat=c.id_candidat WHERE c.id_candidat=$1 FOR UPDATE',[req.params.id]); if(!found.rows.length)throw new Error('NOT_FOUND'); const f=found.rows[0];
    const candidate=req.user!.role==='CAN'; const open=!f.verrouille && ((f.id_etat_candidat==='AP2'&&!f.flag_fiche_de_voeux_soumise)||(f.id_etat_candidat==='CHO'&&!f.date_voeux_definitifs));
    if(candidate&&!open)throw new Error('LOCKED');
    const candidateFields=['zone_orange','conditions_spartiates','hopital_proche','fonctionnaire_dispo_demandee','date_depart_souhaite','nouveau_poste','nouvelle_langue','competences_a_developper','centres_interret','categorie_ecclesiale','categorie_ecclesiale_detail'];
    const allowed=candidate?candidateFields:[...candidateFields,'part_seul','acces_candidat','verrouille'];
    const keys=allowed.filter(k=>k in req.body); if(keys.length)await client.query(`UPDATE fiche_de_voeux SET ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')},date_modification=CURRENT_DATE,modifie_par=$${keys.length+1} WHERE id_fiche_de_voeux=$${keys.length+2}`,[...keys.map(k=>req.body[k]),`${req.user!.prenom} ${req.user!.nom}`,f.id_fiche_de_voeux]);
    const relations:Record<string,[string,string,string]>={ domaines_formation:['a_etudie_dans','id_domaine','domaine'], domaines_experience_pro:['a_travaille_dans','id_domaine','domaine'], environnements:['veut_vivre_dans','id_environnement','environnement'], regions:['veut_aller_a','id_region','region'], hebergements:['veut_habiter_dans','id_hebergement','hebergement'], competences:['a_la_competence_de','id_competences','competences'], durees:['veut_partir_pour','id_duree','duree'] };
    for(const [field,[table,column,refTable]] of Object.entries(relations)) if(Array.isArray(req.body[field])) { await client.query(`DELETE FROM ${table} WHERE id_fiche_de_voeux=$1`,[f.id_fiche_de_voeux]); for(const item of req.body[field]) { const id=typeof item==='object'?item.id:item; const exists=await client.query(`SELECT 1 FROM ${refTable} WHERE ${column}=$1`,[id]); if(!exists.rows.length)throw new Error('REF'); const degree=typeof item==='object'?item.degre:null; await client.query(`INSERT INTO ${table}(id_fiche_de_voeux,${column}${table==='veut_aller_a'?',degre':''}) VALUES($1,$2${table==='veut_aller_a'?', $3':''})`,table==='veut_aller_a'?[f.id_fiche_de_voeux,id,degree]:[f.id_fiche_de_voeux,id]); } }
    if(Array.isArray(req.body.langues)){await client.query('DELETE FROM parle WHERE id_fiche_de_voeux=$1',[f.id_fiche_de_voeux]);for(const x of req.body.langues){const ok=await client.query('SELECT 1 FROM langue WHERE id_langue=$1',[x.id_langue]);if(!ok.rows.length)throw new Error('REF');await client.query('INSERT INTO parle(id_fiche_de_voeux,id_langue,niveau,autre_langue) VALUES($1,$2,$3,$4)',[f.id_fiche_de_voeux,x.id_langue,x.niveau||null,x.autre_langue||null]);}}
    if(!candidate && req.body.verrouille===false) await client.query('UPDATE fiche_de_voeux SET verrouille_par=NULL,date_verrouillage=NULL WHERE id_fiche_de_voeux=$1',[f.id_fiche_de_voeux]);
    await client.query('COMMIT');res.json({message:'Vœux mis à jour.'});
  }catch(e:any){await client.query('ROLLBACK');res.status(e.message==='NOT_FOUND'?404:e.message==='LOCKED'?403:400).json({error:e.message==='LOCKED'?'Les vœux ne sont pas modifiables à cette étape.':e.message==='REF'?'Référence inconnue.':'Mise à jour impossible.'});}finally{client.release();}
});
router.post('/:id/soumettre-voeux-provisoire', requireRole(['CAN']), async(req,res) => {
  if(!self(req,req.params.id))return void res.status(403).json({error:'Accès refusé à ce dossier.'});
  try {const q=await pool.query(`UPDATE fiche_de_voeux f SET flag_fiche_de_voeux_soumise=true,verrouille=true,verrouille_par=$1,date_verrouillage=CURRENT_DATE,date_voeux_provisoires=CURRENT_DATE,modifie_par=$1,date_modification=CURRENT_DATE FROM candidat c WHERE c.id_candidat=f.id_candidat AND c.id_candidat=$2 AND c.id_etat_candidat='AP2' AND NOT f.flag_fiche_de_voeux_soumise RETURNING f.id_fiche_de_voeux`,[`${req.user!.prenom} ${req.user!.nom}`,req.params.id]);if(!q.rows.length)return void res.status(400).json({error:'Soumission provisoire non autorisée.'});res.json({message:'Vœux provisoires soumis.'});}catch(e){console.error(e);res.status(500).json({error:'Erreur interne du serveur.'});}
});
router.post('/:id/soumettre-voeux-definitifs', requireRole(['CAN']), async(req,res) => {
  if(!self(req,req.params.id))return void res.status(403).json({error:'Accès refusé à ce dossier.'});
  try {const q=await pool.query(`UPDATE fiche_de_voeux f SET verrouille=true,verrouille_par=$1,date_verrouillage=CURRENT_DATE,date_voeux_definitifs=CURRENT_DATE,modifie_par=$1,date_modification=CURRENT_DATE FROM candidat c WHERE c.id_candidat=f.id_candidat AND c.id_candidat=$2 AND c.id_etat_candidat='CHO' AND f.date_voeux_definitifs IS NULL RETURNING f.id_fiche_de_voeux`,[`${req.user!.prenom} ${req.user!.nom}`,req.params.id]);if(!q.rows.length)return void res.status(400).json({error:'Soumission définitive non autorisée.'});res.json({message:'Vœux définitifs soumis.'});}catch(e){console.error(e);res.status(500).json({error:'Erreur interne du serveur.'});}
});

export default router;
