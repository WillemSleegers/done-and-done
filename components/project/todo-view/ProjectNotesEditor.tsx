"use client"

import { useRef, forwardRef, useImperativeHandle } from "react"
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "@/components/ui/rich-text-editor"

interface ProjectNotesEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onKeyDown: (e: KeyboardEvent) => void
}

export interface ProjectNotesEditorRef {
  getHTML: () => string
  getText: () => string
  setContent: (content: string) => void
  blur: () => void
}

export const ProjectNotesEditor = forwardRef<ProjectNotesEditorRef, ProjectNotesEditorProps>(
  ({ value, onChange, onSave, onKeyDown }, ref) => {
    const notesInputRef = useRef<RichTextEditorRef>(null)

    useImperativeHandle(ref, () => ({
      getHTML: () => notesInputRef.current?.getHTML() || "",
      getText: () => notesInputRef.current?.getText() || "",
      setContent: (content: string) => notesInputRef.current?.setContent(content),
      blur: () => notesInputRef.current?.blur()
    }))

    return (
      <div>
        <h3 className="text-base font-medium text-foreground mb-3">Notes</h3>
        <RichTextEditor
          ref={notesInputRef}
          content={value}
          onUpdate={onChange}
          onBlur={onSave}
          onKeyDown={onKeyDown}
          placeholder="Add notes..."
          className="text-muted-foreground text-base leading-5 bg-transparent border-none outline-none focus:outline-none w-full cursor-pointer"
        />
      </div>
    )
  }
)

ProjectNotesEditor.displayName = "ProjectNotesEditor"