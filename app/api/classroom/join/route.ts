import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import { inMemoryClassrooms } from '@/lib/inMemoryStore';

export async function POST(req: Request) {
  try {
    const { code, studentEmail } = await req.json();

    if (!code || !studentEmail) {
      return NextResponse.json({ error: 'Code and student email are required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const db = await connectToDatabase();
    if (db) {
      try {
        const classroom = await Classroom.findOne({ code: cleanCode });
        if (classroom) {
          if (!classroom.students.includes(studentEmail)) {
            classroom.students.push(studentEmail);
            await classroom.save();
          }
          return NextResponse.json(classroom, { status: 200 });
        }
      } catch (dbErr) {
        console.warn('MongoDB join error, falling back to in-memory:', dbErr);
      }
    }

    // In-memory fallback
    const memClassroom = inMemoryClassrooms.find(c => c.code.toUpperCase() === cleanCode);
    if (memClassroom) {
      if (!memClassroom.students.includes(studentEmail)) {
        memClassroom.students.push(studentEmail);
      }
      return NextResponse.json(memClassroom, { status: 200 });
    }

    return NextResponse.json({ error: 'Classroom not found. Check the code and try again.' }, { status: 404 });
  } catch (error: any) {
    console.error('Join classroom error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
