'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Send, Loader2 } from 'lucide-react';

interface FormNavigationProps {
  isFirstSection: boolean;
  isLastSection: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave?: () => void;
  onSubmit?: () => void;
  saving?: boolean;
  submitting?: boolean;
}

export function FormNavigation({
  isFirstSection,
  isLastSection,
  onPrevious,
  onNext,
  onSave,
  onSubmit,
  saving = false,
  submitting = false,
}: FormNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onPrevious}
        disabled={isFirstSection}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-14 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-2xl transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold uppercase tracking-widest text-xs">Anterior</span>
      </Button>

      {/* Center Actions */}
      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
        {/* Save Draft Button - Hide on last section */}
        {onSave && !isLastSection && (
          <Button
            variant="ghost"
            size="lg"
            onClick={onSave}
            disabled={saving || submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 h-14 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-bold uppercase tracking-widest text-xs">Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-xs">Guardar Borrador</span>
              </>
            )}
          </Button>
        )}

        {/* Submit Button (Last Section Only) */}
        {isLastSection && onSubmit && (
          <Button
            size="lg"
            onClick={onSubmit}
            disabled={saving || submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 rounded-2xl transition-all hover:scale-105 active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Finalizar Formulario
              </>
            )}
          </Button>
        )}
      </div>

      {/* Next Button - Hide on last section */}
      {!isLastSection && (
        <Button
          size="lg"
          onClick={onNext}
          disabled={saving || submitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold uppercase tracking-widest text-xs">Cargando...</span>
            </>
          ) : (
            <>
              <span className="font-bold uppercase tracking-widest text-xs">Siguiente</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
