'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormStepperProps {
  sections: string[];
  currentIndex: number;
  onSectionClick: (index: number) => void;
}

export function FormStepper({
  sections,
  currentIndex,
  onSectionClick,
}: FormStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {sections.map((section, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <div key={section} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onSectionClick(index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg',
                  isActive &&
                  'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-primary/20',
                  isCompleted && 'bg-primary text-primary-foreground shadow-primary/10',
                  !isActive &&
                  !isCompleted &&
                  'bg-muted text-muted-foreground border border-border',
                  isClickable && 'cursor-pointer hover:scale-105 hover:bg-muted/80',
                  !isClickable && 'cursor-not-allowed opacity-40'
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 stroke-[3px]" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Connector Line */}
              {index < sections.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 rounded-full transition-all duration-500',
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Section Labels */}
      <div className="flex items-start justify-between mt-6">
        {sections.map((section, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={section}
              className="flex-1 text-center"
              style={{ maxWidth: `${100 / sections.length}%` }}
            >
              <p
                className={cn(
                  'text-xs font-bold px-2 line-clamp-2 uppercase tracking-wider transition-colors duration-300',
                  isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {section}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
