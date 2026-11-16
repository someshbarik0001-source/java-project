export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CodingAssessment from '@/models/CodingAssessment';
import { inMemoryCodingAssessments } from '@/lib/inMemoryStore';
import { CODING_PROBLEM_PRESETS } from '@/lib/codingPresets';

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
        let assessments = await CodingAssessment.find({ classroomId }).sort({ createdAt: -1 }).lean();

        // If none exist, seed default preset so classroom is ready to test immediately
        if (assessments.length === 0) {
          const defaultPreset = CODING_PROBLEM_PRESETS[0]; // Two Sum
          const seeded = await CodingAssessment.create({
            classroomId,
            title: defaultPreset.title,
            description: defaultPreset.description,
            difficulty: defaultPreset.difficulty,
            tags: defaultPreset.tags,
            starterCode: defaultPreset.starterCode,
            testCases: defaultPreset.testCases,
            tabSwitchLimit: 1,
            timeLimitMinutes: 45,
          });

          inMemoryCodingAssessments.unshift({
            _id: seeded._id.toString(),
            classroomId,
            title: seeded.title,
            description: seeded.description,
            difficulty: seeded.difficulty,
            tags: seeded.tags,
            starterCode: seeded.starterCode,
            testCases: seeded.testCases,
            tabSwitchLimit: 1,
            timeLimitMinutes: 45,
            createdAt: seeded.createdAt?.toISOString() || new Date().toISOString(),
          });

          assessments = [seeded.toObject()];
        }

        return NextResponse.json(assessments);
      } catch (dbErr) {
        console.warn('MongoDB coding assessment list error:', dbErr);
      }
    }

    // In-memory fallback
    let matches = inMemoryCodingAssessments.filter((a) => a.classroomId === classroomId);

    if (matches.length === 0) {
      const defaultPreset = CODING_PROBLEM_PRESETS[0];
      const seeded = {
        _id: `code_asg_${Date.now()}_default`,
        classroomId,
        title: defaultPreset.title,
        description: defaultPreset.description,
        difficulty: defaultPreset.difficulty,
        tags: defaultPreset.tags,
        starterCode: defaultPreset.starterCode,
        testCases: defaultPreset.testCases,
        tabSwitchLimit: 1,
        timeLimitMinutes: 45,
        createdAt: new Date().toISOString(),
      };
      inMemoryCodingAssessments.unshift(seeded);
      matches = [seeded];
    }

    return NextResponse.json(matches);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('List coding assessments error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
