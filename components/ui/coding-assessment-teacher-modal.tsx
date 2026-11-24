'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Users,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Sparkles,
  FileCode,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CODING_PROBLEM_PRESETS, CodingProblemPreset } from '@/lib/codingPresets';

interface Classroom {
  _id: string;
  name: string;
  subject: string;
  code: string;
  students: string[];
}

interface AssessmentItem {
  _id: string;
  classroomId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
  createdAt: string;
}

interface SubmissionItem {
  _id: string;
  studentEmail: string;
  studentName: string;
  code: string;
  language: string;
  status: string;
  passedTestCases: number;
  totalTestCases: number;
  tabSwitchCount: number;
  tabSwitchedAt?: string;
  autoSubmitted: boolean;
  autoSubmitReason?: string;
  submittedAt: string;
  testResults: any[];
}

interface ProctoringStats {
  totalSubmissions: number;
  violationsCount: number;
  passedCount: number;
  wrongAnswerCount: number;
}

export function TeacherCodingTab({ classroom }: { classroom: Classroom }) {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assessment states
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('two-sum');
  const [isCustom, setIsCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customDiff, setCustomDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Live Proctoring modal states
  const [activeAssessment, setActiveAssessment] = useState<AssessmentItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [stats, setStats] = useState<ProctoringStats | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Inspect student submission modal
  const [inspectedSub, setInspectedSub] = useState<SubmissionItem | null>(null);

  // Fetch assessments for this classroom
  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/coding-assessment/list?classroomId=${classroom._id}`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [classroom._id]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Fetch submissions for active assessment
  const fetchActiveSubmissions = useCallback(async (asgId: string) => {
    try {
      const res = await fetch(`/api/coding-assessment/submissions?assessmentId=${asgId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setStats(data.stats || null);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  // Poll submissions every 4 seconds when live proctoring modal is open
  useEffect(() => {
    if (!activeAssessment || !autoRefresh) return;
    fetchActiveSubmissions(activeAssessment._id);
    const interval = setInterval(() => {
      fetchActiveSubmissions(activeAssessment._id);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeAssessment, autoRefresh, fetchActiveSubmissions]);

  // Handle Create Assessment
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      let payload: any = { classroomId: classroom._id };

      if (!isCustom) {
        payload.presetId = selectedPresetId;
      } else {
        if (!customTitle.trim() || !customDesc.trim()) {
          throw new Error('Title and problem description are required');
        }
        payload.title = customTitle.trim();
        payload.description = customDesc.trim();
        payload.difficulty = customDiff;
        payload.tags = ['Custom Assessment'];
        payload.starterCode = {
          javascript: '// JavaScript Starter\nfunction solve(input) {\n    return input;\n}\n',
          python: '# Python Starter\ndef solve(input_data):\n    return input_data\n',
        };
        payload.testCases = [
          { input: '10', expectedOutput: '10', isHidden: false },
          { input: '25', expectedOutput: '25', isHidden: true },
        ];
      }

      const res = await fetch('/api/coding-assessment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assessment');

      setAssessments((prev) => [data, ...prev]);
      setShowCreate(false);
      setIsCustom(false);
      setCustomTitle('');
      setCustomDesc('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to post assessment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── CREATE ASSESSMENT BUTTON OR FORM ── */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 transition-all text-sm font-semibold cursor-pointer select-none"
        >
          <Plus className="size-4" />
          <span>Post New LeetCode Coding Assessment</span>
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="bg-[#181820] border border-amber-500/20 rounded-2xl p-5 shadow-xl animate-in fade-in"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-6 rounded-md bg-amber-500 text-black font-extrabold text-xs">
                &lt;/&gt;
              </span>
              <h3 className="text-white font-bold text-sm">Post Coding Assessment</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreateError('');
              }}
              className="text-neutral-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Preset Selector vs Custom */}
          <div className="flex gap-2 mb-4 bg-[#141418] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsCustom(false)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                !isCustom
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              ⚡ 1-Click Problem Presets
            </button>
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                isCustom
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              🛠️ Custom Problem Builder
            </button>
          </div>

          {!isCustom ? (
            /* Presets Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              {CODING_PROBLEM_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPresetId(p.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between',
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 text-white shadow-md shadow-amber-950/40'
                        : 'bg-[#141418] border-white/5 text-neutral-400 hover:border-white/15'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white truncate">{p.title}</span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                          p.difficulty === 'Easy'
                            ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                            : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                        )}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span>{p.testCases.length} test cases</span>
                      <span>·</span>
                      <span>{p.tags.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Problem Fields */
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Problem Title</label>
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Find Max Element in Array"
                  className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Difficulty</label>
                <select
                  value={customDiff}
                  onChange={(e) => setCustomDiff(e.target.value as any)}
                  className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Problem Description & Constraints</label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe the task, sample input/output, and constraints..."
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-sans"
                />
              </div>
            </div>
          )}

          {/* Anti-cheat banner info */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 text-xs text-red-300 flex items-center gap-2.5">
            <ShieldAlert className="size-4 shrink-0 text-red-400" />
            <span>
              <strong>Anti-Cheat Enabled:</strong> When students attempt to switch tabs or minimize
              windows, their code is auto-submitted and flagged on your live proctoring dashboard.
            </span>
          </div>

          {createError && (
            <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-2.5 mb-3">{createError}</p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            <span>Publish Assessment to Classroom</span>
          </button>
        </form>
      )}

      {/* ── ASSESSMENTS LIST ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 text-amber-400 animate-spin" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2 text-center">
          <Code2 className="size-8 text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-400">No Coding Assessments Yet</p>
          <p className="text-xs text-neutral-600 max-w-xs">
            Post a LeetCode problem above so students can test their code in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((asg) => (
            <div
              key={asg._id}
              className="bg-[#16161c] border border-white/[0.06] rounded-2xl p-4.5 hover:border-white/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{asg.title}</h4>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      asg.difficulty === 'Easy' &&
                        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      asg.difficulty === 'Medium' &&
                        'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      asg.difficulty === 'Hard' &&
                        'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    )}
                  >
                    {asg.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(asg.createdAt).toLocaleDateString()}
                  </span>
                  <span>{asg.testCases?.length || 0} Test Cases</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldAlert className="size-3" /> Anti-Cheat Active
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveAssessment(asg);
                    setLoadingSubs(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Eye className="size-3.5" />
                  <span>Live Proctoring &amp; Roster</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 🚨 LIVE PROCTORING & SUBMISSIONS MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeAssessment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#181820]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <ShieldAlert className="size-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    {activeAssessment.title}
                    <span className="text-xs font-medium text-neutral-400 font-mono">
                      (Live Proctoring)
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Real-time monitoring · Tab switches auto-submit student exams
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchActiveSubmissions(activeAssessment._id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs flex items-center gap-1.5"
                  title="Refresh now"
                >
                  <RefreshCw className="size-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={() => setActiveAssessment(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Live Metrics Row */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-white/[0.06] bg-[#121216]">
                <div className="p-3 bg-[#181820] rounded-xl border border-white/5">
                  <span className="text-[11px] text-neutral-500 block">Total Submissions</span>
                  <span className="text-xl font-extrabold text-white">
                    {stats.totalSubmissions}
                  </span>
                </div>

                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <span className="text-[11px] text-red-400 block font-semibold">
                    🚨 Tab Switch Violations
                  </span>
                  <span className="text-xl font-extrabold text-red-400">
                    {stats.violationsCount}
                  </span>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-400 block font-semibold">
                    ✅ Passed (Accepted)
                  </span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {stats.passedCount}
                  </span>
                </div>

                <div className="p-3 bg-[#181820] rounded-xl border border-white/5">
                  <span className="text-[11px] text-neutral-500 block">Needs Revision</span>
                  <span className="text-xl font-extrabold text-neutral-300">
                    {stats.wrongAnswerCount}
                  </span>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingSubs ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-7 text-amber-400 animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <Users className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No submissions recorded yet</p>
                  <p className="text-xs text-neutral-600">
                    When students start and submit or trigger tab switches, they appear here live.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const hasViolation = sub.autoSubmitted || (sub.tabSwitchCount && sub.tabSwitchCount > 0);
                    return (
                      <div
                        key={sub._id}
                        className={cn(
                          'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
                          hasViolation
                            ? 'bg-red-500/[0.07] border-red-500/30'
                            : 'bg-[#181820] border-white/5'
                        )}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{sub.studentName}</span>
                            <span className="text-xs text-neutral-500">({sub.studentEmail})</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {hasViolation ? (
                              <span className="flex items-center gap-1 text-red-400 font-bold bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-md">
                                <ShieldAlert className="size-3" />
                                TAB SWITCH DETECTED — AUTO-SUBMITTED
                              </span>
                            ) : sub.status === 'Accepted' ? (
                              <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="size-3" />
                                Accepted
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                                <XCircle className="size-3" />
                                {sub.status}
                              </span>
                            )}

                            <span className="text-neutral-400">
                              Score: {sub.passedTestCases}/{sub.totalTestCases} tests passed
                            </span>

                            <span className="text-neutral-500">
                              Submitted at {new Date(sub.submittedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        {/* Inspect Button */}
                        <button
                          onClick={() => setInspectedSub(sub)}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
                        >
                          Inspect Code Snapshot
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 INSPECT STUDENT CODE SNAPSHOT MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {inspectedSub && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/15 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#16161e]">
              <div>
                <h3 className="text-white font-bold text-sm">
                  Student Submission: {inspectedSub.studentName}
                </h3>
                <p className="text-xs text-neutral-400">
                  {inspectedSub.studentEmail} · Language: {inspectedSub.language}
                </p>
              </div>
              <button
                onClick={() => setInspectedSub(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {inspectedSub.autoSubmitted && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-3">
                  <ShieldAlert className="size-5 shrink-0 text-red-400" />
                  <div>
                    <span className="font-bold block">Tab Switch Violation Flagged</span>
                    <span>
                      This code was frozen and auto-submitted at{' '}
                      {new Date(inspectedSub.submittedAt).toLocaleString()} when the student left the
                      tab.
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-semibold">
                  Submitted Code Snapshot:
                </label>
                <pre className="p-4 bg-[#0a0a0c] border border-white/10 rounded-2xl text-neutral-200 font-mono text-xs overflow-x-auto leading-5 max-h-72">
                  {inspectedSub.code || '// No code submitted'}
                </pre>
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-semibold">
                  Test Case Results:
                </label>
                <div className="space-y-2">
                  {inspectedSub.testResults?.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-xl border text-xs font-mono',
                        r.passed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold">
                        <span>Case {idx + 1} {r.isHidden ? '(Hidden)' : ''}</span>
                        <span>{r.passed ? 'PASSED ✅' : 'FAILED ❌'}</span>
                      </div>
                      <div className="text-[11px] text-neutral-300 space-y-0.5">
                        <div>Input: {r.input}</div>
                        <div>Output: {r.actual}</div>
                        <div>Expected: {r.expected}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
