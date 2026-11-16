import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import { inMemoryClassrooms } from '@/lib/inMemoryStore';

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, subject, professorEmail, professorName } = body;

    if (!name || !subject) {
      return NextResponse.json({ error: 'Name and Subject are required' }, { status: 400 });
    }

    const profEmail = professorEmail || 'professor@example.com';
    const profName = professorName || 'Professor';

    let code = generateCode();

    const db = await connectToDatabase();
    if (db) {
      try {
        let attempts = 0;
        while ((await Classroom.findOne({ code })) && attempts < 10) {
          code = generateCode();
          attempts++;
        }

        const classroom = await Classroom.create({
          name,
          subject,
          code,
          professorEmail: profEmail,
          professorName: profName,
        });

        // Also sync to in-memory
        inMemoryClassrooms.unshift({
          _id: classroom._id.toString(),
          name: classroom.name,
          subject: classroom.subject,
          code: classroom.code,
          professorEmail: classroom.professorEmail,
          professorName: classroom.professorName,
          students: classroom.students || [],
          createdAt: classroom.createdAt?.toISOString() || new Date().toISOString(),
        });

        return NextResponse.json(classroom, { status: 201 });
      } catch (dbErr) {
        console.warn('MongoDB classroom create failed, using in-memory store:', dbErr);
      }
    }

    // In-memory fallback
    const fallbackClassroom = {
      _id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      subject,
      code,
      professorEmail: profEmail,
      professorName: profName,
      students: [],
      createdAt: new Date().toISOString(),
    };

    inMemoryClassrooms.unshift(fallbackClassroom);

    return NextResponse.json(fallbackClassroom, { status: 201 });
  } catch (error: any) {
    console.error('Create classroom error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
