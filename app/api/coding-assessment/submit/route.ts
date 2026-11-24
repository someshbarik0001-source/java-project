export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CodingAssessment from '@/models/CodingAssessment';
import CodingSubmission from '@/models/CodingSubmission';
import {
  inMemoryCodingAssessments,
  inMemoryCodingSubmissions,
  inMemoryProctoringEvents,
} from '@/lib/inMemoryStore';
import { evaluateTestCases } from '@/lib/codeRunner';
import { CODING_PROBLEM_PRESETS } from '@/lib/codingPresets';

export async function POST(req: NextRequest) {
  try {
    const {
      assessmentId,
      classroomId,
      studentEmail,
      studentName,
      code,
      language = 'javascript',
      autoSubmitted = false,
      autoSubmitReason = '',
      tabSwitchCount = 0,
    } = await req.json();

    if (!assessmentId || !studentEmail) {
      return NextResponse.json(
        { error: 'assessmentId and studentEmail are required' },
        { status: 400 }
      );
    }

    // 1. Fetch the full assessment with all test cases (including hidden)
    let testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }> = [];
    let resolvedClassroomId = classroomId;

    const db = await connectToDatabase();
    if (db) {
      try {
        const asg = await CodingAssessment.findById(assessmentId).lean();
        if (asg) {
          testCases = asg.testCases || [];
          resolvedClassroomId = resolvedClassroomId || asg.classroomId?.toString();
        }
      } catch (err) {
        console.warn('MongoDB assessment lookup error:', err);
      }
    }

    if (testCases.length === 0) {
      const memAsg = inMemoryCodingAssessments.find((a) => a._id === assessmentId);
      if (memAsg) {
        testCases = memAsg.testCases || [];
        resolvedClassroomId = resolvedClassroomId || memAsg.classroomId;
      }
    }

    if (testCases.length === 0) {
      const preset = CODING_PROBLEM_PRESETS.find((p) => p.id === assessmentId);
      if (preset) {
        testCases = preset.testCases;
        resolvedClassroomId = resolvedClassroomId || 'demo';
      }
    }

    // 2. Evaluate code against all test cases
    const evaluation = await evaluateTestCases(language, code || '', testCases);

    let status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Auto-Submitted (Tab Switch Violation)' =
      evaluation.overallStatus;

    if (autoSubmitted) {
      status = 'Auto-Submitted (Tab Switch Violation)';
    }

    const submissionData = {
      assessmentId,
      classroomId: resolvedClassroomId,
      studentEmail,
      studentName: studentName || studentEmail.split('@')[0],
      code: code || '',
      language,
      status,
      passedTestCases: evaluation.passedTestCases,
      totalTestCases: evaluation.totalTestCases,
      testResults: evaluation.results,
      tabSwitchCount: autoSubmitted ? Math.max(1, tabSwitchCount) : tabSwitchCount,
      tabSwitchedAt: autoSubmitted ? new Date() : undefined,
      autoSubmitted: !!autoSubmitted,
      autoSubmitReason: autoSubmitted
        ? autoSubmitReason || 'Tab switch detected during assessment'
        : '',
      submittedAt: new Date(),
    };

    // 3. Persist to MongoDB if available (upsert submission)
    if (db) {
      try {
        const saved = await CodingSubmission.findOneAndUpdate(
          { assessmentId, studentEmail },
          submissionData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Update in-memory
        const idx = inMemoryCodingSubmissions.findIndex(
          (s) => s.assessmentId === assessmentId && s.studentEmail === studentEmail
        );
        const memEntry = {
          _id: saved._id.toString(),
          ...submissionData,
          tabSwitchedAt: submissionData.tabSwitchedAt?.toISOString(),
          submittedAt: submissionData.submittedAt.toISOString(),
        };

        if (idx >= 0) {
          inMemoryCodingSubmissions[idx] = memEntry as any;
        } else {
          inMemoryCodingSubmissions.unshift(memEntry as any);
        }

        if (autoSubmitted) {
          inMemoryProctoringEvents.unshift({
            _id: `evt_${Date.now()}`,
            assessmentId,
            classroomId: resolvedClassroomId,
            studentEmail,
            studentName: submissionData.studentName,
            action: 'tab_switched',
            details: `Auto-submitted due to tab switch violation. Code evaluated: ${evaluation.passedTestCases}/${evaluation.totalTestCases} test cases passed.`,
            timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json(saved, { status: 201 });
      } catch (dbErr) {
        console.warn('MongoDB submission save error:', dbErr);
      }
    }

    // 4. In-memory fallback
    const fallbackId = `csub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const memEntry = {
      _id: fallbackId,
      ...submissionData,
      tabSwitchedAt: submissionData.tabSwitchedAt?.toISOString(),
      submittedAt: submissionData.submittedAt.toISOString(),
    };

    const idx = inMemoryCodingSubmissions.findIndex(
      (s) => s.assessmentId === assessmentId && s.studentEmail === studentEmail
    );
    if (idx >= 0) {
      inMemoryCodingSubmissions[idx] = memEntry as any;
    } else {
      inMemoryCodingSubmissions.unshift(memEntry as any);
    }

    if (autoSubmitted) {
      inMemoryProctoringEvents.unshift({
        _id: `evt_${Date.now()}`,
        assessmentId,
        classroomId: resolvedClassroomId,
        studentEmail,
        studentName: submissionData.studentName,
        action: 'tab_switched',
        details: `Auto-submitted due to tab switch violation. Code evaluated: ${evaluation.passedTestCases}/${evaluation.totalTestCases} test cases passed.`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(memEntry, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Submit coding assessment error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
