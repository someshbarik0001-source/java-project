export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { executeCode, evaluateTestCases } from '@/lib/codeRunner';

export async function POST(req: NextRequest) {
  try {
    const { language = 'javascript', code, customInput, testCases } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Code cannot be empty' }, { status: 400 });
    }

    // If custom input is provided, run single execution
    if (typeof customInput === 'string' && (!testCases || testCases.length === 0)) {
      const result = await executeCode({
        language,
        code,
        stdin: customInput,
        timeoutMs: 4000,
      });

      return NextResponse.json({
        type: 'custom',
        result,
      });
    }

    // Otherwise run against provided test cases
    if (Array.isArray(testCases) && testCases.length > 0) {
      const evaluation = await evaluateTestCases(language, code, testCases);
      return NextResponse.json({
        type: 'evaluation',
        ...evaluation,
      });
    }

    // Default: run without stdin
    const result = await executeCode({
      language,
      code,
      stdin: '',
      timeoutMs: 4000,
    });

    return NextResponse.json({
      type: 'custom',
      result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Run code error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
