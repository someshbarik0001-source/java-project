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
  globalStore.__inMemoryClassrooms = [
    {
      _id: 'cls_demo_cs101',
      name: 'CS101: Data Structures & Algorithms',
      subject: 'Computer Science',
      code: 'CS101',
      professorEmail: 'pro@gmail.com',
      professorName: 'Professor',
      students: ['student@gmail.com'],
      createdAt: new Date().toISOString(),
    }
  ];
}
if (!globalStore.__inMemoryAssignments) {
  globalStore.__inMemoryAssignments = [
    {
      _id: 'asg_demo_101',
      classroomId: 'cls_demo_cs101',
      title: 'Assignment 1: Java Basics & OOP',
      description: 'Write an object-oriented solution demonstrating polymorphism, encapsulation, and unit testing.',
      dueDate: '2026-12-01',
      attachments: [],
      createdAt: new Date().toISOString(),
    }
  ];
}
if (!globalStore.__inMemorySubmissions) {
  globalStore.__inMemorySubmissions = [];
}
if (!globalStore.__inMemoryActivities) {
  globalStore.__inMemoryActivities = [
    {
      _id: 'act_demo_101',
      classroomId: 'cls_demo_cs101',
      studentEmail: 'student@gmail.com',
      studentName: 'Student',
      type: 'question',
      content: 'How does binary search tree balancing work?',
      topic: 'Binary Trees',
      weakConcepts: ['Tree Traversal', 'Balancing'],
      confidenceScore: 65,
      aiFeedback: 'Analyzed by Learn X Java Engine',
      createdAt: new Date().toISOString(),
    }
  ];
}
if (!globalStore.__inMemoryCodingAssessments) {
  globalStore.__inMemoryCodingAssessments = [
    {
      _id: 'cod_demo_101',
      classroomId: 'cls_demo_cs101',
      title: 'Two Sum Problem',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'Easy',
      tags: ['Array', 'Hash Table'],
      starterCode: {
        javascript: 'function twoSum(nums, target) {\n  // Your code here\n  return [0, 1];\n}',
        python: 'def two_sum(nums, target):\n    # Your code here\n    return [0, 1]',
        java: 'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
      },
      testCases: [
        { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
        { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false },
      ],
      tabSwitchLimit: 3,
      timeLimitMinutes: 30,
      createdAt: new Date().toISOString(),
    }
  ];
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
