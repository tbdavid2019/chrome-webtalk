# Cloudflare Worker 預覽部署指南

Cloudflare Worker 預覽用獨立的 workers.dev 網域提供 Embed 靜態檔與站長指南。預覽 Worker 的 AI API route 會轉送到正式 Vercel API，正式 Vercel 網域與設定維持不變。

## 部署

本機需先使用 Wrangler 登入 Cloudflare：

```bash
pnpm exec wrangler login
```

建置並部署：

```bash
pnpm deploy:worker:preview
```

Wrangler 會顯示部署網址，並已綁定正式自訂網域：

```text
https://webtalk.david888.com
https://webtalk-embed-preview.<workers.dev-subdomain>.workers.dev
```

目前 Wrangler 設定使用 Cloudflare 帳號 DAVID江江江，並將腳本發布到 custom domain 與 workers.dev。此部署不會修改現有 Vercel deployment。

## 測試路徑

| 路徑 | 用途 |
| --- | --- |
| / | 繁體中文站長指南 |
| /en.html | English integration guide |
| /webtalk.js | 聊天與 AI Embed |
| /webtalk-chat.js | 純聊天 Embed |
| /api/webtalk/ai | 轉送至 https://webtalk-nine.vercel.app/api/webtalk/ai |

指南會依目前請求的 workers.dev 網域產生 Embed 程式碼。AI API 的 CORS 與 LLM 設定仍由 Vercel 環境變數管理。

## 即時通訊

Cloudflare Worker 只提供靜態檔案與 AI API 轉送。Embed 仍連到 Artico signaling 服務交換 WebRTC 連線資訊；聊天訊息仍直接透過瀏覽器間的 WebRTC DataChannel 傳送。這個預覽不建立 WebSocket relay，也不改動 signaling 或聊天室協定。
