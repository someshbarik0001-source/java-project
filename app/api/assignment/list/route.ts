import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import { inMemoryAssignments } from '@/lib/inMemoryStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        const assignments = await Assignment.find({ classroomId })
          .sort({ createdAt: -1 })
          .lean();
        if (assignments && assignments.length > 0) {
          return NextResponse.json(assignments, { status: 200 });
        }
      } catch (dbErr) {
        console.warn('MongoDB list assignments error:', dbErr);
      }
    }

    const memAssignments = inMemoryAssignments.filter(a => a.classroomId === classroomId);
    return NextResponse.json(memAssignments, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('List assignments error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
