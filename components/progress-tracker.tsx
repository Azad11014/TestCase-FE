import * as React from 'react'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete'
}

interface ProgressTrackerProps {
  steps: ProgressStep[]
  currentStep?: string
}

export function ProgressTracker({ steps, currentStep }: ProgressTrackerProps) {
  return (
    <div className="flex items-center justify-between w-full py-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center text-center space-y-2 flex-1">
            <div className="relative flex items-center justify-center">
              {step.status === 'complete' && (
                <CheckCircle2 className="h-6 w-6 text-primary animate-in fade-in" />
              )}
              {step.status === 'loading' && (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              )}
              {step.status === 'pending' && (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className={cn(
              'text-[10px] md:text-xs font-semibold leading-tight px-1',
              step.status === 'complete' ? 'text-primary' : '',
              step.status === 'loading' ? 'text-primary' : '',
              step.status === 'pending' ? 'text-muted-foreground' : ''
            )}>
              {step.label}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'h-[2px] w-full -mt-6',
              step.status === 'complete' ? 'bg-primary' : 'bg-muted'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
