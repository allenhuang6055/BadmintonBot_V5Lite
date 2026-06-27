const { getSummary } = require("../services/googleSheet");

function isTodayQuery(text) { return text === "今天" || text === "今日"; }
function isMonthQuery(text) { return text === "本月" || text === "月報"; }
function isMyUnpaidQuery(text) { return text === "我的未交"; }

function formatSummary(title, s) {
  return `📊 ${title}\n\n收入：${s.income} 元\n支出：${s.expense} 元\n結餘：${s.balance} 元\n\n交款：${s.payment} 元\n未交：${s.unpaid} 元`;
}

async function handleTodayQuery() { return formatSummary("今日統計", await getSummary("today")); }
async function handleMonthQuery() { return formatSummary("本月統計", await getSummary("month")); }

async function handleMyUnpaidQuery(user) {
  const s = await getSummary("month", user.id);
  return `👤 我的未交\n\n填表人：${user.name}\n\n本月收入：${s.income} 元\n本月交款：${s.payment} 元\n尚未繳交：${s.unpaid} 元`;
}

module.exports = { isTodayQuery, isMonthQuery, isMyUnpaidQuery, handleTodayQuery, handleMonthQuery, handleMyUnpaidQuery };
