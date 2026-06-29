# 健好羽球 LINE Bot V8.1 群組通知版

本版以目前可正常運作的 V8 專案為基礎，只新增群組通知功能。

## V8.1 新增

- 在球隊群組輸入 `群組ID`，Bot 會回覆群組 ID。
- Render Environment 加入 `LINE_GROUP_ID` 後，幹部私訊 Bot 記帳完成會自動通知球隊群組。
- 沒有設定 `LINE_GROUP_ID` 時，原本收入、支出、交款功能仍可正常使用，不會報錯。

## 部署

覆蓋原本 `C:\BadmintonBot_V5Lite` 後：

```bat
cd /d C:\BadmintonBot_V5Lite
git add .
git commit -m "Upgrade to V8.1 group notify"
git push
```

## 設定群組通知

1. 把官方帳號 Bot 加入球隊群組。
2. 在球隊群組輸入：

```text
群組ID
```

3. Bot 會回覆一串 `Cxxxxxxxxxxxx`。
4. 到 Render → Environment 新增：

```text
LINE_GROUP_ID=剛剛取得的群組ID
```

5. Save Changes，等 Render 重新部署 Live。

## 測試

私訊 Bot：

```text
零打：100
耗球：1
備註：V8.1測試
```

成功後：

1. 私訊會回覆記帳完成。
2. 球隊群組會收到記帳通知。
