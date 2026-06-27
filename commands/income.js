const { getEnabledItems, appendRecords } = require("../services/googleSheet");

function isIncomeCommand(text) {
  return text === "收入" || text === "💰 收入";
}

function getNumber(text, label) {
  const re = new RegExp(`${label}\\s*[:：=]?\\s*([0-9,]+)`, "i");
  const m = text.match(re);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}

function getNote(text) {
  const m = text.match(/備註\s*[:：=]?\s*(.+)/i);
  return m ? m[1].trim() : "";
}

async function incomeTemplateMessage() {
  const items = await getEnabledItems("收入");
  const body = items.map(item => `${item}：0`).join("\n");
  return { type: "text", text: `💰 收入\n\n${body}\n\n備註：` };
}

async function isIncomeRecord(text) {
  const items = await getEnabledItems("收入");
  return items.some(item => text.includes(item));
}

async function handleIncome(text, user) {
  const items = await getEnabledItems("收入");
  const note = getNote(text);
  const records = [];

  for (const item of items) {
    const amount = getNumber(text, item);
    if (amount > 0) records.push({ type: "收入", item, amount, note });
  }

  if (records.length === 0) throw new Error("沒有讀到收入金額");

  await appendRecords(records, user);
  const total = records.reduce((sum, r) => sum + r.amount, 0);

  return `✅ 收入記帳成功\n\n填表人：${user.name}\n收入合計：${total} 元\n筆數：${records.length}\n\n備註：${note || "無"}`;
}

module.exports = { isIncomeCommand, isIncomeRecord, incomeTemplateMessage, handleIncome };
