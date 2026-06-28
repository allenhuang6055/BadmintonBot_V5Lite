const { getSummary, getCurrentStock } = require("../services/googleSheet");

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
