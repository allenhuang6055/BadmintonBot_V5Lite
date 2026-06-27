function mainMenuMessage() {
  return {
    type: "text",
    text:
`🏸 健好羽球記帳

請選擇功能👇`,
    quickReply: {
      items: [
        { type: "action", action: { type: "message", label: "💰 收入", text: "收入" } },
        { type: "action", action: { type: "message", label: "💸 支出", text: "支出" } },
        { type: "action", action: { type: "message", label: "🏦 交款", text: "交款" } },
        { type: "action", action: { type: "message", label: "📊 今天", text: "今天" } },
        { type: "action", action: { type: "message", label: "📅 本月", text: "本月" } },
        { type: "action", action: { type: "message", label: "👤 我的未交", text: "我的未交" } },
      ],
    },
  };
}

module.exports = { mainMenuMessage };
