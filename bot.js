require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const { mainMenuMessage } = require("./config/menu");
const { getMemberName } = require("./services/googleSheet");

const { isIncomeCommand, isIncomeRecord, incomeTemplateMessage, handleIncome } = require("./commands/income");
const { isExpenseCommand, isExpenseRecord, expenseTemplateMessage, handleExpense } = require("./commands/expense");
const { isPaymentCommand, isPaymentRecord, paymentTemplateMessage, handlePayment } = require("./commands/payment");
const { isTodayQuery, isMonthQuery, isMyUnpaidQuery, handleTodayQuery, handleMonthQuery, handleMyUnpaidQuery } = require("./commands/query");

const app = express();

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

app.get("/", (req, res) => {
  res.send("BadmintonBot V5 Lite is running");
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function replyText(replyToken, text) {
  return client.replyMessage({ replyToken, messages: [{ type: "text", text }] });
}

async function replyMessages(replyToken, messages) {
  return client.replyMessage({ replyToken, messages });
}

async function getUser(event) {
  const lineId = event.source.userId || event.source.groupId || event.source.roomId || "unknown";
  const name = await getMemberName(lineId);
  return { id: lineId, name };
}

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;
  const text = event.message.text.trim();

  try {
    if (text === "選單" || text === "功能") {
      return replyMessages(event.replyToken, [mainMenuMessage()]);
    }

    if (isIncomeCommand(text)) return replyMessages(event.replyToken, [await incomeTemplateMessage()]);
    if (isExpenseCommand(text)) return replyMessages(event.replyToken, [await expenseTemplateMessage()]);
    if (isPaymentCommand(text)) return replyMessages(event.replyToken, [paymentTemplateMessage()]);

    const user = await getUser(event);

    if (isTodayQuery(text)) return replyText(event.replyToken, await handleTodayQuery());
    if (isMonthQuery(text)) return replyText(event.replyToken, await handleMonthQuery());
    if (isMyUnpaidQuery(text)) return replyText(event.replyToken, await handleMyUnpaidQuery(user));

    if (await isIncomeRecord(text)) return replyText(event.replyToken, await handleIncome(text, user));
    if (await isExpenseRecord(text)) return replyText(event.replyToken, await handleExpense(text, user));
    if (isPaymentRecord(text)) return replyText(event.replyToken, await handlePayment(text, user));

    return;
  } catch (err) {
    console.error(err);
    return replyText(event.replyToken, `❌ 操作失敗\n\n原因：${err.message}\n\n請輸入「選單」重新操作。`);
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`BadmintonBot V5 Lite running on port ${port}`);
});
