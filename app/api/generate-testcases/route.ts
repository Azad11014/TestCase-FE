export const runtime = 'nodejs'

const SAMPLE_TEST_CASES = [
  {
    id: "TC-1.1",
    title: "User successfully registers with basic information",
    scenario: "A user downloads the OnUFitness app and registers by providing name, email address, date of birth, and optional phone number.",
    preconditions: [
      "The user has downloaded the OnUFitness app from the App Store or Google Play",
      "The user has a valid email address and date of birth"
    ],
    steps: [
      "The user navigates to the registration page",
      "The user enters their name, email address, date of birth, and optional phone number",
      "The user submits the registration form"
    ],
    expected_result: [
      "The user is successfully registered and receives a confirmation email",
      "The user's profile is created with the provided information"
    ],
    test_type: "Positive",
    priority: "P0"
  },
  {
    id: "TC-1.2",
    title: "Registration fails with invalid email format",
    scenario: "A user attempts to register with an incorrectly formatted email address.",
    preconditions: [
      "The user is on the registration page"
    ],
    steps: [
      "The user enters a name and an invalid email (e.g., 'test@domain')",
      "The user enters date of birth and submits"
    ],
    expected_result: [
      "System displays an error message: 'Invalid email format'",
      "Form is not submitted and user remains on the registration page"
    ],
    test_type: "Negative",
    priority: "P1"
  }
]

async function* streamTestCases(filename: string) {
  // Simulate analysis steps
  const steps = [
    `Analyzing file: ${filename}...`,
    'Identifying functions and methods...',
    'Planning test coverage...',
    'Generating test cases...'
  ]

  for (const step of steps) {
    yield `data: ${JSON.stringify({ type: 'step', message: step })}\n\n`
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Stream test cases
  for (let i = 0; i < SAMPLE_TEST_CASES.length; i++) {
    const testCase = SAMPLE_TEST_CASES[i]
    yield `data: ${JSON.stringify({
      type: 'testcase',
      testcase: {
        id: `tc-${i}`,
        ...testCase
      }
    })}\n\n`
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  // Completion message
  yield `data: ${JSON.stringify({
    type: 'complete',
    count: SAMPLE_TEST_CASES.length
  })}\n\n`
}

export async function POST(request: Request) {
  const { filename } = await request.json()

  if (!filename) {
    return Response.json(
      { error: 'Filename is required' },
      { status: 400 }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamTestCases(filename)) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
