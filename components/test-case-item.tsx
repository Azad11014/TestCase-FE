'use client'

import * as React from 'react'
import { ChevronDown, ListChecks, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface TestCaseItemProps {
  id: string
  brdReferenceNo?: string
  sectionName?: string
  scenario: string
  preConditions: string
  testSteps: string
  expectedResult: string
  priority: string
  test_type?: string
  status?: 'generating' | 'complete'
  isNew?: boolean
}

export function TestCaseItem({
  id,
  brdReferenceNo,
  sectionName,
  scenario,
  preConditions,
  testSteps,
  expectedResult,
  priority,
  test_type,
  status = 'complete',
  isNew = false,
}: TestCaseItemProps) {
  const [isOpen, setIsOpen] = React.useState(isNew)

  const getPriorityColor = (p: string) => {
    switch (p.toUpperCase()) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
      case 'HIGH': return 'bg-orange-600 text-white hover:bg-orange-700'
      case 'MEDIUM': return 'bg-yellow-500 text-white hover:bg-yellow-600'
      case 'LOW': return 'bg-blue-500 text-white hover:bg-blue-600'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getTestTypeColor = (type: string | undefined) => {
    if (!type) return 'hidden'
    switch (type.toLowerCase()) {
      case 'positive': return 'bg-green-500 text-white'
      case 'negative': return 'bg-red-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  return (
    <div
      className={cn(
        'group animate-stream-item rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-sm',
        isNew && 'border-primary/50 shadow-sm'
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge className={cn('flex-shrink-0 font-bold px-2 py-0.5 text-[10px]', getPriorityColor(priority))}>
            {priority}
          </Badge>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                ID: {id}
              </span>
              {brdReferenceNo && (
                <span className="text-[10px] font-medium text-primary/60">
                  Ref: {brdReferenceNo}
                </span>
              )}
              {test_type && test_type !== 'N/A' && (
                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border-none h-4 uppercase font-bold', getTestTypeColor(test_type))}>
                  {test_type}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground truncate">
              {sectionName || 'Scenario Detail'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'generating' && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-4 bg-muted/10 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {scenario && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                <Info className="h-3 w-3" />
                Scenario
              </div>
              <p className="text-sm text-foreground/90 pl-1 leading-relaxed whitespace-pre-wrap">
                {scenario}
              </p>
            </div>
          )}

          {preConditions && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                <Info className="h-3 w-3" />
                Preconditions
              </div>
              <p className="text-sm text-foreground/90 pl-1 leading-relaxed whitespace-pre-wrap">
                {preConditions}
              </p>
            </div>
          )}

          {testSteps && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                <ListChecks className="h-3 w-3" />
                Test Steps
              </div>
              <p className="text-sm text-foreground/90 pl-1 leading-relaxed whitespace-pre-wrap">
                {testSteps}
              </p>
            </div>
          )}

          {expectedResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase font-mono">
                <AlertCircle className="h-3 w-3 text-primary" />
                Expected Result
              </div>
              <div className="bg-background rounded-md p-3 border border-border shadow-inner">
                <p className="text-sm font-medium text-primary leading-relaxed whitespace-pre-wrap">
                  {expectedResult}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

