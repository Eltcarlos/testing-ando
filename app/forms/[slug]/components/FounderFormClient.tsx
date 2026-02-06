'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormStepper } from './FormStepper';
import { FormSection } from './FormSection';
import { FormNavigation } from './FormNavigation';
import { FormProgress } from './FormProgress';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  order: number;
  section: string;
  sectionOrder: number;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: Record<string, unknown>;
}

interface FormData {
  id: string;
  name: string;
  description?: string;
  version: number;
  settings: {
    allowSaveDraft: boolean;
    showProgressBar: boolean;
    submitMessage?: string;
  };
  questions: Question[];
}

interface InvitationData {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone?: string;
  token?: string;
}

interface ResponseData {
  id: string;
  status: string;
  progress: {
    totalQuestions: number;
    answeredQuestions: number;
    percentage: number;
    currentSection?: string;
    completedSections: string[];
  };
  answers: Array<{
    questionId: string;
    value?: string;
    fileUrl?: string;
  }>;
}

interface FounderFormClientProps {
  form: FormData;
  invitation: InvitationData | null;
  existingResponse: ResponseData | null;
  token: string | null;
  onComplete?: () => void;
}

export function FounderFormClient({
  form,
  invitation,
  existingResponse,
  token,
  onComplete,
}: FounderFormClientProps) {
  const router = useRouter();

  // Memoize sections to avoid unnecessary recalculations
  const sections = useMemo(() => {
    return form.questions.reduce((acc, question) => {
      if (!acc[question.section]) {
        acc[question.section] = [];
      }
      acc[question.section].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [form.questions]);

  const sectionNames = useMemo(() => Object.keys(sections), [sections]);

  // State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [responseId, setResponseId] = useState<string | null>(
    existingResponse?.id || null
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({});

  const currentSection = sectionNames[currentSectionIndex];
  const currentQuestions = useMemo(() => sections[currentSection] || [], [sections, currentSection]);
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sectionNames.length - 1;

  // Load existing answers
  useEffect(() => {
    if (existingResponse?.answers) {
      const answersMap: Record<string, unknown> = {};
      existingResponse.answers.forEach((answer) => {
        answersMap[answer.questionId] = answer.value || answer.fileUrl;
      });
      setAnswers(answersMap);

      // Resume at current section if available
      if (existingResponse.progress.currentSection) {
        const sectionIndex = sectionNames.indexOf(
          existingResponse.progress.currentSection
        );
        if (sectionIndex >= 0) {
          setCurrentSectionIndex(sectionIndex);
        }
      }
    }
  }, [existingResponse]);

  // Track question view time
  useEffect(() => {
    const now = Date.now();
    currentQuestions.forEach((q: Question) => {
      if (!questionStartTimes[q.id]) {
        setQuestionStartTimes((prev) => ({ ...prev, [q.id]: now }));
      }
    });
  }, [currentSection]);

  // Initialize response on first interaction
  const initializeResponse = async (): Promise<string | null> => {
    if (responseId) return responseId;
    if (!invitation) return null;

    try {
      const res = await fetch(`/api/forms/${form.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: invitation.id,
          token: token || invitation.token,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to initialize response');
      }

      const data = await res.json();
      const newResponseId = data.id || data.responseId; // Support both just in case
      setResponseId(newResponseId);
      return newResponseId;
    } catch (error) {
      console.error('Error initializing response:', error);
      toast.error('Error al iniciar el formulario');
      return null;
    }
  };

  // Calculate time spent on questions
  const calculateTimeSpent = (questionId: string): number => {
    const startTime = questionStartTimes[questionId];
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000); // seconds
  };

  // Save progress
  const saveProgress = async (autoSave = false) => {
    let currentResponseId = responseId;

    // If no response ID yet, initialize first and get the ID
    if (!currentResponseId) {
      currentResponseId = await initializeResponse();
      if (!currentResponseId) return;
    }

    try {
      setSaving(true);

      // Build answers array with time tracking
      const answersArray = Object.entries(answers).map(([questionId, value]) => {
        const question = form.questions.find((q) => q.id === questionId);
        return {
          questionId,
          questionLabel: question?.label || '',
          section: question?.section || currentSection,
          type: question?.type || 'short_text',
          value: value,
          answeredAt: new Date().toISOString(),
          timeSpent: calculateTimeSpent(questionId),
        };
      });

      const res = await fetch(`/api/forms/${form.id}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: currentResponseId,
          currentSection,
          founderCompanyName: invitation?.companyName || '',
          answers: answersArray,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save progress');
      }

      if (!autoSave) {
        toast.success('Progreso guardado exitosamente');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      if (!autoSave) {
        toast.error('Error al guardar el progreso');
      }
    } finally {
      setSaving(false);
    }
  };

  // Submit form
  const submitForm = async () => {
    // Validate all required questions
    const unanswered = form.questions.filter(
      (q) => q.required && !answers[q.id]
    );

    if (unanswered.length > 0) {
      toast.error(
        `Por favor completa todas las preguntas requeridas (${unanswered.length} pendientes)`
      );
      return;
    }

    try {
      setSubmitting(true);

      // Build answers array with time tracking
      const answersArray = Object.entries(answers).map(([questionId, value]) => {
        const question = form.questions.find((q) => q.id === questionId);
        return {
          questionId,
          questionLabel: question?.label || '',
          section: question?.section || currentSection,
          type: question?.type || 'short_text',
          value: value,
          answeredAt: new Date().toISOString(),
          timeSpent: calculateTimeSpent(questionId),
        };
      });

      const res = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          invitationId: invitation?.id,
          token: token || invitation?.token,
          founderCompanyName: invitation?.companyName || '',
          answers: answersArray,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      // Show success message
      toast.success(
        form.settings.submitMessage ||
        '¡Gracias! Tu formulario ha sido enviado exitosamente.'
      );

      if (onComplete) {
        onComplete();
        return;
      }

      // Redirect if configured
      if (form.settings.submitMessage && form.settings.submitMessage.startsWith('http')) {
        const redirectUrl = form.settings.submitMessage;
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      } else {
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al enviar el formulario'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation handlers
  const goToNextSection = async () => {
    // Validate required questions in the current section before proceeding
    const unansweredRequired = currentQuestions.filter(
      (q) => q.required && (!answers[q.id] || (typeof answers[q.id] === 'string' && (answers[q.id] as string).trim() === ''))
    );

    if (unansweredRequired.length > 0) {
      toast.error(
        `Por favor completa todas las preguntas requeridas de esta sección (${unansweredRequired.length} pendientes)`
      );

      // Optionally scroll to the first unanswered question
      const firstUnansweredId = unansweredRequired[0].id;
      const element = document.getElementById(`question-${firstUnansweredId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Auto-save before navigation
    if (form.settings.allowSaveDraft) {
      await saveProgress(true);
    }

    if (!isLastSection) {
      setCurrentSectionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousSection = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToSection = (index: number) => {
    if (index >= 0 && index < sectionNames.length) {
      setCurrentSectionIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculate progress
  const answeredCount = form.questions.filter((q) => answers[q.id]).length;
  const progressPercentage = (answeredCount / form.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {form.name}
              </h1>
              {form.description && (
                <p className="text-muted-foreground mt-3 text-lg max-w-2xl leading-relaxed">
                  {form.description}
                </p>
              )}
            </div>

            {/* Real-time saving indicator */}
            {saving && (
              <div className="flex items-center gap-2 text-[10px] text-primary font-mono uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 animate-pulse whitespace-nowrap self-start">
                <Loader2 className="h-3 w-3 animate-spin" /> Guardando progreso
              </div>
            )}
          </div>

          {/* Progress Bar Container */}
          {form.settings.showProgressBar && (
            <div className="mt-8">
              <FormProgress
                percentage={progressPercentage}
                answeredCount={answeredCount}
                totalCount={form.questions.length}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Section Stepper */}
        <div className="mb-12">
          <FormStepper
            sections={sectionNames}
            currentIndex={currentSectionIndex}
            onSectionClick={goToSection}
          />
        </div>

        {/* Current Section Card */}
        <div className="bg-card rounded-3xl border shadow-lg p-8 sm:p-12 overflow-hidden transition-all duration-500">
          <FormSection
            section={currentSection}
            questions={currentQuestions}
            answers={answers}
            onAnswerChange={(questionId, value) => {
              setAnswers((prev) => ({ ...prev, [questionId]: value }));
              if (!responseId) {
                initializeResponse();
              }
            }}
          />
        </div>

        {/* Navigation Bar */}
        <div className="mt-12">
          <FormNavigation
            isFirstSection={isFirstSection}
            isLastSection={isLastSection}
            onPrevious={goToPreviousSection}
            onNext={goToNextSection}
            onSave={form.settings.allowSaveDraft ? () => saveProgress() : undefined}
            onSubmit={isLastSection ? submitForm : undefined}
            saving={saving}
            submitting={submitting}
          />
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-muted-foreground text-sm pb-12">
          <p>Tus respuestas se guardan automáticamente al avanzar.</p>
          <p className="mt-2 text-muted-foreground/80">Crece tu Negocio &copy; {new Date().getFullYear()} - Transformación Digital Mexicana</p>
        </div>
      </div>
    </div>
  );
}
