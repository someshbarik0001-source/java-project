import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (!genAI) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface AnalysisResult {
  topic: string;
  weakConcepts: string[];
  confidenceScore: number;
  aiFeedback: string;
}

const SYSTEM_PROMPT = `You are an educational AI analyst. Analyze the student's academic content and return a JSON object with:
- topic: The specific academic topic/concept being asked about or submitted (1 concise phrase, e.g. "Binary Search Trees", "Pointer Arithmetic", "Photosynthesis")
- weakConcepts: Array of 2-4 specific sub-concepts the student seems to struggle with (each max 4 words)
- confidenceScore: Integer 0-100 estimating the student's understanding (0=completely lost, 50=partial, 100=fully understands)
- aiFeedback: 1-2 sentence constructive observation about the student's understanding gap

Return ONLY valid JSON, no markdown, no explanation.`;

export async function analyzeStudentContent(content: string): Promise<AnalysisResult> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `${SYSTEM_PROMPT}\n\nStudent content:\n"${content}"`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;

    return {
      topic: parsed.topic || 'General',
      weakConcepts: Array.isArray(parsed.weakConcepts) ? parsed.weakConcepts.slice(0, 4) : [],
      confidenceScore: Math.max(0, Math.min(100, Number(parsed.confidenceScore) || 50)),
      aiFeedback: parsed.aiFeedback || '',
    };
  } catch (err) {
    console.error('Gemini analysis error:', err);
    // Fallback — don't block the main flow
    return {
      topic: 'General',
      weakConcepts: [],
      confidenceScore: 50,
      aiFeedback: 'Analysis unavailable.',
    };
  }
}

const SUMMARY_PROMPT = `You are an expert Academic Data Analyst. A professor is relying on you to generate an insightful performance report based on student interaction data. Use the input data to produce a report in the following EXACT Markdown format. Be professional, supportive, and highly specific.

---

## 📊 Executive Summary
A 2-3 sentence overview of the class's overall progress. Mention the current phase (Developing/Progressing/Strong), average engagement, and overall trend.

## ⚠️ Weak Areas & Misconceptions
Identify patterns from the list of student questions and weak concepts. Group similar issues together. If multiple students struggle with the same concept, flag it clearly.

- **[Concept Name]**: [Brief explanation of the misconception and how many students are affected]

## 📚 Topics for Revision
Based on question volume and low confidence scores, the top topics the professor should re-teach are:

1. [Topic 1] — [Why it needs revision]
2. [Topic 2] — [Why it needs revision]
3. [Topic 3] — [Why it needs revision]

## 🚀 Actionable Improvement Plan
Two specific strategies the professor can use to help students move from "Developing" to "Proficient":

1. **[Strategy Name]**: [Specific, actionable description]
2. **[Strategy Name]**: [Specific, actionable description]

---

IMPORTANT: Return ONLY the Markdown content above. Do not add any preamble or closing remarks outside the defined sections. If data is insufficient for a topic, state "Insufficient data for individual feedback."`;

export async function generateClassroomSummary(topicsData: string): Promise<string> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `${SUMMARY_PROMPT}\n\n---\n**Class Performance Data:**\n${topicsData}`;
    const result = await model.generateContent(prompt);
    
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini classroom summary error:', err);
    return "## 📊 Executive Summary\n\nThe AI summary is currently unavailable. Please review the charts below to identify areas where your students may need additional revision.";
  }
}

export interface AssistantContext {
  role?: 'student' | 'professor';
  userName?: string;
  userEmail?: string;
  activeClassroom?: {
    _id?: string;
    name?: string;
    subject?: string;
    code?: string;
    professorName?: string;
    students?: string[];
  } | null;
  classrooms?: Array<{
    _id?: string;
    name?: string;
    subject?: string;
    code?: string;
    students?: string[];
  }>;
  classAnalyticsSummary?: string;
  extraContext?: string;
}

