import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, CheckCircle2, Download, FileUp, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { postesApi, type ImportLine } from '@/api/postes';

export default function PosteImport() {
  const [, navigate] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportLine[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const allValid = !!report?.length && report.every((line) => line.statut === 'ok');

  const verify = async () => {
    if (!file) return;
    setBusy(true); setError(''); setReport(null);
    try { setReport((await postesApi.verifyImport(file)).lignes); }
    catch (err: any) { setError(err?.response?.data?.error ?? 'Impossible de vérifier ce fichier.'); }
    finally { setBusy(false); }
  };

  const execute = async () => {
    if (!file || !allValid) return;
    setBusy(true); setError('');
    try {
      await postesApi.executeImport(file);
      navigate('/recruteur/postes');
    } catch (err: any) { setError(err?.response?.data?.error ?? 'L’import a échoué. Aucune donnée n’a été enregistrée.'); }
    finally { setBusy(false); }
  };

  return <div className="p-6 md:p-8">
    <Link href="/recruteur/postes"><Button variant="ghost" className="mb-5"><ArrowLeft className="mr-2 h-4 w-4" />Retour aux postes</Button></Link>
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Flux CRM</p><h1 className="text-3xl font-display font-bold">Importer des postes</h1><p className="mt-2 text-sm text-muted-foreground">L’import est le seul canal de création et de mise à jour des fiches de poste.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5 text-primary" />1. Choisir le fichier</CardTitle><CardDescription>CSV UTF-8, 5 Mo maximum, 66 colonnes contractuelles.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <a href="/api/postes/import/template" download="template_postes_dcc.csv"><Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" />Télécharger le template CSV</Button></a>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/25 bg-primary/[0.03] p-6 text-center hover:bg-primary/[0.06]">
            <UploadCloud className="mb-2 h-8 w-8 text-primary" /><span className="font-medium">{file?.name ?? 'Déposer ou sélectionner un fichier .csv'}</span><span className="mt-1 text-xs text-muted-foreground">Le fichier n’est pas enregistré avant confirmation.</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setReport(null); }} />
          </label>
          <Button className="w-full" disabled={!file || busy} onClick={() => void verify()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Vérifier le fichier</Button>
          {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>2. Rapport de vérification</CardTitle><CardDescription>{report ? `${report.length} ligne(s) analysée(s)` : 'Le rapport apparaîtra après la vérification.'}</CardDescription></CardHeader>
        <CardContent>
          {report ? <><div className="max-h-[470px] overflow-auto rounded-lg border"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted"><tr><th className="px-3 py-2 text-left">Ligne</th><th className="px-3 py-2 text-left">Statut</th><th className="px-3 py-2 text-left">Message</th></tr></thead><tbody>{report.map((line) => <tr key={line.ligne} className="border-t"><td className="px-3 py-2 font-mono">{line.ligne}</td><td className="px-3 py-2">{line.statut === 'ok' ? <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />OK</span> : <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" />Erreur</span>}</td><td className="px-3 py-2">{line.message}</td></tr>)}</tbody></table></div><Button className="mt-5 w-full" disabled={!allValid || busy} onClick={() => void execute()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{allValid ? 'Confirmer l’import' : 'Corrigez les erreurs avant de confirmer'}</Button></> : <div className="flex min-h-64 items-center justify-center text-center text-sm text-muted-foreground">Aucune écriture ne sera faite pendant la vérification.</div>}
        </CardContent>
      </Card>
    </div>
  </div>;
}