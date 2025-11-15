import dotenv from 'dotenv';
import { google } from "googleapis";

dotenv.config();

// Lấy ID Google Sheet từ env
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Lấy nội dung service account JSON từ env
const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!rawCredentials) {
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment variables");
}

const credentials = JSON.parse(rawCredentials);

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
  const sheetNames = ['Nhận biết', 'Thông hiểu', 'Vận dụng'];
  const range = "B:G";
  const sheets = await getSheetsClient();
  const result = {};

  // 3 sheet đầu: B:G
  for (const name of sheetNames) {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${name}!${range}`,
    });
    result[name] = data.values || [];
  }

  // Sheet Đúng sai: B:K
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Đúng sai!B:K`,
  });
  result["Đúng sai"] = data.values || [];

  return result;
}

export async function mixQuestions() {
  const allSheets = await readAllSheets();

  const pickCount = {
    "Nhận biết": 8,
    "Thông hiểu": 6,
    "Vận dụng": 4,
    "Đúng sai": 2
  };

  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const mixedQuestions = [];

  for (const [sheetName, rows] of Object.entries(allSheets)) {
    const count = pickCount[sheetName] || 0;
    if (!rows.length) continue;

    const selected = shuffle(rows).slice(0, count);

    selected.forEach((r) => {
      if (sheetName === "Đúng sai") {
        // Đúng sai: B → K
        mixedQuestions.push({
          type: sheetName,
          question: r[0] || "",
          optionA: r[1] || "",
          answerA: r[2] || "",
          optionB: r[3] || "",
          answerB: r[4] || "",
          optionC: r[5] || "",
          answerC: r[6] || "",
          optionD: r[7] || "",
          answerD: r[8] || "",
          explain: r[9] || "",
        });
      } else {
        // Nhận biết / Thông hiểu / Vận dụng: B → G
        mixedQuestions.push({
          type: sheetName,
          question: r[0] || "",
          optionA: r[1] || "",
          optionB: r[2] || "",
          optionC: r[3] || "",
          optionD: r[4] || "",
          answer: r[5] || "",
        });
      }
    });
  }

  return shuffle(mixedQuestions);
}
