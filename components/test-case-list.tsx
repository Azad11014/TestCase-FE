'use client'

import * as React from 'react'
import { TestCaseItem } from './test-case-item'
import { Loader2, CheckCircle2 } from 'lucide-react'

export interface TestCase {
  id: string
  title: string
  scenario: string
  preconditions: string[]
  steps: string[]
  expected_result: string[]
  test_type: string
  priority: string
  status?: 'generating' | 'complete'
}

interface TestCaseListProps {
  testCases: TestCase[]
  isStreaming?: boolean
}

export function TestCaseList({ testCases, isStreaming }: TestCaseListProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [testCases])

  if (testCases.length === 0 && !isStreaming) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          Generated Test Cases
          {isStreaming && (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          {!isStreaming && testCases.length > 0 && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </h2>
        <span className="text-sm text-muted-foreground">
          {testCases.length} {testCases.length === 1 ? 'case' : 'cases'}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {testCases.map((testCase, index) => (
          <TestCaseItem
            key={testCase.id}
            {...testCase}
            isNew={index === testCases.length - 1 && isStreaming}
          />
        ))}
      </div>
    </div>
  )
}
