export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CodingAssessment from '@/models/CodingAssessment';
import { inMemoryCodingAssessments } from '@/lib/inMemoryStore';
import { CODING_PROBLEM_PRESETS } from '@/lib/codingPresets';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        const assessment = await CodingAssessment.findById(id).lean();
        if (assessment) {
          return NextResponse.json(assessment);
        }
      } catch (dbErr) {
        console.warn('MongoDB get assessment error:', dbErr);
      }
    }

    // In-memory fallback
    const found = inMemoryCodingAssessments.find((a) => a._id === id);
    if (found) {
      return NextResponse.json(found);
    }

    // Fallback preset if matching preset ID
    const preset = CODING_PROBLEM_PRESETS.find((p) => p.id === id);
    if (preset) {
      return NextResponse.json({
        _id: preset.id,
        classroomId: 'demo',
        title: preset.title,
        description: preset.description,
        difficulty: preset.difficulty,
        tags: preset.tags,
        starterCode: preset.starterCode,
        testCases: preset.testCases,
        tabSwitchLimit: 1,
        timeLimitMinutes: 45,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Get assessment error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
