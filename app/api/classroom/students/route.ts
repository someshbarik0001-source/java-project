import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import User from '@/models/User';
import { inMemoryClassrooms } from '@/lib/inMemoryStore';

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
        const classroom = await Classroom.findById(classroomId);
        if (classroom) {
          const students = await User.find(
            { email: { $in: classroom.students } },
            { email: 1, name: 1, registrationNumber: 1, course: 1, section: 1, createdAt: 1 }
          ).lean();
          return NextResponse.json(students, { status: 200 });
        }
      } catch (dbErr) {
        console.warn('MongoDB student list error:', dbErr);
      }
    }

    const memClassroom = inMemoryClassrooms.find(c => c._id === classroomId);
    if (memClassroom) {
      const fallbackStudents = memClassroom.students.map(email => ({
        _id: email,
        email,
        name: email.split('@')[0],
        registrationNumber: 'AP25XXXXXX',
        course: 'Computer Science',
        section: 'A',
      }));
      return NextResponse.json(fallbackStudents, { status: 200 });
    }

    return NextResponse.json([], { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Student details API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
