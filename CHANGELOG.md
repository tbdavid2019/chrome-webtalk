# CHANGELOG

## [2.8.8] - 2026-10-28

### Added

- 無新增使用者功能。

### Changed

- 將 lodash、lodash-es 更新至 4.18.1，並將 `@ungap/structured-clone` 更新至 1.4.0。
- 將 Node.js 最低版本同步調整為 20.19.0，符合 WXT 與 vite-node 工具鏈需求。

### Fixed

- 移除 lockfile 中被 npm 標示為不建議使用的 lodash 4.18.0 版本。
- 修補 `@ungap/structured-clone` 1.2.0 的棄用安全警示。

### Build

- 版本升級至 `2.8.8`。
- 未新增 Chrome 權限。

## [2.8.7] - 2026-10-28

### Added

- 無新增使用者功能。

### Changed

- 更新 Dependabot 警示相關套件，包含 Vite 6.4.4、WXT 0.20、Valibot、Handlebars、undici、tar、node-forge、moment 與轉移相依套件。
- 將 WXT 匯入路徑與瀏覽器型別遷移至 0.20 API。

### Fixed

- 修補相依套件掃描辨識且已有安全版本的弱點。

### Build

- 版本升級至 `2.8.7`。
- 未新增 Chrome 權限。

## [2.8.6] - 2026-10-26

### Fixed

- 修正 AI 服務回傳 HTML 或其他非 JSON 錯誤內容時，只顯示 JSON 解析錯誤的問題。
- 修正 Base URL 以 `/models/` 結尾時，聊天請求端點路徑錯誤的問題。

### Build

- 版本升級至 `2.8.6`。
- 未新增 Chrome 權限。

## [2.8.5] - 2026-10-26

### Fixed

- 修正已選擇的非 Groq 供應商在 Key 為空時，可能誤用 Groq 起始 Key 的問題。
- 修正 API 設定載入完成前按「重設」會清空預填 Groq Key 的問題。

### Build

- 版本升級至 `2.8.5`。
- 未新增 Chrome 權限。

## [2.8.4] - 2026-10-26

### Added

- 新安裝預填免費 Groq 起始 API Key，讓使用者可先體驗 AI 摘要與對話。
- 為各供應商分別保存 API Key、Base URL、文字與視覺模型，切換後可回復該供應商設定。

### Changed

- 保留內附 Groq 起始額度；額度用完或 Key 失效時，可改用自己的 Groq Key 或切換其他 BYOK 供應商。
- Embed proxy 模式隱藏不會生效的 BYOK 設定入口；模型清單錯誤可讀取非 JSON HTTP 回應狀態。

### Fixed

- 修正多供應商設定更新時意外移除免費 Groq 起始 Key 的問題。
- 新增 API 設定遷移、供應商設定保留、模型清單解析與短連線測試的單元測試。

### Build

- 版本升級至 `2.8.4`。
- 未新增 Chrome 權限。

## [2.8.3] - 2026-10-26

### Added

- BYOK 支援 Groq、Google Gemini、xAI Grok、OpenAI API、DeepSeek、OpenRouter，以及自訂 OpenAI 相容端點。
- 新增「取得模型」功能，以目前供應商的 API Key 載入可用模型，並可套用到文字與視覺模型欄位。

### Changed

- API Key 欄位會隨供應商切換；切換供應商時清空舊 Key 與模型，避免把憑證送到錯誤服務。
- 多供應商設定明確區分 OpenAI API 費用與 ChatGPT 訂閱。
- API 錯誤訊息改為通用 AI 服務設定說明。

### Fixed

- 修正 AI 設定介面僅能設定 Groq，無法使用其他 OpenAI 相容服務的限制。

### Build

- 版本升級至 `2.8.3`。
- 未新增 Chrome 權限。

## [2.8.2] - 2026-10-26

### Added

- BYOK API 設定保存後自動發送短測試請求，驗證 API Key、Base URL 與文字模型，並回報測試結果。
- 測試請求限制輸出長度並設有 15 秒逾時；保存成功與連線測試失敗會分開顯示。

### Changed

- AI 空間與 Options 設定頁的按鈕改為「保存並測試」，測試失敗時保留設定畫面以便修正。

### Fixed

- 修正 API 設定保存成功後無法立即確認金鑰／模型是否可用的問題。

### Build

- 版本升級至 `2.8.2`。
- 未新增 Chrome 權限。

## [2.8.1] - 2026-10-26

### Added

- BYOK API 設定提供本機保存，讓個人 API Key 不會透過 Chrome Sync 同步到其他裝置。

### Fixed

- 修正 BYOK API 設定因 Chrome Sync 儲存限制而無法保存的問題；API 金鑰與模型設定改存本機 `storage.local`。
- 首次載入時相容讀取舊版 `storage.sync` 設定，成功遷移後清除舊同步項目；不新增 Chrome 權限。

### Changed

- Options 與 AI 空間共用同一套 API 設定讀寫流程，避免兩處設定不一致。

### Build

- 版本升級至 `2.8.1`。
- 未新增 Chrome 權限。

## [2.8.0] - 2026-10-23

### Fixed

- **CSS Reset `all: initial !important` 排序錯誤修復 (`src/assets/styles/tailwind.css`)**：
  - 修正 `:host` 中 `all: initial !important` 位於字型與顏色定義之後，導致 Shadow DOM 內部元件繼承 `initial` 預設字型（宋體 / 明體 / Times New Roman）的問題。
  - 重構為優先執行 `all: initial !important`，並依序定義 `direction: ltr !important`、`visibility: visible !important`、`--font-ui`、14px 字級、1.5 行高、文字與背景顏色，且為 `#root, #app, *, *::before, *::after` 明確套用 `font-family: var(--font-ui)` 與 `box-sizing: border-box`。
- **Chromium Shadow DOM `@font-face` 穿透與字型字重支援**：
  - 在 `src/assets/styles/tailwind.css` 與 `src/app/content/index.tsx` 將 `@font-face` 的 `font-weight: 500` 調整為 `font-weight: 300 500`，使 400 (Normal) 與 500 (Medium) 原生套用內建字型檔不退回宋體，同時保留 600/700 粗體合成（Synthetic Bold）層次感。
  - 在 content script 初始化時將字型樣式同步注入宿主網頁 `document.head`（`#webtalk-font-faces`），徹底解決 Chromium Shadow DOM 內部 `@font-face` 被瀏覽器引擎忽略導致的字型降級問題。
- **字型堆疊、自訂字型偏好與等寬程式碼區塊保護**：
  - 移除 `--font-ui`、`fontFamily.sans` 及 `DISPLAY_FONT_FAMILY_VALUES.webtalk` 最前端的 `JetBrainsMono`，改為以 `var(--font-ui)` 與 `GenJyuuGothic` 優先搭配系統無襯線字型，避免等寬英文字型與 CJK 混排產生字級落差與跳動，並完整保留使用者 `displayFontFamily` 字型偏好切換能力。
  - 在 `tailwind.css` 的 `@layer base` 明確宣告 `code, kbd, samp, pre` 的 `JetBrainsMono` 等寬字型，並於 `SummaryPanel` 統一改用 `<Markdown>` 元件取代 `dangerouslySetInnerHTML`。
  - 在 `App.tsx` 的 `#app` 根節點行內明確指定 `fontFamily: 'var(--font-ui)'`。
- **HSL CSS 變數無效 Alpha 語法修復**：
  - 修正 `--border`、`--input`、`--ring`、`--saffron-light` 內嵌 `/ alpha` 導致 Tailwind 編譯 `border-border/60` 產生無效 CSS `hsl(... / ... / ...)` 造成瀏覽器退回純黑線框（currentColor）的語法錯誤，全面回歸純淨 HSL 數值（`--border: 43 52% 66%` 等）。

### Changed

