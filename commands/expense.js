const { getEnabledItems, appendRecords, getSummary } = require("../services/googleSheet");
const { parseNote, hasAnyLabel, parseByFuzzyLines } = require("../services/parser");

function money(value) {
  return Number(value || 0).toLocaleString("zh-TW");
}

async function expenseTemplate() {
  const items = await getEnabledItems("支出");
  const body = items.map((item) => `${item}：0`).join("\n");
  return `💸 支出

${body}

備註：`;
}

async function isExpenseRecord(text) {
  const items = await getEnabledItems("支出");
  return hasAnyLabel(text, items);
}

async function handleExpense(text, user) {
  const items = await getEnabledItems("支出");
  const note = parseNote(text);
  const parsed = parseByFuzzyLines(text, items);
  const records = [];
  const expenseLines = [];
  const warningLines = [];

  for (const u of parsed.unknown) {
    warningLines.push(`⚠️ 未辨識項目：「${u.input}」${money(u.amount)} 元，未寫入`);
  }

  for (const item of items) {
    const amount = Number(parsed.result[item] || 0);
    if (amount > 0) {
      records.push({ type: "支出", item, expense: amount, note });
      expenseLines.push(`・${item}：${money(amount)} 元`);
    }
  }

  console.log("PARSE_EXPENSE_RESULT:", JSON.stringify({
    user: user.name,
    text,
    parsed: parsed.matched,
    unknown: parsed.unknown,
    result: parsed.result,
  }));

  if (!records.length) {
    throw new Error("沒有讀到支出金額。請確認格式，例如：買球：690、場租：1000");
  }

  await appendRecords(records, user);

  const total = records.reduce((sum, r) => sum + (r.expense || 0), 0);
  const month = await getSummary("month");
  const warningBlock = warningLines.length ? `

${warningLines.join("\n")}` : "";

  return `✅ 支出完成

填表人：${user.name}

支出明細：
${expenseLines.join("\n")}

支出合計：${money(total)} 元
本月盈餘：${money(month.profit)} 元

備註：${note || "無"}${warningBlock}`;
}

module.exports = {
  expenseTemplate,
  isExpenseRecord,
  handleExpense,
};
