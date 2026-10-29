# 🕸️ WebTalk 333 - 網頁聊天室擴充功能

> 在任何網站上與他人匿名即時聊天！可以提供LLM 幫你了解網頁內容
>
> ![alt text](image.png) > ![alt text](image-1.png)
> 這是一款去中心化、無伺服器的瀏覽器聊天擴充功能，透過 WebRTC 實現端對端加密傳輸，保護你的隱私，所有資料皆儲存在本地裝置。

本版本 fork 自 [molvqingtai/WebChat](https://github.com/molvqingtai/WebChat)，並進行以下改進：

- ✅ 使用其他建的 WSS 通訊站台，與原專案用戶分流
- 🎨 全新設計的使用者介面，提升操作體驗與可讀性
- 🧠 新增 AI 摘要功能，一鍵生成網頁內容摘要，提高閱讀效率

### 🌐 Website Embed

除了 Chrome Extension，本專案也提供可嵌入一般網站的 WebTalk Embed。正式站長安裝指南與線上體驗在 **[https://webtalk-nine.vercel.app/](https://webtalk-nine.vercel.app/)**；這是提供網站站長直接複製程式碼、選擇房間策略與測試 WebTalk 的正式網站。

Cloudflare Worker 部署可用 pnpm deploy:worker:preview 建置與發布。支援自訂網域 **[https://webtalk.david888.com/](https://webtalk.david888.com/)** 與 workers.dev 網域；站台提供 Embed 腳本與站長指南，AI API 由 Worker 轉送至既有 Vercel API。正式 Vercel 網域維持不變，完整設定請參考 [Cloudflare Worker 預覽部署指南](docs/deploy-cloudflare-worker.md)。

WebTalk Embed 有純聊天 `webtalk-chat.js` 與含 AI 摘要／對話的 `webtalk.js`。若不知道怎麼選，建議直接使用「聊天＋AI＋全站共用聊天室」：

```html
<script
  async
  src="https://webtalk-nine.vercel.app/webtalk.js"
  data-webtalk-scope="origin"
  data-webtalk-ai-endpoint="https://webtalk-nine.vercel.app/api/webtalk/ai"
></script>
```

手機預設是下半螢幕聊天覆蓋層，可用 `data-webtalk-mobile-placement="top"` 改為上半部。沒有 page meta 的頁面不應載入 Embed script，例如 Wiki edit 頁；CRM 則可以使用 `data-webtalk-auto-mount="false"`，在登入成功後呼叫 `window.WebTalk.mount()`。完整參數、聊天室策略與 AI 資料流請直接閱讀 [WebTalk Embed 接入指南（繁中）](https://webtalk-nine.vercel.app/) 或 [English guide](https://webtalk-nine.vercel.app/en.html)；部署細節請參考 [Vercel 部署指南](docs/deploy-vercel.md)。

這個正式站點是給一般網站站長使用的安裝與體驗入口；目前版本定位為多人即時交流與現場互動工具，不是客服工具，未提供客服分流、工單或客服後台。Vercel 建置時可設定 `WEBTALK_DOMAIN=https://webtalk-nine.vercel.app/`，讓教學頁自動帶入正確的 script 與 AI endpoint 網域；未設定時也會使用這個網址作為預設值。一般使用者可從 [Chrome Web Store 安裝 WebTalk 333](https://chromewebstore.google.com/detail/webtalk-333-chat-and-summ/hhhdloelamldfadfobnhdhpfmbbdppdb)。

安裝後，你將能在任何網站上開啟聊天室，再也不怕一個人上網啦！還能使用 AI 摘要功能快速了解網頁內容！

---

## 🆕 近期更新

- ⚡ **雲端免費 AI 體驗通道與開箱即用 (v2.8.13)**：新增透過 Cloudflare Worker 邊緣端點（`https://webtalk.david888.com/api/webtalk/ai`）提供免費 AI 體驗通道，新安裝使用者無需繁瑣申請或填寫 API Key 即可直接使用網頁摘要與對話；代碼與倉庫 100% 零私鑰暴露，徹底杜絕金鑰洩漏與 GitGuardian 警報。亦支援隨時自備金鑰（BYOK）使用 Groq、Gemini、OpenAI、DeepSeek 等個人帳號；未新增 Chrome 權限。

- 🔐 **安全性修復：移除預置 Groq 起始金鑰，全面採用純 BYOK (v2.8.12)**：徹底移除套件內硬編碼之預設 Groq 起始金鑰，所有 AI 供應商均採純個人金鑰模式（BYOK），使用者首次使用時可透過內建引導連結至各供應商 Console 免費申請並填入個人 API Key；未新增 Chrome 權限。

- 🚀 **Cloudflare Worker 自動化部署 CI/CD (v2.8.11)**：新增 GitHub Actions 自動部署工作流程（`.github/workflows/deploy-worker.yml`），推送到 `main` 分支時自動執行靜態建置並發布 Cloudflare Worker，實現與 Vercel 雙端同步自動更新；未新增 Chrome 權限。
- ☁️ **Cloudflare Worker 部署修正 (v2.8.10)**：精確限定 Esbuild 安全覆寫，同時讓 Wrangler 使用相容打包版本；未新增 Chrome 權限。
- 🔒 **套件發行與 Node 版本修正 (v2.8.8)**：更新 lodash、lodash-es 與 `@ungap/structured-clone`，移除已標記不建議使用的套件版本；最低 Node.js 版本調整為 20.19.0。未新增 Chrome 權限。
- 🔐 **相依套件安全更新 (v2.8.7)**：更新 Dependabot 已有修補版本的受影響相依套件，並升級 Vite/WXT 建置工具鏈；未新增 Chrome 權限。
- 🔑 **多供應商 BYOK 與 Groq 免費起始額度 (v2.8.6)**：新安裝預填免費 Groq 起始 Key，先體驗摘要與對話；額度用完或 Key 失效時，可申請自己的 Groq Key，或切換 Google Gemini、xAI Grok、OpenAI API、DeepSeek、OpenRouter 及自訂 OpenAI 相容端點。各供應商的 Key 和模型會分開保存在目前裝置；按「取得模型」載入可用模型，保存後會執行短連線測試。修正空白的其他供應商設定不再誤用 Groq Key，設定載入前按重設會保留起始 Key，且非 JSON API 錯誤能顯示 HTTP 狀態、`/models/` Base URL 可正確呼叫聊天 API。Embed proxy 不提供無效的 BYOK 設定入口。OpenAI API 另計費，ChatGPT 訂閱不含 API 額度。未新增 Chrome 權限。
- 🎨 **修復 CSS Reset、字型洩漏與邊框語法錯誤，100% 完整對齊 david888.com / 2md.aiurl.tw 視覺標準 (v2.8.0)**：
  - **CSS Reset 順序與字型繼承徹底修復**：修正 `all: initial !important` 執行次序，優先執行 reset 並注入 `--font-ui`、14px 字級、1.5 行高及語意色，杜絕 Shadow DOM 內部元件繼承系統預設字型（宋體 / Times New Roman）的問題。
  - **Chromium Shadow DOM `@font-face` 穿透與字重校準**：將 `@font-face` 的 `font-weight` 設為 `300 500`（兼顧 400/500 原生渲染與 600/700 粗體合成層次），並在 Content Script 初始化時將樣式同步注入 `document.head`，解決 Chromium 忽略 ShadowRoot 內 `@font-face` 的問題。
  - **字型混排精準校準（GenJyuuGothic 源柔黑體優先）**：移除 sans-serif 字型最前端的 `JetBrainsMono`，改為以 `var(--font-ui)` 及 `GenJyuuGothic` 搭配系統無襯線字型優先，解決等寬英文與 CJK 混排時字級忽大忽小的跳動感，同時保護 `code`/`pre` 等寬區塊並統一 `SummaryPanel` 的 `<Markdown>` 渲染。
  - **HSL CSS 變數無效 Alpha 語法修復**：修正 `--border`、`--input`、`--ring`、`--saffron-light` 內嵌 `/ alpha` 導致 Tailwind 編譯 `border-border/60` 產生無效語法而退回純黑線框（currentColor）的錯誤。
  - **100% 對齊 david888.com / 2md.aiurl.tw 經典視覺風格**：
    - 主面板與 AI 空間：立體左側深藍外框（`border-l-2 border-[#17324d] dark:border-[#2b4a6b]`）與多層次深邃柔和陰影。
    - 頂部 Header：3px 藏紅金識別頂線、暖奶油背景、`[15px]` 粗體無襯線網域標題，以及經典微立體膠囊按鈕（`border-[1.5px] border-[#17324d] bg-[#fffefa] shadow-[0_2px_0_#17324d]`）。
    - 空狀態卡片：溫潤暖底 `bg-[#faefd4]/85`、左側暖陶土/藏紅雙重立體飾邊（`border-l-4 border-l-[#a9471d]`）、藏紅圖示徽章與 `[15px]` 標題。
    - 推薦話題與問題：經典藏紅膠囊按鈕（`border-[1.5px] border-[#17324d] bg-[#ffb010] text-[#2b251a] shadow-[0_2px_0_#17324d]`），懸停微浮動反饋。
    - 輸入框與送出按鈕：高對比純白輸入底框（`border-2 border-[#17324d] bg-[#fffefa]`）搭配沈穩深藍送出按鈕（`bg-[#17324d] text-[#fff9e8] shadow-[0_2px_0_#0f2337]`）。此版本未新增任何 Chrome 權限。

- 🌓 **宿主環境智慧感知、毛玻璃 Bento Header 與 Zero-Noise 在線狀態 (v2.7.0)**：
  - **宿主網頁環境與背景智慧感知（Host-Aware Adaptive Theme）**：全面升級 `checkDarkMode.ts` 實作四層環境感知瀑布流（顯式 DOM 標記、`color-scheme`、ITU-R BT.601 背景色光學亮度演算、系統媒體查詢兜底），並結合 `MutationObserver` 達成宿主網站切換主題時同一毫秒即時自動同步切換。
  - **Multiplayer 零雜訊在線狀態哲學（Zero-Noise Presence）**：在線人數僅有自己（<= 1）時完全不顯示在線膠囊或數字，保持極致安靜純淨；僅在有其他訪客（>= 2）時優雅顯露 Lucide `<UsersIcon />` 與人數標籤，點擊開啟名單與私聊。
  - **頂級毛玻璃與 Bento 品牌 Header（david888.com / 2md.aiurl.tw 精髓）**：全面汰除老舊黃色油漆塊，採用高級毛玻璃（`backdrop-blur-xl`）與 Saffron `#ffb010` 藏紅金 2px 髮絲級光暈識別線，左側 Favicon + JetBrains Mono 網域名稱，右側一體化 Action Capsule（太陽/月亮主題切換、多人在線狀態、關閉按鈕）。
  - **AI 摘要面板同步換裝**：換裝為毛玻璃 + Saffron 髮絲光暈 Header，語言切換改為微型 Segmented Control，空狀態與操作按鈕全面換用純淨 Lucide 圖示。
  - **字型混排精準校準（JetBrains Mono + 源柔黑體）**：英數代碼、統計與時間戳記優先使用 JetBrains Mono 等寬字型，中文字符平滑回退至源柔黑體。此版本未新增任何 Chrome 權限。
- 🎨 **david888.com & 2md.aiurl.tw 品牌風格全面導入與 WCAG 無障礙合規 (v2.5.0)**：
  - **品牌五大核心色系**：整合 Saffron 藏紅金 (`#ffb010`)、Deep Blue 沉穩深藍 (`#17324d`)、Clay 暖陶土紅 (`#a9471d`)、Warm Cream 溫潤奶油 (`#fff9e8`)、Ink 濃墨黑炭 (`#2b251a`) 與畫布色 Canvas (`#fff0cc`)。
  - **嚴格符合 WCAG 2.1 對比度規範（全數達標 AA 與 AAA）**：
    - 淺色模式：主要文字達 14.45:1（AAA 級）、次要文字達 7.78:1（AAA 級）、主要互動元素達 13.13:1（AAA 級）。
    - 杜絕「黃底白字」無障礙盲區：藏紅金（Saffron）背景上的文字與圖示全面使用深色墨黑（Ink `#2b251a`），對比度達 8.30:1（AAA 級）。
    - 深色模式：暗色畫布文字達 16.86:1（AAA 級）、主要金黃互動色達 9.69:1（AAA 級）。
  - **網頁版與 Chrome Extension 視覺完全同步**：包含側邊聊天室、AI 摘要面板、網站安裝指南頁（`index.html` 與 `en.html`）、選項頁面（Options）與歷史紀錄頁面（History），全面換裝品牌色調並設定 `theme-color: #FFB010`。
  - **全面統一字體大小階層**：徹底掃除歷史遺留的任意硬編碼字級（`10px`、`10.5px`、`11.5px`、`13.5px`、`15px`、`0.72em` 等），將所有訊息、輸入框、Markdown 摘要統一收斂至標準 14px（`text-sm`），次要標籤與時間戳記收斂至 12px（`text-xs`），徹底消除視覺忽大忽小的跳躍感。此版本未新增任何 Chrome 權限。
- 🎨 **頂部 Header 美學重塑與全局排版細節修復 (v2.4.4)**：
  - **在線狀態膠囊（Presence Capsule）**：將右上角人數數字與關閉鈕（X）升級為等高（32px）與圓弧對稱設計，整合呼吸綠燈動畫，點擊流暢展開在線成員名單。
  - **左上角網站識別與標題**：網站 Favicon 新增圓角容器微投影襯托，網域名稱採用乾淨比例字型呈現，子標題清晰展示網頁標題或私聊對象，並將 Header 高度調整為 56px 提供舒適呼吸空間。
  - **解決混搭字型與邊框雜亂**：修正字型堆疊順序，將 `GenJyuuGothic` 與比例無襯線字型優先排列，避免一般英文文字被強制套用等寬字型；移除生硬的 `rounded-[4px]`，將輸入框與底部工具欄收斂為單一溫潤容器，消除多重卡片嵌套。未新增 Chrome 權限。
- 🛠️ **Embed 對話面板寬度修正 (v2.4.3)**：限制面板 Grid 欄位在可用寬度內收縮，避免輸入框與送出按鈕被右側邊界裁切。
- ☁️ **Cloudflare Worker 預覽部署 (v2.4.2)**：新增獨立 workers.dev 測試網域，提供 Embed 靜態檔與指南，AI API 轉送至既有 Vercel endpoint。正式站不變，聊天 signaling 與 WebRTC DataChannel 不需調整。
- 🛠️ **懸浮 Dock 拖曳修正 (v2.4.1)**：修正拖曳時水平位移被重設，造成拉不到另一側的問題。按住上方把手拖過螢幕中央再放開即可換邊；未過中央則回原側，雙擊把手也可切換。上下位置與左右停靠會保存，不需要新增 Chrome 權限。新增兩種 Embed 的實際瀏覽器回歸測試：先執行 `pnpm build:embed`，再執行 `pnpm test:browser`（需已安裝 Google Chrome）。

- 📍 **懸浮按鈕左右停靠位置、自由拖曳吸附與 Embed 自訂 (v2.4.0)**：
  - **自由拖曳搬移與雙擊切換**：懸浮 Dock 現支援直接水平拖動，放開滑鼠自動吸附至最近邊緣（靠左或靠右）；亦可「按兩下拖曳把手」瞬間切換兩側，位置自動跨頁記住。
  - **擴充功能設定頁（Options）**：提供明確的單選停靠位置選項。
  - **網站 Embed 參數**：站長可透過 `data-webtalk-placement="left"` 或 `mount({ placement: 'left' })` 指定預設停靠位置。
  - **對稱自適應**：靠左時圓角、Hover 展開方向、關閉（X）與未讀紅點全面對稱調整。此功能不需要新增 Chrome 權限。
- 🔑 **預設 Groq API Key 與開箱即用 AI 支援 (v2.3.2)**：內建預設 Groq 體驗金鑰與後備設定，安裝後無需額外設定即可體驗 AI 摘要與問答；使用者仍可隨時於設定頁替換為個人 API Key。
- 🛠️ **使用者資料儲存修正 (v2.3.1)**：使用者設定改由 `storage.sync` 保存，頭像與不同網站頭像改由本機 `storage.local` 保存，避免頭像資料超過 Chrome `storage.sync` 單筆 8 KB 限制。舊版資料會在下一次保存設定時自動相容處理；此修正不需要新增 Chrome 權限。
- 🧰 **WebMCP 工具支援與自動探索 (v2.3.0)**：AI Workspace 會自動探索目前分頁提供的 WebMCP 工具，顯示工具名稱、用途描述、輸入 schema 與安全標註；工具新增或移除時會自動更新。WebMCP 面板預設摺疊並放在 AI 內容區下方，避免搶過 AI 空間主要內容。若分頁不支援 WebMCP，面板會保持隱藏，不顯示打擾性提示。AI 也能在支援 tool-calling 的模型下呼叫網站工具。
- 🔠 **使用者字型與字級設定 (v2.3.0)**：設定頁新增小／中／大／特大字級，以及 WebTalk 預設、系統、中文優先、襯線與等寬字型選擇。設定會保存並套用到 WebTalk overlay；此功能不需要新增 Chrome 權限。
- 🤖 **LLM & AI Agent 標準索引支持 (v2.2.1)**：依照 `llmstxt.org` 標準於網頁版 (Vercel Build) 提供 `/llms.txt` 與 `/llms-full.txt`，並在 HTTP 標頭與 `<head>` 注入 Link 發現標籤，便於大語言模型與 AI Agent 自動檢索 WebTalk 服務、API 端點與 Embed 整合規格。
- 🚀 **Website Embed 雙版本與手機 RWD (v2.0.6)**：Embed 現在同時產生純 P2P 的 `webtalk-chat.js` 與含 AI 的 `webtalk.js`；手機以不修改宿主網站的半螢幕覆蓋方式呈現聊天室。網站 Embed 隱藏 extension 專屬設定入口；使用者若已安裝 extension，extension 偵測到官方 widget 後會主動讓位。Vercel 根目錄新增可直接給站長閱讀的繁中接入指南。
- 🛠️ **Website Embed page room 隔離 (v2.0.5)**：房間 ID 的判定與 IndexedDB 訊息歷史改由核心層依 room 分區；Wiki 的每個 `webtalk-page-id` 會有獨立聊天與本機歷史。`meta` 模式缺少 page id 時不再悄悄退回整站共用房間，請明確使用 `origin` 模式才會共用。
- 🛠️ **Website Embed 瀏覽器修正 (v2.0.4)**：修正一般網站載入 `webtalk.js` 時的 `process is not defined` runtime error，Embed 現在可正常初始化聊天室。
- 🚀 **Website Embed 與 Vercel AI proxy (v2.0.3)**：新增可嵌入一般網站的 `webtalk.js`，支援動態 `webtalk-page-id`、`meta / origin / path` 房間策略、匿名本地頭像與 P2P 聊天；新增通用 `LLM_*` Vercel 環境變數，文字模型與 Vision 模型可使用不同 Base URL。Chrome Extension 維持原本的網域房間與直接 API 設定。
- 👤 **Dicebear 更多風格與不同網站不同頭像選項 (v2.0.1)**：
  - **擴充 Dicebear 頭像包**：追加 `adventurer-neutral` (冒險者)、`big-smile` (笑臉)、`pixel-art` (像素風)、`notionists` (Notion 風) 四種新風格。
  - **「不同網站不同頭像」選項**：設定頁新增開關，預設開啟。開啟後，在不同的網域中聊天的頭像會自動隨機產生且不同；關閉後則回退為全域頭像。
- 🎨 **大改版！底欄極簡化與 Dicebear 本地頭像 (v2.0.0)**：
  - **極簡一列式底欄**：將模式切換 `PanelModeSwitch` 簡化為「純圖標」膠囊，寬度減半；並將 `@ai`、`🔗` 按鈕微調為 icon-only 樣式，並移除換行限制，完美合為一排，為未來功能（如語音輸入）預留大片空間。
  - **統一輸入框**：AI 空間底端改用 `<MessageInput>` 元件，獲得字數計算器（`0/500`）、相同圓角與高亮等一致體驗。
  - **極簡 Markdown 複製**：複製統一為單一圖標按鈕，含有網頁連結的訊息會自動複製為 Markdown 格式 `[標題](網址)`，更適應 LLM 輸出。
  - **Dicebear 本地頭像**：替換幾何漸層頭像為本地 `@dicebear` 動態生成的 `lorelei` / `lorelei-neutral` / `big-ears-neutral` 隨機精美頭像，100% 本地與離線運作，免申請任何外部 API 與 Chrome 跨域權限，保障上架順暢。
- 🔠 **中英文預設字體全面升級**：中文字體採用溫潤圓滑的 `GenJyuuGothic` (源柔黑體 Medium)，英文字體採用專用程式碼字體 `JetBrainsMono` (Medium)，打造更清晰舒適的中英混排閱讀體驗。
- 🔠 **AI 空間頂部字級放大與贅詞清理 (v1.6.8)**：放大 AI 空間語系切換、`歷史`、`⚙️` 等頂部控制列字級與按鈕尺寸，讓它們更貼近整體視覺語言；推薦區多餘說明文字也已移除，避免版面噪音。
- 🧩 **Footer 版型統一與壓線修復 (v1.6.7)**：聊天室與 AI 空間的 footer 現在改為一致的「輸入區卡片 + 下方工具列」結構，`聊天 / AI` 切換、工具按鈕與送出按鈕會自動換行與保留安全間距，不再被擠進螢幕邊界。
- 🧠 **AI 空間多圖 + 自動模型路由 (v1.6.6)**：AI 空間現在支援多張圖片、縮圖預覽與單張移除；當提問不含圖片時，系統會自動走文字/推理模型 `openai/gpt-oss-120b`，一旦附圖則自動切到視覺模型。設定頁也新增 `Vision Model` 欄位，可自行指定圖片問答使用的 Groq model。
- 🖼️ **AI 空間支援圖片問答與共用切換膠囊 (v1.6.5)**：AI 空間現在可上傳單張圖片並直接對圖片提問；實作改走 Groq 官方支援的 vision 請求格式。聊天室與 AI 空間左下角的 `聊天 / AI` 切換膠囊也改為共用同一個元件，樣式完全一致。
- 🎨 **聊天室 UI 向 AI 空間收斂 (v1.6.4)**：聊天室的版型、空狀態、訊息區容器、輸入區卡片與 header 視覺全面往 AI 空間靠攏，統一為較新的圓角卡片、柔和底色與較寬鬆的間距，降低兩套面板的割裂感。
- 💡 **AI 推薦議題 / 推薦問題開關 (v1.6.3)**：聊天室與 AI 空間現在可根據當前頁面的 `title / URL / 文字內容`，由 LLM 自動提出幾個可點選的討論議題或追問方向。聊天室只會把議題帶入輸入框，不會直接廣播；AI 空間則會提供可直接帶入提問框的推薦問題。設定頁也新增 `AI 推薦議題` 開關，預設開啟，可隨時關閉。
- 🧠 **AI 空間與聊天室 AI 邏輯收斂 (v1.6.2)**：AI 空間現在和聊天室 `@ai` 共用同一套 API client / 設定讀取邏輯，並支援直接聊天，不必先摘要。兩邊都會帶入更完整的頁面上下文；AI 空間若已有摘要，也會一併帶入。這也修正了部分長頁面下 AI 空間明明 API Key 正確卻仍失敗的問題。
- 🔌 **送訊時序穩定化 (v1.6.1)**：修正剛進房或剛建立 peer connection 的短時間內，聊天室偶發跳出 `Connection is not established yet.` 的假性錯誤。公開訊息與 `Like / Hate` 現在改為逐 peer 發送，並對尚未 ready 的單一 peer 做短暫自動重試。
- 🧩 **Private / AI extension 疊上 upstream text (v1.6.0)**：`upstream` 模式下，私聊文字與 `@ai` 房間回覆不再退回 legacy `Text` payload，而是改用 upstream `text` + fork 專用 optional `extension` metadata。這讓公開聊天室更貼近原版 WebChat，同時保留這個 fork 的 AI/私聊能力。
- 🕰️ **Upstream HLC / reaction 第二階段 (v1.5.9)**：`upstream` 相容模式下，公開聊天室現在會為 `text / reaction / peer-sync / history-sync` 維護 HLC 排序，`👍 / 👎` 也開始改走 upstream reaction 封包，跨 peer 順序與互動狀態比 `v1.5.8` 更接近原版 WebChat。
- 🔀 **原版 WebChat 公開聊天室相容模式初版 (v1.5.8)**：設定頁新增 `Chat Protocol` 切換。切到 `upstream` 後，公開聊天室會開始嘗試用原版 `molvqingtai/WebChat` 的 `peer-sync / text / history-sync` 協定互通；私聊、AI metadata 與 reaction 仍會在後續版本逐步對齊。
- 🧱 **聊天室協定重構地基 (v1.5.7)**：抽出獨立 `protocol` 層與 adapter，開始把聊天室 wire format 從舊有 domain 內聯結構中拆出，為未來逐步靠攏 upstream `molvqingtai/WebChat` 協定做準備。
- 🌐 **可選介面語系與 AI 回覆語言 (v1.5.6)**：設定頁新增 `Interface Language`，可選 `Auto / 繁體中文 / 简体中文 / English`。`@ai` 房間回覆也會跟隨這個設定，選繁中時會明確要求 AI 使用繁體中文。
- 🤖 **`@ai` 房間回覆機器人 (v1.5.5)**：在公開聊天室輸入 `@ai ...`，會由發送者本機呼叫 AI，再把回覆作為獨立 AI 訊息推回聊天室，適合多人共同討論頁面內容。
- 🪪 **AI 訊息獨立樣式與本地過濾 (v1.5.5)**：AI 回覆現在會以特殊框線與 `AI` badge 顯示，且不再進入彈幕；你也可以在本地封鎖某位使用者時同步隱藏他觸發的 AI，或直接在設定頁隱藏全部 AI 訊息。
- 🧼 **Options 頁遮擋與字體整理 (v1.5.5)**：修復設定頁底部 `GitHub / 開源專案` 浮動遮擋內容的問題，並將整個聊天/設定介面收斂為一致的中英混排字體系統。
- 🧰 **開發者模式與 Header 精簡 (v1.5.4)**：新增 `Developer Mode` 開關，將跨網站在線站點清單收進開發者專用除錯入口；一般使用者只看到當前網站名稱與精簡的 `👥` 在線人數徽章，不再暴露多餘的切換入口。
- 📋 **單篇訊息 Copy / 倒讚工具列 (v1.5.4)**：每則聊天訊息底下新增類似 Gemini / ChatGPT 的輕量操作列，支援 `👍`、`👎` 與單篇 `Copy` 複製內文。
- ⚠️ **訊息長度到頂主動警示 (v1.5.4)**：保留 500 字元上限，但接近上限時會變色提示，撞到上限時會直接跳出警告，不再像被靜默截斷。
- 🔒 **P2P 私密對話安全加固 (v1.5.2)**：修復 LastMessageTimeQuery 洩漏私聊 metadata、Like/Hate 全房間廣播、多分頁私聊目標誤清、歷史同步天數計算反向等問題。
- 🔒 **P2P 私密對話隱私修復 (v1.5.1)**：修復私聊消息對所有用戶可見的隱私漏洞。現在私聊消息僅雙方可見，歷史同步也排除私聊內容，並限制非參與者的互動權限。
- 🔒 **P2P 私密對話功能 (v1.5.0)**：導入基於 WebRTC P2P 的定點私聊機制。使用者可透過點擊對話頭像或右上角在線用戶列表開啟私聊，發送的訊息僅雙方可見，且畫面會呈現高質感的靛藍色光暈與鎖頭徽章。詳細架構請參考 [房間機制與 P2P 私聊設計文件](docs/room-mechanism-and-private-chat.md)。
- 🧠 **預置實驗 Key、預設模型更換與 Groq 引導 (v1.4.0)**：預設模型更改為 `openai/gpt-oss-120b`，API 改為引導至 Groq Console。內建預置實驗 API Key `gsk_ZXLmQT*****`，並增強錯誤處理，當實驗 Key 請求失敗或超出限額時，會顯示引導錯誤說明引導使用者自行更換 API Key。
- ✕ **聊天室 Header 關閉按鈕壓線溢出修正 (v1.4.0)**：重新調整 Header 佈局，由原先的限制性網格改為自適應彈性 `flex` 排版，確保關閉 `✕` 按鈕在任何視窗解析度下均不會靠右過度壓線或甚至超出畫面。
- 💬 **漂浮對話氣泡超長句子截斷修正 (v1.3.9)**：將網頁漂浮對話氣泡/彈幕的最大寬度從 `max-w-44` (176px) 擴展至 `max-w-[480px]`，徹底修復超長英文、中文句子被過早砍斷、顯示不全的 Bug。
- 🧾 **AI 空間「單一對話流」大重構 (v1.3.8)**：重整為與主流 AI（ChatGPT/Claude）相同的單一對話聊天流。網頁摘要成為最頂端置頂 of AI 消息，提問與後續續問氣泡無縫向下延伸。
- 🎨 **溫潤拿鐵書香配色 (Warm Latte & Papyrus)**：界面配色深度優化，採用大氣柔和的淡米黃底色、深烘焙咖啡色字體與栗子磚紅主色調，長時間閱讀極度舒適。
- 🔤 **大字型與自訂字型物理路徑**：為照顧視力，所有面板正文及輸入文字均提升至 `text-base` (16px)；修正 MapleMono 與 JetBrainsMono 物理路徑並解鎖 CSP，解決 Extension 本地字型加載 404 問題。
- ⚡ **兔子 Dock 4px 防抖點擊修復**：為懸浮拖曳 Dock 引入 4 像素防抖閾值，徹底解決滑鼠微小抖動導致點擊沒反應的 Bug。
- 🔄 **左下角雙鍵導航膠囊**：於聊天室與 AI 空間最左下角引入 `[ 💬 聊天 | ✨ AI ]` 對齊雙鍵 Tab，切換隨心所欲。
- ❌ **統一右上角 X 關閉**：兩個面板的 `X` 關閉按鈕统一設計為精緻的圓圈 `XIcon` 並放置於最右上角。
- 🧹 **消滅狗皮藥膏不對齊**：AI 空間頂部控制列高度完全齊平（統一為 `h-7` / `size-7`），毫無高低起伏，視覺大升級。

---

## 🚀 安裝方式

### 從瀏覽器擴充商店安裝

https://chromewebstore.google.com/detail/webtalk/hhhdloelamldfadfobnhdhpfmbbdppdb

### 手動安裝

1. 前往 [本專案 Releases 頁面](https://github.com/tbdavid2019/chrome-webtalk/releases)
2. 點選最新版本中的 `webtalk-*.zip`
3. 解壓縮 ZIP 檔到你的電腦資料夾中
4. 開啟瀏覽器的擴充功能管理頁（例如 Chrome 輸入 `chrome://extensions/`）
   - 開啟右上角「開發人員模式」
   - 點選「載入未封裝項目」，選取剛剛解壓縮的資料夾

### 原始建構

```
pnpm build

```

會產出 output/

---

## 💬 使用說明

當擴充功能安裝完成後，會在每個網站的右側出現兩個小圖示：

- **聊天室圖示**（上方）：點擊它，就能開啟聊天室，與其他正在同個網站上的使用者即時聊天！
- **AI 摘要圖示**（下方黃色）：點擊它，可以快速生成當前網頁內容的 AI 摘要，包含總結、觀點、關鍵字等，幫助你快速了解網頁內容。

### 聊天操作補充

- **單篇操作列**：每則訊息底下都有 `👍`、`👎` 與 `Copy` 按鈕，可直接複製單篇訊息內容，或對該則訊息表達正負回饋。
- **`@ai` 房間回覆**：在公開聊天室輸入 `@ai 你的問題`，會由你本機的 AI 設定產生回覆，再把 AI 回覆廣播到房間中。為避免濫用，目前同一時間只允許一個 AI 請求，且有 `30` 秒冷卻時間。
- **AI 推薦議題 / 問題**：若設定頁保持預設開啟，聊天室輸入框上方會出現幾個根據當前頁面內容產生的推薦議題；AI 空間也會顯示推薦問題。點擊後只會帶入輸入框，仍由你決定是否送出。
- **語系控制**：到設定頁的 `Interface Language` 可切換介面語言，`Auto` 會跟隨瀏覽器；`@ai` 房間回覆也會跟著這個設定決定回答語言。
- **AI 訊息管理**：AI 回覆會以獨立樣式顯示，不會進入彈幕；你可以封鎖某位使用者並同步隱藏他觸發的 AI，或在設定頁開啟 `Hide All AI Messages` 完全隱藏 AI 訊息。
- **WebMCP 工具**：在支援 WebMCP 的 Chrome 中，AI Workspace 會顯示目前頁面的工具名稱、用途描述、輸入 schema 與安全標註，並透過 `toolchange` 即時更新；AI 聊天也會自動探索並在必要時呼叫工具後再回答。若目前分頁不支援 WebMCP，面板會保持隱藏，不打擾一般使用。若要在本機測試，請到 `chrome://flags/#enable-webmcp-testing` 開啟 WebMCP 並重新啟動 Chrome；請使用支援 tool-calling 的模型。
- **顯示設定**：到設定頁的 `Display Font Size` 可調整面板字級，`Display Font` 可選擇系統介面、中文優先、襯線或等寬字型。這些選項使用作業系統字型堆疊，不會讀取完整的已安裝字型清單。
- **訊息長度提示**：聊天輸入框目前上限為 `500` 字元；接近上限會變色提醒，達到上限時會主動顯示警告。
- **Developer Mode**：若你是進階使用者，可到擴充功能設定頁開啟 `Developer Mode 開發者模式`，顯示跨網站 presence 與站點切換/debug 入口。
- **原版相容測試模式**：若你想逐步和原版 `molvqingtai/WebChat` 公開房間互通，可在設定頁把 `Chat Protocol` 切到 `Upstream`。目前公開聊天室優先對齊 `peer-sync / text / history-sync / reaction`；私聊與 AI 會以 fork 專用 `extension` metadata 疊在 upstream text 上，只在支援這個 fork 的 peer 之間完整還原。

---

## ⚙️ 即時通訊架構速記

- **Website Embed 公開訊息**：使用 Artico signaling `https://0.artico.dev:443` 交換 SDP 與 ICE candidate；聊天訊息建立連線後直接走瀏覽器之間的 WebRTC DataChannel，不需要 Vercel WebSocket relay 或 Redis。
- **Extension／指定 peer 通訊**：`Peer` 使用 `@rtco/client` 的 Artico signaling 交換 SDP 與 ICE candidate；私聊、使用者同步與 P2P 歷史同步也使用 DataChannel。
- **STUN / TURN**：`@rtco/client` 內建的 `RTCConfiguration` 只列出 Google 的公開 STUN（`stun:stun.l.google.com:19302`、`stun:stun1.l.google.com:19302`），僅協助取得公網位址並不會中繼資料；目前未設定 TURN，所以遇到嚴格 NAT 可能需要自備 coturn。
- **RTCConfiguration**：所有 `RTCPeerConnection` 都沿用 `Artico` 的預設 `rtcConfig`；若要指定自家 STUN/TURN 或自架 signaling，可在 `Peer.createInstance` 之外新增參數並傳給 `Artico`。
- **Vercel 部署**：Vercel 只提供 Embed 静態 bundle 與 AI proxy；聊天訊息完全走 WebRTC P2P，不需要 Redis 或 WebSocket relay。

---

## 🧱 聊天運作流程

- **房間如何形成**：內容腳本會把 `location.host` 轉十六進位作為房號（`src/domain/impls/ChatRoom.ts`），同一個網域的使用者都連到同一房間。
- **即時傳輸**：Website 與 Extension 的公開訊息都走 WebRTC DataChannel；不再使用 Vercel WebSocket relay。
- **歷史同步**：每個節點本地保留完整訊息；新 peer 加入時，舊 peer 依最後訊息時間批次推送近 `SYNC_HISTORY_MAX_DAYS`（預設 3 天）的紀錄，避免漏掉談話（`src/domain/ChatRoom.ts:332-470`）。
- **本地儲存**：訊息歷史使用 IndexedDB；一般使用者設定使用 `chrome.storage.sync` 同步，頭像、不同網站頭像及 BYOK API 設定使用 `chrome.storage.local` 保存。API 金鑰只留在目前裝置，不會透過 Chrome Sync 複製到其他裝置。

---

## 🙌 技術來源與致敬

本專案建立在以下開源技術之上，特此致敬：

- **[remesh](https://github.com/remesh-js/remesh)** – 遵循 DDD 原則的 JS 架構，邏輯與 UI 完全分離，極易擴充與重構。
- **[shadcn/ui](https://ui.shadcn.com/)** – 美觀又彈性的 UI 元件庫，無需安裝即可自訂樣式。
- **[wxt](https://wxt.dev/)** – 極佳的瀏覽器擴充套件開發框架。
- **[Artico](https://github.com/matallui/artico)** – 建立自定 WebRTC 解決方案的利器。
- **[ugly-avatar](https://github.com/txstc55/ugly-avatar)** – 為用戶產生可愛又獨特的隨機頭像。

---

## 📜 授權條款

本專案採用 GNU Affero General Public License v3.0（AGPL-3.0-only），詳情請參閱 [LICENSE](https://github.com/tbdavid2019/chrome-webtalk/blob/main/LICENSE)。

---

# 🌐 Chrome WebTalk - Anonymous Chat Anywhere

> Chat with anyone on any website

This is a decentralized, serverless browser extension that allows real-time, end-to-end encrypted chatting via WebRTC. All data is stored locally to ensure privacy.

This fork, hosted at [`tbdavid2019/chrome-webtalk`](https://github.com/tbdavid2019/chrome-webtalk), includes:

- ✅ A custom WSS server to separate userbase from the original project
- 🎨 A redesigned interface for better user experience and readability
- 🧠 New AI summary feature that generates concise summaries of web pages

---

## 🚀 Installation

### From Store

https://chromewebstore.google.com/detail/webtalk/hhhdloelamldfadfobnhdhpfmbbdppdb

### Manual Installation

1. Go to [Releases](https://github.com/tbdavid2019/chrome-webtalk/releases)
2. Download the latest `webtalk-*.zip`
3. Extract the ZIP file to a folder
4. Open your browser’s extension page (`chrome://extensions/`)
   - Enable **Developer mode**
   - Click **Load unpacked** and select the extracted folder

---

## 💬 How to Use

Once installed, two icons will appear on the right side of any website:

- **Chat icon** (top): Click it to join a shared chatroom with others browsing the same site!
- **AI Summary icon** (bottom, yellow): Click it to generate an AI-powered summary of the current webpage, including key points, opinions, and keywords to help you quickly understand the content.

---

## 🙌 Acknowledgements

Built upon amazing open-source tools:

- **[remesh](https://github.com/remesh-js/remesh)** – DDD-inspired logic framework with full UI separation
- **[shadcn/ui](https://ui.shadcn.com/)** – UI library that enables beautiful, customizable components
- **[wxt](https://wxt.dev/)** – Best framework for browser extension development
- **[Artico](https://github.com/matallui/artico)** – WebRTC library suite for building P2P apps
- **[ugly-avatar](https://github.com/txstc55/ugly-avatar)** – Fun random avatar generator

---

## 📜 License

GNU Affero General Public License v3.0 – see [LICENSE](https://github.com/tbdavid2019/chrome-webtalk/blob/main/LICENSE) for details.