- **100% 視覺對齊 `david888.com` 與 `2md.aiurl.tw` 經典設計風格**：
  - **浮動主面板（AppMain / SummaryPanel）**：加入標誌性左側立體深藍輪廓（`border-l-2 border-[#17324d] dark:border-[#2b4a6b]`）與多層次柔和深邃陰影（`shadow-[-12px_0_36px_rgba(23,50,77,0.16)]`）。
  - **頂部 Header**：統一採用 3px 藏紅金識別頂線、暖奶油背景、`[15px]` 粗體無襯線網域標題，以及經典微立體膠囊控制按鈕（`border-[1.5px] border-[#17324d] bg-[#fffefa] shadow-[0_2px_0_#17324d]`）。
  - **空狀態卡片（MessageList / SummaryPanel）**：對齊基準卡片設計，採用溫潤暖底 `bg-[#faefd4]/85`、左側暖陶土/藏紅雙重立體飾邊（`border-[1.5px] border-[#d6bc7c] border-l-4 border-l-[#a9471d] dark:border-[#2b4a6b] dark:border-l-4 dark:border-l-[#ffb010]`）、藏紅圖示徽章與 `[15px]` 標題。
  - **推薦話題與問題膠囊**：全面採用品牌藏紅膠囊按鈕（`border-[1.5px] border-[#17324d] bg-[#ffb010] text-[#2b251a] shadow-[0_2px_0_#17324d]`），懸停微浮動反饋。
  - **輸入框與送出按鈕**：採用高對比純白輸入底框（`border-2 border-[#17324d] bg-[#fffefa]`）搭配沈穩深藍主要送出按鈕（`bg-[#17324d] text-[#fff9e8] shadow-[0_2px_0_#0f2337]`）。
  - **模式切換器（PanelModeSwitch）**：全面採用暖色圓角外框與深藍/藏紅雙態切換膠囊。

### Build

- 版本升級至 `2.8.0`。
- 通過 TypeScript 類型檢查與所有單元測試（47/47 passed），未新增任何 Chrome 擴充功能權限。

## [2.7.0] - 2026-10-23

### Added

- **宿主網頁環境與背景智慧感知（Host-Aware Adaptive Theme）**：
  - 全面升級 `src/utils/checkDarkMode.ts`，實作四層環境感知瀑布流：
    1. **第 1 層（顯式 DOM 標記）**：透過 `parseThemeToken` 詞彙邊界正規表達式檢查 `document.documentElement` 與 `document.body` 的 `classList`（`dark`/`light` 等）以及自訂主題屬性（`data-theme`、`data-color-mode`、`data-bs-theme` 等）。
    2. **第 2 層（行內與 Computed `color-scheme`）**：支援 `dark`、`light`、`only dark`、`only light` 設定，並自動跳過雙向 `light dark` 宣告。
    3. **第 3 層（真實背景色光學亮度演算）**：依序讀取 `body`、`documentElement` 與 SPA 根容器（`#app, #root, #__next, main`）背景色，將半透明色與白底合成後計算 ITU-R BT.601 感知亮度 `(0.299 * r + 0.587 * g + 0.114 * b) / 255`，`L < 0.5` 智慧判別為深色模式。
    4. **第 4 層（作業系統偏好兜底）**：回退至 `prefers-color-scheme: dark` 媒體查詢。
  - 新增 `subscribeDarkModeChange` 工具函式，結合 `MutationObserver`（含延遲掛載 `body` 自動補綁與 `requestAnimationFrame` 去重節流）與 `matchMedia`，當宿主網站（如 david888.com）切換主題時同一毫秒即時自動同步。
  - 新增 `src/utils/checkDarkMode.test.ts` 單元測試，嚴格驗證詞彙邊界比對、RGB 色彩解析、半透明白底合成、感知亮度演算與訂閱清理。
- **Multiplayer 零雜訊在線狀態哲學（Zero-Noise Presence）**：
  - 聊天面板 Header 在僅有自己一人在線（`chatUserList.length <= 1`）時保持極致純淨，完全隱藏在線人數膠囊、數字與圓點。
  - 僅當有其他訪客（`chatUserList.length >= 2`）時，優雅顯示精緻的 Lucide `<UsersIcon size={13} strokeWidth={1.8} />` 與人數標籤，點擊開啟在線成員清單與私聊視窗。

### Changed

- **頂級毛玻璃與 Bento 品牌 Header（2026 Linear / Arc 級別）**：
  - 摒棄整片塗滿的色塊，全面改採現代高級毛玻璃面板（`backdrop-blur-xl bg-background/90 border-b border-border/60`）搭配頂部 Saffron `#ffb010` 藏紅金 2px 髮絲級光暈識別線。
  - 左側 Favicon 圓角容器與網域名稱採用 JetBrains Mono 等寬字型（`font-mono text-xs font-semibold tracking-tight text-foreground`）。
  - 右側整合為精緻的一體化 Action Capsule 控制組（主題切換、多人在線狀態、關閉按鈕）。
- **AI 摘要面板（SummaryPanel）同步升級**：
  - 同步換裝為頂級毛玻璃 + Saffron 髮絲光暈 Header，語言切換採用微型 Segmented Control，空狀態引導與操作按鈕全面換用標準 Lucide Icons。

### Fixed

- 修正 Options 設定頁面與 History 歷史紀錄頁面在主題為 `system` 時深淺色自動偵測與動態同步問題。
- 修正 `checkDarkMode` 顯式屬性詞彙邊界比對（避免將 `highlight`、`twilight` 誤判為 `light`）。
- 修正 Light Mode 下 `--primary` 文字對比度，維持 Deep Blue `#17324d`（13.13:1 WCAG AAA）與 Dark Mode Saffron `#ffb010`（9.69:1 WCAG AAA）。
- 修正 `SummaryPanel` 在窄視窗（`< 440px`）下的 `max-w-full` 響應式防溢位保護。

### Build

- 版本升級至 `2.7.0`。重新產出 Chrome Extension、ZIP 離線包及 Embed 產出物，通過 47/47 單元測試與 Dual-Code-Review（Codex CLI + OpenCode CLI），無新增任何非必要權限。

## [2.6.0] - 2026-10-23

### Added

- 新增作業系統深淺色模式動態監聽、面板頂部深淺切換按鈕，以及於 `AGENTS.md` 明訂全面採用 `lucide-react` 規範。

### Changed

- 調整預設字型堆疊順序為 `'JetBrainsMono', 'GenJyuuGothic'`，並將懸浮工具列全面換裝為 Lucide 圖示。

### Build

- 版本升級至 `2.6.0`，未新增任何 Chrome 權限。

## [2.5.0] - 2026-10-23

### Added

- **全面導入 david888.com 與 2md.aiurl.tw 品牌經典設計體系**：
  - 整合品牌核心五色（Saffron 藏紅金 `#ffb010`、Deep Blue 沉穩海軍深藍 `#17324d`、Clay 暖陶土磚紅 `#a9471d`、Warm Cream 溫潤暖奶油 `#fff9e8`、Ink 濃墨黑炭 `#2b251a`）與畫布色 Canvas `#fff0cc`。
  - 在頂部 Header 與 AI 摘要面板置頂加入代表性的 Saffron 金黃漸層品牌識別線（`before:bg-gradient-to-r from-saffron via-saffron-hover to-saffron`）。
  - 將網站安裝指南（`index.html` 與 `en.html`）全面換裝為 david888.com / 2md.aiurl.tw 風格，包含品牌 Saffron 標籤、深藍外框程式碼區塊、溫潤卡片與導覽列。
  - 網頁版 HTML Meta `theme-color` 全面同步設定為品牌標準色 `#FFB010`。

### Changed

