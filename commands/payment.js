const { appendRecords, getSummary } = require("../services/googleSheet");
const { parseAmount, parseNote } = require("./income");

function paymentTemplate() {
  return `💵 幹部交款

交款：0

備註：`;
}

function isPaymentRecord(text) {
  return /交款\s*[:：=]/.test(text);
}

async function handlePayment(text, user) {
  const amount = parseAmount(text, "交款");
  const note = parseNote(text);

  if (amount <= 0) {
    throw new Error("沒有讀到交款金額。請確認格式，例如：交款：5000");
  }

  await appendRecords([{ type: "交款", item: "交款", payment: amount, note }], user);

  const my = await getSummary("month", user.id);

  return `✅ 交款完成

填表人：${user.name}
交款：${amount} 元

💰 我的未交：${my.unpaid} 元

備註：${note || "無"}`;
}

module.exports = {
  paymentTemplate,
  isPaymentRecord,
  handlePayment,
};
