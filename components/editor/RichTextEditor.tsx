"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { forwardRef, useImperativeHandle, useEffect } from 'react'

export interface RichTextEditorRef {
  focus: () => void
  blur: () => void
  getHTML: () => string
  getText: () => string
  setContent: (content: string) => void
}

interface RichTextEditorProps {
  content: string
  onUpdate: (content: string) => void
  onBlur?: () => void
  onKeyDown?: (event: KeyboardEvent) => void
  placeholder?: string
  className?: string
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onUpdate, onBlur, onKeyDown, placeholder, className }, ref) => {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          link: {
            openOnClick: false,
            HTMLAttributes: {
              class: 'text-primary underline hover:text-primary/80 cursor-pointer',
            },
          },
        }),
        Placeholder.configure({
          placeholder: placeholder || 'Start typing...',
          emptyEditorClass: 'is-editor-empty',
          showOnlyWhenEditable: false,
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onUpdate(editor.getHTML())
      },
      onBlur: () => {
        onBlur?.()
      },
      editorProps: {
        attributes: {
          class: className || '',
        },
        handleKeyDown: (view, event) => {
          onKeyDown?.(event)
          return false
        },
      },
    })

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      blur: () => editor?.commands.blur(),
      getHTML: () => editor?.getHTML() || '',
      getText: () => editor?.getText() || '',
      setContent: (content: string) => editor?.commands.setContent(content),
    }))

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content)
      }
    }, [content, editor])

    if (!editor) {
      return null
    }

    return (
      <div className="relative">
        <div className={`rich-text-editor ${className || ''}`}>
          <EditorContent 
            editor={editor} 
            placeholder={placeholder}
          />
        </div>
        <style jsx global>{`
          .rich-text-editor .ProseMirror {
            outline: none;
          }
          .rich-text-editor .ProseMirror p {
            margin: 0;
            line-height: 1.25rem;
          }
          .rich-text-editor .ProseMirror ul,
          .rich-text-editor .ProseMirror ol {
            margin: 0.25rem 0;
            padding-left: 1rem;
          }
          .rich-text-editor .ProseMirror ul li {
            list-style-type: disc;
          }
          .rich-text-editor .ProseMirror ol li {
            list-style-type: decimal;
          }
          .rich-text-editor .ProseMirror li {
            margin: 0.125rem 0;
          }
          .rich-text-editor .ProseMirror strong {
            font-weight: 600;
          }
          .rich-text-editor .ProseMirror em {
            font-style: italic;
          }
          .rich-text-editor .ProseMirror a {
            color: hsl(var(--primary));
            text-decoration: underline;
            cursor: pointer;
          }
          .rich-text-editor .ProseMirror a:hover {
            color: hsl(var(--primary) / 0.8);
          }
          .rich-text-editor .ProseMirror p.is-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: hsl(var(--muted-foreground));
            pointer-events: none;
            height: 0;
          }
        `}</style>
      </div>
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'