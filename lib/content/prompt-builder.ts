import type { PromptCustomization } from "@/types/editorial";

/**
 * Safely injects additional user instructions
 */
export function injectUserInstructions(
  basePrompt: string,
  instructions?: string
): string {
  if (!instructions || !instructions.trim()) return basePrompt;

  // Sanitize instructions to prevent prompt injection
  const sanitized = instructions
    .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
    .replace(/[<>]/g, "") // Remove potential HTML/XML tags
    .trim();

  if (!sanitized) return basePrompt;

  return basePrompt + `\n\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n${sanitized}`;
}

/**
 * Main function to build a customized prompt
 */
export function buildCustomizedPrompt(
  baseSystemPrompt: string,
  formatPrompt: string,
  formatWordCount: { min: number; max: number },
  customization: PromptCustomization
): string {
  let customizedPrompt = baseSystemPrompt;

  // Add format-specific instructions
  customizedPrompt += "\n\n## Formato requerido\n" + formatPrompt;

  // Inject user instructions if provided
  customizedPrompt = injectUserInstructions(customizedPrompt, customization.additionalInstructions);

  return customizedPrompt;
}

/**
 * Gets a summary of active customizations for display
 */
export function getCustomizationSummary(customization: PromptCustomization): string[] {
  const summary: string[] = [];

  if (customization.additionalInstructions) {
    summary.push("Instrucciones personalizadas");
  }

  return summary;
}