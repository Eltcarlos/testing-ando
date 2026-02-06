'use client';

import { useState } from 'react';
import { ContentCategory } from '@/types/editorial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useSession } from "next-auth/react";

interface Props {
  visible: boolean;
  category: ContentCategory | null;
  selected: string;
  onSelect: (topic: string, isCustom: boolean) => void;
}

export function TopicSelector({ visible, category, selected, onSelect }: Props) {
  const { data: session } = useSession();
  const [customTopic, setCustomTopic] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  if (!visible || !category) return null;

  const handleSuggestTopics = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/admin/content/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          existingTopics: [...category.topics, ...suggestedTopics],
          count: 5,
        }),
      });
      const data = await res.json();
      setSuggestedTopics(prev => [...prev, ...data.topics]);
    } catch (error) {
      console.error('Error suggesting topics:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddTopic = async (topic: string) => {
    try {
      const adminEmail = session?.user?.email;
      await fetch('/api/admin/content/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          categorySlug: category.slug,
          topic,
        }),
      });
    } catch (error) {
      console.error('Error adding topic:', error);
    }
  };

  const allTopics = [...category.topics, ...suggestedTopics];

  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">2. Tema</h2>

      <div className="space-y-2">
        {allTopics.map((t) => (
          <Card
            key={t}
            onClick={() => {
              onSelect(t, false);
              // Agregar a la categoría si es un tema sugerido
              if (suggestedTopics.includes(t)) {
                handleAddTopic(t);
              }
            }}
            className={`p-3 cursor-pointer transition-all hover:shadow-sm
              ${selected === t
                ? 'border-2 border-primary bg-primary/5'
                : 'border hover:border-muted-foreground'
              }`}
          >
            <span className="text-sm">{t}</span>
          </Card>
        ))}

        {/* Custom topic input */}
        <div className="pt-2">
          <Input
            type="text"
            placeholder="O escribe tu propio tema..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customTopic.trim()) {
                onSelect(customTopic.trim(), true);
                setCustomTopic('');
              }
            }}
            className="border-dashed"
          />
        </div>

        {/* Suggest more topics */}
        <Button
          onClick={handleSuggestTopics}
          disabled={isSuggesting}
          variant="outline"
          className="w-full border-dashed"
        >
          {isSuggesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSuggesting ? 'Generando sugerencias...' : '+ Sugerir nuevos temas'}
        </Button>
      </div>
    </section>
  );
}
