'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface EditWarningProps {
  responseCount: number;
}

export function EditWarning({ responseCount }: EditWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (responseCount === 0 || isDismissed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Advertencia: Este formulario tiene respuestas</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="h-6 w-6 p-0 hover:bg-destructive/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        Este formulario tiene{' '}
        <strong>
          {responseCount} {responseCount === 1 ? 'respuesta' : 'respuestas'}
        </strong>
        . Ten cuidado al editar preguntas, ya que los cambios podrían afectar cómo se
        interpretan las respuestas existentes.
      </AlertDescription>
    </Alert>
  );
}
