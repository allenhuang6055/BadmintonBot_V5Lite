# 健好羽球 V5 Lite

## Google Sheet 三個分頁

### LINE資料庫
第一列欄位：
日期｜時間｜LINE_ID｜填表人｜類型｜項目｜金額｜備註｜狀態｜建立時間

### 項目設定
第一列欄位：
類型｜項目｜啟用

範例：
收入｜零打｜TRUE
收入｜球券｜TRUE
收入｜會員｜TRUE
收入｜其他｜TRUE
支出｜買球｜TRUE
支出｜場租｜TRUE
支出｜聚餐｜TRUE
支出｜其他｜TRUE

### 幹部名單
第一列欄位：
LINE_ID｜姓名｜權限｜啟用

## 本機啟動
cd /d C:\BadmintonBot_V5Lite
npm install
node bot.js
