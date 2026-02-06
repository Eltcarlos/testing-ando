'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      allowSaveDraft: true,
      showProgressBar: true,
      submitMessage: '¡Gracias por completar el formulario!',
      redirectUrl: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch('/api/admin/founder-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const data = await response.json();

      // Redirect to form editor
      router.push(`/founder-forms/${data.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Error al crear el formulario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Link href="/founder-forms">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Crear Nuevo Formulario
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure los detalles básicos del formulario
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                Nombre del Formulario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Onboarding Socios 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción breve del formulario"
                rows={3}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Configuración</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir guardar borrador</Label>
                <p className="text-sm text-muted-foreground">
                  Los usuarios pueden guardar su progreso y continuar después
                </p>
              </div>
              <Switch
                checked={formData.settings.allowSaveDraft}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowSaveDraft: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mostrar barra de progreso</Label>
                <p className="text-sm text-muted-foreground">
                  Muestra el porcentaje de completado
                </p>
              </div>
              <Switch
                checked={formData.settings.showProgressBar}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, showProgressBar: checked },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="submitMessage">Mensaje de confirmación</Label>
              <Input
                id="submitMessage"
                value={formData.settings.submitMessage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      submitMessage: e.target.value,
                    },
                  })
                }
                placeholder="Mensaje que se muestra al enviar"
              />
            </div>

            <div>
              <Label htmlFor="redirectUrl">URL de redirección (opcional)</Label>
              <Input
                id="redirectUrl"
                type="url"
                value={formData.settings.redirectUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      redirectUrl: e.target.value,
                    },
                  })
                }
                placeholder="https://ejemplo.com/gracias"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Redirige al usuario después de enviar el formulario
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/founder-forms">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Formulario'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
