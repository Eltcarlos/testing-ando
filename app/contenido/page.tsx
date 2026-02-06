"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { ContentCategory, ContentFormat } from "@/types/editorial";
import { CategorySelector } from "./components/CategorySelector";
import { TopicSelector } from "./components/TopicSelector";
import { FormatSelector } from "./components/FormatSelector";
import { ContentPreview } from "./components/ContentPreview";
import ContentTabs from "./components/ContentTabs";
import ContentAdminPanel from "./components/ContentAdminPanel";
import HumanContentWizard from "./components/human-content/HumanContentWizard";
import BlogReviewPanel from "./components/BlogReviewPanel";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptCustomizationProvider,
  usePromptCustomization,
} from "@/lib/contexts/prompt-customization-context";

function ContentGeneratorContent() {
  const { customization } = usePromptCustomization();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = useState<ContentCategory | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [format, setFormat] = useState<ContentFormat>("listicle");

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/admin/content/generate",
    streamProtocol: "text",
    onError: (err) => {
      console.error("[ContentGenerator] Generation error:", err);
      alert(`Error al generar contenido: ${err.message}`);
    },
    onFinish: (prompt, completion) => {
      console.log("[ContentGenerator] Generation finished:", {
        prompt,
        completionLength: completion.length,
        preview: completion.substring(0, 100),
      });
    },
  });

  // Debug logging
  console.log("[ContentGenerator] Render state:", {
    step,
    completionLength: completion?.length || 0,
    isLoading,
    hasError: !!error,
    completionPreview: completion?.substring(0, 50) || "(empty)",
  });

  const handleCategorySelect = (cat: ContentCategory) => {
    setCategory(cat);
    setStep(2);
  };

  const handleTopicSelect = (t: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomTopic(t);
      setTopic("");
    } else {
      setTopic(t);
      setCustomTopic("");
    }
    setStep(3);
  };

  const handleGenerate = async () => {
    console.log("[ContentGenerator] handleGenerate called", {
      category: category?.label,
      topic,
      customTopic,
      format,
    });

    setStep(4);

    try {
      await complete("", {
        body: {
          category,
          topic,
          format,
          customTopic,
          customization:
            Object.keys(customization).length > 0 ? customization : undefined,
        },
      });
      console.log("[ContentGenerator] complete() call finished");
    } catch (err) {
      console.error("[ContentGenerator] Error in handleGenerate:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const reset = () => {
    setStep(1);
    setCategory(null);
    setTopic("");
    setCustomTopic("");
    setFormat("listicle");
  };

  const goBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const createAITabContent = (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step > 1 && (
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Crear Contenido con IA</h1>
          <p className="text-sm text-muted-foreground">
            Genera artículos de blog con IA en unos pocos clicks
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      <CategorySelector
        visible={step >= 1}
        selected={category}
        onSelect={handleCategorySelect}
      />

      <TopicSelector
        visible={step >= 2 && !!category}
        category={category}
        selected={topic || customTopic}
        onSelect={handleTopicSelect}
      />

      <FormatSelector
        visible={step >= 3 && !!(topic || customTopic)}
        selected={format}
        onSelect={setFormat}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h3 className="font-semibold mb-2">Error al generar contenido</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      <ContentPreview
        visible={step === 4}
        content={completion}
        isLoading={isLoading}
        onRegenerate={handleGenerate}
        onReset={reset}
        metadata={{
          category,
          topic: topic || customTopic,
          format,
          wasCustomTopic: !!customTopic,
        }}
      />
    </div>
  );

  const createHumanTabContent = <HumanContentWizard />;

  const adminTabContent = <ContentAdminPanel />;

  const reviewTabContent = <BlogReviewPanel />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <ContentTabs
        createAITab={createAITabContent}
        createHumanTab={createHumanTabContent}
        adminTab={adminTabContent}
        reviewTab={reviewTabContent}
      />
    </div>
  );
}

// Wrap with provider
export default function ContentGeneratorAdmin() {
  return (
    <PromptCustomizationProvider>
      <ContentGeneratorContent />
    </PromptCustomizationProvider>
  );
}
