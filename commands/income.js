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
  const m = text.match(/\u5099\u8a3b\s*[:：=]?\s*(.*)/i);
  return m ? String(m[1] || "").trim() : "";
}

async function incomeTemplate() {
  const items = await getEnabledItems("\u6536\u5165");
  const body = items.map((item) => `${item}\uff1a0`).join("\n");
  const stock = await getCurrentStock();

  return `\ud83d\udcb0 \u6536\u5165\uff0b\u8017\u7403

\u76ee\u524d\u5eab\u5b58\uff1a${formatStock(stock)}

${body}

\u8017\u7403\uff1a0

\u5099\u8a3b\uff1a`;
}

async function isIncomeRecord(text) {
  if (/\u8017\u7403\s*[:：=]/.test(text)) return true;

  const items = await getEnabledItems("\u6536\u5165");
  return items.some((item) => new RegExp(`${item}\\s*[:：=]`).test(text));
}

async function handleIncome(text, user) {
  const items = await getEnabledItems("\u6536\u5165");
  const note = parseNote(text);
  const ballsUsed = parseAmount(text, "\u8017\u7403");
  const records = [];

  for (const item of items) {
    const amount = parseAmount(text, item);

    if (amount > 0) {
      records.push({
        type: "\u6536\u5165",
        item,
        income: amount,
        note,
      });
    }
  }

  if (ballsUsed > 0) {
    records.push({
      type: "\u5eab\u5b58",
      item: "\u8017\u7403",
      ballsUsed,
      note,
    });
  }

  if (!records.length) {
    throw new Error("\u6c92\u6709\u8b80\u5230\u6536\u5165\u91d1\u984d\u6216\u8017\u7403\u6578\u3002\u8acb\u78ba\u8a8d\u683c\u5f0f\uff0c\u4f8b\u5982\uff1a\u96f6\u6253\uff1a500\u3001\u8017\u7403\uff1a18");
  }

  await appendRecords(records, user);

  const incomeTotal = records.reduce((sum, r) => sum + (r.income || 0), 0);
  const stock = await getCurrentStock();
  const my = await getSummary("month", user.id);

  return `\u2705 \u6536\u5165\u5b8c\u6210

\u586b\u8868\u4eba\uff1a${user.name}
\u6536\u5165\u5408\u8a08\uff1a${incomeTotal} \u5143
\u8017\u7403\uff1a${ballsUsed} \u9846

\ud83c\udff8 \u5269\u9918\u5eab\u5b58\uff1a${formatStock(stock)}
\ud83d\udcb0 \u6211\u7684\u672a\u4ea4\uff1a${my.unpaid} \u5143

\u5099\u8a3b\uff1a${note || "\u7121"}`;
}

module.exports = {
  parseAmount,
  parseNote,
  incomeTemplate,
  isIncomeRecord,
  handleIncome,
};