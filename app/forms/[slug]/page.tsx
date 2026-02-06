'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FounderFormClient } from './components/FounderFormClient';
import { Loader2 } from 'lucide-react';

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
  questions: Array<{
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
  }>;
}

interface InvitationData {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone?: string;
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

export default function FormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [response, setResponse] = useState<ResponseData | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        setError(null);

        // Use token if provided, otherwise use slug
        const endpoint = token ? `/api/forms/${token}` : `/api/forms/${slug}`;

        const res = await fetch(endpoint);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load form');
        }

        const data = await res.json();

        // Handle both token response (with nested form) and slug response (flat)
        if (data.form) {
          // Token-based response
          setFormData(data.form);
          setInvitation(data.invitation);
          setResponse(data.response);
        } else {
          // Slug-based response
          setFormData(data);
        }
      } catch (err) {
        console.error('Error loading form:', err);
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [slug, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar el formulario
          </h1>
          <p className="text-gray-600 mb-6">{error || 'Formulario no encontrado'}</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <FounderFormClient
      form={formData}
      invitation={invitation}
      existingResponse={response}
      token={token}
    />
  );
}