- **嚴格遵循 WCAG 2.1 對比度標準（AA 與 AAA 級全面達標）**：
  - **淺色模式（Light Mode）**：
    - 主文字（Ink `#2b251a`）於 Warm Cream 背景達成 **14.45:1** 對比度（遠超 WCAG AAA 的 7:1 標準）。
    - 次要文字（`#594e36`）於 Warm Cream 達成 **7.78:1**、於 Canvas 達成 **7.24:1**（全數通過 WCAG AAA）。
    - 主要互動元素採用 Deep Blue `#17324d`，前景色搭配 Warm Cream `#fff9e8` 達到 **13.13:1** 對比度（通過 AAA）。
    - 徹底消除「黃底白字」無障礙地雷：在藏紅金 Saffron `#ffb010` 上的所有文字一律使用 Ink `#2b251a` 或 Deep Blue `#17324d`，達成 **8.30:1** 之 AAA 級高對比。
    - 陶土紅 Clay `#a9471d` 於 Warm Cream 達成 **5.54:1** 對比度（通過 WCAG AA）。
  - **深色模式（Dark Mode）**：
    - 主文字 Warm Cream Ink `#fff9e8` 於 Dark Canvas `#0c1927` 達成 **16.86:1**（通過 AAA），於 Dark Surface `#13273c` 達成 **14.44:1**（通過 AAA）。
    - 次要文字 Slate `#cbd5e1` 於 Dark Canvas 達成 **11.95:1**（通過 AAA）。
    - 主要色 Saffron `#ffb010` 於暗色畫布達成 **9.69:1**（通過 AAA），其內部文字一律使用深墨黑 `#0b1826`（**9.78:1**，通過 AAA）。
    - 次要色 Sky Blue `#7cc2ff` 達成 **7.97:1**（通過 AAA）。
- **網頁版與 Chrome Extension 視覺完全同步**：
  - 更新 Tailwind 設計 Token、Sonner Toast 彈窗樣式、選項頁面（Options）與歷史紀錄頁面（History），所有端點維持單一美學體驗。
  - 將 Markdown 與設定表單內的低對比藍色連結改為具備底線、通過 WCAG AAA 的高可視度 `text-primary` 連結。
  - 補強各個互動按鈕的鍵盤聚焦指示環（`focus-visible:ring-2 focus-visible:ring-ring`），提升鍵盤導航可訪問性。
- **全面統一字體大小階層，消除字級忽大忽小與任意數值割裂**：
  - 徹底清除所有零散的任意硬編碼微小字級（`text-[10px]`、`text-[10.5px]`、`text-[11.5px]`、`text-[13.5px]`、`text-[15px]`、`text-[0.72em]`、`text-[0.78em]`、`text-[0.9em]` 等）。
  - 建立嚴謹協調的兩大核心閱讀級距：
    - **正文與輸入階層（14px, `text-sm leading-relaxed`）**：訊息氣泡、輸入框打字、Markdown 渲染、AI 摘要與追問全面統一為 14px，打字與送出閱讀體感完全無縫一致。
    - **次要標籤與元數據階層（12px, `text-xs`）**：時間戳記、微型徽章（AI / 私聊 / 在線人數）、標題副標、WebMCP 工具項目全面統一為 12px，不再有低於 12px 的極小字，杜絕視覺突兀感。
    - **標題階層（14px, `text-sm font-semibold`）**：面板頂部標題與各分區標題維持舒適比例。

### Fixed

- 修正 Markdown 內超連結、API 設定申請連結與歷史紀錄卡片文字在不同主題下對比度不足（舊為 `text-blue-500` / `text-slate-500`）的問題。
- 修正 Sonner 浮動提示框在深淺色模式下無法完全融入品牌主色的問題。
- 修正輸入框計數字數與提示文字在接近上限時的色差警告對比度。

### Build

- Chrome Extension 與網站 Embed 建置版本同步至 2.5.0；未新增任何 Chrome 權限。
- 通過自動化單元測試（39/39 passed）、TypeScript 語法檢查與 WCAG 嚴格色彩比對測試。

### Changed

- **頂部 Header 視覺重塑與美學提升**：
  - 將右上角人數指示器重構為在線狀態膠囊（Presence Capsule），整合呼吸綠燈動畫、即時在線人數與觸控回饋，點擊流暢展開在線成員名單。
  - 右上角關閉按鈕（X）調整為等高 32px 圓形按鈕（`rounded-full`），與在線膠囊垂直對齊且具備觸覺動效，消除生硬的方形外框。
  - 左上角網站圖標以圓角容器（`rounded-xl border bg-muted/30 shadow-2xs`）襯托，提升精緻感與識別度。
  - 提升標題與子標題字級層次，網域名稱採乾淨比例無襯線字型，子標題平穩展示網頁標題或私聊對象，並將 Header 高度調整為 56px（`h-14`），給予舒適視覺呼吸空間。
- **全局字型堆疊與排版細節修復**：
  - 修正 `--font-ui` 與 WebTalk 預設字型堆疊順序，將 `GenJyuuGothic` 與比例無襯線字型優先排列，避免一般英文文字與網址被強制套用 JetBrains Mono 等寬字體導致字體混搭不協調。
  - 統一元件圓角體系，全面移除生硬的 `rounded-[4px]` 與 `rounded-[3px]`，改採系統一致的 `rounded-xl`、`rounded-lg`、`rounded-md` 與 `rounded-full`。
- **輸入區與推薦議題排版降噪**：
  - 消除輸入區卡片套卡片的多重邊框與混亂背景，將輸入框與底部工具列收斂為單一溫潤的輸入容器（`rounded-2xl`），具備聚焦微光反饋。
  - 推薦話題改採輕量膠囊 Pill 標籤，與整體拿鐵暖咖／紙墨色調深度融合。
  - 優化聊天室空狀態顯示，以細緻的 Lucide Sparkles 圖標與溫暖卡片引導使用者開啟對話。

### Fixed

- 修正頂部關閉按鈕與在線人數按鈕高度不一致（28px vs 32px）與邊框割裂的問題。
- 修正成員名單與私聊指示器硬編碼 Tailwind `slate` 與 `indigo` 色彩的問題，回歸統一的拿鐵暖咖主題色系變數。

### Build

- Chrome Extension 與網站 Embed 建置版本同步至 2.4.4；未新增 Chrome 權限。
- Wrangler 新增自訂網域 `webtalk.david888.com` 路由設定，已完成 Cloudflare Worker 部署。

## [2.4.3] - 2026-10-12

### Fixed

- 修正 Embed 聊天面板的 Grid 欄位受 Footer 內容最小寬度撐開，造成輸入框與右側按鈕超出可視區的問題。

### Build

- Chrome Extension 與網站 Embed 建置版本同步至 2.4.3；未新增 Chrome 權限。
- 產生 Chrome 安裝 ZIP；一般建置明確指定 Chrome、Embed 與 Firefox，避免同時執行 Cloudflare 預覽建置。

## [2.4.2] - 2026-10-12

### Added

- 新增 Cloudflare Worker 預覽部署，提供網站 Embed 靜態檔與安裝指南。
- 預覽 Worker 將 AI API 請求轉送至既有 Vercel API；Artico signaling 與 WebRTC DataChannel 維持原連線方式。

### Changed

- Wrangler 部署設定固定使用 DAVID江江江 Cloudflare 帳號，並只啟用 workers.dev 測試網域。

### Build

- Chrome Extension 與網站 Embed 建置版本同步至 2.4.2；未新增 Chrome 權限。
- 新增 pnpm deploy:worker:preview 建置並部署 Cloudflare Worker 預覽站。

## [2.4.1] - 2026-09-05

### Added

- 新增 Chrome 瀏覽器互動回歸測試，涵蓋兩種 Embed 的左右拖曳、短距離吸附、雙擊換邊及位置保存。

### Changed

- 左右換邊以拖曳範圍中點判定，與最近邊緣吸附的操作說明一致。

### Fixed

- 修正拖曳時畫面更新反覆將水平位移歸零，導致把手無法拖到另一側。
- 放開後重設水平位移，確保未換邊也能回到原側；拖曳期間不套用收合位移。
- 非左鍵不啟動拖曳，未拖曳時放開滑鼠不修改宿主頁面的游標與選取樣式。

### Build

- Chrome Extension 與網站 Embed 產出同步更新至 2.4.1；未新增 Chrome 權限。
- 新增 `pnpm test:browser`（先執行 `pnpm build:embed`，使用已安裝的 Google Chrome）。

## [2.4.0] - 2026-09-05

### Added

