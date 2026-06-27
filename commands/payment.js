const { appendRecords } = require("../services/googleSheet");

function isPaymentCommand(text) {
  return text === "交款" || text === "🏦 交款";
}

function isPaymentRecord(text) {
  return text.includes("交款");
}

function getPaymentAmount(text) {
  const m = text.match(/交款\s*[:：=]?\s*([0-9,]+)/i);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}

function getNote(text) {
  const m = text.match(/備註\s*[:：=]?\s*(.+)/i);
  return m ? m[1].trim() : "";
}

function paymentTemplateMessage() {
  return { type: "text", text: `🏦 交款\n\n交款：0\n\n備註：` };
}

async function handlePayment(text, user) {
  const amount = getPaymentAmount(text);
  const note = getNote(text);
  if (amount <= 0) throw new Error("沒有讀到交款金額");

  await appendRecords([{ type: "交款", item: "交款", amount, note }], user);

  return `✅ 交款記錄成功\n\n填表人：${user.name}\n交款金額：${amount} 元\n\n備註：${note || "無"}`;
}

module.exports = { isPaymentCommand, isPaymentRecord, paymentTemplateMessage, handlePayment };
