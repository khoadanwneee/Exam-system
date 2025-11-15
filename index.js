import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

//Import service
import * as sheetService from './services/sheet.service.js';
import connectDatabase from './db.config.js';
import Result from './score.model.js';

const app = express();
const PORT = 3000;
dotenv.config();

connectDatabase();

app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());                       
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/sheet/question', async (req, res) => {
    try {
        const questions = await sheetService.mixQuestions();
        res.json({
            code: "success",
            message: "Send questions successfully",
            data: questions
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            code: "error",
            message: "Failed to send questions",
            error: error.message
        });
    }
});

app.post("/score/submit", async (req, res) => {
  try {
    const { sessionId, userId, score, total, startedAt, finishedAt, meta } = req.body;

    if (!sessionId || score == null || total == null) {
      return res.status(400).json({
        code: "error",
        message: "Thiếu dữ liệu bắt buộc (sessionId, score, total)",
      });
    }

    const result = await Result.create({
      sessionId,
      userId,
      score,
      total,
      startedAt,
      finishedAt,
      meta,
    });

    res.json({
      code: "success",
      message: "Lưu điểm thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error saving result:", error);
    res.status(500).json({
      code: "error",
      message: "Lưu điểm thất bại",
      error: error.message,
    });
  }
});

app.get("/score/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        code: "error",
        message: "Thiếu userId trong URL",
      });
    }

    const results = await Result.find({ userId }).sort({ createdAt: -1 }).lean();

    res.json({
      code: "success",
      message: `Lấy tất cả điểm của user: ${userId}`,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching user scores:", error);
    res.status(500).json({
      code: "error",
      message: "Không thể lấy danh sách điểm",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});