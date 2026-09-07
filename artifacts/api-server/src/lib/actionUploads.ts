import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Request } from 'express';
import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));

function safeResourceId(req: Request): string {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Identifiant de ressource invalide.');
  return String(id);
}

function fileName(req: Request, mimeType: string): string {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `${safeResourceId(req)}_${date}_${time}_${randomBytes(5).toString('hex')}.${MIME_EXTENSIONS[mimeType]}`;
}

export function actionUpload(resource: 'candidats' | 'opportunites') {
  return multer({
    storage: multer.diskStorage({
      destination(req, _file, callback) {
        const destination = path.join(uploadRoot, resource, safeResourceId(req));
        void mkdir(destination, { recursive: true })
          .then(() => callback(null, destination))
          .catch((error) => callback(error, destination));
      },
      filename(req, file, callback) {
        try {
          callback(null, fileName(req, file.mimetype));
        } catch (error) {
          callback(error as Error, '');
        }
      },
    }),
    limits: { files: 2, fileSize: MAX_FILE_SIZE },
    fileFilter(_req, file, callback) {
      if (MIME_EXTENSIONS[file.mimetype]) callback(null, true);
      else callback(new Error('Seuls les fichiers PDF, JPEG et PNG sont autorisés.'));
    },
  });
}

function validSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return false;
}

export async function verifyUploadedFiles(files: Express.Multer.File[]): Promise<void> {
  for (const file of files) {
    const header = await readFile(file.path);
    if (!validSignature(header, file.mimetype)) {
      await cleanupUploadedFiles(files);
      throw new Error('Le contenu du fichier ne correspond pas à un PDF, JPEG ou PNG valide.');
    }
  }
}

export async function cleanupUploadedFiles(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
}

export function uploadedFileUrls(resource: 'candidats' | 'opportunites', resourceId: string, files: Express.Multer.File[]): string[] {
  const configuredBase = process.env.PIECE_JOINTE_STORAGE_URL?.trim();
  const appOrigin = process.env.APP_BASE_URL?.trim()
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '')
    || `http://localhost:${process.env.PORT || '8080'}`;
  const base = configuredBase
    ? `${configuredBase.replace(/\/$/, '')}/`
    : `${appOrigin.replace(/\/$/, '')}/uploads/`;
  return files.map((file) => {
    const url = `${base}${resource}/${resourceId}/${encodeURIComponent(file.filename)}`;
    if (url.length >= 250) throw new Error('L’URL publique de la pièce jointe dépasse 250 caractères.');
    return url;
  });
}