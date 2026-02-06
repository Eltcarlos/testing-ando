"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePromptCustomization } from "@/lib/contexts/prompt-customization-context";

export default function PromptCustomizer() {
  const {
    customization,
    updateCustomization,
    resetCustomization,
    isCustomizationActive,
  } = usePromptCustomization();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleInstructionsChange = (value: string) => {
    if (value.length <= 500) {
      updateCustomization({ additionalInstructions: value });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">Personalización con IA</span>
          {isCustomizationActive && (
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
              Activo
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrucciones adicionales para la IA
              </label>
              <div className="relative">
                <textarea
                  value={customization.additionalInstructions || ""}
                  onChange={(e) => handleInstructionsChange(e.target.value)}
                  placeholder="Agrega cualquier instrucción específica que quieras que la IA siga al generar el contenido..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 min-h-[120px] resize-y"
                  maxLength={500}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {(customization.additionalInstructions?.length || 0)} / 500
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Puedes agregar contexto, estilo específico, puntos a incluir, o cualquier otra instrucción para personalizar el contenido generado.
              </p>
            </div>

            {/* Actions */}
            {customization.additionalInstructions && (
              <div className="flex justify-end">
                <button
                  onClick={resetCustomization}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}