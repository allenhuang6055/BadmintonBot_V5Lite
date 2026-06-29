const {
  getEnabledItems,
  appendRecords,
  getSummary,
  getCurrentStock,
  formatStock,
} = require("../services/googleSheet");

function parseAmount(text, label) {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${safe}\\s*[:：=]?\\s*([0-9,]+)`, "i");
  const m = text.match(re);
  if (!m) return 0;

  const num = Number(String(m[1]).replace(/,/g, ""));
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function parseNote(text) {
  const m = text.match(/備註\s*[:：=]?\s*(.*)/i);
  return m ? String(m[1] || "").trim() : "";
}

async function incomeTemplate() {
  const items = await getEnabledItems("收入");
  const body = items.map((item) => `${item}：0`).join("\n");
  const stock = await getCurrentStock();

  return `💰 收入＋耗球

目前庫存：${formatStock(stock)}

${body}

耗球：0

備註：`;
}

async function isIncomeRecord(text) {
  if (/耗球\s*[:：=]/.test(text)) return true;
  const items = await getEnabledItems("收入");
  return items.some((item) => new RegExp(`${item}\\s*[:：=]`).test(text));
}

async function handleIncome(text, user) {
  const items = await getEnabledItems("收入");
  const note = parseNote(text);
  const ballsUsed = parseAmount(text, "耗球");
  const records = [];

  for (const item of items) {
    const amount = parseAmount(text, item);
    if (amount > 0) {
      records.push({ type: "收入", item, income: amount, note });
    }
  }

  if (ballsUsed > 0) {
    records.push({ type: "庫存", item: "耗球", ballsUsed, note });
  }

  if (!records.length) {
    throw new Error("沒有讀到收入金額或耗球數。請確認格式，例如：零打：500、耗球：18");
  }

  await appendRecords(records, user);

  const incomeTotal = records.reduce((sum, r) => sum + (r.income || 0), 0);
  const stock = await getCurrentStock();
  const my = await getSummary("month", user.id);

  return `✅ 收入完成

填表人：${user.name}
收入合計：${incomeTotal} 元
耗球：${ballsUsed} 顆

🏸 剩餘庫存：${formatStock(stock)}
💰 我的未交：${my.unpaid} 元

備註：${note || "無"}`;
}

module.exports = {
  parseAmount,
  parseNote,
  incomeTemplate,
  isIncomeRecord,
  handleIncome,
};
