# 健好羽球 LINE Bot V8.2 群組查詢與每日報表版

## 新增功能

在群組輸入：

```text
今天
```

Bot 回覆今日收支、耗球、庫存。

```text
庫存
```

Bot 回覆目前剩餘幾桶幾顆。

```text
月報
```

Bot 回覆本月收入、支出、盈餘、耗球、庫存。

另外可設定每日晚上 10 點自動推送今日財務摘要到群組。

## Render Environment

```text
LINE_GROUP_ID=C6bf48da7ba1ea9a81f9ef4bb36f141a7
DAILY_REPORT_ENABLED=true
DAILY_REPORT_TIME=22:00
```

## 部署

```bat
cd /d C:\BadmintonBot_V5Lite
npm install
git add .
git commit -m "Upgrade to V8.2 group query daily report"
git push
```

Render Logs 應看到：

```text
DAILY_REPORT_ENABLED: 22:00 Asia/Taipei
BadmintonBot V8.2 running on port 10000
```

注意：Render Free 方案如果服務休眠，每日固定時間報表可能不會準時送出；群組查詢與記帳通知不受影響。
