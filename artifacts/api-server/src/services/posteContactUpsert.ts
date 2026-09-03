import type { PoolClient } from 'pg';

export type PosteContactRole = 'CM1' | 'CM2' | 'CHZ' | 'MIS' | 'PAR';

export type PosteContactInput = {
  crmKey: string;
  nom: string;
  prenom: string;
  role: PosteContactRole;
  telephone?: string | null;
  email?: string | null;
  adresse?: {
    adresse1: string;
    adresse2: string | null;
    codePostal: string | null;
    ville: string | null;
    idPays: number;
  } | null;
};

/**
 * Le CRM est maître des contacts liés aux postes. L'upsert se fait uniquement
 * par crm_key afin qu'un même contact conserve son identité et ses droits RBAC
 * lorsqu'il est rattaché à plusieurs postes.
 */
export async function upsertPosteContact(
  client: PoolClient,
  input: PosteContactInput,
): Promise<{ idContact: number; idAdresse: number | null; created: boolean }> {
  const found = await client.query(
    'SELECT id_contact,id_adresse FROM contact WHERE crm_key=$1 FOR UPDATE',
    [input.crmKey],
  );

  let idContact: number;
  let idAdresse: number | null = found.rows[0]?.id_adresse ?? null;
  const created = found.rows.length === 0;

  if (created) {
    if (input.adresse) {
      const address = await client.query(
        `INSERT INTO adresse(adresse1,adresse2,code_postal,ville,id_pays)
         VALUES($1,$2,$3,$4,$5) RETURNING id_adresse`,
        [
          input.adresse.adresse1,
          input.adresse.adresse2,
          input.adresse.codePostal,
          input.adresse.ville,
          input.adresse.idPays,
        ],
      );
      idAdresse = address.rows[0].id_adresse;
    }
    const inserted = await client.query(
      `INSERT INTO contact(crm_key,nom_contact,prenom_contact,role,tel_contact,email_contact,id_adresse)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id_contact`,
      [input.crmKey, input.nom, input.prenom, input.role, input.telephone ?? null, input.email ?? null, idAdresse],
    );
    idContact = inserted.rows[0].id_contact;
  } else {
    idContact = found.rows[0].id_contact;
    if (input.role === 'MIS' || input.role === 'PAR') {
      await client.query(
        `UPDATE contact SET nom_contact=$1,prenom_contact=$2,role=$3,tel_contact=$4,email_contact=$5
         WHERE id_contact=$6`,
        [input.nom, input.prenom, input.role, input.telephone ?? null, input.email ?? null, idContact],
      );
    } else {
      await client.query(
        'UPDATE contact SET nom_contact=$1,prenom_contact=$2,role=$3 WHERE id_contact=$4',
        [input.nom, input.prenom, input.role, idContact],
      );
    }

    if (input.adresse) {
      if (idAdresse) {
        await client.query(
          `UPDATE adresse SET adresse1=$1,adresse2=$2,code_postal=$3,ville=$4,id_pays=$5
           WHERE id_adresse=$6`,
          [
            input.adresse.adresse1,
            input.adresse.adresse2,
            input.adresse.codePostal,
            input.adresse.ville,
            input.adresse.idPays,
            idAdresse,
          ],
        );
      } else {
        const address = await client.query(
          `INSERT INTO adresse(adresse1,adresse2,code_postal,ville,id_pays)
           VALUES($1,$2,$3,$4,$5) RETURNING id_adresse`,
          [
            input.adresse.adresse1,
            input.adresse.adresse2,
            input.adresse.codePostal,
            input.adresse.ville,
            input.adresse.idPays,
          ],
        );
        idAdresse = address.rows[0].id_adresse;
        await client.query('UPDATE contact SET id_adresse=$1 WHERE id_contact=$2', [idAdresse, idContact]);
      }
    }
  }

  return { idContact, idAdresse, created };
}

export async function linkPosteContact(client: PoolClient, idPoste: number, idContact: number) {
  await client.query(
    'INSERT INTO gere_poste(id_poste,id_contact) VALUES($1,$2) ON CONFLICT DO NOTHING',
    [idPoste, idContact],
  );
}