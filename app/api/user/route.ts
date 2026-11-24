import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Instant response for demo accounts without requiring database
  if (cleanEmail === 'student@gmail.com') {
    return NextResponse.json({
      _id: 'demo-student',
      email: 'student@gmail.com',
      name: 'Student',
      role: 'student',
    }, { status: 200 });
  }

  if (cleanEmail === 'pro@gmail.com') {
    return NextResponse.json({
      _id: 'demo-professor',
      email: 'pro@gmail.com',
      name: 'Professor',
      role: 'professor',
    }, { status: 200 });
  }

  const defaultRole = (cleanEmail.includes('prof') || cleanEmail.startsWith('pro@') || cleanEmail.includes('teacher') || cleanEmail === 'lavjeet1@gmail.com') ? 'professor' : 'student';

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: defaultRole,
      }, { status: 200 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (_error) {
    return NextResponse.json({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: defaultRole,
    }, { status: 200 });
  }
}

