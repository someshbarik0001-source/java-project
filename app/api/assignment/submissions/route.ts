import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import { inMemorySubmissions } from '@/lib/inMemoryStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        const submissions = await Submission.find({ assignmentId })
          .sort({ submittedAt: -1 })
          .lean();
        if (submissions && submissions.length > 0) {
          return NextResponse.json(submissions, { status: 200 });
        }
      } catch (dbErr) {
        console.warn('MongoDB list submissions error:', dbErr);
      }
    }

    const memSubmissions = inMemorySubmissions.filter(s => s.assignmentId === assignmentId);
    return NextResponse.json(memSubmissions, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('List submissions error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
