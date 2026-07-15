# WebTalk Website Embed

網站版 Embed 會由 `output/webtalk/webtalk.js` 產生。它可以和 Chrome Extension 共用 WebRTC 與訊息協定，但使用網站自己的 Shadow DOM、LocalStorage／IndexedDB 與頁面房間識別。

## 最小嵌入

```html
<meta name="webtalk-page-id" content="{{dynamic-page-id}}" />
<script async src="https://your-webtalk-host.example/webtalk.js"></script>
```

預設 `scope` 是 `meta`：

- 有 `meta[name="webtalk-page-id"]` 時，使用 `page:<origin>:<pageId>`。
- 沒有 page meta 時，退回 `origin:<origin>`，整個網站共用一個房間。

網站版預設把 AI 請求送到 `/api/webtalk/ai`，由網站後端代理到設定的 OpenAI-compatible LLM。Embed 腳本不包含 Extension 的 fallback API Key；若 Server 使用不同路徑，可透過 `data-webtalk-ai-endpoint` 或 `mount({ aiEndpoint })` 指定。

```html
<script
  async
  src="https://your-webtalk-host.example/webtalk.js"
  data-webtalk-ai-endpoint="https://your-webtalk-host.example/api/webtalk/ai"
></script>
```

## 房間策略

### 整個網站共用一個房間

```html
<script async src="https://your-webtalk-host.example/webtalk.js" data-webtalk-scope="origin"></script>
```

### 使用網址路徑分房

```html
<script async src="https://your-webtalk-host.example/webtalk.js" data-webtalk-scope="path"></script>
```

`/share/a/` 與 `/share/a` 會視為同一個房間。`path` 模式不會讀取 page meta。

### 由網站動態提供頁面 ID

`webtalk-page-id` 應由網站的 Share template 依目前頁面動態輸出，Embed script 本身不需要寫死 page ID：

```html
<!-- 每個 Share 頁的伺服器輸出不同 content 值 -->
<meta name="webtalk-page-id" content="ffrk4e" />
<script async src="https://your-webtalk-host.example/webtalk.js" data-webtalk-site-id="david888-wiki"></script>
```

下一個 Share 頁可以輸出不同的 meta：

```html
<meta name="webtalk-page-id" content="abc123" />
```

`data-webtalk-page-id` 仍可作為特殊情況的 override，但不應作為一般 Share 頁的固定設定。`data-webtalk-site-id` 可用來建立穩定 namespace，不受網站網址變更影響。

### 完全指定房間

```html
<script async src="https://your-webtalk-host.example/webtalk.js" data-webtalk-room-id="david888-wiki:ffrk4e"></script>
```

`data-webtalk-room-id` 優先權最高。

## JavaScript API

除了 script data attributes，也可以手動控制：

```html
<script src="https://your-webtalk-host.example/webtalk.js" data-webtalk-auto-mount="false"></script>
<script>
  window.WebTalk.mount({
    scope: 'meta',
    siteId: 'david888-wiki',
    aiEndpoint: '/api/webtalk/ai',
    enableVirtualRoom: false
  })
</script>
```

`enableVirtualRoom` 預設為 `false`。網站版通常只需要目前頁面的聊天室；若需要跨網站 presence，再明確設為 `true`。

## Embed script 參數

以下參數可直接寫在 `<script>` 的 `data-*` attributes：

| 參數                        | 可用值                   | 用途                        |
| --------------------------- | ------------------------ | --------------------------- |
| `data-webtalk-scope`        | `meta`、`origin`、`path` | 房間分流策略，預設為 `meta` |
| `data-webtalk-page-id`      | 動態 page ID             | 覆寫頁面 meta，通常不使用   |
| `data-webtalk-site-id`      | 穩定字串                 | 建立網站 namespace          |
| `data-webtalk-room-id`      | 任意穩定字串             | 完全覆寫 room，優先權最高   |
| `data-webtalk-meta-name`    | meta name                | 使用自訂 page meta 名稱     |
| `data-webtalk-auto-mount`   | `true`、`false`          | 是否載入後自動顯示          |
| `data-webtalk-virtual-room` | `true`、`false`          | 是否加入跨站 Virtual Room   |
| `data-webtalk-ai-endpoint`  | URL                      | 指定 AI proxy endpoint      |

Wiki Share 頁通常只需要：

```html
<meta name="webtalk-page-id" content="{{dynamic-page-id}}" />
<script
  src="https://your-webtalk-host.example/webtalk.js"
  data-webtalk-scope="meta"
  data-webtalk-site-id="david888-wiki"
></script>
```

Wiki Edit 頁則不要載入這段 script。登入後才顯示的網站，可使用 `data-webtalk-auto-mount="false"`，登入成功後再呼叫 `window.WebTalk.mount()`。

## 建置

```bash
pnpm build:embed
```

輸出檔案：

```text
output/webtalk/webtalk.js
```

這個輸出是給合作網站載入的瀏覽器腳本，不是 Chrome Extension 的 `output/chrome-mv3`，也不是 Vercel API Server。AI Key proxy 與其他後端 API 應由獨立的 Vercel Function 提供。

## Vercel AI proxy 環境變數

本專案已提供 `api/webtalk/ai.ts`，部署到 Vercel 後設定：

```text
LLM_API_KEY=...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_VISION_BASE_URL=https://api.groq.com/openai/v1
LLM_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
WEBTALK_ALLOWED_ORIGINS=https://wiki.david888.com
```

`LLM_API_KEY` 只在 Vercel server-side 使用，不會進入 Embed bundle。`LLM_BASE_URL` 預設為 Groq；`LLM_VISION_BASE_URL` 若未設定，會退回使用 `LLM_BASE_URL`。兩個 Base URL 都必須提供 OpenAI-compatible `/chat/completions` API。正式環境應設定 `WEBTALK_ALLOWED_ORIGINS`，並在 Vercel 或前置服務加上 rate limit；未設定 allowlist 時，Function 會允許所有來源，適合本機測試，不適合公開正式環境。

聊天本身仍使用現有 Artico WebRTC 信令與 P2P DataChannel；訊息不寫入這個 AI proxy。若日後要自建信令服務，應另設可維持 WebSocket／連線狀態的服務，不要把 AI proxy 當成聊天 relay。
