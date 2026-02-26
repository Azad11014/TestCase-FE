'use client'

import * as React from 'react'
import { Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      onFileSelect(files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      onFileSelect(files[0])
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all duration-200 p-8 text-center',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 bg-card'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept=".pdf,.docx,.json,.md"
        className="hidden"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          'p-3 rounded-lg transition-colors',
          isDragActive ? 'bg-primary/20' : 'bg-muted'
        )}>
          <Upload className={cn(
            'h-6 w-6 transition-colors',
            isDragActive ? 'text-primary' : 'text-muted-foreground'
          )} />
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            Drag and drop your document here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="rounded-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Choose Document
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          Supported: .pdf, .docx, .json, .md
        </p>
      </div>
    </div>
  )
}
