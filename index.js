import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

//Import service
import * as sheetService from './services/sheet.service.js';

const app = express();
const PORT = 3000;
dotenv.config();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});