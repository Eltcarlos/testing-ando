'use client';

import { QuestionRenderer } from './QuestionRenderer';

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

interface FormSectionProps {
  section: string;
  questions: Question[];
  answers: Record<string, unknown>;
  onAnswerChange: (questionId: string, value: unknown) => void;
}

export function FormSection({
  section,
  questions,
  answers,
  onAnswerChange,
}: FormSectionProps) {
  // Sort questions by sectionOrder
  const sortedQuestions = [...questions].sort(
    (a, b) => a.sectionOrder - b.sectionOrder
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Section Title */}
      <div className="relative">
        <div className="absolute -left-12 top-0 bottom-0 w-1 bg-primary/30 rounded-full" />
        <h2 className="text-3xl font-black text-foreground tracking-widest uppercase italic">
          {section}
        </h2>
        <div className="h-1 w-24 bg-primary mt-2 rounded-full" />
      </div>

      {/* Questions */}
      <div className="space-y-10">
        {sortedQuestions.map((question, index) => (
          <div
            key={question.id}
            className="group relative"
          >
            <QuestionRenderer
              question={question}
              value={answers[question.id]}
              onChange={(value) => onAnswerChange(question.id, value)}
              questionNumber={index + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
