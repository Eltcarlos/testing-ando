'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TurndownService from 'turndown';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  LinkIcon,
  Undo,
  Redo,
  Type,
  Heading3,
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string, markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Escribe tu contenido aquí...',
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline underline-offset-2',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none text-foreground [&_.ProseMirror]:outline-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      const markdown = turndownService.turndown(html);
      onChange?.(html, markdown);
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addHeading = (level: 1 | 2 | 3) => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-input rounded-md overflow-hidden bg-background dark:bg-input/30 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-input bg-accent/50 dark:bg-accent/30 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-input">
            <button
              type="button"
              onClick={() => addHeading(1)}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Título 1"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => addHeading(2)}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Título 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => addHeading(3)}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('heading', { level: 3 }) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Título 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Bold, Italic */}
          <div className="flex items-center gap-1 pr-2 border-r border-input">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('bold') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Negrita"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('italic') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Cursiva"
            >
              <Italic className="h-4 w-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 pr-2 border-r border-input">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Lista con viñetas"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('orderedList') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>

          {/* Quote and Code */}
          <div className="flex items-center gap-1 pr-2 border-r border-input">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('blockquote') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Cita"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('codeBlock') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Código"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          {/* Link */}
          <div className="flex items-center gap-1 pr-2 border-r border-input">
            <button
              type="button"
              onClick={setLink}
              className={`p-2 rounded-md hover:bg-accent transition-colors ${
                editor.isActive('link') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title="Enlace"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="p-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
              title="Deshacer"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="p-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
              title="Rehacer"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Character count */}
        <div className="text-xs text-muted-foreground mt-2">
          {editor.storage.characterCount?.characters()} caracteres • {' '}
          {editor.storage.characterCount?.words()} palabras
        </div>
      </div>

      {/* Editor */}
      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}