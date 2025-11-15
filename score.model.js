import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  userId: String,           // tuỳ bạn: email/username/userId
  score: Number,            // số câu đúng
  total: Number,            // tổng số câu
  startedAt: Date,
  finishedAt: Date,
  meta: Object,             // ví dụ: device, ip, etc.
  questions: [{             // Store detailed question data for answer review
    questionId: Number,
    type: String,            // "Nhận biết", "Thông hiểu", "Vận dụng", "Đúng sai"
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    // For multiple choice questions
    optionA: String,
    optionB: String,
    optionC: String,
    optionD: String,
    // For yes/no questions
    optionA_yn: String,
    answerA: String,
    optionB_yn: String,
    answerB: String,
    optionC_yn: String,
    answerC: String,
    optionD_yn: String,
    answerD: String,
    explain: String           // Explanation for yes/no questions
  }]
}, { timestamps: true });

export default mongoose.model("Result", ResultSchema);