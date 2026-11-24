export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CodingSubmission from '@/models/CodingSubmission';
import { inMemoryCodingSubmissions, inMemoryProctoringEvents } from '@/lib/inMemoryStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 });
    }

    let submissions: any[] = [];
    const db = await connectToDatabase();
    if (db) {
      try {
        submissions = await CodingSubmission.find({ assessmentId })
          .sort({ submittedAt: -1 })
          .lean();
      } catch (err) {
        console.warn('MongoDB fetch submissions error:', err);
      }
    }

    if (submissions.length === 0) {
      submissions = inMemoryCodingSubmissions.filter((s) => s.assessmentId === assessmentId);
    }

    const events = inMemoryProctoringEvents.filter((e) => e.assessmentId === assessmentId);

    const stats = {
      totalSubmissions: submissions.length,
      violationsCount: submissions.filter((s) => s.autoSubmitted || (s.tabSwitchCount && s.tabSwitchCount > 0)).length,
      passedCount: submissions.filter((s) => s.status === 'Accepted').length,
      wrongAnswerCount: submissions.filter((s) => s.status === 'Wrong Answer').length,
    };

    return NextResponse.json({
      submissions,
      events,
      stats,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Fetch submissions error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
