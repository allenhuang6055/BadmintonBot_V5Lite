const { getEnabledItems, appendRecords, getSummary } = require("../services/googleSheet");
const { parseAmount, parseNote } = require("./income");

async function expenseTemplate() {
  const items = await getEnabledItems("支出");
  const body = items.map(item => `${item}：0`).join("\n");
  return `💸 支出

${body}

備註：`;
}

async function isExpenseRecord(text) {
  const items = await getEnabledItems("支出");
  return items.some(item => new RegExp(`${item}\\s*[:：=]`).test(text));
}

async function handleExpense(text, user) {
  const items = await getEnabledItems("支出");
  const note = parseNote(text);
  const records = [];
  for (const item of items) {
    const amount = parseAmount(text, item);
    if (amount > 0) records.push({ type: "支出", item, expense: amount, note });
  }
  if (!records.length) throw new Error("沒有讀到支出金額。請確認格式，例如：買球：690");
  await appendRecords(records, user);
  const total = records.reduce((sum, r) => sum + (r.expense || 0), 0);
  const month = await getSummary("month");
  return `✅ 支出完成

填表人：${user.name}
支出合計：${total} 元
本月盈餘：${month.profit} 元

備註：${note || "無"}`;
}

module.exports = { expenseTemplate, isExpenseRecord, handleExpense };
