"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PromptCustomization } from "@/types/editorial";

interface PromptCustomizationContextType {
  // Current customization state
  customization: PromptCustomization;
  setCustomization: (customization: PromptCustomization) => void;
  updateCustomization: (partial: Partial<PromptCustomization>) => void;
  resetCustomization: () => void;

  // UI state
  isCustomizationActive: boolean;
  setIsCustomizationActive: (active: boolean) => void;
}

const PromptCustomizationContext = createContext<PromptCustomizationContextType | undefined>(undefined);

const DEFAULT_CUSTOMIZATION: PromptCustomization = {};

export function PromptCustomizationProvider({ children }: { children: React.ReactNode }) {
  const [customization, setCustomization] = useState<PromptCustomization>(DEFAULT_CUSTOMIZATION);
  const [isCustomizationActive, setIsCustomizationActive] = useState(false);

  // Load from session storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCustomization = sessionStorage.getItem("prompt_customization");
        if (storedCustomization) {
          const parsed = JSON.parse(storedCustomization);
          if (parsed.additionalInstructions) {
            setCustomization(parsed);
            setIsCustomizationActive(true);
          }
        }
      } catch (error) {
        console.error("Error loading prompt customization from session:", error);
      }
    }
  }, []);

  // Save to session storage whenever customization changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (customization.additionalInstructions) {
          sessionStorage.setItem("prompt_customization", JSON.stringify(customization));
          setIsCustomizationActive(true);
        } else {
          sessionStorage.removeItem("prompt_customization");
          setIsCustomizationActive(false);
        }
      } catch (error) {
        console.error("Error saving prompt customization to session:", error);
      }
    }
  }, [customization]);

  const updateCustomization = useCallback((partial: Partial<PromptCustomization>) => {
    setCustomization((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  const resetCustomization = useCallback(() => {
    setCustomization(DEFAULT_CUSTOMIZATION);
    setIsCustomizationActive(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("prompt_customization");
    }
  }, []);

  return (
    <PromptCustomizationContext.Provider
      value={{
        customization,
        setCustomization,
        updateCustomization,
        resetCustomization,
        isCustomizationActive,
        setIsCustomizationActive,
      }}
    >
      {children}
    </PromptCustomizationContext.Provider>
  );
}

export function usePromptCustomization() {
  const context = useContext(PromptCustomizationContext);
  if (context === undefined) {
    throw new Error("usePromptCustomization must be used within a PromptCustomizationProvider");
  }
  return context;
}