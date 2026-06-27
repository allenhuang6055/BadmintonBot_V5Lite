require("dotenv").config();
const { google } = require("googleapis");

const DB_SHEET = "LINE資料庫";
const SETTINGS_SHEET = "項目設定";
const MEMBERS_SHEET = "幹部名單";

function getGoogleAuth() {
  const options = {
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  };

  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    options.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } else {
    options.keyFile = process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json";
  }

  return new google.auth.GoogleAuth(options);
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getGoogleAuth() });
}

function taipeiDate() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date());
}

function taipeiTime() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function taipeiNow() {
  return new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

async function getRows(sheetName, range = "A:Z") {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return res.data.values || [];
}

function defaultItems(type) {
  if (type === "收入") return ["零打", "球券", "會員", "其他"];
  if (type === "支出") return ["買球", "場租", "聚餐", "其他"];
  return [];
}

async function getEnabledItems(type) {
  try {
    const rows = await getRows(SETTINGS_SHEET, "A:C");
    const items = rows
      .slice(1)
      .filter(row => String(row[0] || "").trim() === type)
      .filter(row => ["TRUE", "是", "啟用"].includes(String(row[2] || "").trim().toUpperCase()))
      .map(row => String(row[1] || "").trim())
      .filter(Boolean);
    return items.length ? items : defaultItems(type);
  } catch (err) {
    return defaultItems(type);
  }
}

async function getMemberName(lineId) {
  try {
    const rows = await getRows(MEMBERS_SHEET, "A:D");
    const found = rows.slice(1).find(row => String(row[0] || "").trim() === lineId);
    if (found && String(found[3] || "TRUE").toUpperCase() !== "FALSE") {
      return String(found[1] || lineId).trim() || lineId;
    }
  } catch (err) {}
  return lineId || "unknown";
}

async function appendRecords(records, user) {
  const sheets = getSheets();
  const nowDate = taipeiDate();
  const nowTime = taipeiTime();
  const createdAt = taipeiNow();

  const values = records.map(record => [
    record.date || nowDate,
    nowTime,
    user.id,
    user.name,
    record.type,
    record.item,
    record.amount || 0,
    record.note || "",
    "有效",
    createdAt,
  ]);

  if (values.length === 0) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${DB_SHEET}!A:J`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function getDatabaseRows() {
  return getRows(DB_SHEET, "A:J");
}

function parseDate(text) {
  if (!text) return null;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isSameDay(dateText, now) {
  const d = parseDate(dateText);
  return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isSameMonth(dateText, now) {
  const d = parseDate(dateText);
  return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

async function getSummary(scope, userId = null) {
  const rows = await getDatabaseRows();
  const now = new Date();
  let income = 0;
  let expense = 0;
  let payment = 0;

  for (const row of rows.slice(1)) {
    const [date, , lineId, , type, , amount, , status] = row;
    if (status === "作廢") continue;
    if (userId && lineId !== userId) continue;

    const match = scope === "today" ? isSameDay(date, now) : isSameMonth(date, now);
    if (!match) continue;

    const n = Number(amount || 0);
    if (type === "收入") income += n;
    if (type === "支出") expense += n;
    if (type === "交款") payment += n;
  }

  return { income, expense, payment, balance: income - expense, unpaid: income - payment };
}

module.exports = { getEnabledItems, getMemberName, appendRecords, getSummary };
