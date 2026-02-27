'use client'

import * as React from 'react'
import { Header } from '@/components/header'
import { FileUpload } from '@/components/file-upload'
import { ProgressTracker } from '@/components/progress-tracker'
import { TestCaseList, type TestCase } from '@/components/test-case-list'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

import { API_ENDPOINTS } from '@/lib/config'

import { Input } from '@/components/ui/input'
import { generateTestCasesPDF } from '@/lib/pdf-utils'
import { generateTestCasesExcel } from '@/lib/excel-utils'
import { Download, FileSpreadsheet } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'

type ProgressStep = {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete'
}

type FrdChunk = {
  section_name: string
  frd_content: string
}

type FrdResponse = {
  success: boolean
  workflow_id: string
  message: string
  status?: string
  error?: string | null
  frd_file_path?: string
  chunks: FrdChunk[]
}

export default function Home() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generateFrd, setGenerateFrd] = React.useState(false)
  const [projectName, setProjectName] = React.useState('default')
  const [frdData, setFrdData] = React.useState<FrdResponse | null>(null)
  const [testCases, setTestCases] = React.useState<TestCase[]>([])
  const [progressSteps, setProgressSteps] = React.useState<ProgressStep[]>([
    { id: 'upload', label: 'Upload document', status: 'pending' },
    { id: 'analyze', label: 'Analyze document', status: 'pending' },
    { id: 'generate', label: 'Generate test cases', status: 'pending' },
    { id: 'complete', label: 'Complete', status: 'pending' },
  ])
  const [error, setError] = React.useState<string | null>(null)

  const updateProgressStep = (stepId: string, status: ProgressStep['status']) => {
    setProgressSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    )
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setError(null)
    setTestCases([])
    setFrdData(null)

    // Reset steps for new generation
    setProgressSteps([
      { id: 'upload', label: 'Upload document', status: 'pending' },
      { id: 'analyze', label: 'Analyze document', status: 'pending' },
      { id: 'generate', label: 'Generate test cases', status: 'pending' },
      { id: 'complete', label: 'Complete', status: 'pending' },
    ])

    try {
      setIsGenerating(true)
      updateProgressStep('upload', 'loading')

      const formData = new FormData()
      formData.append('file', file)

      // Use the central backend URL
      const tenantName = projectName || 'default'
      const url = `${API_ENDPOINTS.UPLOAD_BRD}?tenant_name=${tenantName}&generate_frd=${generateFrd}`

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      if (generateFrd) {
        // Flow A: JSON Response
        const data = await response.json()

        // Guide alignment: success might be false but status is "Waiting for user feedback"
        if (!data.success && data.status === 'Waiting for user feedback') {
          // Step 1.1: Fetch FRD path for the tenant
          const frdsResponse = await fetch(API_ENDPOINTS.DATA.TENANT_FRDS(tenantName))
          const frdsData = await frdsResponse.json()

          if (frdsData.success && frdsData.frds?.length > 0) {
            const latestFrd = frdsData.frds[0] // Assume first is latest

            // Step 1.2: Fetch actual content
            const contentResponse = await fetch(`${API_ENDPOINTS.DATA.CONTENT}?path=${latestFrd.path}`)
            const contentData = await contentResponse.json()

            if (contentData.success && contentData.content) {
              setFrdData({
                success: true,
                workflow_id: data.workflow_id,
                message: data.message,
                chunks: contentData.content.chunks || []
              })
              updateProgressStep('upload', 'complete')
              updateProgressStep('analyze', 'complete')
            } else {
              throw new Error('Failed to fetch FRD content')
            }
          } else {
            throw new Error('No FRD found for tenant')
          }
        } else if (data.success) {
          // Fallback for direct chunks-in-response (if backend still does it)
          setFrdData(data)
          updateProgressStep('upload', 'complete')
          updateProgressStep('analyze', 'complete')
        } else {
          throw new Error(data.message || 'FRD generation failed')
        }
      } else {
        // Flow B: Streaming Response
        updateProgressStep('upload', 'complete')
        updateProgressStep('analyze', 'loading')
        await processStream(response)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProgressSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
    } finally {
      setIsGenerating(false)
    }
  }

  const startTestCaseGeneration = async () => {
    if (!frdData) return

    try {
      setIsGenerating(true)
      updateProgressStep('generate', 'loading')

      const tenantName = projectName || 'default'
      const params = new URLSearchParams({
        tenant_name: tenantName,
      })
      const url = `${API_ENDPOINTS.GENERATE_TC}?${params.toString()}`

      const response = await fetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Test case generation failed')
      }

      await processStream(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const processStream = async (response: Response) => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6))

            switch (data.status) {
              case 'processing':
                updateProgressStep('analyze', 'loading')
                break

              case 'generating':
                updateProgressStep('upload', 'complete')
                updateProgressStep('analyze', 'complete')
                updateProgressStep('generate', 'loading')
                if (data.testcases && Array.isArray(data.testcases)) {
                  const mappedTestCases = data.testcases.map((tc: any) => ({
                    id: tc['Test Case ID'] || tc['id'] || 'N/A',
                    brdReferenceNo: tc['BRD Reference No.'] || tc['brdReferenceNo'] || '',
                    sectionName: tc['Section Name'] || tc['sectionName'] || '',
                    scenario: tc['Test Scenario'] || tc['scenario'] || '',
                    preConditions: tc['Pre-Conditions'] || tc['preConditions'] || '',
                    testSteps: tc['Test Steps'] || tc['testSteps'] || '',
                    expectedResult: tc['Expected Result'] || tc['expectedResult'] || '',
                    priority: tc['Priority'] || tc['priority'] || 'Medium',
                    test_type: tc['Test Type'] || tc['test_type'] || undefined
                  }));
                  setTestCases(prev => [...(prev || []), ...mappedTestCases])
                }
                break

              case 'completed':
              case 'pending_feedback':
                updateProgressStep('upload', 'complete')
                updateProgressStep('analyze', 'complete')
                updateProgressStep('generate', 'complete')
                updateProgressStep('complete', 'complete')
                break

              case 'failed':
                throw new Error(data.error || 'Generation failed')
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setTestCases([])
    setError(null)
    setProgressSteps([
      { id: 'upload', label: 'Upload document', status: 'pending' },
      { id: 'analyze', label: 'Analyze document', status: 'pending' },
      { id: 'generate', label: 'Generate test cases', status: 'pending' },
      { id: 'complete', label: 'Complete', status: 'pending' },
    ])
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Top Progress Tracker */}
        {selectedFile && (
          <Card className="border-border">
            <CardContent className="pt-6">
              <ProgressTracker steps={progressSteps} />
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-sm font-medium">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isGenerating}
                  className="rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Upload Document</h2>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="frd-toggle"
                    checked={generateFrd}
                    onCheckedChange={setGenerateFrd}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="frd-toggle" className="text-xs">Generate FRD</Label>
                </div>
              </div>
              <FileUpload
                onFileSelect={handleFileSelect}
                isLoading={isGenerating}
              />

              {selectedFile && (
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-sm text-muted-foreground">Selected file:</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedFile.name}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-xs text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedFile && testCases.length > 0 && !isGenerating && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Generate Another
              </Button>
            )}
          </div>

          {/* Right Column - Test Cases & FRD */}
          <div className="lg:col-span-2">
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center h-[450px] rounded-2xl border-2 border-dashed border-muted bg-muted/5 group transition-all duration-300 hover:bg-muted/10">
                <div className="p-6 rounded-full bg-muted/50 mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-foreground">No Document Selected</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Upload a BRD, PDF, or JSON file in the sidebar to start generating test scenarios.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {testCases.length > 0 ? 'Generated Test Cases' : frdData ? 'Review FRD' : 'Processing Document'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isGenerating ? 'AI is processing your request...' : testCases.length > 0 ? `Total ${testCases.length} scenarios generated.` : 'Analyze complete. See details below.'}
                    </p>
                  </div>
                  {testCases.length > 0 && !isGenerating && (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-8 border-primary/20 hover:bg-primary/5"
                          >
                            <Download className="h-4 w-4" />
                            Export
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => generateTestCasesPDF(projectName, testCases)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => generateTestCasesExcel(projectName, testCases)}
                            className="flex items-center gap-2 cursor-pointer text-green-600 focus:text-green-700"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export as Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1 border border-primary/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Generating Complete
                      </span>
                    </div>
                  )}
                </div>

                {/* FRD View - Only show if no test cases or if we just finished FRD step */}
                {frdData && testCases.length === 0 && !isGenerating && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-primary/20 bg-primary/5 shadow-sm">
                      <CardContent className="p-6 flex items-center justify-between gap-6">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-primary">FRD Generation Complete</h3>
                          <p className="text-sm text-muted-foreground">The document has been analyzed. You can now generate specific test scenarios.</p>
                        </div>
                        <Button
                          onClick={startTestCaseGeneration}
                          disabled={isGenerating}
                          size="lg"
                          className="shadow-lg shadow-primary/20 min-w-[180px]"
                        >
                          Generate Test Cases
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Functional Requirements
                        <Badge variant="outline" className="font-normal text-[10px]">{frdData.chunks.length} sections</Badge>
                      </h3>
                      <div className="grid gap-4">
                        {frdData.chunks.map((chunk, index) => (
                          <Card key={index} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                {chunk.section_name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-4 px-4 bg-card">
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {chunk.frd_content}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State for Test Cases (only when array is empty) */}
                {isGenerating && testCases.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-muted bg-muted/5 animate-pulse">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <div className="text-center space-y-2">
                      <p className="text-lg font-bold text-foreground">
                        {frdData ? 'Generating Test Cases...' : 'Analyzing Document...'}
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm px-6">
                        Our AI is processing the requirements to create detailed test scenarios. This may take a minute.
                      </p>
                    </div>
                  </div>
                )}

                {/* Results List */}
                {testCases.length > 0 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <TestCaseList
                      testCases={testCases}
                      isStreaming={isGenerating}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
