'use client';

import { ContentFormat } from '@/types/editorial';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { formatOptions } from '@/lib/content/formats';
import PromptCustomizer from './PromptCustomizer';
import { usePromptCustomization } from '@/lib/contexts/prompt-customization-context';
import { getCustomizationSummary } from '@/lib/content/prompt-builder';

interface Props {
  visible: boolean;
  selected: ContentFormat;
  onSelect: (format: ContentFormat) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function FormatSelector({ visible, selected, onSelect, onGenerate, isLoading }: Props) {
  const { customization, isCustomizationActive } = usePromptCustomization();

  if (!visible) return null;

  const customizationSummary = getCustomizationSummary(customization);

  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">3. Formato</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon;
            return (
              <Card
                key={format.value}
                onClick={() => onSelect(format.value)}
                className={`p-4 text-center cursor-pointer transition-all hover:shadow-md
                  ${selected === format.value
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-2 border-transparent hover:border-muted'
                  }`}
              >
                <span className="flex justify-center mb-2">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-sm font-medium block mb-1">{format.label}</span>
                <span className="text-xs text-muted-foreground">{format.description}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Prompt Customization Section */}
      <div className="space-y-4">
        <PromptCustomizer />

        {/* Active Customizations Summary */}
        {isCustomizationActive && customizationSummary.length > 0 && (
          <div className="px-4 py-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700 mb-1">Personalizaciones activas:</p>
            <div className="flex flex-wrap gap-2">
              {customizationSummary.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-white text-purple-700 rounded-full border border-purple-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={onGenerate}
        disabled={isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? 'Generando contenido...' : (
          <>
            Generar Contenido {isCustomizationActive && '(Personalizado)'}
          </>
        )}
      </Button>
    </section>
  );
}
