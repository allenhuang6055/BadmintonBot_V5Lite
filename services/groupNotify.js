function hasGroupId() {
  return Boolean(process.env.LINE_GROUP_ID && process.env.LINE_GROUP_ID.trim());
}

async function pushGroupMessage(client, text) {
  if (!hasGroupId()) {
    console.log("GROUP_NOTIFY_SKIPPED: LINE_GROUP_ID is empty");
    return false;
  }

  await client.pushMessage({
    to: process.env.LINE_GROUP_ID.trim(),
    messages: [
      {
        type: "text",
        text,
      },
    ],
  });

  console.log("GROUP_NOTIFY_SENT");
  return true;
}

function buildGroupNotice(kind, user, resultText) {
  const titleMap = {
    income: "📢 收入記帳通知",
    expense: "📢 支出記帳通知",
    payment: "📢 交款通知",
  };

  const title = titleMap[kind] || "📢 記帳通知";

  return `${title}

填表人：${user.name}

${resultText}`;
}

module.exports = {
  pushGroupMessage,
  buildGroupNotice,
};
