import React, { useState, useEffect } from 'react';
import { adminApi, ReferentielItem } from '@/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit2, Database, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const TABLES = [
  { id: 'region', name: 'région' },
  { id: 'pays', name: 'pays' },
  { id: 'domaine', name: 'domaine' },
  { id: 'competences', name: 'compétences' },
  { id: 'langue', name: 'langue' },
  { id: 'niveau_langue', name: 'niveau de langue' },
  { id: 'duree', name: 'durée de mission' },
  { id: 'environnement', name: 'environnement' },
  { id: 'hebergement', name: 'hébergement' },
  { id: 'etat_poste', name: 'état de poste' },
  { id: 'stages', name: 'stages' },
  { id: 'notoriete_dcc', name: 'notoriété DCC' },
  { id: 'type_billet_avion', name: 'type de billet d’avion' },
  { id: 'etat_opportunite', name: 'état d\'opportunité' },
  { id: 'etat_candidat', name: 'état candidat' },
];

export default function AdminReferentiels() {
  const [selectedTable, setSelectedTable] = useState(TABLES[0]);
  const [data, setData] = useState<ReferentielItem[]>([]);
  const [pkField, setPkField] = useState<string>('id');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferentielItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const isReadOnly = selectedTable.id === 'etat_candidat';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getReferentiel(selectedTable.id);
      setPkField(result.pk || 'id');
      setData(result.rows || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le référentiel.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTable.id]);

  const handleToggleActive = async (item: ReferentielItem) => {
    if (isReadOnly) return;
    
    try {
      const pkVal = item[pkField] as number;
      const updated = await adminApi.updateReferentiel(selectedTable.id, pkVal, { active: !item.active });
      setData(prev => prev.map(row => row[pkField] === pkVal ? { ...row, active: updated.active } : row));
      toast({
        title: 'Statut mis à jour',
        description: `L'élément a été ${updated.active ? 'activé' : 'désactivé'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenForm = (item?: ReferentielItem) => {
    if (isReadOnly) return;
    
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      // Initialize form data based on current columns (excluding id and active)
      const initialData: Record<string, any> = {};
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          if (key !== pkField && key !== 'active') {
            initialData[key] = '';
          }
        });
      }
      setFormData(initialData);
    }
    setIsFormOpen(true);
  };

  const handleFormChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const pkVal = editingItem[pkField] as number;
        const updated = await adminApi.updateReferentiel(selectedTable.id, pkVal, formData);
        setData(prev => prev.map(row => row[pkField] === pkVal ? updated : row));
        toast({ title: 'Succès', description: 'Élément modifié avec succès.' });
      } else {
        const payload = { ...formData, active: formData.active ?? true };
        const created = await adminApi.createReferentiel(selectedTable.id, payload);
        setData(prev => [...prev, created]);
        toast({ title: 'Succès', description: 'Élément ajouté avec succès.' });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'enregistrement.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive columns from first data item or empty array if no data
  const columns = data.length > 0 
    ? Object.keys(data[0]).filter(k => k !== pkField && k !== 'active') 
    : [];

  return (
    <div className="flex h-full">
      {/* Sidebar for tables */}
      <div className="w-64 border-r border-border bg-card overflow-y-auto hidden md:block">
        <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-display font-bold flex items-center gap-2 text-foreground">
            <Database className="h-4 w-4" />
            Référentiels
          </h2>
        </div>
        <nav className="p-2 space-y-1">
          {TABLES.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                selectedTable.id === table.id 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {table.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground capitalize">{selectedTable.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez les données de référence pour : {selectedTable.name}.
                {isReadOnly && <span className="ml-2 text-orange-500 font-medium">Lecture seule</span>}
              </p>
            </div>
            {!isReadOnly && (
              <Button onClick={() => handleOpenForm()} className="shrink-0" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}
          </div>

          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-destructive">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>{error}</p>
                  <Button variant="outline" className="mt-4" onClick={fetchData}>Réessayer</Button>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucune donnée trouvée dans ce référentiel.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        {columns.map(col => (
                          <TableHead key={col} className="capitalize">{col.replace(/_/g, ' ')}</TableHead>
                        ))}
                        <TableHead className="w-24 text-center">Statut</TableHead>
                        {!isReadOnly && <TableHead className="w-24 text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map(item => (
                        <TableRow key={String(item[pkField])} className={!item.active ? "opacity-60 bg-muted/30" : ""}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{String(item[pkField] ?? '')}</TableCell>
                          {columns.map(col => (
                            <TableCell key={col} className="font-medium text-foreground">
                              {String(item[col] ?? '')}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            {isReadOnly ? (
                              <Badge variant={item.active ? "default" : "secondary"} className={item.active ? "bg-green-600 hover:bg-green-700" : ""}>
                                {item.active ? "Actif" : "Inactif"}
                              </Badge>
                            ) : (
                              <Switch 
                                checked={Boolean(item.active)} 
                                onCheckedChange={() => handleToggleActive(item)}
                                aria-label="Toggle active status"
                              />
                            )}
                          </TableCell>
                          {!isReadOnly && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenForm(item)}>
                                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingItem ? 'Modifier' : 'Ajouter'} - {selectedTable.name}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifiez les informations ci-dessous.' : 'Remplissez les champs pour ajouter un nouvel élément.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {Object.keys(formData).map(key => {
              if (key === pkField) return null;
              if (key === 'active') return null; // handled separately or assumed true on create
              
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Input 
                    id={key}
                    value={formData[key] || ''}
                    onChange={(e) => handleFormChange(key, e.target.value)}
                    required
                  />
                </div>
              );
            })}
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