- **懸浮按鈕左右停靠位置設定**：在擴充功能設定頁（Options）新增「懸浮按鈕位置」選項，使用者可自由選擇將懸浮 Dock 停靠在螢幕「靠右（預設）」或「靠左」。
- **自由拖曳吸附（Drag & Snap）與雙擊快速換邊**：使用者可直接按住懸浮按鈕拖曳把手在螢幕上水平拖動，拖曳過半放開自動吸附至左側或右側；亦可直接按兩下（雙擊）拖曳把手立即切換左右兩邊，位置會自動記錄於本機儲存與使用者偏好。
- **網站 Embed 支援自訂停靠邊緣**：網站嵌入腳本新增 `data-webtalk-placement="left"` 參數與 `mount({ placement: 'left' })` 選項，供站長自訂初始停靠位置。
- **左右對稱樣式與互動動效**：懸浮按鈕停靠於左側時，外框圓角、按鈕圓角、Hover 滑出動效、關閉按鈕（X）及未讀小紅點均自適應對稱翻轉，避免遮擋左側螢幕邊界。

### Changed

- 懸浮按鈕設定項描述通用化，不再寫死「右側」，並在開啟懸浮按鈕時直觀展示停靠位置單選項目。
- 使用者偏好資料模型與同步儲存機制支援 `floatingButtonPlacement` 欄位。

### Build

- Chrome Extension 建置輸出版本更新為 `2.4.0`。
- 網站 Embed 產出物（`webtalk.js`、`webtalk-chat.js`）同步建置更新。
- 驗證 `output/chrome-mv3/manifest.json` 版本號一致。
- 未新增 Chrome Extension 權限。

## [2.3.2] - 2026-08-24

### Added

- **預設 Groq API Key 與後備支援**：內建預設 Groq API Key 與後備設定，安裝後即可直接體驗 AI 摘要與問答功能，並支援於設定頁自由切換自訂金鑰。

### Build

- Chrome Extension 建置輸出版本更新為 `2.3.2`。
- 產生上架用套件包 `output/web-talk-333-2.3.2-chrome.zip`。
- 未新增 Chrome Extension 權限。

## [2.3.1] - 2026-08-24

### Added

- 新增使用者資料的分離儲存機制，將頭像資料保存於本機儲存空間。

### Changed

- `storage.sync` 僅保存小型使用者設定，頭像與不同網站頭像改由 `storage.local` 保存。
- 保留舊版完整 UserInfo 的回讀相容性，使用者下次保存設定時會自動完成資料拆分。

### Fixed

- 修正 `Resource::kQuotaBytesPerItem quota exceeded`，避免使用者頭像使 `chrome.storage.sync` 單筆資料超過 8 KB 限制。

### Build

- Chrome Extension 建置輸出版本更新為 `2.3.1`。
- 未新增 Chrome Extension 權限。

## [2.3.0] - 2026-08-23

### Added

- **WebMCP 工具支援**：自動探索目前分頁提供的 WebMCP 工具，顯示工具名稱、用途描述、輸入 schema 與安全標註；網站未支援 WebMCP 時不顯示提示面板，避免打擾使用者。
- **WebMCP AI 工具呼叫**：AI 可依照目前網站提供的 WebMCP 工具進行多輪工具呼叫，並將工具結果帶回對話。
- **顯示字型設定**：使用者可以調整 WebTalk 面板字級，並選擇預設、系統、中文優先、襯線或等寬字型。

### Changed

- WebMCP 工具清單會監聽網站工具新增或移除事件並自動更新。
- WebMCP 面板預設摺疊並移至 AI 內容區下方，以低干擾的小型列呈現，避免搶過 AI 空間主要內容。
- 顯示字型設定使用作業系統字型堆疊，不新增 Chrome Extension 權限。

### Build

- 已產生 Chrome Extension `output/chrome-mv3`，版本 `2.3.0`。

## [2.2.1] - 2026-08-10

### Added

- **LLM & AI Agent Discovery (`llms.txt` / `llms-full.txt`)**:
  - 新增符合 `llmstxt.org` 標準規範之 `/llms.txt` 與完整架構檔 `/llms-full.txt`，供大語言模型與 AI Agents 自動檢索 WebTalk 頁面、Embed 參數與 AI Proxy 端點規格。
  - 於 `index.html`、`en.html` `<head>` 以及 `vercel.json` 注入 `Link: </llms.txt>; rel="llms-txt"; type="text/markdown"` 發現標頭與 `Content-Type` 屬性。

## [2.2.0] - 2026-07-24

### Changed

- **中英文預設字體全面升級 (Default Font Stack Upgrade)**：
  - 中文字體預設改用 `GenJyuuGothic` (源柔黑體 Medium, `GenJyuuGothic-Medium.woff2`)。
  - 英文字體預設改用 `JetBrainsMono` (JetBrains Mono Medium, `JetBrainsMono-Medium.woff2`)。
  - 更新 Shadow DOM、Tailwind CSS、Tailwind Config 以及 Vercel Embed 的字體載入與打包流程，確保 Extension 與 Vercel 部署頁面皆能完美載入新字體。
- **Chat 訊息資訊層級重整**：作者與時間移到訊息泡泡外，自己的訊息不再重複顯示姓名與「你」標籤；頁面來源縮成單行圖示與標題，操作列改為低干擾的 icon toolbar，降低資訊堆疊。
- **Chat / Summary 字體與泡泡統一**：兩個介面的正文統一為 15px／24px 行高，摘要、AI 回覆、聊天室訊息與輸入框共用相同密度、圓角及背景層級。
- **控制元件統一**：左下角 Chat / AI 切換改成與「繁／簡／En」語言切換相同的 segmented control；輸入工具與送出按鈕同步採用一致的方形圓角。
- **在線人數簡化**：右上角移除群組頭像圖示與浮動 badge，改為只顯示可點擊的在線人數數字。
- **Summary 操作列精簡**：重新摘要、複製、Markdown 與清除動作改用一致的 Lucide icon buttons，移除 emoji 與分隔線造成的視覺噪音。

### Build

- 已產生 Chrome Extension `output/chrome-mv3`，以及 Vercel Embed 使用的 `output/webtalk/webtalk.js` 與 `output/webtalk/webtalk-chat.js`。

## [2.1.9] - 2026-07-23

### Added

