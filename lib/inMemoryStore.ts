export interface InMemoryClassroom {
  _id: string;
  name: string;
  subject: string;
  code: string;
  professorEmail: string;
  professorName: string;
  students: string[];
  createdAt: string;
}

export interface InMemoryAssignment {
  _id: string;
  classroomId: string;
  title: string;
  description: string;
  dueDate?: string;
  attachments: { fileName: string; filePath: string }[];
  createdAt: string;
}

export interface InMemorySubmission {
  _id: string;
  assignmentId: string;
  studentEmail: string;
  studentName: string;
  attachments: { fileName: string; filePath: string }[];
  submittedAt: string;
}

export interface InMemoryStudentActivity {
  _id: string;
  classroomId: string;
  studentEmail: string;
  studentName: string;
  type: 'question' | 'submission';
  content: string;
  topic: string;
  weakConcepts: string[];
  confidenceScore: number;
  aiFeedback: string;
  createdAt: string;
}

export interface InMemoryTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface InMemoryCodingAssessment {
  _id: string;
  classroomId: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  starterCode: {
    javascript?: string;
    python?: string;
    java?: string;
  };
  testCases: InMemoryTestCase[];
  tabSwitchLimit: number;
  timeLimitMinutes?: number;
  dueDate?: string;
  createdAt: string;
}

export interface InMemoryTestResultItem {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
  executionTimeMs: number;
  error?: string;
}

export interface InMemoryCodingSubmission {
  _id: string;
  assessmentId: string;
  classroomId: string;
  studentEmail: string;
  studentName: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Auto-Submitted (Tab Switch Violation)' | 'Pending';
  passedTestCases: number;
  totalTestCases: number;
  testResults: InMemoryTestResultItem[];
  tabSwitchCount: number;
  tabSwitchedAt?: string;
  autoSubmitted: boolean;
  autoSubmitReason?: string;
  submittedAt: string;
}

export interface InMemoryProctoringEvent {
  _id: string;
  assessmentId: string;
  classroomId: string;
  studentEmail: string;
  studentName: string;
  action: 'tab_switched' | 'focus_lost' | 'auto_submitted';
  details: string;
  timestamp: string;
}

interface GlobalMemoryStore {
  __inMemoryClassrooms?: InMemoryClassroom[];
  __inMemoryAssignments?: InMemoryAssignment[];
  __inMemorySubmissions?: InMemorySubmission[];
  __inMemoryActivities?: InMemoryStudentActivity[];
  __inMemoryCodingAssessments?: InMemoryCodingAssessment[];
  __inMemoryCodingSubmissions?: InMemoryCodingSubmission[];
  __inMemoryProctoringEvents?: InMemoryProctoringEvent[];
}

const globalStore = global as unknown as GlobalMemoryStore;

if (!globalStore.__inMemoryClassrooms) {
  globalStore.__inMemoryClassrooms = [];
}
if (!globalStore.__inMemoryAssignments) {
  globalStore.__inMemoryAssignments = [];
}
if (!globalStore.__inMemorySubmissions) {
  globalStore.__inMemorySubmissions = [];
}
if (!globalStore.__inMemoryActivities) {
  globalStore.__inMemoryActivities = [];
}
if (!globalStore.__inMemoryCodingAssessments) {
  globalStore.__inMemoryCodingAssessments = [];
}
if (!globalStore.__inMemoryCodingSubmissions) {
  globalStore.__inMemoryCodingSubmissions = [];
}
if (!globalStore.__inMemoryProctoringEvents) {
  globalStore.__inMemoryProctoringEvents = [];
}

export const inMemoryClassrooms = globalStore.__inMemoryClassrooms;
export const inMemoryAssignments = globalStore.__inMemoryAssignments;
export const inMemorySubmissions = globalStore.__inMemorySubmissions;
export const inMemoryActivities = globalStore.__inMemoryActivities;
export const inMemoryCodingAssessments = globalStore.__inMemoryCodingAssessments;
export const inMemoryCodingSubmissions = globalStore.__inMemoryCodingSubmissions;
export const inMemoryProctoringEvents = globalStore.__inMemoryProctoringEvents;
