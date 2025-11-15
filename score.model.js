import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  userId: String,           // tuỳ bạn: email/username/userId
  score: Number,            // số câu đúng
  total: Number,            // tổng số câu
  startedAt: Date,
  finishedAt: Date,
  meta: Object,             // ví dụ: device, ip, etc.
}, { timestamps: true });

export default mongoose.model("Result", ResultSchema);