- **AI 模式推薦問題摺疊功能 (Collapsible Suggested Questions in AI Mode)**：
  - 在 AI 空間 ([SummaryPanel.tsx](file:///Users/david/Documents/git/tbdavid2019/chrome-webtalk/src/components/SummaryPanel.tsx)) 中將「推薦問題」標題區域改為可點擊摺疊/展開，並加入 Lucide `ChevronDown` 圖示，手機與窄版下保持極致簡潔的視覺介面。

## [2.1.8] - 2026-07-23

### Fixed

- **移除突兀的 1px 實線外框 (Remove Jarring 1px Borders)**：
  - 徹底移除對話氣泡卡片外層突兀的 `border` 1px 實線黑框（[MessageItem.tsx](file:///Users/david/Documents/git/tbdavid2019/chrome-webtalk/src/app/content/components/MessageItem.tsx)），改用自然的軟背景色調（`bg-primary/10`, `bg-amber-500/10`, `bg-muted/60`）配合 `shadow-xs` 質感。
  - 移除 AI 訊息內部提示框的硬邊框。
  - 軟化訊息列表容器與輸入框的邊框粗糙感（[MessageInput.tsx](file:///Users/david/Documents/git/tbdavid2019/chrome-webtalk/src/app/content/components/MessageInput.tsx) & [Footer/index.tsx](file:///Users/david/Documents/git/tbdavid2019/chrome-webtalk/src/app/content/views/Footer/index.tsx)）。

## [2.1.7] - 2026-07-23

### Changed

- **Chat UI 與 Summary UI 設計完全齊平 (UI Design Alignment)**：
  - 調整 Chat 模式的對話氣泡卡片風格與邊框圓角（`rounded-2xl`），讓對話卡片與 Summary Panel 視覺語言（`border-border bg-background shadow-sm`）100% 保持一致。
- **專案全 Icon 盤點與 Lucide 風格替換 (Icon Audit & Lucide Replacement)**：
  - 替換 `Header` 中的內聯自訂 Material SVG 圖示為 Lucide `UsersIcon`。
  - 替換 `MessageInput` 中的自訂 `loading.svg` 為 Lucide `Loader2` 旋轉圖示。
  - 替換 `Checkbox` 與 `RadioGroup` 中的 `@radix-ui/react-icons` 為 Lucide `CheckIcon`。
  - 替換 `BadgeList` 中的 `@radix-ui/react-icons` 為 Lucide `Github` 圖示。

## [2.1.6] - 2026-07-23

### Changed

- **Chat 模式字體與行高統一 (Font Size & Typography Alignment)**：
  - 將 Chat 模式對話訊息的字體大小由較小緊湊的 `text-[15px]` / `prose-sm` (14px) 提升統一為 `text-base` (16px) 與 `prose-base` (16px)，配合 `leading-relaxed` 行高，讓 Chat 模式擁有與 Summary 模式一樣舒適大方的閱讀體驗。

## [2.1.5] - 2026-07-23

### Fixed

- **滾輪向上滾動修復 (Critical Scroll Fix)**：
  - 移除 `App.tsx` 中包覆 `SummaryPanel` 外層的 `pointerEvents: 'none'` 父層 `<div>`。該屬性會導致瀏覽器在 Shadow DOM 命中測試 (Hit-testing) 時忽略面板並將滑鼠滾輪事件穿透傳送給底層網頁，致使滾輪無法向上滾動。
  - 修正 `useEffect` 自動滾動競爭條件（Race condition），僅在有新訊息或 AI 思考中時滾動至底部，防止生成摘要時 smooth scroll 動畫覆蓋 `scrollTop = 0`。
  - 隔離 `chatListRef` 的 `onWheel` 事件冒泡 (`stopPropagation`)。

## [2.1.4] - 2026-07-23

### Fixed

- **AI 空間直接提問響應**：修正 AI 空間在未產生摘要前直接輸入提問時，介面未自動切換對話清單而導致使用者感覺沒反應的問題。
- **網頁摘要 Prompt 修正**：修正摘要提示詞中硬編碼「影片」的錯誤，補全 `pageTitle` 與 `pageUrl` Context，並在摘要/提問時自動重新抓取頁面內容，確保 LLM 正確理解網頁與文章。
- **滾動定位與 Shadow DOM 滾動鎖死**：移除 `overscroll-y-contain`，並在完成網頁濃縮時自動定位至頂端（`scrollTop = 0`），解決鼠標無法向上滾動問題。
- **Chat 模式邊界擠壓防護**：修正面板最外層容器 `AppMain` 缺乏 `overflow-hidden` 以及底部控制欄在狹窄側邊欄（如 380px）時，按鈕推擠導致右側發送按鈕溢出視野邊界的問題。

## [2.1.3] - 2026-07-18

### Changed

- **推薦議題可收合**：聊天室與 Embed 的推薦議題區塊現在所有裝置都可展開／收合；手機版預設收合，展開時維持固定高度，避免壓縮聊天視野與輸入區。
- **控制按鈕方形化**：聊天室 Header 與 AI 空間的在線人數、語系、歷史、設定及關閉按鈕改為方形圓角外框，降低整排圓形按鈕的視覺負擔。

### Fixed

- **Embed 手機私訊入口**：在線使用者名單由滑鼠 hover 改為可點擊／觸控的選單，手機 Embed 現在可點選其他在線使用者進入私訊。

## [2.1.2] - 2026-07-17

### Changed

- **Extension UI refresh**：更新聊天室人數 badge、訊息卡片配色與 AI Workspace 導覽列，Chrome Extension 與 Embed 共用同一套 UI 調整。

### Fixed

- **Background danmaku**：聊天室面板關閉時仍持續接收公開訊息並顯示彈幕；彈幕容器生命週期不再依賴 Chat 面板狀態。

## [2.1.1] - 2026-07-16

### Removed

- **撤回 Vercel WebSocket relay**：移除 `/api/webtalk/ws` endpoint、`WebSocketRelay` 類別與所有 relay 相關代碼。Embed 與 Extension 現在共用同一套 Artico signaling + WebRTC DataChannel P2P 核心。
- **移除 Redis 依賴**：`REDIS_URL` 不再是聊天必要環境變數。Vercel 部署僅提供靜態 Embed bundle 與 AI proxy；聊天訊息完全走瀏覽器之間的 WebRTC DataChannel。
- **清理 relay 相關依賴**：從 `package.json` 移除 `express`、`ioredis`、`ws`、`@vercel/functions`、`@types/express`、`@types/ws`。

### Changed

- **Embed 傳輸核心重做**：Embed 與 Extension 現在都直接使用 `Peer extends Artico`、`peer.join()` 與 `@rtco/client` 內建 `Room.send()`；移除 Embed 專用的 `DeterministicRoom`、自訂 signaling call 管理與訊息 queue 分叉。
- **公開文字統一廣播**：文字、收回、讚與倒讚都由同一個 `BaseRoom.sendMessage()` 廣播給 Artico Room 的 peers；Embed 只保留掛載、平台設定與 UI。

### Fixed

- **Embed 文字同步路徑**：修正 Embed 使用自訂 deterministic room／ready peer 清單造成的文字廣播遺失；改回 extension 已使用的 Artico Room，由同一個底層 DataChannel 收發文字與反應事件。
- **收到文字後的 MessageList 錯誤**：文字事件在訊息建立前查詢不存在的 message ID，會拋出 `in not founded in MessageListModule` 並中斷 B 端更新；現在先安全檢查既有訊息，再建立列表項目，最後觸發文字／彈幕事件。

## [2.0.9] - 2026-07-16

### Fixed

- **Embed 多人即時彈幕**：Website Embed 的公開訊息改走同網域 Vercel WebSocket relay；Vercel Redis 在不同 Function instances 間轉送事件並保留最近訊息。B 收到 relay event 後立即沿用既有 `OnTextMessageEvent` 更新訊息列表與觸發彈幕，不再依賴 reload 後的 P2P history sync。
- **Relay 重連與去重**：WebSocket 中斷後採指數退避自動重連，離線期間的待送訊息會排隊；歷史重播與重連收到已存在的訊息 ID 時不會重複顯示或重複彈幕。

## [2.0.8] - 2026-07-16

### Fixed

- **雙向即時傳輸**：替換 `@rtco/client` 會讓同一對 peer 同時建立兩條 room Call 的競態邏輯。現在固定只由 peer ID 排序較前的一端發起，雙方共用同一條 DataChannel，避免使用者同步、公開訊息、歷史同步與彈幕只成功單一方向。
- **Embed 即時收訊與彈幕**：修正 React 初始化 cleanup 在 room 尚未建立時，延後執行離房動作的生命週期錯誤。Embed 自動建立匿名使用者後，不會再把剛加入的 WebRTC room 關掉；其他使用者收到公開訊息時會立即新增訊息並觸發彈幕，不需重新整理。
- **Website Embed message delivery**：修正公開聊天室只依賴應用層 `UserList` 判定收件 peer 的問題。新使用者可能已完成 WebRTC 連線，但使用者同步訊息尚未更新清單；此時 A 傳送公開訊息時，目標清單可能為空，B 會收不到訊息。
- **Connected peer broadcast**：公開文字、收回、讚與倒讚現在直接廣播到 WebRTC room 實際已連線的 peers。私聊、使用者同步與歷史同步仍維持指定 peer 傳送。
- **DataChannel readiness queue**：若 peer 已出現在 room，但 DataChannel 尚未 ready，訊息會依 peer 暫存，等 `Room.join` 事件確認連線後送出；peer 離線時會清除暫存訊息。

## [2.0.6] - 2026-07-15

### Added

- **Website Embed products**：`pnpm build:embed` 現在產生純聊天的 `output/webtalk/webtalk-chat.js`、含 AI 的 `output/webtalk/webtalk.js`，以及可直接部署、可切換繁中／英文的站長教學頁（`output/webtalk/index.html`、`output/webtalk/en.html`）。
- **Mobile half-screen overlay**：網站 Embed 在寬度小於 640px 時改為半螢幕覆蓋層，預設聊天室在下半部；可用 `data-webtalk-mobile-placement="top"` 改到上半部，不會改寫宿主網站的版面或捲動。
- **站長安裝指南**：繁中／英文教學頁提供四種「聊天／聊天＋AI」與「全站共用／每頁各自」組合、可直接複製的程式碼按鈕，以及完整的 `<head>`／`</body>` 放置說明。
- **進階整合 FAQ**：新增多網域共用聊天室的固定 `data-webtalk-site-id` 範例，以及先載入、登入後呼叫 `window.WebTalk.mount()`、登出後呼叫 `unmount()` 的整合案例。

### Changed

- **建議安裝方式**：站長指南的預設建議改為「聊天＋AI＋全站共用聊天室」；不填 `data-webtalk-site-id` 時，系統自動以目前網站網域區分房間。
- **產品定位**：指南新增適用情境（企業後台／會員系統、直播活動與觀戰、社群與內容網站），並明確說明目前版本不是客服工具，未提供客服專線、客服分流、工單或客服後台。
- **Embed-only UI**：網站 Embed 移除 extension 設定按鈕；純聊天版同時隱藏 AI workspace、`@ai`、AI 建議與 AI 訊息。
- **Mobile footer visibility**：聊天室訊息區現在可在半螢幕高度內收縮並捲動；Embed 手機版的推薦議題卡也會在固定高度內獨立捲動，避免非同步載入議題後把 footer／送出按鈕推出畫面。footer 同時保留 iPhone safe area 間距；Embed 的原設定按鈕位置改為 WebTalk 333 Chrome Web Store 入口。
- **Extension precedence**：Chrome extension 會偵測頁面上正式的 `webtalk-widget`，若網站已掛載 Embed，extension 不會掛載或會卸載自己的 UI，避免兩套 UI 與連線衝突。
- **Embed documentation**：README、接入文件現在區分純聊天、signaling 連線資訊與混合版 AI 資料流。
- **Guide domain**：Vercel 建置時可用 `WEBTALK_DOMAIN` 為站長教學首頁帶入正式的 Embed／AI endpoint 網域；未設定時預設 `https://webtalk-nine.vercel.app/`，尾端 `/` 會自動正規化。

## [2.0.5] - 2026-07-15

### Fixed

- **Website Embed page room isolation**：聊天室訊息歷史的 IndexedDB key 改為依 WebRTC room ID 分區，避免不同 Wiki Share 頁在本機讀到彼此的歷史訊息。
- **Safe `meta` scope**：`scope="meta"` 缺少 `webtalk-page-id` 時不再退回整站共用房間；Embed 會停止掛載並在 Console 顯示明確錯誤。需整站共用時請明確使用 `scope="origin"`。

## [2.0.4] - 2026-07-15

### Fixed

- **Website Embed browser runtime**：修正 `webtalk.js` 在一般網站執行時出現 `process is not defined`，導致聊天室無法掛載的問題。

## [2.0.3] - 2026-07-15

### Added

- **Website Embed**：新增 `output/webtalk/webtalk.js` 建置入口，可將 WebTalk 嵌入一般合作網站。
- **動態 page room**：網站可透過 `meta[name="webtalk-page-id"]` 為每個 Share 頁提供不同房間 ID，並支援 `meta`、`origin`、`path` 與自訂 room 參數。
- **Vercel AI proxy**：新增 `api/webtalk/ai.ts`，支援 `LLM_API_KEY`、一般模型與 Vision 模型的獨立 Base URL，API key 不進入 Embed bundle。

### Changed

- **平台抽象**：網站 Embed 使用 Shadow DOM、LocalStorage／IndexedDB；Chrome Extension 維持原有 Extension storage 與網域房間機制。
- **Storage 相容性**：patch 版本升級至 `2.0.3` 時維持既有 storage namespace，避免升級後遺失本地設定與資料。

### Fixed

- 修正網站 Embed 預設無法直接讀取瀏覽器頁面 meta 的問題。

## [2.0.1] - 2026-07-11

### Added

- **新增更多 Dicebear 頭像風格**：在原本 3 種風格的基礎上，追加了 4 種全新精美本地風格，包括：
  - `adventurer-neutral` (冒險者)
  - `big-smile` (笑臉)
  - `pixel-art` (像素風)
  - `notionists` (Notion 風)
- **新增「不同網站不同頭像」選項**：
  - 設定頁與 `UserInfo` 新增 `roomAvatarsEnabled` 開關（預設為「開啟」）。
  - 開啟時，系統會自動在不同 Hostname（網站房間）自動生成並記錄各自的獨立頭像，讓您在不同網站聊天時能扮演不同角色。上方設定的頭像此時會作為預設/全域頭像。
  - 當使用者將此選項關閉時，聊天頭像會統一回退並還原為您在設定頁所選的預設/全域頭像。

## [2.0.0] - 2026-07-11

### Added

- **Dicebear 本地隨機頭像整合**：移除了原先簡單的幾何漸層 SVG 產生器，並引入 `@dicebear/core` 以及本地安裝的 `lorelei`、`lorelei-neutral`、`big-ears-neutral` 頭像風格。頭像生成 100% 於本地及離線進行，免去了向外部 API 請求的需要，避免了 Chrome Webstore 上架時繁雜的隱私與跨域權限審查。

### Changed

- **極簡底欄排版與一列式合併**：
  - 將左下角模式切換膠囊 `PanelModeSwitch` 簡化為「純圖標」模式（💬 和 ✨ 膠囊），縮小 50% 寬度（節省約 70px 空間）。
  - 將「插入頁面連結 (🔗)」與「AI 呼叫 (Bot 🤖)」按鈕變更為純圖標大小 `size={20}`，與表情及圖片按鈕完美看齊。
  - 移除了換行限制 `flex-wrap` 並緊湊排版，現在即使在側邊欄最小寬度下（380px），切換器、功能圖標組和送出按鈕也能平整併入同一排，為未來語音包輸入等新功能預留空間。
- **統一輸入框體驗**：將 AI 空間的原生 `<Textarea>` 替換為通用的 `<MessageInput>` 元件，使其自動擁有字數計時器（`0/500`）、相同的輸入框圓角與邊框高亮以及 Loading 遮罩。
- **複製操作極簡化與 Markdown 格式化**：
  - 移除了訊息下方重複文字的純複製與含連結複製，統一精簡為單一圖標按鈕（`CopyIcon` / `CheckIcon`）。
  - 當點擊複製時，如果訊息包含來源頁面資訊，網址會自動格式化為 Markdown 連結 `[網頁標題](網頁連結)`，更契合 LLM 輸出的 Markdown 內文。

## [1.6.8] - 2026-07-11

### Changed

- **AI 空間頂部控制列字級放大**：語系切換、`歷史`、設定與關閉按鈕的尺寸、字重與高度全面放大，讓 header 視覺更符合整體面板風格。
- **推薦區說明文清理**：移除 `先挑一個方向，再決定是否追問。` 這類低訊息量贅詞，讓版面更乾淨。

## [1.6.7] - 2026-07-11

### Fixed

- **Footer 壓線與送出按鈕擠壓修復**：聊天室 footer 在窄寬下不再把 `Send` 擠出面板邊界，工具列會自動換行並保留右側安全空間。

### Changed

- **聊天室 / AI 空間 footer 結構統一**：兩邊都改為一致的輸入卡片與下方工具列布局，降低切換時的視覺斷裂。

## [1.6.6] - 2026-07-11

### Added

- **AI 空間多圖與縮圖預覽**：AI Workspace 現在支援一次附加多張圖片，並在送出前顯示縮圖預覽，可逐張移除或全部清空。
- **Vision Model 設定欄位**：設定頁新增 `Vision Model`，讓使用者自行指定圖片問答走哪個 Groq vision model。

### Changed

- **自動模型路由**：AI 請求現在會依輸入型態自動選模型。純文字預設走 `openai/gpt-oss-120b`，附圖時則自動切到 vision model，不再靠元件內硬編碼 fallback。

## [1.6.5] - 2026-07-11

### Added

- **AI 空間圖片問答**：AI Workspace 現在支援附加單張圖片並直接向 AI 發問，圖片會以 Groq vision 相容格式送出。

### Changed

- **左下角模式切換統一**：聊天室與 AI 空間的 `聊天 / AI` 切換膠囊改為共用同一個元件，尺寸、圖示、字重與 active 樣式完全一致。

## [1.6.4] - 2026-07-11

### Changed

- **聊天室 UI 向 AI 空間收斂**：聊天室主面板改為更接近 AI 空間的圓角卡片、柔和分區、留白與容器層次，包含訊息列表區、空狀態、推薦議題區與輸入區。
- **Header 次資訊補強**：聊天室頂部除了網域名稱，也會顯示目前頁面標題或私聊對象，讓整體資訊架構更接近 AI 空間的 modern panel 風格。
- **面板尺寸對齊**：聊天室預設寬度、最小寬度與最大寬度調整為更接近 AI 空間的側欄尺寸，減少切換時的視覺斷層。

## [1.6.3] - 2026-07-11

### Added

- **AI 推薦議題開關**：設定頁新增 `AI 推薦議題` 開關，預設開啟；使用者可自行決定是否在聊天室與 AI 空間顯示頁面導向的 AI 建議。
- **聊天室推薦議題 chips**：公開聊天室輸入區上方會根據當前頁面的 `title / URL / 文字內容` 顯示幾個可點選的討論議題，點擊後只會帶入輸入框，不會自動送出。
- **AI 空間推薦問題 chips**：AI 空間新增可點選的推薦問題區塊，方便使用者針對當前頁面快速展開追問。

### Changed

- **頁面建議生成共用化**：新增共用的頁面建議請求工具，聊天室與 AI 空間會共用同一批 LLM 推薦結果，避免重複請求與分叉邏輯。
- **LLM 場景化提問入口**：系統現在會嘗試由 LLM 自行判讀頁面脈絡，產生適合 shared chat 與 private AI workspace 的不同建議問法。

## [1.6.2] - 2026-07-10

### Changed

- **AI 呼叫路徑收斂**：AI 空間的摘要與追問改為共用同一套 AI client / API 設定讀取邏輯，避免聊天室 `@ai` 能用、AI 空間卻失敗的分叉行為。
- **AI 空間可直接聊天**：移除必須先產生摘要才能追問的限制，現在可以直接針對當前頁面和 AI 對話。
- **頁面上下文補強**：AI 空間追問與聊天室 `@ai` 現在都會攜帶更完整的頁面文字上下文；AI 空間若已有摘要，也會一併帶入。

### Fixed

- **摘要請求 payload 過肥**：修正 AI 空間摘要把整段頁面內容重複塞進 prompt 與 user message 的問題，降低長頁面時因 context/token 過大而失敗的機率。

---

## [1.6.1] - 2026-07-10

### Fixed

- **剛進房時的假性送訊失敗**：修正部分 peer 尚未完成 DataChannel 建立時，公開聊天室送訊會跳出 `Connection is not established yet.` 的問題。
- **聊天室改為逐 peer 發送並短暫重試**：公開訊息與 `Like / Hate` 不再用單次整房送出；若個別 peer 還沒 ready，現在會對該 peer 做短暫重試，避免一位剛加入的使用者拖垮整次廣播。

---

## [1.6.0] - 2026-07-10

### Added

- **Protocol text extension 疊層**：在 upstream `text` 訊息上新增 fork 專用的 optional `extension` metadata，承載 `AI / private` 類型資訊，不再把這些功能綁死在 legacy `Text` payload。

### Changed

- **Upstream 模式全面改走 protocol text**：`compatibilityMode = upstream` 下，公開訊息、`@ai` 房間回覆與私聊文字現在都會優先走 upstream text 結構；只有 fork 專屬語意才附加 `extension`。
- **私聊改為 upstream 定向傳送**：upstream 模式的私聊文字訊息不再退回 legacy text，而是改用 protocol text 只發給目標 peer，讓公開協定與 fork 擴充層的邊界更清楚。
- **AI/private metadata 可隨 history-sync 保留**：fork peer 在接收 upstream text 或 history-sync 時，會還原 AI badge、owner metadata 與 private 標記；原版 upstream peer 則仍可把它視為一般文字訊息處理。

### Fixed

- **options/chat 殘留硬編碼文案清理**：修正設定頁 `Developer Mode`、`Hide All AI Messages` 與聊天私聊 badge 的殘留硬編碼，回到 `uiText` 多語系來源。

---

## [1.5.9] - 2026-07-10

### Added

- **Upstream reaction/HLC 第二階段**：`compatibilityMode = upstream` 下，公開聊天室的 `👍 / 👎` 互動已可改走 upstream `reaction` 訊息，並為文字、reaction、peer-sync、history-sync 補上 Hybrid Logical Clock（HLC）欄位。

### Changed

- **公開聊天室排序改為 HLC 優先**：訊息列表在有 upstream HLC 時會先依 HLC 排序，再以 `sendTime` 作為 fallback，降低多 peer 同步時的順序漂移。
- **Upstream 歷史同步升級**：接收 upstream `history-sync` 時會保留 `hlc` 與 reaction 狀態到本地訊息模型，為後續更完整對齊原版 WebChat 協定打好基礎。

---

## [1.5.8] - 2026-07-10

### Added

- **Upstream 相容模式初版**：設定頁新增 `Chat Protocol` 切換，可在 `legacy` 與 `upstream` 間切換，方便測試與原版 `molvqingtai/WebChat` 的公開聊天室互通。

### Changed

- **Dual parser 收訊管線**：聊天室收訊現在會同時辨識既有 legacy 協定與 upstream `text / peer-sync / history-sync` 協定，為公開房間互通打開第一步。
- **Upstream 公開文字同步**：在 `compatibilityMode = upstream` 下，公開文字訊息、`peer-sync` 與基本 `history-sync` 會改走 upstream 風格封包；私聊、AI metadata 與 reaction 仍暫留後續版本處理。

---

## [1.5.7] - 2026-07-10

### Added

- **協定層抽離地基**：新增 `src/protocol/Message.ts`、`src/protocol/LegacyChatRoom.ts` 與 adapter，將聊天室 wire format 從 `ChatRoomDomain` 內聯定義中抽離，為後續逐步靠攏 upstream `WebChat` 協定做準備。
- **相容模式設定欄位骨架**：`UserInfo` 新增 `compatibilityMode`，預設為 `legacy`，先完成資料模型與儲存層鋪墊。

### Changed

- **ChatRoom 改用外部 protocol 定義**：目前聊天室仍維持既有 legacy 協定對外行為，但 schema 驗證與型別定義已改由 `src/protocol/*` 提供，降低後續切換 upstream 相容模式的改動面。

---

## [1.5.6] - 2026-07-10

### Added

- **介面語系選擇器**：設定頁新增 `Interface Language`，可明確指定 `Auto / 繁體中文 / 简体中文 / English`，不再只能被動跟隨瀏覽器語系。

### Fixed

- **`@ai` 回覆語言鎖定**：房間 AI 現在會跟隨你的語系設定回覆；選擇繁中時會明確要求模型只用繁體中文，避免回成簡體中文。
- **新功能文案多語系化**：這次新增的 `@ai` 提示、Copy/Ban 操作、長度/離線警告與私聊 placeholder 已改走語系表，不再把文字硬寫在元件內。

---

## [1.5.5] - 2026-07-10

### Added

- **`@ai` 房間機器人回覆**：在公開聊天室輸入 `@ai ...` 後，訊息會先正常送進房間，再由發送者本機呼叫 AI，最後將 AI 回覆作為獨立訊息廣播回聊天室，提升房間互動性。
- **AI 訊息獨立樣式與標記**：AI 回覆現在帶有專屬框線、`AI` badge 與 `by @觸發者` 標示，能和一般使用者訊息清楚區分。
- **本地 AI 可見性控制**：設定頁新增 `Hide All AI Messages` 開關，可在本地隱藏全部 AI 訊息，不影響其他使用者。
- **本地封鎖連帶 AI 過濾**：封鎖某位使用者後，除了隱藏他的真人訊息，也會一併隱藏由他觸發的 AI 回覆。

### Fixed

- **AI 訊息不進彈幕**：AI 回覆不再推送到網頁漂浮彈幕，避免畫面被機器人內容洗版。
- **Options 頁底部遮擋修復**：將底部 `GitHub / 開源專案` 連結改回正常版面流，修復浮動 badge 壓住設定欄位的問題。
- **聊天室字體系統統一**：將內容面板、header、按鈕與 toast 收斂到同一套中英混排 sans 字體堆疊，改善先前字體混亂與觀感不一致問題。

---

## [1.5.4] - 2026-07-10

### Added

- **單篇訊息操作列**：每則聊天訊息底下新增接近 Gemini / ChatGPT 風格的操作列，提供 `👍`、`👎` 與單篇 `Copy` 複製內文按鈕；複製成功後會即時顯示狀態與 toast 提示。
- **Developer Mode 開發者模式**：在設定頁新增開發者模式開關，跨網站 presence 與站點切換/debug 入口預設對一般使用者隱藏，僅在開發者模式下顯示。

### Fixed

- **訊息長度限制警示補強**：保留既有 500 字元輸入上限，但在接近上限時會以顏色高亮提示，達上限時主動跳出 warning，不再出現靜默卡住或像被截斷卻無提示的體驗。
- **Header 在線狀態視覺精簡**：將冗長的 `ONLINE` 文案收斂為更一致的 `👥 數字` 人數徽章，改善字體不統一與資訊噪音問題。

---

## [1.5.3] - 2026-07-09

### Fixed

- **私聊 Like/Hate 路由修正**：修復私聊消息的點讚/踩永遠發給 toUser（可能是自己）的問題，現在根據 self 判斷另一方並定向發送。
- **私聊發送使用即時 peerIds**：修復發送私訊時使用過期快照 peerIds 的問題，改為每次發送時從 UserListQuery 取得最新 peerIds，支援多分頁/多裝置場景。

---

## [1.5.2] - 2026-07-09

### Fixed

- **LastMessageTimeQuery 排除私聊消息**：修復最後訊息時間查詢仍將私聊計入的問題，避免洩漏私聊 metadata 並修正歷史同步誤判。
- **私聊 Like/Hate 定向發送**：修復私聊消息的點讚/踩仍全房間廣播的問題，現在僅發送給私聊參與雙方。
- **多分頁/多裝置私聊目標保留**：修復同一用戶多個 peerId 時，任一 peer 離線即取消私聊目標的問題，現在僅在該用戶所有 peer 離線時才取消。
- **歷史同步天數計算修正**：修復 `message.sendTime - Date.now()` 方向相反導致3天限制失效的問題。
- **README 連結修正**：將本機 `file:///` 連結改為相對路徑。

---

## [1.5.1] - 2026-07-09

### Fixed

- **私聊消息隱私洩漏修復**：修復私聊消息對所有房間用戶可見的嚴重隱私問題。現在私聊消息僅發送者與接收者可見，其他用戶不會看到任何私聊內容。
- **歷史同步排除私聊消息**：新用戶加入房間時，歷史同步不再包含私聊消息，避免隱私洩漏。
- **私聊消息互動權限控制**：非私聊參與者無法對私聊消息進行點讚/踩操作。

---

## [1.4.0] - 2026-07-04

### Added

- **預埋實驗額度 Key 與防呆引導**：曾預置實驗性 Groq API 金鑰供直接使用。當請求失敗（如额度用盡、失效）時，系統會彈出中文/英文的醒目警示，主動引導使用者前往 Groq Console 申請自己的 API Key 並在設定中進行替換。歷史文件不保留金鑰內容。

### Fixed

- **聊天室關閉按鈕壓線/溢出修復**：解決聊天室 Header 右上角關閉 `✕` 按鈕在部分螢幕解析度下靠右壓線、甚至被推出畫面的問題。改用彈性 `flex` 佈局自適應排版，使其恆定與右邊框保持舒適的內縮安全邊距。
- **預設 API 與模型修正**：更改預設 API Provider 為 Groq，預設模型為 `openai/gpt-oss-120b`；將所有設定面板中的 "Gemini" 字樣更換為 "Groq"，並新增申請 API Key 的 Groq 控制台外部連結。

---

## [1.3.9] - 2026-07-03

### Fixed

- **漂浮對話氣泡超長句子截斷修正**：將彈幕/漂浮消息氣泡的最大寬度從偏小的 `max-w-44` (176px) 擴大至 **`max-w-[480px]` (近 3 倍寬度)**，完美解決長篇英文、中文長句在網頁漂浮視窗中顯示不全、被過早砍斷的問題。

---

## [1.3.8] - 2026-07-03

### Added

- **雙向導航 Tab 膠囊**：於聊天室 Footer 左下角與 AI 空間最左下角新增 `[ 💬 聊天 | ✨ AI ]` 雙鍵切換膠囊，實現像素級對齊的 Tab 式無縫切換體驗。
- **無訊息虛線框引導**：當聊天室為空時，自動渲染 Morandi 風格的虛線提示框，引導使用者輸入並發言，拒絕光禿禿的一片。

### Fixed

- **對話點讚 (Like/Hate) 按鈕配色修正**：解決在 Light 模式下，Like 按鈕背景誤套用 secondary 深色變數而導致的「黑斑塊」問題。未選中改為溫潤的 `bg-muted` 燕麥咖，選中改為 `bg-primary/20` 淡栗子紅，高對比且精緻。
- **統一 Header 關閉按鈕 X 樣式**：將聊天室 Header 右上角的 `X` 關閉按鈕，改為與 AI 空間完全一致的 `size-7` 圓圈外框與 `XIcon` 設計。
- **統一 Header 關閉按鈕 X 位置**：將聊天室頂部的 X 關閉按鈕從 ONLINE 左側移至最右上角（最後一個按鈕），符合大眾使用習慣。
- **消滅狗皮藥膏不對齊設計**：重新調整 AI 空間頂部 Header 控制欄的元素高度（統一為 `h-7` / `size-7`）與垂直置中，移除擁擠的「聊天室」返回按鈕，使版面極致齊平。
- **聊天輸入框對齊**：移除 Chat 輸入框外層繁瑣的 `ScrollArea`，改為與 AI 空間一致的 `rounded-xl border-border bg-muted` 設計，並加入 Focus 紅暈。

---

## [1.3.1] ~ [1.3.4] - 2026-07-03

### Added

- **AI 空間「單一對話流 (Unified Message Flow)」重構**：將「網頁摘要」整合為對話流的最頂端置頂消息，支持追問與連續對話。
- **動作按鈕精簡化與合併**：移除原本臃腫的「重新摘要 / 複製 / markdown」三大按鈕，改為精巧的 `[ 🔄 重新濃縮 | 📋 複製 | 📄 MD | 🗑️ 清除 ]` 合併於氣泡右上角，釋放 50px 垂直空間。
- **字型物理載入與 CSP 解鎖**：將 JetBrainsMono 與 MapleMono 字型放入 `src/public/fonts/` 並在 Shadow Root 動態載入 Chrome Extension 絕對 URL，徹底解決 404 與安全策略攔截問題。
- **字體有感放大**：為照顧視力，將摘要、聊天氣泡、輸入框文字大小全面放大至 `text-base` (16px)，輔助文字放大至 `text-sm` (14px)。
- **暖調燕麥拿鐵配色 (Warm Latte & Papyrus)**：引入「333TTSWeb」書卷色系，使用米黃背景、深咖文字、栗紅主色與藍綠輔助色。

### Fixed

- **兔子點擊不靈敏問題**：在拖曳手勢中引入 `4px` 拖曳死區防抖閾值，解決滑鼠微小抖動導致 click 事件被攔截吞掉的 Bug，按鈕點擊秒響應！
- **WXT 輸出路徑配置**：將 WXT 配置輸出目錄指定為 `output/` 而非隱藏的 `.output/`，解決 Mac 選取不到隱藏檔案的痛點。
