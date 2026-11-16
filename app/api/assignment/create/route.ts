import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import { inMemoryAssignments } from '@/lib/inMemoryStore';

export async function POST(req: NextRequest) {
  try {
    const { classroomId, title, description, dueDate, attachments } = await req.json();

    if (!classroomId || !title) {
      return NextResponse.json({ error: 'classroomId and title are required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        const assignment = await Assignment.create({
          classroomId,
          title,
          description: description || '',
          dueDate: dueDate || undefined,
          attachments: attachments || [],
        });

        inMemoryAssignments.unshift({
          _id: assignment._id.toString(),
          classroomId,
          title,
          description: description || '',
          dueDate: dueDate || undefined,
          attachments: attachments || [],
          createdAt: assignment.createdAt?.toISOString() || new Date().toISOString(),
        });

        return NextResponse.json(assignment, { status: 201 });
      } catch (dbErr) {
        console.warn('MongoDB assignment create error:', dbErr);
      }
    }

    const fallbackAssignment = {
      _id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      classroomId,
      title,
      description: description || '',
      dueDate: dueDate || undefined,
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
    };

    inMemoryAssignments.unshift(fallbackAssignment);

    return NextResponse.json(fallbackAssignment, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
