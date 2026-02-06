'use client';

import React, { useState } from 'react';
import { ChevronRight, FileText, Folder, Edit3, Eye } from 'lucide-react';
import { CategorySelector } from '../CategorySelector';
import { TopicSelector } from '../TopicSelector';
import HumanContentForm from './HumanContentForm';
import HumanContentPreview from './HumanContentPreview';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { ContentCategory } from '@/types/editorial';

export default function HumanContentWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState<ContentCategory | null>(null);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [editorialTeamType, setEditorialTeamType] = useState<'person' | 'company'>('person');
  const [authorName, setAuthorName] = useState('');
  const [authorPosition, setAuthorPosition] = useState('');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);

  const steps = [
    { number: 1, name: 'Categoría', icon: Folder },
    { number: 2, name: 'Tema', icon: FileText },
    { number: 3, name: 'Crear Contenido', icon: Edit3 },
    { number: 4, name: 'Vista Previa', icon: Eye },
  ];

  const handleCategorySelect = (selectedCategory: ContentCategory) => {
    setCategory(selectedCategory);
    setCurrentStep(2);
  };

  const handleTopicSelect = (selectedTopic: string, isCustom: boolean) => {
    setTopic(selectedTopic);
    setCurrentStep(3);
  };

  const handleContentReady = (
    contentTitle: string,
    contentHtml: string,
    contentMarkdown: string,
    teamType: 'person' | 'company',
    author: string,
    position: string,
    image?: File | null
  ) => {
    setTitle(contentTitle);
    setHtmlContent(contentHtml);
    setMarkdownContent(contentMarkdown);
    setEditorialTeamType(teamType);
    setAuthorName(author);
    setAuthorPosition(position);
    setFeaturedImage(image || null);
    setCurrentStep(4);
  };

  const handlePublish = async () => {
    const adminEmail = session?.user?.email;
    const userId = (session?.user as any)?.id;
    
    if (!adminEmail || !userId) {
      toast.error('No se pudo identificar el administrador');
      return;
    }

    try {
      let featuredImageKey = null;
      let imageMetadata = null;

      // Upload image to S3 if present
      if (featuredImage) {
        const formData = new FormData();
        formData.append('file', featuredImage);

        const uploadResponse = await fetch('/api/upload/s3', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen a S3');
        }

        const uploadData = await uploadResponse.json();
        featuredImageKey = uploadData.s3Key;

        imageMetadata = {
          fileName: uploadData.filename,
          fileSize: uploadData.size,
          contentType: uploadData.type,
          uploadedAt: uploadData.uploadedAt,
        };
      }

      // Create the blog post with all fields
      const response = await fetch('/api/admin/content/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: markdownContent,
          categoryId: category?.id || '',
          topic,
          createdBy: adminEmail,
          userId,
          source: 'human',
          editorialTeamType,
          authorName,
          authorPosition: editorialTeamType === 'person' ? authorPosition : null,
          featuredImageKey,
          imageMetadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al publicar el contenido');
      }

      const data = await response.json();
      toast.success('Contenido enviado para revisión exitosamente');

      // Clear draft from localStorage
      localStorage.removeItem('humanContentDraft');

      // Reset form to initial state
      setCurrentStep(1);
      setCategory(null);
      setTopic('');
      setTitle('');
      setHtmlContent('');
      setMarkdownContent('');
      setEditorialTeamType('person');
      setAuthorName('');
      setAuthorPosition('');
      setFeaturedImage(null);
    } catch (error) {
      console.error('Error publishing content:', error);
      toast.error(error instanceof Error ? error.message : 'Error al publicar el contenido');
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-background border-input text-muted-foreground'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                    }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* {renderStepIndicator()} */}

      {/* Progress Indicator */}


      {currentStep === 1 && (
        <CategorySelector
          visible={true}
          selected={category}
          onSelect={handleCategorySelect}
        />
      )}

      {currentStep === 2 && category && (
        <TopicSelector
          visible={true}
          category={category}
          selected={topic}
          onSelect={handleTopicSelect}
        />
      )}

      {currentStep === 3 && category && topic && (
        <HumanContentForm
          category={category.label}
          topic={topic}
          initialTitle={title}
          initialHtmlContent={htmlContent}
          initialMarkdownContent={markdownContent}
          initialEditorialTeamType={editorialTeamType}
          initialAuthorName={authorName}
          initialAuthorPosition={authorPosition}
          initialFeaturedImage={featuredImage}
          onContentReady={handleContentReady}
        />
      )}

      {currentStep === 4 && title && markdownContent && category && (
        <HumanContentPreview
          title={title}
          content={markdownContent}
          category={category.label}
          topic={topic}
          editorialTeamType={editorialTeamType}
          authorName={authorName}
          authorPosition={authorPosition}
          featuredImage={featuredImage}
          onEdit={() => setCurrentStep(3)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}