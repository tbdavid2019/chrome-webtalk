# 🕸️ Chrome WebTalk - 網頁聊天室擴充功能

> 在任何網站上與他人匿名即時聊天！

這是一款去中心化、無伺服器的瀏覽器聊天擴充功能，透過 WebRTC 實現端對端加密傳輸，保護你的隱私，所有資料皆儲存在本地裝置。

本版本 fork 自 [molvqingtai/WebChat](https://github.com/molvqingtai/WebChat)，並進行以下改進：
- ✅ 使用自建的 WSS 通訊站台，與原專案用戶分流
- 🎨 全新設計的使用者介面，提升操作體驗與可讀性
- 🧠 新增 AI 摘要功能，一鍵生成網頁內容摘要，提高閱讀效率

安裝後，你將能在任何網站上開啟聊天室，再也不怕一個人上網啦！還能使用 AI 摘要功能快速了解網頁內容！

---

## 🚀 安裝方式

### 從瀏覽器擴充商店安裝

（⚠️ 尚未上架，可先使用手動安裝方式）

### 手動安裝

1. 前往 [本專案 Releases 頁面](https://github.com/tbdavid2019/chrome-webtalk/releases)
2. 點選最新版本中的 `webtalk-*.zip`
3. 解壓縮 ZIP 檔到你的電腦資料夾中
4. 開啟瀏覽器的擴充功能管理頁（例如 Chrome 輸入 `chrome://extensions/`）
   - 開啟右上角「開發人員模式」
   - 點選「載入未封裝項目」，選取剛剛解壓縮的資料夾

---

## 💬 使用說明

當擴充功能安裝完成後，會在每個網站的右側出現兩個小圖示：
- **聊天室圖示**（上方）：點擊它，就能開啟聊天室，與其他正在同個網站上的使用者即時聊天！
- **AI 摘要圖示**（下方黃色）：點擊它，可以快速生成當前網頁內容的 AI 摘要，包含總結、觀點、關鍵字等，幫助你快速了解網頁內容。

---

## 🎥 操作影片

https://github.com/user-attachments/assets/e7ac9b8e-1b6c-43fb-8469-7a0a2c09d450

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

(⚠️ Not yet published – use manual install)

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

## 🎥 Demo Video

https://github.com/user-attachments/assets/e7ac9b8e-1b6c-43fb-8469-7a0a2c09d450

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