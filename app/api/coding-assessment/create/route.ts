export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CodingAssessment from '@/models/CodingAssessment';
import { inMemoryCodingAssessments } from '@/lib/inMemoryStore';
import { CODING_PROBLEM_PRESETS } from '@/lib/codingPresets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      classroomId,
      presetId,
      title: customTitle,
      description: customDesc,
      difficulty: customDiff,
      tags: customTags,
      starterCode: customStarter,
      testCases: customTestCases,
      tabSwitchLimit = 1,
      timeLimitMinutes = 45,
      dueDate,
    } = body;

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId is required' }, { status: 400 });
    }

    let title = customTitle;
    let description = customDesc;
    let difficulty = customDiff || 'Easy';
    let tags = customTags || [];
    let starterCode = customStarter || {};
    let testCases = customTestCases || [];

    // If a preset was selected, merge preset data
    if (presetId) {
      const preset = CODING_PROBLEM_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        title = title || preset.title;
        description = description || preset.description;
        difficulty = difficulty || preset.difficulty;
        tags = tags.length > 0 ? tags : preset.tags;
        starterCode = Object.keys(starterCode).length > 0 ? starterCode : preset.starterCode;
        testCases = testCases.length > 0 ? testCases : preset.testCases;
      }
    }

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        const assessment = await CodingAssessment.create({
          classroomId,
          title,
          description,
          difficulty,
          tags,
          starterCode,
          testCases,
          tabSwitchLimit: tabSwitchLimit ?? 1,
          timeLimitMinutes: timeLimitMinutes ?? 45,
          dueDate: dueDate || undefined,
        });

        inMemoryCodingAssessments.unshift({
          _id: assessment._id.toString(),
          classroomId,
          title,
          description,
          difficulty,
          tags,
          starterCode,
          testCases,
          tabSwitchLimit: tabSwitchLimit ?? 1,
          timeLimitMinutes: timeLimitMinutes ?? 45,
          dueDate: dueDate || undefined,
          createdAt: assessment.createdAt?.toISOString() || new Date().toISOString(),
        });

        return NextResponse.json(assessment, { status: 201 });
      } catch (dbErr) {
        console.warn('MongoDB coding assessment create error:', dbErr);
      }
    }

    // In-memory fallback
    const fallbackAssessment = {
      _id: `code_asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      classroomId,
      title,
      description,
      difficulty,
      tags,
      starterCode,
      testCases,
      tabSwitchLimit: tabSwitchLimit ?? 1,
      timeLimitMinutes: timeLimitMinutes ?? 45,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    inMemoryCodingAssessments.unshift(fallbackAssessment);

    return NextResponse.json(fallbackAssessment, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Create coding assessment error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
