require("dotenv").config();
const { google } = require("googleapis");

const DB_SHEET = "02_LINE\u8cc7\u6599\u5eab";
const SETTINGS_SHEET = "08_\u9805\u76ee\u8a2d\u5b9a";

function sheetRange(sheetName, range) {
  return `'${sheetName}'!${range}`;
}

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
  return google.sheets({
    version: "v4",
    auth: getGoogleAuth(),
  });
}

async function getRows(sheetName, range = "A:AA") {
  const sheets = getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: sheetRange(sheetName, range),
  });

  return res.data.values || [];
}

async function appendRows(sheetName, values) {
  const sheets = getSheets();

  console.log("READY_WRITE_SHEET:", sheetName);
  console.log("READY_WRITE_RANGE:", sheetRange(sheetName, "A:O"));
  console.log("READY_WRITE_VALUES:", JSON.stringify(values));

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: sheetRange(sheetName, "A:O"),
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  console.log("WRITE_RESULT:", JSON.stringify(res.data.updates));
  return res.data.updates;
}

function taipeiDate() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date());
}

function taipeiNow() {
  return new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  });
}

function n(value) {
  const num = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function normalizeBool(value) {
  const s = String(value ?? "").trim().toUpperCase();
  return ["TRUE", "YES", "Y", "1", "\u662f", "\u555f\u7528"].includes(s);
}

async function getEnabledItems(type) {
  try {
    const rows = await getRows(SETTINGS_SHEET, "A:F");

    const items = rows
      .slice(3)
      .filter((row) => String(row[0] || "").trim() === type)
      .filter((row) => normalizeBool(row[2]))
      .map((row) => ({
        item: String(row[1] || "").trim(),
        sort: Number(row[3] || 99),
      }))
      .filter((x) => x.item)
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.item);

    if (items.length) return items;
  } catch (err) {
    console.error("READ_SETTINGS_FAILED:", err.message);
  }

  if (type === "\u6536\u5165") {
    return ["\u96f6\u6253", "\u7403\u5238", "\u6703\u54e1", "\u5176\u4ed6"];
  }

  if (type === "\u652f\u51fa") {
    return ["\u8cb7\u7403", "\u5834\u79df", "\u805a\u9910", "\u96dc\u652f"];
  }

  return [];
}

async function appendRecords(records, user) {
  if (!records.length) return;

  const values = records.map((r) => [
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
    "\u6709\u6548",
    taipeiNow(),
    "",
    "",
  ]);

  return appendRows(DB_SHEET, values);
}

function parseDate(value) {
  if (!value) return null;

  if (typeof value === "number") {
    return new Date((value - 25569) * 86400 * 1000);
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDay(dateText, now) {
  const d = parseDate(dateText);

  return (
    d &&
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isSameMonth(dateText, now) {
  const d = parseDate(dateText);
  return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

async function getSummary(scope, userId = null) {
  const rows = await getRows(DB_SHEET, "A:AA");
  const now = new Date();

  let income = 0;
  let expense = 0;
  let payment = 0;
  let ballsUsed = 0;
  let ballsIn = 0;

  for (const row of rows.slice(3)) {
    const date = row[0];
    const lineId = row[1];
    const status = String(row[11] || "").trim() || "\u6709\u6548";

    if (status !== "\u6709\u6548") continue;
    if (userId && lineId !== userId) continue;

    const match = scope === "today" ? isSameDay(date, now) : isSameMonth(date, now);
    if (!match) continue;

    income += n(row[22] ?? row[5]);
    expense += n(row[23] ?? row[6]);
    ballsUsed += n(row[24] ?? row[7]);
    ballsIn += n(row[25] ?? row[8]);
    payment += n(row[26] ?? row[9]);
  }

  return {
    income,
    expense,
    payment,
    ballsUsed,
    ballsIn,
    profit: income - expense,
    unpaid: income - payment,
  };
}

async function getCurrentStock() {
  const rows = await getRows(DB_SHEET, "A:AA");

  let ballsUsed = 0;
  let ballsIn = 0;

  for (const row of rows.slice(3)) {
    const status = String(row[11] || "").trim() || "\u6709\u6548";
    if (status !== "\u6709\u6548") continue;

    ballsUsed += n(row[24] ?? row[7]);
    ballsIn += n(row[25] ?? row[8]);
  }

  let initialStock = 0;

  try {
    const homeRows = await getRows("00_\u9996\u9801", "B6:B6");
    initialStock = n(homeRows[0]?.[0]);
  } catch (err) {
    console.error("READ_INITIAL_STOCK_FAILED:", err.message);
  }

  return initialStock + ballsIn - ballsUsed;
}

module.exports = {
  getEnabledItems,
  appendRecords,
  getSummary,
  getCurrentStock,
};