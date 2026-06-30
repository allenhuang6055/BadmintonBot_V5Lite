const { appendRecords, getSummary } = require("../services/googleSheet");
const { parseAmount, parseNote, hasAnyLabel } = require("../services/parser");

function money(value) {
  return Number(value || 0).toLocaleString("zh-TW");
}

function paymentTemplate() {
  return `💵 幹部交款

交款：0

備註：`;
}

function isPaymentRecord(text) {
  return hasAnyLabel(text, ["交款"]);
}

async function handlePayment(text, user) {
  const amount = parseAmount(text, "交款");
  const note = parseNote(text);

  console.log("PARSE_PAYMENT_RESULT:", JSON.stringify({
    user: user.name,
    text,
    payment: amount,
  }));

  if (amount <= 0) {
    throw new Error("沒有讀到交款金額。請確認格式，例如：交款：5000");
  }

  await appendRecords([{ type: "交款", item: "交款", payment: amount, note }], user);

  const my = await getSummary("month", user.id);

  return `✅ 交款完成

填表人：${user.name}
交款：${money(amount)} 元

💰 我的未交：${money(my.unpaid)} 元

備註：${note || "無"}`;
}

module.exports = {
  paymentTemplate,
  isPaymentRecord,
  handlePayment,
};
