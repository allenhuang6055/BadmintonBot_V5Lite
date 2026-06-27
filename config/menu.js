function mainMenuMessage() {
  return {
    type: "text",
    text: `🏸 健好羽球記帳\n\n請選擇功能👇`,
    quickReply: {
      items: [
        { type: "action", action: { type: "message", label: "💰 收入", text: "收入" } },
        { type: "action", action: { type: "message", label: "💸 支出", text: "支出" } },
        { type: "action", action: { type: "message", label: "🏦 交款", text: "交款" } },
        { type: "action", action: { type: "message", label: "📊 今天", text: "今天" } },
        { type: "action", action: { type: "message", label: "📅 本月", text: "本月" } },
        { type: "action", action: { type: "message", label: "👤 我的未交", text: "我的未交" } }
      ]
    }
  };
}

function confirmMessage(text) {
  return {
    type: "text",
    text,
    quickReply: {
      items: [
        { type: "action", action: { type: "message", label: "✅ 確認", text: "確認" } },
        { type: "action", action: { type: "message", label: "❌ 取消", text: "取消" } }
      ]
    }
  };
}
module.exports = { mainMenuMessage, confirmMessage };
