import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface ICodingAssessment extends Document {
  classroomId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  starterCode: {
    javascript?: string;
    python?: string;
    java?: string;
  };
  testCases: ITestCase[];
  tabSwitchLimit: number;
  timeLimitMinutes?: number;
  dueDate?: Date;
  createdAt: Date;
}

const TestCaseSchema: Schema = new Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String, default: '' },
});

const CodingAssessmentSchema: Schema = new Schema({
  classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  tags: { type: [String], default: [] },
  starterCode: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
  },
  testCases: { type: [TestCaseSchema], default: [] },
  tabSwitchLimit: { type: Number, default: 1 },
  timeLimitMinutes: { type: Number, default: 45 },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

CodingAssessmentSchema.index({ classroomId: 1, createdAt: -1 });

export default mongoose.models.CodingAssessment ||
  mongoose.model<ICodingAssessment>('CodingAssessment', CodingAssessmentSchema);
