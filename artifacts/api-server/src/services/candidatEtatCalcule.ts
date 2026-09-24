/**
 * État "calculé" d'un candidat (Retour_30, 24/09/2026) : l'état réel (workflow) combiné à l'état de
 * soumission des vœux, pour rendre visible qui doit agir et permettre de filtrer les relances.
 * Jamais stocké : dérivé à la volée de l'état du candidat (c.id_etat_candidat) et de la fiche de
 * vœux (f), donc toujours cohérent. Les alias SQL attendus sont c (candidat), ec (etat_candidat) et
 * f (fiche_de_voeux, LEFT JOIN).
 *
 * Le libellé est "Titre — Précision" : l'interface affiche les deux parties sur deux lignes.
 */
const PROVISOIRE_SOUMIS = `(COALESCE(f.flag_fiche_de_voeux_soumise,false) OR f.date_voeux_provisoires IS NOT NULL)`;
const DEFINITIF_SOUMIS = `(f.date_voeux_definitifs IS NOT NULL)`;

export const ETAT_CALCULE_SQL = `CASE
  WHEN c.id_etat_candidat='AP2' THEN CASE WHEN ${PROVISOIRE_SOUMIS}
    THEN '2ème appel — À passer en Session choisir' ELSE '2ème appel — Attente vœux candidat' END
  WHEN c.id_etat_candidat='CHO' THEN CASE WHEN ${DEFINITIF_SOUMIS}
    THEN 'Session choisir — À passer en Attente affectation' ELSE 'Session choisir — Attente vœux candidat' END
  ELSE ec.designation END`;

/**
 * Côté de l'action attendue : 'autre' = candidat (ou CM) doit agir, 'recruteur' = le recruteur doit
 * agir, 'aucune' = état final, rien n'est attendu.
 */
export const ETAT_ACTION_COTE_SQL = `CASE
  WHEN c.id_etat_candidat='AP2' THEN CASE WHEN ${PROVISOIRE_SOUMIS} THEN 'recruteur' ELSE 'autre' END
  WHEN c.id_etat_candidat='CHO' THEN CASE WHEN ${DEFINITIF_SOUMIS} THEN 'recruteur' ELSE 'autre' END
  WHEN c.id_etat_candidat IN ('MEL','ACP') THEN 'autre'
  WHEN c.id_etat_candidat IN ('NEL','NCA','AFF') THEN 'aucune'
  ELSE 'recruteur' END`;
