import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import { inMemoryClassrooms } from '@/lib/inMemoryStore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const email = searchParams.get('email');

    const searchEmail = email || '';

    const db = await connectToDatabase();
    if (db) {
      try {
        let dbClassrooms = [];
        if (role === 'professor') {
          dbClassrooms = await Classroom.find(searchEmail ? { professorEmail: searchEmail } : {}).sort({ createdAt: -1 });
        } else {
          dbClassrooms = await Classroom.find(searchEmail ? { students: searchEmail } : {}).sort({ createdAt: -1 });
        }
        if (dbClassrooms && dbClassrooms.length > 0) {
          return NextResponse.json(dbClassrooms, { status: 200 });
        }
      } catch (dbErr) {
        console.warn('MongoDB list classrooms failed, using in-memory store:', dbErr);
      }
    }

    // Filter in-memory classrooms
    let results = inMemoryClassrooms;
    if (searchEmail) {
      if (role === 'professor') {
        results = inMemoryClassrooms.filter(c => c.professorEmail.toLowerCase() === searchEmail.toLowerCase());
      } else {
        results = inMemoryClassrooms.filter(c => c.students.map(s => s.toLowerCase()).includes(searchEmail.toLowerCase()));
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('List classrooms error:', error);
    return NextResponse.json(inMemoryClassrooms, { status: 200 });
  }
}
