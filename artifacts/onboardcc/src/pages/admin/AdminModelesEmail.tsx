import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Mail, Pencil, Send } from 'lucide-react';
import { adminApi, type EmailTemplate } from '@/api/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

/* Signification des variables, affichée sous le texte pour que l'administrateur sache quoi écrire. */
const VARIABLE_HELP: Record<string, string> = {
  prenom: 'prénom de la personne',
  identifiant: 'identifiant de connexion',
  mot_de_passe: 'mot de passe provisoire',
  lien: 'adresse de Passerelle (ou lien de réinitialisation)',
  role: 'rôle du compte',
  nombre: 'nombre de nouvelles notifications',
};

const frequenceLabel = (template: EmailTemplate) => {
  if (!template.groupable) return 'Immédiat';
  return template.frequence_heures === 0 ? 'Immédiat (à chaque événement)' : `Groupé, au plus 1 mail toutes les ${template.frequence_heures} h`;
};

export default function AdminModelesEmail() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [smtp, setSmtp] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [objet, setObjet] = useState('');
  const [contenu, setContenu] = useState('');
  const [frequence, setFrequence] = useState('0');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  /* Rechargement depuis le serveur après chaque enregistrement (UAT-07) : l'écran reflète toujours la base. */
  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const result = await adminApi.getModelesEmail();
      setTemplates(result.modeles);
      setSmtp(result.smtp_configure);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Impossible de charger les modèles d’email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const open = (template: EmailTemplate) => {
    setEditing(template);
    setObjet(template.objet);
    setContenu(template.contenu);
    setFrequence(String(template.frequence_heures));
    setFormError('');
  };

  const save = async () => {
    if (!editing) return;
    const hours = Number(frequence);
    if (editing.groupable && (!Number.isInteger(hours) || hours < 0 || hours > 168)) {
      setFormError('La fréquence doit être un nombre entier d’heures compris entre 0 et 168.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await adminApi.updateModeleEmail(editing.email_type, { objet, contenu, frequence_heures: editing.groupable ? hours : 0 });
      toast({ title: 'Modèle enregistré', description: `« ${editing.libelle} » sera utilisé pour les prochains envois.` });
      setEditing(null);
      await load(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!editing) return;
    setTesting(true);
    setFormError('');
    try {
      const result = await adminApi.testerModeleEmail(editing.email_type, { objet, contenu });
      toast({ title: 'Email de test envoyé', description: `Vérifiez la boîte ${result.envoye_a} (le texte affiché est celui en cours de saisie, non enregistré).` });
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'L’email de test n’a pas pu être envoyé.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Mail className="h-6 w-6 text-primary" /> Modèle d’email</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rédigez les textes des emails envoyés par Passerelle. Les variables entre accolades, comme {'{prenom}'}, sont remplacées à l’envoi.</p>
      </div>

      {!smtp && (
        <p className="flex items-start gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900" data-testid="warning-smtp">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          La messagerie n’est pas configurée sur ce serveur (variables SMTP_*) : aucun email ne part pour l’instant, et le bouton d’envoi de test est indisponible.
        </p>
      )}

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader>
          <CardTitle>Emails envoyés</CardTitle>
          <CardDescription>Une fréquence de 0 heure signifie « envoi immédiat » ; elle ne se règle que pour les notifications des chargés de mission.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-destructive"><AlertCircle className="h-8 w-8" /><p>{error}</p><Button variant="outline" onClick={() => void load()}>Réessayer</Button></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50"><TableRow><TableHead>Email</TableHead><TableHead>Objet</TableHead><TableHead>Envoi</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.email_type} data-testid={`row-template-${template.email_type}`}>
                      <TableCell className="font-medium">{template.libelle}</TableCell>
                      <TableCell>{template.objet}</TableCell>
                      <TableCell><Badge variant="outline">{frequenceLabel(template)}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => open(template)} data-testid={`button-edit-template-${template.email_type}`}><Pencil className="mr-2 h-3.5 w-3.5" />Modifier</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(isOpen) => { if (!isOpen) setEditing(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.libelle}</DialogTitle>
            <DialogDescription>Texte brut : pas de mise en forme. Les retours à la ligne sont conservés.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-objet">Objet du mail</Label>
                <Input id="tpl-objet" value={objet} maxLength={150} onChange={(e) => setObjet(e.target.value)} data-testid="input-template-objet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-contenu">Texte du mail <span className="text-xs font-normal text-muted-foreground">({contenu.length} / 3000 caractères)</span></Label>
                <Textarea id="tpl-contenu" className="min-h-56 font-mono text-sm" value={contenu} maxLength={3000} onChange={(e) => setContenu(e.target.value)} data-testid="input-template-contenu" />
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Variables utilisables :</p>
                  <ul className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                    {editing.variables.map((name) => (
                      <li key={name}><code className="font-semibold text-foreground">{`{${name}}`}</code> — {VARIABLE_HELP[name] ?? name}{editing.obligatoires.includes(name) ? ' (obligatoire)' : ''}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {editing.groupable && (
                <div className="space-y-2">
                  <Label htmlFor="tpl-frequence">Fréquence d’envoi (heures)</Label>
                  <Input id="tpl-frequence" type="number" min={0} max={168} className="w-32" value={frequence} onChange={(e) => setFrequence(e.target.value)} data-testid="input-template-frequence" />
                  <p className="text-xs text-muted-foreground">0 = un mail dès qu’un événement se produit. Au-delà de 0, un seul mail groupé est envoyé à chaque chargé de mission au plus toutes les X heures ; cela nécessite la tâche planifiée décrite dans la procédure d’installation.</p>
                </div>
              )}
              {formError && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" data-testid="error-template">{formError}</p>}
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => void sendTest()} disabled={saving || testing || !smtp} data-testid="button-test-template">
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Envoyer un test à mon adresse
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>Annuler</Button>
              <Button type="button" onClick={() => void save()} disabled={saving} data-testid="button-save-template">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
