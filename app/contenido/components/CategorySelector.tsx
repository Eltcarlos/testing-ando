'use client';

import { useState, useEffect } from 'react';
import { ContentCategory } from '@/types/editorial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useSession } from "next-auth/react";

interface Props {
  visible: boolean;
  selected: ContentCategory | null;
  onSelect: (category: ContentCategory) => void;
}

export function CategorySelector({ visible, selected, onSelect }: Props) {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [hint, setHint] = useState('');
  const [showHintInput, setShowHintInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      loadCategories();
    }
  }, [session?.user?.email]);

  const loadCategories = async () => {
    try {
      const adminEmail = session?.user?.email;

      if (!adminEmail) {
        console.error('No admin email found in CategorySelector');
        setCategories([]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/content/categories?adminEmail=${encodeURIComponent(adminEmail)}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.status}`);
      }

      const data = await res.json();
      // Filter out any invalid categories
      const validCategories = Array.isArray(data)
        ? data.filter(cat => cat && cat.slug && cat.label)
        : [];
      setCategories(validCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestCategory = async () => {
    setIsSuggesting(true);
    try {
      const adminEmail = session?.user?.email;

      if (!adminEmail) {
        console.error('No admin email found');
        alert('Por favor, inicia sesión primero');
        return;
      }

      // Suggest and create category (endpoint now creates it directly)
      const suggestRes = await fetch('/api/admin/content/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          existingCategories: categories,
          hint: hint || undefined,
        }),
      });

      if (!suggestRes.ok) {
        const error = await suggestRes.json();
        throw new Error(error.error || 'Failed to suggest category');
      }

      const { category: newCat } = await suggestRes.json();

      // Add to local state
      if (newCat && newCat.slug && newCat.label) {
        setCategories(prev => [...prev, newCat]);
      } else {
        throw new Error('Invalid category returned');
      }

      setHint('');
      setShowHintInput(false);
    } catch (error) {
      console.error('Error suggesting category:', error);
      alert('Error al generar categoría. Por favor intenta de nuevo.');
    } finally {
      setIsSuggesting(false);
    }
  };

  if (!visible) return null;

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any;
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">1. Categoría</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">1. Categoría</h2>

      {categories.length === 0 && !showHintInput && (
        <Card className="p-6 text-center mb-4 border-dashed">
          <p className="text-sm text-muted-foreground mb-2">
            No hay categorías disponibles. Crea tu primera categoría para empezar.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.filter(cat => cat && cat.slug && cat.label).map((cat) => (
          <Card
            key={cat.slug}
            onClick={() => onSelect(cat)}
            className={`p-4 text-center cursor-pointer transition-all hover:shadow-md
              ${selected?.slug === cat.slug
                ? 'border-2 border-primary bg-primary/5'
                : 'border-2 border-transparent hover:border-muted'
              }`}
          >
            <span className="flex justify-center mb-2">{getIcon(cat.icon)}</span>
            <span className="text-sm font-medium">{cat.label}</span>
            {!cat.isDefault && (
              <span className="text-xs text-muted-foreground block mt-1">AI</span>
            )}
          </Card>
        ))}

        {/* Nueva categoría */}
        <Card
          onClick={() => setShowHintInput(true)}
          className="p-4 text-center cursor-pointer border-2 border-dashed border-muted hover:border-muted-foreground transition-all"
        >
          <span className="flex justify-center mb-2">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </span>
          <span className="text-sm text-muted-foreground">Nueva categoría</span>
        </Card>
      </div>

      {/* Hint input modal */}
      {showHintInput && (
        <Card className="mt-4 p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground mb-3">
            ¿Alguna pista de qué área te interesa? (opcional)
          </p>
          <Input
            type="text"
            placeholder="ej: sustentabilidad, exportaciones, franquicias..."
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSuggestCategory}
              disabled={isSuggesting}
            >
              {isSuggesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSuggesting ? 'Generando...' : 'Generar categoría'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowHintInput(false);
                setHint('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}
