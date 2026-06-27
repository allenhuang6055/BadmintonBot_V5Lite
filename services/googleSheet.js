require("dotenv").config();
const { google } = require("googleapis");

const DB_SHEET = "LINE資料庫";
const MEMBERS_SHEET = "幹部名單";

function getGoogleAuth() {
  const options = { scopes: ["https://www.googleapis.com/auth/spreadsheets"] };
  if (process.env.GOOGLE_CREDENTIALS_JSON) options.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  else options.keyFile = process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json";
  return new google.auth.GoogleAuth(options);
}
function getSheets() { return google.sheets({ version: "v4", auth: getGoogleAuth() }); }

function taipeiDate() {
  return new Intl.DateTimeFormat("zh-TW", { timeZone:"Asia/Taipei", year:"numeric", month:"numeric", day:"numeric" }).format(new Date());
}
function taipeiTime() {
  return new Intl.DateTimeFormat("zh-TW", { timeZone:"Asia/Taipei", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(new Date());
}
function taipeiNow() { return new Date().toLocaleString("zh-TW", { timeZone:"Asia/Taipei" }); }

async function getRows(sheetName, range="A:Z") {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: `${sheetName}!${range}` });
  return res.data.values || [];
}

async function getMemberName(lineId) {
  try {
    const rows = await getRows(MEMBERS_SHEET, "A:D");
    const found = rows.slice(1).find(row => String(row[0] || "").trim() === lineId);
    if (found && String(found[3] || "TRUE").toUpperCase() !== "FALSE") return String(found[1] || lineId).trim() || lineId;
  } catch (err) {}
  return lineId || "unknown";
}

async function appendRecords(records, user) {
  if (!records.length) return;
  const values = records.map(r => [r.date || taipeiDate(), taipeiTime(), user.id, user.name, r.type, r.item, r.amount || 0, r.note || "", "有效", taipeiNow()]);
  await getSheets().spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${DB_SHEET}!A:J`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values }
  });
}

function parseDate(text) {
  if (!text) return null;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}
function isSameDay(dateText, now) {
  const d=parseDate(dateText); return d && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
}
function isSameMonth(dateText, now) {
  const d=parseDate(dateText); return d && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
}
async function getSummary(scope, userId=null) {
  const rows = await getRows(DB_SHEET, "A:J");
  const now = new Date();
  let income=0, expense=0, payment=0;
  for (const row of rows.slice(1)) {
    const [date,,lineId,,type,,amount,,status]=row;
    if (status === "作廢") continue;
    if (userId && lineId !== userId) continue;
    const ok = scope === "today" ? isSameDay(date, now) : isSameMonth(date, now);
    if (!ok) continue;
    const n=Number(amount||0);
    if (type==="收入") income += n;
    if (type==="支出") expense += n;
    if (type==="交款") payment += n;
  }
  return { income, expense, payment, balance: income-expense, unpaid: income-payment };
}
module.exports = { getMemberName, appendRecords, getSummary };
