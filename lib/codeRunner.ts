import { execFile } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CodeRunOptions {
  language: 'javascript' | 'python' | 'java';
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  error?: string;
}

export interface TestCaseEvaluation {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
  executionTimeMs: number;
  error?: string;
}

/**
 * Normalizes output strings for comparison (handles JSON arrays, trailing newlines, whitespace)
 */
export function normalizeOutput(val: string): string {
  const trimmed = (val || '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed);
  } catch {
    return trimmed.replace(/\r\n/g, '\n');
  }
}

/**
 * Checks if actual output matches expected output
 */
export function outputsMatch(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) return true;

  // Case-insensitive boolean comparison (e.g. Python True vs JS true)
  if (normActual.toLowerCase() === normExpected.toLowerCase()) return true;

  return false;
}

/**
 * Execute code in a sandboxed child process with strict timeout
 */
export async function executeCode(options: CodeRunOptions): Promise<CodeRunResult> {
  const { language, code, stdin = '', timeoutMs = 4000 } = options;

  if (!code || !code.trim()) {
    return {
      success: false,
      stdout: '',
      stderr: 'No code provided to execute.',
      exitCode: -1,
      executionTimeMs: 0,
      error: 'Empty code',
    };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnx-run-'));
  const startTime = Date.now();

  try {
    let binaryPath = '';
    let args: string[] = [];
    let scriptPath = '';

    if (language === 'javascript') {
      scriptPath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      binaryPath = process.execPath || '/usr/bin/node';
      args = [scriptPath];
    } else if (language === 'python') {
      scriptPath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      binaryPath = '/usr/bin/python3';
      args = [scriptPath];
    } else if (language === 'java') {
      let className = 'Solution';
      const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      if (match && match[1]) {
        className = match[1];
      }
      scriptPath = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(scriptPath, code, 'utf-8');
      binaryPath = '/usr/bin/java';
      args = [scriptPath];
    } else {
      return {
        success: false,
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        exitCode: -1,
        executionTimeMs: 0,
        error: 'Unsupported language',
      };
    }

    return await new Promise<CodeRunResult>((resolve) => {
      const child = execFile(
        binaryPath,
        args,
        {
          cwd: tempDir,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024 * 2, // 2MB
          env: {
            PATH: process.env.PATH || '/usr/bin:/bin:/usr/local/bin',
            NODE_ENV: 'production',
            PYTHONUNBUFFERED: '1',
          },
        },
        (error, stdout, stderr) => {
          const elapsed = Date.now() - startTime;
          const out = (stdout || '').trim();
          const err = (stderr || '').trim();

          if (error) {
            const isTimeout = (error as any).killed || error.signal === 'SIGTERM' || (error as any).code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
            const exitCode = typeof error.code === 'number' ? error.code : -1;

            return resolve({
              success: false,
              stdout: out,
              stderr: isTimeout
                ? `Time Limit Exceeded: Process exceeded ${timeoutMs / 1000}s limit.`
                : err || error.message,
              exitCode,
              executionTimeMs: elapsed,
              error: isTimeout ? 'Time Limit Exceeded' : err || error.message,
            });
          }

          resolve({
            success: true,
            stdout: out,
            stderr: err,
            exitCode: 0,
            executionTimeMs: elapsed,
          });
        }
      );

      if (stdin && child.stdin) {
        try {
          child.stdin.write(stdin);
          child.stdin.end();
        } catch {
          // ignore broken pipe
        }
      } else if (child.stdin) {
        child.stdin.end();
      }
    });
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    return {
      success: false,
      stdout: '',
      stderr: err.message || 'Execution error',
      exitCode: -1,
      executionTimeMs: elapsed,
      error: err.message,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Runs code against multiple test cases and returns comprehensive evaluations
 */
export async function evaluateTestCases(
  language: 'javascript' | 'python' | 'java',
  code: string,
  testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>
): Promise<{
  allPassed: boolean;
  passedTestCases: number;
  totalTestCases: number;
  results: TestCaseEvaluation[];
  overallStatus: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
}> {
  const results: TestCaseEvaluation[] = [];
  let passedCount = 0;
  let hasRuntimeError = false;

  for (const tc of testCases) {
    const runResult = await executeCode({
      language,
      code,
      stdin: tc.input,
      timeoutMs: 4000,
    });

    const passed = runResult.success && outputsMatch(runResult.stdout, tc.expectedOutput);
    if (passed) passedCount++;
    if (!runResult.success) hasRuntimeError = true;

    results.push({
      input: tc.input,
      expected: tc.expectedOutput,
      actual: runResult.stdout,
      passed,
      isHidden: !!tc.isHidden,
      executionTimeMs: runResult.executionTimeMs,
      error: runResult.error,
    });
  }

  const allPassed = passedCount === testCases.length;
  const overallStatus = allPassed
    ? 'Accepted'
    : hasRuntimeError
    ? 'Runtime Error'
    : 'Wrong Answer';

  return {
    allPassed,
    passedTestCases: passedCount,
    totalTestCases: testCases.length,
    results,
    overallStatus,
  };
}
