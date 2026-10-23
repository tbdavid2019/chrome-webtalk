# AGENTS.md

## 專案交付與版本同步規則

每次完成可見功能、功能修正或發版相關工作時，不能只修改程式碼。交付前必須依序檢查並完成以下基本動作：

1. 根據變更類型更新 `package.json` 的 `version`（**鐵律：每改一次程式碼就必須推進一個新版本號，嚴禁在連續修改中沿用舊版號**）：
   - patch：修正錯誤或小幅調整，例如 `2.3.0` → `2.3.1`
   - minor：新增向後相容功能，例如 `2.2.0` → `2.3.0`
   - major：有破壞性變更時才使用。
2. 在 `CHANGELOG.md` 最上方新增相同版本與日期，記錄 Added、Changed、Fixed 及 Build 內容。
3. 更新 `README.md`：同步近期更新、使用方式、權限或限制，以及使用者可感知的功能變更。
4. 重新產生建置輸出：
   - Chrome Extension：`pnpm build:chrome`
   - 需要上架 ZIP 時，再執行：`pnpm pack:chrome`
5. 驗證產出物：確認 `output/chrome-mv3/manifest.json` 的 `version` 與 `package.json` 一致，並確認必要檔案存在。
6. 執行品質檢查：至少執行 `pnpm check`、`pnpm test` 與 `git diff --check`；涉及 Chrome 內容腳本時也必須執行 `pnpm build:chrome`。
7. 檢查 manifest 權限是否因功能變更而意外增加；若新增權限，必須在 README、CHANGELOG 和交付說明中明確記錄原因。
8. 最終回覆必須明確說明：版本號、是否更新 CHANGELOG/README、是否產生 output，以及驗證結果。

`output/` 通常被 Git ignore，因此不能只用 Git 狀態判斷是否已產出；必須直接檢查檔案與 manifest 內容。

## 本專案的使用者偏好

- 回覆使用繁體中文。
- **全面統一使用 Lucide Icons (`lucide-react`)**：專案內所有介面圖示（包含按鈕、導航、狀態列、空狀態、在線人數、主題切換等）一律全面使用 `lucide-react`，嚴禁使用 Emoji 作為 UI 圖示，嚴禁混用風格不一致或老舊的自定義 SVG 圖示。圖示維持統一線條美感（strokeWidth 1.75~2）。
- 不支援 WebMCP 的分頁應保持安靜，不顯示干擾性提示。
- 不要為了列出完整系統字型而擅自新增 Chrome 權限；若要使用 Local Font Access，必須先說明權限與隱私影響。
