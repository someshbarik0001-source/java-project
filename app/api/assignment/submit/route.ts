import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Assignment from '@/models/Assignment';
import { analyzeStudentContent } from '@/lib/gemini';
import StudentActivity from '@/models/StudentActivity';
import { inMemorySubmissions, inMemoryAssignments } from '@/lib/inMemoryStore';

export async function POST(req: NextRequest) {
  try {
    const { assignmentId, studentEmail, studentName, attachments } = await req.json();

    if (!assignmentId || !studentEmail) {
      return NextResponse.json({ error: 'assignmentId and studentEmail are required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        // Upsert — allow re-submission (replaces old one)
        const submission = await Submission.findOneAndUpdate(
          { assignmentId, studentEmail },
          {
            studentName: studentName || '',
            attachments: attachments || [],
            submittedAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Fire AI analysis in background (non-blocking)
        void (async () => {
          try {
            const assignment = await Assignment.findById(assignmentId).lean();
            if (!assignment) return;

            const fileNames = (attachments || []).map((a: { fileName: string }) => a.fileName).join(', ');
            const contentForAnalysis = `Assignment: "${assignment.title}"\nDescription: ${assignment.description || 'None'}\nSubmitted files: ${fileNames || 'No files'}`;

            const analysis = await analyzeStudentContent(contentForAnalysis);

            await StudentActivity.findOneAndUpdate(
              { classroomId: assignment.classroomId, studentEmail, type: 'submission', content: { $regex: assignment.title } },
              {
                classroomId: assignment.classroomId,
                studentEmail,
                studentName: studentName || '',
                type: 'submission',
                content: contentForAnalysis,
                topic: analysis.topic,
                weakConcepts: analysis.weakConcepts,
                confidenceScore: analysis.confidenceScore,
                aiFeedback: analysis.aiFeedback,
                createdAt: new Date(),
              },
              { upsert: true, new: true }
            );
          } catch (err) {
            console.error('Background AI analysis error (submission):', err);
          }
        })();

        return NextResponse.json(submission, { status: 201 });
      } catch (dbErr) {
        console.warn('MongoDB submit error:', dbErr);
      }
    }

    // In-memory fallback
    const existingIdx = inMemorySubmissions.findIndex(s => s.assignmentId === assignmentId && s.studentEmail === studentEmail);
    const fallbackSubmission = {
      _id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assignmentId,
      studentEmail,
      studentName: studentName || '',
      attachments: attachments || [],
      submittedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      inMemorySubmissions[existingIdx] = fallbackSubmission;
    } else {
      inMemorySubmissions.unshift(fallbackSubmission);
    }

    return NextResponse.json(fallbackSubmission, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Submit assignment error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
