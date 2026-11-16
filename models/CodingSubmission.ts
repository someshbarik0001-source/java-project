import mongoose, { Schema, Document } from 'mongoose';

export interface ITestResultItem {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
  executionTimeMs: number;
  error?: string;
}

export interface ICodingSubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  studentEmail: string;
  studentName: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Auto-Submitted (Tab Switch Violation)' | 'Pending';
  passedTestCases: number;
  totalTestCases: number;
  testResults: ITestResultItem[];
  tabSwitchCount: number;
  tabSwitchedAt?: Date;
  autoSubmitted: boolean;
  autoSubmitReason?: string;
  submittedAt: Date;
}

const TestResultItemSchema: Schema = new Schema({
  input: { type: String, required: true },
  expected: { type: String, required: true },
  actual: { type: String, default: '' },
  passed: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  executionTimeMs: { type: Number, default: 0 },
  error: { type: String },
});

const CodingSubmissionSchema: Schema = new Schema({
  assessmentId: { type: Schema.Types.ObjectId, ref: 'CodingAssessment', required: true },
  classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
  studentEmail: { type: String, required: true },
  studentName: { type: String, default: '' },
  code: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Auto-Submitted (Tab Switch Violation)', 'Pending'],
    default: 'Pending',
  },
  passedTestCases: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  testResults: { type: [TestResultItemSchema], default: [] },
  tabSwitchCount: { type: Number, default: 0 },
  tabSwitchedAt: { type: Date },
  autoSubmitted: { type: Boolean, default: false },
  autoSubmitReason: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
});

// Compound index for querying submissions per assessment and student
CodingSubmissionSchema.index({ assessmentId: 1, studentEmail: 1 });
CodingSubmissionSchema.index({ classroomId: 1, submittedAt: -1 });

export default mongoose.models.CodingSubmission ||
  mongoose.model<ICodingSubmission>('CodingSubmission', CodingSubmissionSchema);