export async function generateAssistantResponse(
  prompt: string,
  mode: 'chat' | 'voice' = 'chat',
  context?: AssistantContext
): Promise<string> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const isProf = context?.role === 'professor';
    const userName = context?.userName || (isProf ? 'Professor' : 'Student');

    let roleInstructions = '';
    if (isProf) {
      roleInstructions = `You are Learn X Professor Copilot & Teaching Assistant for ${userName}.
Your goals:
- Help the professor manage, understand, and optimize their classrooms and teaching.
- Provide direct, accurate details about their classrooms (such as subjects, classroom codes, enrolled students count, weak areas) based on the provided context.
- Assist with pedagogical tasks: creating interactive quiz/exam questions, lesson plans, lecture summaries, homework assignments, rubric criteria, and drafting classroom announcements.
- Analyze student learning trends, misconceptions, and suggested revision strategies when asked.
- Be professional, highly knowledgeable, and proactively helpful.`;
    } else {
      roleInstructions = `You are Learn X Academic Tutor & Study Companion for ${userName}.
Your goals:
- Guide the student through coursework, concepts, doubts, homework problems, and exam revision.
- Explain concepts step-by-step with intuitive analogies and clear examples.
- When helping with assignments or problems, explain the underlying logic rather than just giving a raw answer without explanation.
- Be encouraging, patient, clear, and supportive.`;
    }

    if (mode === 'voice') {
      roleInstructions += `\nVOICE MODE: Keep answers concise (2-4 sentences max), conversational, and formatted naturally to be spoken aloud. Avoid markdown symbols, asterisks, tables, or long bullet lists.`;
    }

    let contextSection = '';
    if (context) {
      const parts: string[] = [];
      if (context.activeClassroom) {
        parts.push(`Current Active Classroom: "${context.activeClassroom.name}" (Subject: ${context.activeClassroom.subject}, Code: ${context.activeClassroom.code}, Enrolled Students: ${context.activeClassroom.students?.length || 0})`);
      }
      if (context.classrooms && context.classrooms.length > 0) {
        const classList = context.classrooms.map(c => `- "${c.name}" | Subject: ${c.subject} | Code: ${c.code} | ${c.students?.length || 0} students enrolled`).join('\n');
        parts.push(`User's Classrooms:\n${classList}`);
      }
      if (context.classAnalyticsSummary) {
        parts.push(`Classroom Analytics / Student Performance Summary:\n${context.classAnalyticsSummary}`);
      }
      if (context.extraContext) {
        parts.push(`Additional Classroom Data:\n${context.extraContext}`);
      }
      if (parts.length > 0) {
        contextSection = `\n\n--- REAL-TIME CLASSROOM CONTEXT ---\n${parts.join('\n\n')}\n-----------------------------------\n`;
      }
    }

    const fullPrompt = `${roleInstructions}${contextSection}\n\nUser Question:\n"${prompt}"`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini assistant response error:', err);
    if (context?.role === 'professor') {
      return `Here is a helpful summary for your classroom: You can view real-time student activity, manage assignments, or review concept analytics directly from your dashboard. Let me know if you would like me to generate quiz ideas or draft announcements!`;
    }
    return `Here is a helpful breakdown on "${prompt}": It is an important concept in your studies. Feel free to ask more specific questions or try voice/camera analysis!`;
  }
}

export async function generateVisionResponse(
  prompt: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  context?: AssistantContext
): Promise<string> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const isProf = context?.role === 'professor';

    const systemPrompt = isProf
      ? `You are Learn X Professor Copilot. The professor has captured a frame from their camera (whiteboard, textbook, student assignment, diagram, or slides). Analyze what is visible, extract key content, and answer the professor's request: "${prompt}". Provide teaching insights, verification of formulas/solutions, or summary notes.`
      : `You are Learn X Student AI Tutor. The student has captured a frame from their camera (handwritten notes, textbook diagram, exam question, or problem on paper). Break down what is in view step-by-step and provide clear, high-yield guidance answering: "${prompt}".`;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ]);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini vision analysis error:', err);
    return `I received your camera frame. Ensure the camera has good lighting and is focused on your question, notes, or diagram, and try asking again!`;
  }
}
