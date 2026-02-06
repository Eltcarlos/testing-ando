'use client';

import { cn } from '@/lib/utils';

interface FormProgressProps {
  percentage: number;
  answeredCount: number;
  totalCount: number;
}

export function FormProgress({
  percentage,
  answeredCount,
  totalCount,
}: FormProgressProps) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Progreso del formulario
        </span>
        <span className="text-sm font-mono font-bold text-primary">
          {answeredCount} / {totalCount} <span className="text-muted-foreground font-normal">preguntas</span>
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden shadow-inner border border-border">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(var(--primary),0.3)] bg-primary"
          style={{
            width: `${percentage}%`
          }}
        />
      </div>

      {/* Percentage Text */}
      <div className="flex justify-end">
        <p className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
          {percentage.toFixed(0)}% COMPLETADO
        </p>
      </div>
    </div>
  );
}
