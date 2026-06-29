require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");

const { mainMenuMessage } = require("./config/menu");
const { getUser } = require("./services/lineUser");
const { pushGroupMessage, buildGroupNotice } = require("./services/groupNotify");
const { incomeTemplate, isIncomeRecord, handleIncome } = require("./commands/income");
const { expenseTemplate, isExpenseRecord, handleExpense } = require("./commands/expense");
const { paymentTemplate, isPaymentRecord, handlePayment } = require("./commands/payment");
const { handleToday, handleMonth, handleMyUnpaid, handleStock } = require("./commands/query");

const app = express();

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

app.get("/", (req, res) => {
  res.send("BadmintonBot V8.1 group notify is running");
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
  return client.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

async function replyMessages(replyToken, messages) {
  return client.replyMessage({ replyToken, messages });
}

function getSourceType(event) {
  return event.source?.type || "";
}

async function notifyGroupSafely(kind, user, resultText) {
  try {
    const notice = buildGroupNotice(kind, user, resultText);
    await pushGroupMessage(client, notice);
  } catch (err) {
    console.error("GROUP_NOTIFY_FAILED:", err.message);
  }
}

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const text = event.message.text.trim();
  const user = await getUser(client, event);

  try {
    if (text === "群組ID" || text.toLowerCase() === "groupid") {
      if (getSourceType(event) !== "group" || !event.source.groupId) {
        return replyText(event.replyToken, "這個指令請在球隊群組裡輸入，才會顯示 groupId。");
      }

      return replyText(
        event.replyToken,
        `✅ 這個群組的 LINE_GROUP_ID 是：

${event.source.groupId}

請到 Render → Environment 新增或修改：
LINE_GROUP_ID=${event.source.groupId}`
      );
    }

    if (text === "選單" || text === "功能" || text.toLowerCase() === "menu") {
      return replyMessages(event.replyToken, [mainMenuMessage()]);
    }

    if (text === "收入" || text === "💰 收入" || text === "今日收入") {
      return replyText(event.replyToken, await incomeTemplate());
    }

    if (text === "支出" || text === "💸 支出") {
      return replyText(event.replyToken, await expenseTemplate());
    }

    if (text === "交款" || text === "💵 交款" || text === "幹部交款") {
      return replyText(event.replyToken, paymentTemplate());
    }

    if (text === "今天" || text === "今日") {
      return replyText(event.replyToken, await handleToday());
    }

    if (text === "本月" || text === "月報") {
      return replyText(event.replyToken, await handleMonth());
    }

    if (text === "我的未交" || text === "未交款") {
      return replyText(event.replyToken, await handleMyUnpaid(user));
    }

    if (text === "球庫存" || text === "庫存") {
      return replyText(event.replyToken, await handleStock());
    }

    if (await isIncomeRecord(text)) {
      const resultText = await handleIncome(text, user);
      await notifyGroupSafely("income", user, resultText);
      return replyText(event.replyToken, resultText);
    }

    if (await isExpenseRecord(text)) {
      const resultText = await handleExpense(text, user);
      await notifyGroupSafely("expense", user, resultText);
      return replyText(event.replyToken, resultText);
    }

    if (isPaymentRecord(text)) {
      const resultText = await handlePayment(text, user);
      await notifyGroupSafely("payment", user, resultText);
      return replyText(event.replyToken, resultText);
    }

    return;
  } catch (err) {
    console.error(err);
    return replyText(event.replyToken, `❌ 操作失敗

原因：${err.message}

請輸入「選單」重新操作。`);
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`BadmintonBot V8.1 running on port ${port}`);
});
