export const runtime = 'nodejs'

const SAMPLE_TEST_CASES = [
  {
    title: 'Test: Valid Input Handling',
    description: 'Verify that the function correctly handles valid inputs',
    code: `test('should return true for valid input', () => {
  const result = validateInput({ name: 'John', age: 30 });
  expect(result).toBe(true);
});`,
    expected: 'Function returns true without throwing errors'
  },
  {
    title: 'Test: Empty String Edge Case',
    description: 'Ensure proper handling of empty strings',
    code: `test('should handle empty string', () => {
  const result = processString('');
  expect(result).toEqual({ length: 0, processed: true });
});`,
    expected: 'Returns object with length 0 and processed flag'
  },
  {
    title: 'Test: Null/Undefined Values',
    description: 'Validate behavior with null and undefined inputs',
    code: `test('should throw error for null input', () => {
  expect(() => getData(null)).toThrow('Invalid input');
});`,
    expected: 'Throws appropriate error message'
  },
  {
    title: 'Test: Large Dataset Performance',
    description: 'Check performance with large data sets',
    code: `test('should process large array efficiently', () => {
  const largeArray = Array(10000).fill({ id: 1, value: 'test' });
  const start = performance.now();
  const result = filterData(largeArray);
  const end = performance.now();
  expect(end - start).toBeLessThan(100);
});`,
    expected: 'Processing completes within 100ms'
  },
  {
    title: 'Test: Error Recovery',
    description: 'Verify graceful error handling and recovery',
    code: `test('should recover from API error', async () => {
  const result = await fetchWithRetry('invalid-url', { retries: 3 });
  expect(result.success).toBe(false);
  expect(result.attempts).toBe(3);
});`,
    expected: 'Returns error object after 3 retry attempts'
  },
  {
    title: 'Test: Data Transformation',
    description: 'Validate correct data structure transformation',
    code: `test('should transform data correctly', () => {
  const input = { users: [{ id: 1, name: 'Alice' }] };
  const result = transformData(input);
  expect(result).toEqual({ 1: 'Alice' });
});`,
    expected: 'Data transformed from array to map format'
  },
  {
    title: 'Test: Async Operation Timeout',
    description: 'Check timeout handling for long-running operations',
    code: `test('should timeout after 5 seconds', async () => {
  await expect(
    Promise.race([
      longRunningOperation(),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000))
    ])
  ).rejects.toBe('timeout');
});`,
    expected: 'Promise rejects after 5 second timeout'
  },
  {
    title: 'Test: Concurrent Requests',
    description: 'Validate handling of multiple concurrent operations',
    code: `test('should handle concurrent requests', async () => {
  const promises = Array(10).fill(null).map(() => fetchData());
  const results = await Promise.all(promises);
  expect(results).toHaveLength(10);
});`,
    expected: 'All 10 concurrent requests complete successfully'
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
