import dotenv from 'dotenv';
import { google } from "googleapis";
import fs from "fs";

dotenv.config();

const credentials = JSON.parse(fs.readFileSync("history-question-1b3ed7158a13.json", "utf8"));
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

async function getSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

export async function readSheet(range) {
  const sheets = await getSheetsClient();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return data.values || []; // array 2D
}

export async function readAllSheets() {
    const sheetNames = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Đúng sai'];
    const range = "B:G";
    const sheets = await getSheetsClient();
    const result = {};

    for (const name of sheetNames) {
        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${name}!${range}`,
        });
        result[name] = data.values || [];
    }
    return result;
}

export async function mixQuestions() {
  const allSheets = await readAllSheets();

  // Số lượng cần lấy ở từng loại
  const pickCount = {
    "Nhận biết": 8,
    "Thông hiểu": 6,
    "Vận dụng": 4,
    "Đúng sai": 2
  };

  // Hàm trộn mảng ngẫu nhiên (Fisher–Yates)
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const mixedQuestions = [];

  // Duyệt từng sheet
  for (const [sheetName, rows] of Object.entries(allSheets)) {
    const count = pickCount[sheetName] || 0;
    if (rows.length === 0) continue;

    // Trộn thứ tự & chọn số lượng cần
    const selected = shuffle(rows).slice(0, count);

    // Map thành object dễ dùng hơn
    selected.forEach((r) => {
      mixedQuestions.push({
        question: r[0] || "",
        optionA: r[1] || "",
        optionB: r[2] || "",
        optionC: r[3] || "",
        optionD: r[4] || "",
        answer: r[5] || "",
      });
    });
  }

  // Trộn lại toàn bộ câu hỏi lần nữa
  return shuffle(mixedQuestions);
}
