require("dotenv").config();
const { google } = require("googleapis");

const DB_SHEET = "02_LINE∏ÍÆ∆Æw";
const SETTINGS_SHEET = "08_?ÖÁõÆË®≠Â?";

function getGoogleAuth() {
  const options = { scopes: ["https://www.googleapis.com/auth/spreadsheets"] };
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
    day: "numeric"
  }).format(new Date());
}

function taipeiNow() {
  return new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

async function getRows(sheetName, range = "A:AA") {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!${range}`
  });
  return res.data.values || [];
}

async function appendRows(sheetName, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: ''${sheetName}''!A:O,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values }
  });
}

function normalizeBool(value) {
  const s = String(value ?? "").trim().toUpperCase();
  return ["TRUE", "??, "?üÁî®", "Y", "YES", "1"].includes(s);
}

async function getEnabledItems(type) {
  try {
    const rows = await getRows(SETTINGS_SHEET, "A:F");
    const items = rows.slice(3)
      .filter(row => String(row[0] || "").trim() === type)
      .filter(row => normalizeBool(row[2]))
      .map(row => ({ item: String(row[1] || "").trim(), sort: Number(row[3] || 99) }))
      .filter(x => x.item)
      .sort((a, b) => a.sort - b.sort)
      .map(x => x.item);
    if (items.length) return items;
  } catch (err) {
    console.error("ËÆÄ?ñÈ??ÆË®≠ÂÆöÂ§±?óÔ??πÁî®?êË®≠?ÖÁõÆÔº?, err.message);
  }
  if (type === "?∂ÂÖ•") return ["?∂Ê?", "?ÉÂà∏", "?ÉÂì°", "?∂‰?"];
  if (type === "?ØÂá∫") return ["Ë≤∑Á?", "?¥Á?", "?öÈ?", "?úÊîØ"];
  return [];
}

function n(value) {
  const num = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === "number") return new Date((value - 25569) * 86400 * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDay(dateText, now) {
  const d = parseDate(dateText);
  return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isSameMonth(dateText, now) {
  const d = parseDate(dateText);
  return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

async function appendRecords(records, user) {
  if (!records.length) return;
  const values = records.map(r => [
    r.date || taipeiDate(),
    user.id,
    user.name,
    r.type,
    r.item,
    r.income || 0,
    r.expense || 0,
    r.ballsUsed || 0,
    r.ballsIn || 0,
    r.payment || 0,
    r.note || "",
    "?âÊ?",
    taipeiNow(),
    "",
    ""
  ]);
  await appendRows(DB_SHEET, values);
}

async function getSummary(scope, userId = null) {
  const rows = await getRows(DB_SHEET, "A:AA");
  const now = new Date();
  let income = 0, expense = 0, payment = 0, ballsUsed = 0, ballsIn = 0;
  for (const row of rows.slice(3)) {
    const date = row[0];
    const lineId = row[1];
    const status = String(row[11] || "").trim() || "?âÊ?";
    if (status !== "?âÊ?") continue;
    if (userId && lineId !== userId) continue;
    const match = scope === "today" ? isSameDay(date, now) : isSameMonth(date, now);
    if (!match) continue;
    income += n(row[22] ?? row[5]);
    expense += n(row[23] ?? row[6]);
    ballsUsed += n(row[24] ?? row[7]);
    ballsIn += n(row[25] ?? row[8]);
    payment += n(row[26] ?? row[9]);
  }
  return { income, expense, payment, ballsUsed, ballsIn, profit: income - expense, unpaid: income - payment };
}

async function getCurrentStock() {
  const rows = await getRows(DB_SHEET, "A:AA");
  let ballsUsed = 0, ballsIn = 0;
  for (const row of rows.slice(3)) {
    const status = String(row[11] || "").trim() || "?âÊ?";
    if (status !== "?âÊ?") continue;
    ballsUsed += n(row[24] ?? row[7]);
    ballsIn += n(row[25] ?? row[8]);
  }
  let initialStock = 0;
  try {
    const homeRows = await getRows("00_È¶ñÈ?", "B6:B6");
    initialStock = n(homeRows[0]?.[0]);
  } catch (err) {
    console.error("ËÆÄ?ñÊ??ùÂ∫´Â≠òÂ§±?óÔ?", err.message);
  }
  return initialStock + ballsIn - ballsUsed;
}

module.exports = { getEnabledItems, appendRecords, getSummary, getCurrentStock };


