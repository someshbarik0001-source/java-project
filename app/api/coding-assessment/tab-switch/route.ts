export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CodingSubmission from '@/models/CodingSubmission';
import { inMemoryCodingSubmissions, inMemoryProctoringEvents } from '@/lib/inMemoryStore';

export async function POST(req: NextRequest) {
  try {
    const {
      assessmentId,
      classroomId,
      studentEmail,
      studentName,
      action = 'tab_switched',
    } = await req.json();

    if (!assessmentId || !studentEmail) {
      return NextResponse.json(
        { error: 'assessmentId and studentEmail are required' },
        { status: 400 }
      );
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const event = {
      _id: eventId,
      assessmentId,
      classroomId: classroomId || '',
      studentEmail,
      studentName: studentName || studentEmail.split('@')[0],
      action: (action as any) || 'tab_switched',
      details: 'Student switched browser tab or lost window focus during active assessment.',
      timestamp: new Date().toISOString(),
    };

    inMemoryProctoringEvents.unshift(event);

    const db = await connectToDatabase();
    if (db) {
      try {
        await CodingSubmission.findOneAndUpdate(
          { assessmentId, studentEmail },
          {
            $inc: { tabSwitchCount: 1 },
            $set: {
              status: 'Auto-Submitted (Tab Switch Violation)',
              autoSubmitted: true,
              autoSubmitReason: 'Tab switch detected during assessment',
              tabSwitchedAt: new Date(),
            },
          },
          { upsert: false }
        );
      } catch (err) {
        console.warn('MongoDB tab switch log error:', err);
      }
    }

    // Also update in-memory submission if present
    const existing = inMemoryCodingSubmissions.find(
      (s) => s.assessmentId === assessmentId && s.studentEmail === studentEmail
    );
    if (existing) {
      existing.tabSwitchCount = (existing.tabSwitchCount || 0) + 1;
      existing.status = 'Auto-Submitted (Tab Switch Violation)';
      existing.autoSubmitted = true;
      existing.autoSubmitReason = 'Tab switch detected during assessment';
      existing.tabSwitchedAt = new Date().toISOString();
    }

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Tab switch alert error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
