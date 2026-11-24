'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Code2,
  ChevronLeft,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  ChevronDown,
  ChevronUp,
  FileCode,
  Sparkles,
  Loader2,
  Check,
  Copy,
  Info,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

interface Assessment {
  _id: string;
  classroomId: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  starterCode: {
    javascript?: string;
    python?: string;
    java?: string;
  };
  testCases: TestCase[];
  tabSwitchLimit: number;
  timeLimitMinutes?: number;
}

interface TestResultItem {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
  executionTimeMs: number;
  error?: string;
}

interface SubmissionRecord {
  _id: string;
  status: string;
  passedTestCases: number;
  totalTestCases: number;
  tabSwitchCount: number;
  autoSubmitted: boolean;
  submittedAt: string;
  code: string;
  language: string;
}

export default function CodingAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student auth
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');

  // Editor states
  const [language, setLanguage] = useState<'javascript' | 'python' | 'java'>('javascript');
  const [code, setCode] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Split-pane & drawer states
  const [leftTab, setLeftTab] = useState<'description' | 'submissions'>('description');
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'testresult' | 'terminal'>('testcase');
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('Console initialized. Click "Run" to test your solution.');
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Past submissions
  const [submissionsList, setSubmissionsList] = useState<SubmissionRecord[]>([]);

  // Anti-Cheat & Proctoring States
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationTime, setViolationTime] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);

  // Ref to hold latest code for tab-switch event handler
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const studentEmailRef = useRef(studentEmail);
  useEffect(() => {
    studentEmailRef.current = studentEmail;
  }, [studentEmail]);

  const studentNameRef = useRef(studentName);
  useEffect(() => {
    studentNameRef.current = studentName;
  }, [studentName]);

  const isLockedRef = useRef(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Load user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail') || 'student@learnx.edu';
      const name = localStorage.getItem('userName') || email.split('@')[0];
      setStudentEmail(email);
      setStudentName(name);
    }
  }, []);

  // Fetch assessment data
  useEffect(() => {
    if (!assessmentId) return;

    fetch(`/api/coding-assessment/${assessmentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load assessment');
        return res.json();
      })
      .then((data: Assessment) => {
        setAssessment(data);
        if (data.timeLimitMinutes) {
          setTimeLeft(data.timeLimitMinutes * 60);
        }

        // Set default starter code
        const defaultLang = 'javascript';
        setLanguage(defaultLang);
        const starter = data.starterCode?.[defaultLang] || '// Write your solution here\n';
        setCode(starter);

        if (data.testCases && data.testCases.length > 0) {
          setCustomInput(data.testCases[0].input);
        }

        setHasStarted(true);
      })
      .catch((err) => {
        setError(err.message || 'Error loading assessment');
      })
      .finally(() => setLoading(false));
  }, [assessmentId]);

  // Fetch past submissions
  const fetchSubmissions = useCallback(async () => {
    if (!assessmentId) return;
    try {
      const res = await fetch(`/api/coding-assessment/submissions?assessmentId=${assessmentId}`);
      if (res.ok) {
        const data = await res.json();
        const mySubs = (data.submissions || []).filter(
          (s: any) => s.studentEmail === studentEmailRef.current
        );
        setSubmissionsList(mySubs);

        // Check if student already had a tab-switch auto submission
        const violated = mySubs.find((s: any) => s.autoSubmitted);
        if (violated && !isLockedRef.current) {
          setIsLocked(true);
          setShowViolationModal(true);
          setViolationTime(new Date(violated.submittedAt).toLocaleTimeString());
        }
      }
    } catch {
      // ignore
    }
  }, [assessmentId]);

  useEffect(() => {
    if (studentEmail) {
      fetchSubmissions();
    }
  }, [studentEmail, fetchSubmissions]);

  // Countdown timer
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit('Time limit expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // ──────────────────────────────────────────────────────────────────────────
  // ANTI-CHEAT TAB SWITCH & BLUR DETECTION
  // ──────────────────────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(
    async (reason: string) => {
      if (isLockedRef.current) return;
      setIsLocked(true);
      setIsSubmitting(true);
      const currentTime = new Date().toLocaleTimeString();
      setViolationTime(currentTime);
      setShowViolationModal(true);

      try {
        // 1. Immediately fire proctoring event
        fetch('/api/coding-assessment/tab-switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            studentEmail: studentEmailRef.current,
            studentName: studentNameRef.current,
            action: 'tab_switched',
          }),
        }).catch(() => {});

        // 2. Submit current code with auto-submitted flag
        const res = await fetch('/api/coding-assessment/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            studentEmail: studentEmailRef.current,
            studentName: studentNameRef.current,
            code: codeRef.current,
            language,
            autoSubmitted: true,
            autoSubmitReason: reason,
            tabSwitchCount: tabSwitchCount + 1,
          }),
        });

        if (res.ok) {
          const submissionData = await res.json();
          setTestResults(submissionData.testResults || []);
          setOverallStatus('Auto-Submitted (Tab Switch Violation)');
          setConsoleTab('testresult');
          setConsoleExpanded(true);
          fetchSubmissions();
        }
      } catch (err) {
        console.error('Auto-submit failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [assessmentId, language, tabSwitchCount, fetchSubmissions]
  );

  useEffect(() => {
    if (!hasStarted || isLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => c + 1);
        handleAutoSubmit('Tab switch detected (navigated away from exam tab)');
      }
    };

    const handleBlur = () => {
      // Note: we check document.activeElement to prevent firing when clicking internal iframes/inputs
      if (document.activeElement?.tagName === 'IFRAME') return;
      setTabSwitchCount((c) => c + 1);
      handleAutoSubmit('Window blur detected (switched application or tab)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [hasStarted, isLocked, handleAutoSubmit]);

  // Handle language switch
  const handleLanguageChange = (newLang: 'javascript' | 'python' | 'java') => {
    setLanguage(newLang);
    if (assessment?.starterCode?.[newLang]) {
      setCode(assessment.starterCode[newLang]!);
    } else {
      setCode(
        newLang === 'python'
          ? '# Write your Python solution here\n'
          : newLang === 'java'
          ? '// Write your Java solution here\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}\n'
          : '// Write your JavaScript solution here\n'
      );
    }
  };

  // Reset code to default starter
  const handleResetCode = () => {
    if (assessment?.starterCode?.[language]) {
      setCode(assessment.starterCode[language]!);
    }
  };

  // Run Code against sample test cases
  const handleRun = async () => {
    setIsRunning(true);
    setConsoleTab('testresult');
    setConsoleExpanded(true);
    setTerminalOutput(`[Running ${language} solution on sample test cases...]\n`);

    try {
      const sampleCases = (assessment?.testCases || []).filter((tc) => !tc.isHidden);
      const res = await fetch('/api/coding-assessment/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          testCases: sampleCases,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      if (data.type === 'evaluation') {
        setTestResults(data.results || []);
        setOverallStatus(data.overallStatus);
        setTerminalOutput(
          `[Execution completed in ${data.results.reduce((acc: number, r: any) => acc + (r.executionTimeMs || 0), 0)}ms]\n` +
            data.results
              .map(
                (r: any, idx: number) =>
                  `Case ${idx + 1}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'} (${r.executionTimeMs}ms)\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\n${r.error ? 'Error: ' + r.error + '\n' : ''}`
              )
              .join('\n')
        );
      }
    } catch (err: any) {
      setOverallStatus('Runtime Error');
      setTerminalOutput(`Execution error:\n${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run Custom Testcase Input
  const handleRunCustom = async () => {
    setIsRunning(true);
    setConsoleTab('terminal');
    setConsoleExpanded(true);
    setTerminalOutput(`[Executing with custom input on stdin...]\n`);

    try {
      const res = await fetch('/api/coding-assessment/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          customInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      const r = data.result;
      setExecutionTime(r.executionTimeMs);
      setTerminalOutput(
        `--- Standard Output ---\n${r.stdout || '(no output)'}\n\n` +
          (r.stderr ? `--- Standard Error ---\n${r.stderr}\n\n` : '') +
          `Process exited with code ${r.exitCode} in ${r.executionTimeMs}ms`
      );
    } catch (err: any) {
      setTerminalOutput(`Execution error:\n${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code against all test cases
  const handleSubmit = async () => {
    if (isLocked) return;
    setIsSubmitting(true);
    setConsoleTab('testresult');
    setConsoleExpanded(true);

    try {
      const res = await fetch('/api/coding-assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          classroomId: assessment?.classroomId,
          studentEmail,
          studentName,
          code,
          language,
          autoSubmitted: false,
          tabSwitchCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setTestResults(data.testResults || []);
      setOverallStatus(data.status);
      fetchSubmissions();
    } catch (err: any) {
      setOverallStatus('Runtime Error');
      setTerminalOutput(`Submission error:\n${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 text-amber-400 animate-spin" />
        <p className="text-sm text-neutral-400">Loading LeetCode Assessment...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col items-center justify-center p-6">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-md text-center">
          <AlertTriangle className="size-8 text-red-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-red-400 mb-1">Assessment Not Found</h2>
          <p className="text-xs text-neutral-400 mb-4">{error || 'Unable to retrieve this coding assessment.'}</p>
          <button
            onClick={() => router.push('/classroom')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-all"
          >
            Back to Classroom
          </button>
        </div>
      </div>
    );
  }

  const sampleCases = (assessment.testCases || []).filter((tc) => !tc.isHidden);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0c] text-white font-sans overflow-hidden select-none">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TOP LEETCODE NAVBAR */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-white/[0.08] bg-[#141418] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back + Problem Title + Difficulty */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/classroom')}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
            title="Back to Classroom"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 text-black font-extrabold text-xs">
              &lt;/&gt;
            </span>
            <span className="font-semibold text-sm text-neutral-200 truncate max-w-[240px] sm:max-w-[360px]">
              {assessment.title}
            </span>
          </div>

          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border',
              assessment.difficulty === 'Easy' &&
                'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              assessment.difficulty === 'Medium' &&
                'text-amber-400 bg-amber-500/10 border-amber-500/20',
              assessment.difficulty === 'Hard' &&
                'text-rose-400 bg-rose-500/10 border-rose-500/20'
            )}
          >
            {assessment.difficulty}
          </span>
        </div>

        {/* Center: Proctoring Active & Timer */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all',
              isLocked
                ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            )}
          >
            <ShieldAlert className="size-3.5" />
            <span>
              {isLocked
                ? 'EXAM TERMINATED (Violation Recorded)'
                : 'ANTI-CHEAT ARMED: Tab switch = Auto-Submit'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a20] border border-white/5 text-xs font-mono font-medium text-neutral-300">
            <Clock className="size-3 text-amber-400" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Right: Language + Run + Submit Buttons */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            disabled={isLocked}
            onChange={(e) => handleLanguageChange(e.target.value as any)}
            className="bg-[#1c1c22] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-neutral-300 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer disabled:opacity-50"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="java">Java 21</option>
          </select>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting || isLocked}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22222a] hover:bg-[#2c2c36] text-neutral-200 text-xs font-semibold border border-white/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 text-amber-400 fill-amber-400" />}
            <span>Run</span>
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting || isLocked}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5 stroke-[3]" />
            )}
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MAIN TWO-PANE LEETCODE WORKSPACE */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ── LEFT PANE: Problem Description & Past Submissions ── */}
        <div className="w-full md:w-[45%] lg:w-[42%] flex flex-col border-r border-white/[0.08] bg-[#101014] overflow-hidden">
          {/* Sub-tabs header */}
          <div className="h-10 border-b border-white/[0.06] bg-[#141418] flex items-center px-4 gap-4 shrink-0">
            <button
              onClick={() => setLeftTab('description')}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold h-full border-b-2 transition-all',
                leftTab === 'description'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              )}
            >
              <FileCode className="size-3.5" />
              <span>Description</span>
            </button>
            <button
              onClick={() => setLeftTab('submissions')}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold h-full border-b-2 transition-all',
                leftTab === 'submissions'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              )}
            >
              <Clock className="size-3.5" />
              <span>Submissions ({submissionsList.length})</span>
            </button>
          </div>

          {/* Left Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300">
            {leftTab === 'description' ? (
              <>
                {/* Title & tags */}
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">{assessment.title}</h1>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.tags?.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/5 text-[11px] text-neutral-400 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Formatted Markdown Problem Description */}
                <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                  {assessment.description}
                </div>

                {/* Anti-cheat notice banner */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
                  <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Strict Proctoring Enforcement</span>
                    <span>
                      Do not switch tabs, minimize the browser window, or open developer tools.
                      Any focus loss will immediately trigger auto-submission of your current code
                      and flag your attempt on your instructor&apos;s live proctoring dashboard.
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* ── Submissions History Tab ── */
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white mb-2">Past Submission Attempts</h3>
                {submissionsList.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-6 text-center">
                    No submissions yet. Write your code and click Submit.
                  </p>
                ) : (
                  submissionsList.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-md border',
                            sub.status === 'Accepted' &&
                              'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                            sub.status === 'Wrong Answer' &&
                              'text-rose-400 bg-rose-500/10 border-rose-500/20',
                            sub.status.includes('Auto-Submitted') &&
                              'text-red-400 bg-red-500/20 border-red-500/40'
                          )}
                        >
                          {sub.status}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {new Date(sub.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span>
                          Passed: {sub.passedTestCases}/{sub.totalTestCases} test cases
                        </span>
                        <span className="font-mono text-[11px]">{sub.language}</span>
                      </div>
                      {sub.autoSubmitted && (
                        <p className="text-[11px] text-red-400 bg-red-500/10 p-1.5 rounded-md">
                          ⚠️ Auto-submitted due to tab switch violation
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Code Editor + Terminal Console Drawer ── */}
        <div className="w-full md:w-[55%] lg:w-[58%] flex flex-col bg-[#141418] overflow-hidden relative">
          {/* Editor Header Bar */}
          <div className="h-10 border-b border-white/[0.06] bg-[#18181e] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
              <Code2 className="size-3.5 text-amber-400" />
              <span>
                Solution.{language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCode}
                disabled={isLocked}
                title="Reset to default starter code"
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-all disabled:opacity-40"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Code Textarea Editor with Line Numbers */}
          <div className="flex-1 relative flex overflow-hidden bg-[#121216]">
            {/* Line numbers gutter */}
            <div className="w-12 bg-[#101014] border-r border-white/5 py-4 flex flex-col items-center select-none text-[12px] font-mono text-neutral-600">
              {Array.from({ length: Math.max(code.split('\n').length, 25) }).map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editable code area */}
            <textarea
              value={code}
              disabled={isLocked}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  setCode(code.substring(0, start) + '    ' + code.substring(end));
                  setTimeout(() => {
                    const el = e.target as HTMLTextAreaElement;
                    el.selectionStart = el.selectionEnd = start + 4;
                  }, 0);
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className={cn(
                'flex-1 p-4 bg-transparent text-neutral-200 font-mono text-xs leading-6 resize-none focus:outline-none overflow-y-auto selection:bg-amber-400/20 whitespace-pre',
                isLocked && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="Type your code solution here..."
            />

            {/* Editor locked banner */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="size-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-3">
                  <ShieldAlert className="size-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Editor Locked</h3>
                <p className="text-xs text-neutral-400 max-w-sm mb-4">
                  Assessment has been submitted. Academic integrity rules prevent further code editing.
                </p>
                <button
                  onClick={() => router.push('/classroom')}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition-all"
                >
                  Return to Classroom Hub
                </button>
              </div>
            )}
          </div>

          {/* ── BOTTOM DRAWER: Testcase / Test Result / Terminal ── */}
          <div
            className={cn(
              'border-t border-white/[0.08] bg-[#141418] flex flex-col transition-all duration-300',
              consoleExpanded ? 'h-64' : 'h-10'
            )}
          >
            {/* Drawer Header Tabs */}
            <div className="h-10 bg-[#16161c] px-4 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setConsoleTab('testcase');
                    setConsoleExpanded(true);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-md transition-all',
                    consoleTab === 'testcase'
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  )}
                >
                  <CheckCircle2 className="size-3" />
                  <span>Testcase</span>
                </button>

                <button
                  onClick={() => {
                    setConsoleTab('testresult');
                    setConsoleExpanded(true);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-md transition-all',
                    consoleTab === 'testresult'
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  )}
                >
                  <Sparkles className="size-3 text-amber-400" />
                  <span>Test Result</span>
                  {overallStatus && (
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        overallStatus === 'Accepted'
                          ? 'bg-emerald-400'
                          : overallStatus === 'Wrong Answer'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      )}
                    />
                  )}
                </button>

                <button
                  onClick={() => {
                    setConsoleTab('terminal');
                    setConsoleExpanded(true);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-md transition-all',
                    consoleTab === 'terminal'
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  )}
                >
                  <Terminal className="size-3" />
                  <span>Terminal</span>
                </button>
              </div>

              <button
                onClick={() => setConsoleExpanded(!consoleExpanded)}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title={consoleExpanded ? 'Collapse Console' : 'Expand Console'}
              >
                {consoleExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
              </button>
            </div>

            {/* Drawer Body Content */}
            {consoleExpanded && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#101014] text-xs font-mono">
                {/* 1. Testcase Tab */}
                {consoleTab === 'testcase' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {sampleCases.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveCaseIdx(idx);
                            setCustomInput(sampleCases[idx].input);
                          }}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                            activeCaseIdx === idx
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                          )}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setActiveCaseIdx(-1)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                          activeCaseIdx === -1
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                        )}
                      >
                        Custom Input
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">
                        Input Stdin (editable):
                      </label>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        rows={3}
                        className="w-full bg-[#18181e] border border-white/10 rounded-xl p-3 text-neutral-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                      />
                    </div>

                    {activeCaseIdx >= 0 && sampleCases[activeCaseIdx] && (
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">
                          Expected Output:
                        </span>
                        <div className="bg-[#18181e] border border-white/5 rounded-xl px-3 py-2 text-neutral-300 font-mono text-xs">
                          {sampleCases[activeCaseIdx].expectedOutput}
                        </div>
                      </div>
                    )}

                    {activeCaseIdx === -1 && (
                      <button
                        onClick={handleRunCustom}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-all"
                      >
                        <Play className="size-3 fill-black" />
                        <span>Run Custom Input</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 2. Test Result Tab */}
                {consoleTab === 'testresult' && (
                  <div className="space-y-4">
                    {testResults.length === 0 ? (
                      <div className="py-8 text-center text-neutral-500 italic">
                        Click &quot;Run&quot; to test your code or &quot;Submit&quot; to evaluate all test cases.
                      </div>
                    ) : (
                      <>
                        {/* Status banner */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-lg font-extrabold',
                                overallStatus === 'Accepted' && 'text-emerald-400',
                                overallStatus === 'Wrong Answer' && 'text-rose-400',
                                overallStatus?.includes('Auto-Submitted') && 'text-red-400',
                                overallStatus === 'Runtime Error' && 'text-amber-400'
                              )}
                            >
                              {overallStatus}
                            </span>
                            {executionTime !== null && (
                              <span className="text-neutral-500 text-xs">
                                Runtime: {executionTime}ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Test case badge pills */}
                        <div className="flex flex-wrap gap-2">
                          {testResults.map((r, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border',
                                r.passed
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              )}
                            >
                              {r.passed ? (
                                <CheckCircle2 className="size-3.5" />
                              ) : (
                                <XCircle className="size-3.5" />
                              )}
                              <span>
                                Case {i + 1} {r.isHidden ? '(Hidden)' : ''}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Details of first failing or active case */}
                        {testResults.length > 0 && (
                          <div className="p-3 bg-[#16161c] rounded-xl border border-white/5 space-y-2">
                            <div>
                              <span className="text-neutral-500 text-[11px] block">Input:</span>
                              <div className="bg-[#101014] p-2 rounded text-neutral-200">
                                {testResults[0].input}
                              </div>
                            </div>
                            <div>
                              <span className="text-neutral-500 text-[11px] block">Output:</span>
                              <div className="bg-[#101014] p-2 rounded text-neutral-200">
                                {testResults[0].actual || '(no output)'}
                              </div>
                            </div>
                            <div>
                              <span className="text-neutral-500 text-[11px] block">Expected:</span>
                              <div className="bg-[#101014] p-2 rounded text-neutral-200">
                                {testResults[0].expected}
                              </div>
                            </div>
                            {testResults[0].error && (
                              <div>
                                <span className="text-red-400 text-[11px] block">Error:</span>
                                <div className="bg-red-500/10 p-2 rounded text-red-300 whitespace-pre-wrap">
                                  {testResults[0].error}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 3. Terminal Tab */}
                {consoleTab === 'terminal' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                      <Terminal className="size-3" />
                      <span>LearnX Virtual Runner Sandbox — STDOUT & STDERR</span>
                    </div>
                    <pre className="p-3 bg-[#0c0c10] border border-white/5 rounded-xl text-neutral-300 font-mono text-xs whitespace-pre-wrap leading-5">
                      {terminalOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 🚨 ANTI-CHEAT TAB SWITCH VIOLATION MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181e] border border-red-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-red-950/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />

            <div className="flex items-start gap-4 mb-4">
              <div className="size-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="size-7 text-red-400 animate-bounce" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  Tab Switch Detected — Auto-Submitted!
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  You switched browser tabs or minimized the assessment window at{' '}
                  <span className="font-semibold text-red-400 font-mono">{violationTime}</span>.
                </p>
              </div>
            </div>

            <div className="bg-[#121216] border border-white/5 rounded-2xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Student:</span>
                <span className="text-white font-medium">{studentName} ({studentEmail})</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Action Taken:</span>
                <span className="text-red-400 font-bold">Assessment Terminated & Locked</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Proctoring Alert:</span>
                <span className="text-amber-400 font-semibold">Teacher Live Notified</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 mb-6 text-center">
              Per strict classroom honor rules, your in-progress code has been captured, evaluated,
              and recorded. Your instructor can review the exact timestamp of this violation.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowViolationModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all"
              >
                Inspect Submitted Code & Results
              </button>
              <button
                onClick={() => router.push('/classroom')}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all"
              >
                Return to Classroom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
