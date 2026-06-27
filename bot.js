require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const { mainMenuMessage, confirmMessage } = require("./config/menu");
const { getMemberName, appendRecords, getSummary } = require("./services/googleSheet");

const app = express();
const config = { channelSecret: process.env.LINE_CHANNEL_SECRET, channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN };
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });

const sessions = new Map();
const FLOW = { INCOME:"income", EXPENSE:"expense", PAYMENT:"payment" };
const incomeItems = ["零打","球券","會員","其他"];
const expenseItems = ["買球","場租","聚餐","其他"];

app.get("/", (req,res)=>res.send("BadmintonBot V5 Lite 1.1 is running"));
app.post("/webhook", line.middleware(config), async (req,res)=>{
  try { await Promise.all(req.body.events.map(handleEvent)); res.status(200).end(); }
  catch(err){ console.error(err); res.status(500).end(); }
});

async function replyText(replyToken, text) { return client.replyMessage({ replyToken, messages:[{type:"text", text}] }); }
async function replyMessages(replyToken, messages) { return client.replyMessage({ replyToken, messages }); }
async function getUser(event) {
  const lineId = event.source.userId || event.source.groupId || event.source.roomId || "unknown";
  return { id: lineId, name: await getMemberName(lineId) };
}
function toNumber(text) {
  const n = Number(String(text||"").trim().replace(/,/g,""));
  return Number.isNaN(n) || n < 0 ? null : n;
}
function startIncome(userId) {
  sessions.set(userId,{flow:FLOW.INCOME,step:0,items:incomeItems,amounts:{}});
  return `💰 收入記帳\n\n請依序輸入金額。沒有請輸入 0。\n\n${incomeItems[0]}金額？`;
}
function startExpense(userId) {
  sessions.set(userId,{flow:FLOW.EXPENSE,step:0,items:expenseItems,amounts:{}});
  return `💸 支出記帳\n\n請依序輸入金額。沒有請輸入 0。\n\n${expenseItems[0]}金額？`;
}
function startPayment(userId) {
  sessions.set(userId,{flow:FLOW.PAYMENT,step:0,amount:0,note:""});
  return "🏦 交款\n\n請輸入交款金額。";
}
function summarizeSession(s) {
  if (s.flow===FLOW.PAYMENT) return `🏦 交款確認\n\n交款：${s.amount} 元\n備註：${s.note || "無"}\n\n是否送出？`;
  const title = s.flow===FLOW.INCOME ? "💰 收入確認" : "💸 支出確認";
  const lines = s.items.map(item => `${item}：${s.amounts[item] || 0} 元`);
  const total = s.items.reduce((sum,item)=>sum+(s.amounts[item]||0),0);
  return `${title}\n\n${lines.join("\n")}\n\n合計：${total} 元\n備註：${s.note || "無"}\n\n是否送出？`;
}
async function saveSession(user,s) {
  if (s.flow===FLOW.PAYMENT) {
    await appendRecords([{type:"交款",item:"交款",amount:s.amount,note:s.note}], user);
    return `✅ 交款完成\n\n交款：${s.amount} 元\n備註：${s.note || "無"}`;
  }
  const type = s.flow===FLOW.INCOME ? "收入" : "支出";
  const records = s.items.map(item=>({type,item,amount:s.amounts[item]||0,note:s.note||""})).filter(r=>r.amount>0);
  if (!records.length) throw new Error("全部金額都是 0，沒有資料可寫入");
  await appendRecords(records, user);
  const total = records.reduce((sum,r)=>sum+r.amount,0);
  return `✅ ${type}完成\n\n填表人：${user.name}\n合計：${total} 元\n筆數：${records.length}\n備註：${s.note || "無"}`;
}
async function handleFlow(event,text,user) {
  const s = sessions.get(user.id);
  if (!s) return false;
  if (text==="取消") { sessions.delete(user.id); await replyText(event.replyToken,"已取消本次操作。"); return true; }
  if (text==="確認") { const msg=await saveSession(user,s); sessions.delete(user.id); await replyText(event.replyToken,msg); return true; }

  if (s.flow===FLOW.PAYMENT) {
    if (s.step===0) {
      const amount=toNumber(text);
      if (amount===null || amount<=0) { await replyText(event.replyToken,"請輸入正確交款金額，例如：5000"); return true; }
      s.amount=amount; s.step=1; sessions.set(user.id,s);
      await replyText(event.replyToken,"請輸入備註。沒有備註請輸入 0。"); return true;
    }
    if (s.step===1) {
      s.note = text==="0" ? "" : text; s.step="confirm"; sessions.set(user.id,s);
      await replyMessages(event.replyToken,[confirmMessage(summarizeSession(s))]); return true;
    }
  }

  if (s.flow===FLOW.INCOME || s.flow===FLOW.EXPENSE) {
    if (typeof s.step==="number" && s.step<s.items.length) {
      const amount=toNumber(text);
      if (amount===null) { await replyText(event.replyToken,"請輸入數字，例如：500。沒有請輸入 0。"); return true; }
      const item=s.items[s.step]; s.amounts[item]=amount; s.step += 1; sessions.set(user.id,s);
      if (s.step<s.items.length) { await replyText(event.replyToken,`${s.items[s.step]}金額？`); return true; }
      await replyText(event.replyToken,"請輸入備註。沒有備註請輸入 0。"); return true;
    }
    if (s.step===s.items.length) {
      s.note = text==="0" ? "" : text; s.step="confirm"; sessions.set(user.id,s);
      await replyMessages(event.replyToken,[confirmMessage(summarizeSession(s))]); return true;
    }
  }
  return false;
}
function formatSummary(title,s) {
  return `📊 ${title}\n\n收入：${s.income} 元\n支出：${s.expense} 元\n結餘：${s.balance} 元\n\n交款：${s.payment} 元\n未交：${s.unpaid} 元`;
}
async function handleEvent(event) {
  if (event.type!=="message" || event.message.type!=="text") return;
  const text = event.message.text.trim();
  const user = await getUser(event);
  try {
    if (await handleFlow(event,text,user)) return;
    if (text==="選單" || text==="功能") return replyMessages(event.replyToken,[mainMenuMessage()]);
    if (text==="收入" || text==="💰 收入") return replyText(event.replyToken,startIncome(user.id));
    if (text==="支出" || text==="💸 支出") return replyText(event.replyToken,startExpense(user.id));
    if (text==="交款" || text==="🏦 交款") return replyText(event.replyToken,startPayment(user.id));
    if (text==="今天" || text==="今日") return replyText(event.replyToken,formatSummary("今日統計",await getSummary("today")));
    if (text==="本月" || text==="月報") return replyText(event.replyToken,formatSummary("本月統計",await getSummary("month")));
    if (text==="我的未交") {
      const s=await getSummary("month",user.id);
      return replyText(event.replyToken,`👤 我的未交\n\n填表人：${user.name}\n\n本月收入：${s.income} 元\n本月交款：${s.payment} 元\n尚未繳交：${s.unpaid} 元`);
    }
    return;
  } catch(err) {
    console.error(err); sessions.delete(user.id);
    return replyText(event.replyToken,`❌ 操作失敗\n\n原因：${err.message}\n\n請輸入「選單」重新操作。`);
  }
}
const port = process.env.PORT || 3000;
app.listen(port,()=>console.log(`BadmintonBot V5 Lite 1.1 running on port ${port}`));
