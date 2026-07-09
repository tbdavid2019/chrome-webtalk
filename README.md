# 🕸️ Chrome WebTalk - 網頁聊天室擴充功能

> 在任何網站上與他人匿名即時聊天！可以提供LLM 幫你了解網頁內容
>
> ![alt text](image.png)

這是一款去中心化、無伺服器的瀏覽器聊天擴充功能，透過 WebRTC 實現端對端加密傳輸，保護你的隱私，所有資料皆儲存在本地裝置。

本版本 fork 自 [molvqingtai/WebChat](https://github.com/molvqingtai/WebChat)，並進行以下改進：

- ✅ 使用其他建的 WSS 通訊站台，與原專案用戶分流
- 🎨 全新設計的使用者介面，提升操作體驗與可讀性
- 🧠 新增 AI 摘要功能，一鍵生成網頁內容摘要，提高閱讀效率

安裝後，你將能在任何網站上開啟聊天室，再也不怕一個人上網啦！還能使用 AI 摘要功能快速了解網頁內容！

---

## 🆕 近期更新

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

---

## ⚙️ WebRTC 架構速記

- **Signaling**：擴充功能的 `Peer` 直接繼承 `@rtco/client` 的 `Artico`（`src/domain/impls/Peer.ts`），未覆寫任何設定，因此會連到 Artico 預設的 Socket signaling 伺服器 `https://0.artico.dev:443`，用來交換 SDP 與 ICE candidate。
- **STUN / TURN**：`@rtco/client` 內建的 `RTCConfiguration` 只列出 Google 的公開 STUN（`stun:stun.l.google.com:19302`、`stun:stun1.l.google.com:19302`），僅協助取得公網位址並不會中繼資料；目前未設定 TURN，所以遇到嚴格 NAT 可能需要自備 coturn。
- **RTCConfiguration**：所有 `RTCPeerConnection` 都沿用 `Artico` 的預設 `rtcConfig`；若要指定自家 STUN/TURN 或自架 signaling，可在 `Peer.createInstance` 之外新增參數並傳給 `Artico`。
- **為什麼要關心**：免費 signaling 僅適合開發／測試，正式環境仍建議自建或評估商用服務，以取得可控的節點數、SLA 與資安策略。

---

## 🧱 聊天運作流程

- **房間如何形成**：內容腳本會把 `location.host` 轉十六進位作為房號（`src/domain/impls/ChatRoom.ts`），同一個網域的使用者都連到同一房間。
- **即時傳輸**：`ChatRoom` 透過 WebRTC DataChannel 序列化訊息並廣播給房內 peer（`src/domain/impls/ChatRoom.ts`），完全端對端。
- **歷史同步**：每個節點本地保留完整訊息；新 peer 加入時，舊 peer 依最後訊息時間批次推送近 `SYNC_HISTORY_MAX_DAYS`（預設 3 天）的紀錄，避免漏掉談話（`src/domain/ChatRoom.ts:332-470`）。
- **本地儲存**：使用 `unstorage` 驅動的 IndexedDB/LocalStorage 保存訊息與設定（`src/domain/impls/Storage.ts`），即使離線或重新載入也能保留記錄，再由其他節點補齊差異。

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

本專案採用 MIT 授權，詳情請參閱 [LICENSE](https://github.com/tbdavid2019/chrome-webtalk/blob/main/LICENSE)。

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

MIT License – see [LICENSE](https://github.com/tbdavid2019/chrome-webtalk/blob/main/LICENSE) for details.
