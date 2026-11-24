import { NextRequest, NextResponse } from 'next/server';
import { generateAssistantResponse, generateVisionResponse, AssistantContext } from '@/lib/gemini';
import connectToDatabase from '@/lib/mongodb';
import StudentActivity from '@/models/StudentActivity';
import Classroom from '@/models/Classroom';
import { inMemoryClassrooms } from '@/lib/inMemoryStore';

export async function POST(req: NextRequest) {
  let mode: string = 'chat';
  let role: 'student' | 'professor' = 'student';

  try {
    const body = await req.json();
    const prompt = body?.prompt;
    mode = body?.mode || 'chat';
    role = body?.role === 'professor' ? 'professor' : 'student';
    const image = body?.image;
    const mimeType = body?.mimeType;

    if (!prompt && !image) {
      return NextResponse.json({ error: 'Prompt or image is required' }, { status: 400 });
    }

    const context: AssistantContext = {
      role,
      userName: body?.userName,
      userEmail: body?.userEmail,
      activeClassroom: body?.activeClassroom,
      classrooms: body?.classrooms,
      classAnalyticsSummary: body?.classAnalyticsSummary,
      extraContext: body?.extraContext,
    };

    // If professor and no classrooms passed in body, try to load from DB / memory
    if (role === 'professor' && (!context.classrooms || context.classrooms.length === 0) && body?.userEmail) {
      try {
        const db = await connectToDatabase();
        if (db) {
          const dbClasses = await Classroom.find({ professorEmail: body.userEmail }).lean();
          if (dbClasses && dbClasses.length > 0) {
            context.classrooms = dbClasses.map((c: any) => ({
              _id: c._id?.toString(),
              name: c.name,
              subject: c.subject,
              code: c.code,
              students: c.students || [],
            }));
          }
        }
        if (!context.classrooms || context.classrooms.length === 0) {
          context.classrooms = inMemoryClassrooms
            .filter((c) => c.professorEmail.toLowerCase() === body.userEmail.toLowerCase())
            .map((c) => ({
              _id: c._id,
              name: c.name,
              subject: c.subject,
              code: c.code,
              students: c.students || [],
            }));
        }
      } catch (err) {
        console.warn('Could not enrich professor classrooms:', err);
      }
    }

    // If activeClassroom or classroomId is provided, pull recent student activities for context
    const targetClassId = context.activeClassroom?._id || body?.classroomId;
    if (targetClassId) {
      try {
        const db = await connectToDatabase();
        if (db) {
          const recentActivities = await StudentActivity.find({ classroomId: targetClassId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          if (recentActivities && recentActivities.length > 0) {
            const summaryPoints = recentActivities.map((a: any) =>
              `- [${a.type?.toUpperCase()}] by ${a.studentName || a.studentEmail}: "${a.content?.slice(0, 100)}" | Topic: ${a.topic} | Weak concepts: ${a.weakConcepts?.join(', ') || 'None'} | Understanding score: ${a.confidenceScore}%`
            );
            context.extraContext = `Recent student activities in this classroom:\n${summaryPoints.join('\n')}`;
          }
        }
      } catch (err) {
        console.warn('Could not enrich classroom activities:', err);
      }
    }

    if (mode === 'vision' && image) {
      const defaultVisionPrompt = role === 'professor'
        ? 'Analyze this camera frame. Extract key equations, notes, or student work and provide teaching insights or corrections.'
        : 'Analyze what you see and explain the educational concept, problem, or notes shown in this camera frame.';

      const visionPrompt = prompt?.trim() || defaultVisionPrompt;
      const answer = await generateVisionResponse(visionPrompt, image, mimeType || 'image/jpeg', context);
      return NextResponse.json({ success: true, text: answer });
    }

    const defaultChatPrompt = role === 'professor'
      ? 'How can I assist you with managing your classrooms, students, or teaching materials today?'
      : 'Hello! How can you assist my learning today?';

    const answer = await generateAssistantResponse(prompt || defaultChatPrompt, mode as 'chat' | 'voice', context);
    return NextResponse.json({ success: true, text: answer });
  } catch (error: unknown) {
    console.error('AI Assistant API error:', error);
    const fallbackText = role === 'professor'
      ? "I am your Learn X Teaching Copilot. Ask me anything about your classrooms, students, weak concept analytics, or generating quizzes and announcements!"
      : "I am your Learn X Study Companion. Ask me any question to get clear step-by-step guidance on your coursework!";
    return NextResponse.json({ success: true, text: fallbackText });
  }
}
