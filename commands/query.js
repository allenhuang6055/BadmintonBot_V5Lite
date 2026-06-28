const {
  getSummary,
  getCurrentStock,
  formatStock,
} = require("../services/googleSheet");

function formatSummary(title, s, stock = null) {
  return `\ud83d\udcca ${title}

\u6536\u5165\uff1a${s.income} \u5143
\u652f\u51fa\uff1a${s.expense} \u5143
\u76c8\u9918\uff1a${s.profit} \u5143

\u4ea4\u6b3e\uff1a${s.payment} \u5143
\u672a\u4ea4\uff1a${s.unpaid} \u5143
\u8017\u7403\uff1a${s.ballsUsed} \u9846${stock === null ? "" : `\n\u5eab\u5b58\uff1a${formatStock(stock)}`}`;
}

async function handleToday() {
  const s = await getSummary("today");
  const stock = await getCurrentStock();
  return formatSummary("\u4eca\u65e5\u7d71\u8a08", s, stock);
}

async function handleMonth() {
  const s = await getSummary("month");
  const stock = await getCurrentStock();
  return formatSummary("\u672c\u6708\u7d71\u8a08", s, stock);
}

async function handleMyUnpaid(user) {
  const s = await getSummary("month", user.id);

  return `\ud83d\udc64 \u6211\u7684\u672a\u4ea4

\u586b\u8868\u4eba\uff1a${user.name}

\u672c\u6708\u6536\u5165\uff1a${s.income} \u5143
\u672c\u6708\u4ea4\u6b3e\uff1a${s.payment} \u5143
\u5c1a\u672a\u4ea4\u56de\uff1a${s.unpaid} \u5143`;
}

async function handleStock() {
  const stock = await getCurrentStock();

  return `\ud83c\udff8 \u7fbd\u7403\u5eab\u5b58

\u76ee\u524d\u5269\u9918\uff1a${formatStock(stock)}

\u63d0\u9192\uff1a\u8017\u7403\u8acb\u5728\u300c\u6536\u5165\uff0b\u8017\u7403\u300d\u6a21\u677f\u4e00\u8d77\u8f38\u5165\u3002`;
}

module.exports = {
  handleToday,
  handleMonth,
  handleMyUnpaid,
  handleStock,
};const { getSummary, getCurrentStock } = require("../services/googleSheet");

function formatSummary(title, s, stock = null) {
  return `📊 ${title}

收入：${s.income} 元
支出：${s.expense} 元
盈餘：${s.profit} 元

交款：${s.payment} 元
未交：${s.unpaid} 元
耗球：${s.ballsUsed} 顆${stock === null ? "" : `\n庫存：${stock} 顆`}`;
}

async function handleToday() {
  const s = await getSummary("today");
  const stock = await getCurrentStock();
  return formatSummary("今日統計", s, stock);
}

async function handleMonth() {
  const s = await getSummary("month");
  const stock = await getCurrentStock();
  return formatSummary("本月統計", s, stock);
}

async function handleMyUnpaid(user) {
  const s = await getSummary("month", user.id);
  return `👤 我的未交

填表人：${user.name}

本月收入：${s.income} 元
本月交款：${s.payment} 元
尚未交回：${s.unpaid} 元`;
}

async function handleStock() {
  const stock = await getCurrentStock();
  return `🏸 羽球庫存

目前剩餘：${stock} 顆

提醒：耗球請在「收入＋耗球」模板一起輸入。`;
}

module.exports = { handleToday, handleMonth, handleMyUnpaid, handleStock };
