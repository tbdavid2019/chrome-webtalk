# WebTalk Vercel 部署指南

本專案部署到 Vercel 後，同一個 Project 會提供四個靜態檔與一個選用 API：

- `webtalk-chat.js`：主推的純 P2P 聊天 Embed
- `webtalk.js`：含 AI 摘要與對話的混合 Embed
- `index.html`：公開的繁中站長接入指南
- `en.html`：公開的英文站長接入指南
- `/api/webtalk/ai`：混合版使用的 server-side LLM proxy，保護 API key

目前 Vercel 部署設定位於根目錄的 `vercel.json`。

## 1. 連接 GitHub Repository

在 Vercel 建立或匯入 Project：

- Repository：`tbdavid2019/chrome-webtalk`
- Branch：`main`
- Root Directory：`./`
- Framework Preset：`Other`

Push 到 `main` 後，Vercel 會自動建立新的 Deployment。

## 2. Build 設定

`vercel.json` 已經固定以下設定：

```json
{
  "buildCommand": "pnpm build:embed",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "output/webtalk"
}
```

如果需要在 Vercel UI 手動設定，請使用：

| 欄位                | 值                               |
| ------------------- | -------------------------------- |
| Framework Preset    | `Other`                          |
| Build Command       | `pnpm build:embed`               |
| Output Directory    | `output/webtalk`                 |
| Install Command     | `pnpm install --frozen-lockfile` |
| Development Command | `None`                           |
| Root Directory      | `./`                             |

Build 完成後，Vercel 會將：

```text
output/webtalk/index.html
output/webtalk/en.html
output/webtalk/webtalk-chat.js
output/webtalk/webtalk.js
```

公開成：

```text
https://你的-project.vercel.app/webtalk.js
https://你的-project.vercel.app/webtalk-chat.js
https://你的-project.vercel.app/
https://你的-project.vercel.app/en.html
```

## 3. Environment Variables

到 Vercel Project 的 **Settings → Environment Variables** 新增：

```text
LLM_API_KEY=你的 LLM API key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_VISION_BASE_URL=https://api.groq.com/openai/v1
LLM_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
WEBTALK_ALLOWED_ORIGINS=https://wiki.david888.com,https://uat.open333crm.create360.ai
WEBTALK_DOMAIN=https://webtalk-nine.vercel.app/
```

### 變數說明

| 變數                      | 預設值                                      | 未設定時行為                           |
| ------------------------- | ------------------------------------------- | -------------------------------------- |
| `LLM_API_KEY`             | 無                                          | 回傳 `AI_NOT_CONFIGURED`               |
| `LLM_BASE_URL`            | `https://api.groq.com/openai/v1`            | 使用 Groq OpenAI-compatible API        |
| `LLM_MODEL`               | `openai/gpt-oss-120b`                       | 使用預設文字模型                       |
| `LLM_VISION_BASE_URL`     | `LLM_BASE_URL`                              | Vision 沿用一般模型 Base URL           |
| `LLM_VISION_MODEL`        | `meta-llama/llama-4-scout-17b-16e-instruct` | 使用預設 Vision 模型                   |
| `WEBTALK_ALLOWED_ORIGINS` | 空值（等同允許所有來源）                    | 僅適合測試，正式環境必須設定 allowlist |
| `WEBTALK_DOMAIN`          | `https://webtalk-nine.vercel.app/`          | 站長教學首頁中產生的 Embed script 網域 |

Base URL 不要包含 `/chat/completions`，程式會自動補上。

### `WEBTALK_DOMAIN`：Embed 對外公開網域

`WEBTALK_DOMAIN` 是**本 Vercel Project 部署後提供 WebTalk 檔案的公開網址**，例如：

```text
WEBTALK_DOMAIN=https://webtalk-nine.vercel.app/
```

它會在 `pnpm build:embed` 時寫入 `output/webtalk/index.html` 與 `output/webtalk/en.html`，使站長指南中的下列範例指向正確位置：

- `https://你的-webtalk-domain/webtalk-chat.js`
- `https://你的-webtalk-domain/webtalk.js`
- `https://你的-webtalk-domain/api/webtalk/ai`

請不要填入**合作網站／使用 Embed 的網站**網域，也不要填入 Vercel dashboard 的網址；應填 WebTalk 正式對外網址。尾端 `/` 可有可無，建置時會自動移除。未設定時會回退到 `https://webtalk-nine.vercel.app/`。

在 Vercel 新增或修改此變數後，請確認套用到要部署的 Environment（通常是 Production），然後重新部署；環境變數是 build-time 值，既有的教學頁不會即時改變。

例如正確：

```text
https://api.groq.com/openai/v1
```

錯誤：

```text
https://api.groq.com/openai/v1/chat/completions
```

`WEBTALK_ALLOWED_ORIGINS` 要包含 `https://`，但不要包含最後的 `/`，也不要填頁面路徑。

單一網站：

```text
https://wiki.david888.com
```

不要填成：

```text
https://wiki.david888.com/
```

也不要填成：

```text
https://wiki.david888.com/share/ffrk4e
```

兩個以上網站使用逗號分隔：

```text
https://wiki.david888.com,https://uat.open333crm.create360.ai
```

如果有 `www`、不同子網域或不同協定，必須分別列出：

```text
https://wiki.david888.com,https://www.wiki.david888.com,https://uat.open333crm.create360.ai,http://localhost:3000
```

不要寫成：

```text
https://wiki.david888.com/share/ffrk4e
```

新增或修改 Environment Variables 後，需要重新 Deploy。

## 4. 驗證部署

### 驗證 Embed JavaScript 與站長指南

瀏覽：

```text
https://你的-project.vercel.app/webtalk.js
https://你的-project.vercel.app/webtalk-chat.js
https://你的-project.vercel.app/
```

前兩個 URL 應顯示壓縮後 JavaScript；根目錄應顯示繁中站長接入指南。

### 驗證 AI endpoint

API URL：

```text
https://你的-project.vercel.app/api/webtalk/ai
```

這個 endpoint 只接受 `POST` 與 `OPTIONS`。直接用瀏覽器開啟出現錯誤訊息是正常的，實際使用時由 Embed script 呼叫。

## 5. Wiki Share 頁嵌入

每個 Share 頁由網站動態輸出自己的 page ID：

```html
<meta name="webtalk-page-id" content="{{dynamic-page-id}}" />

<script
  src="https://你的-project.vercel.app/webtalk-chat.js"
  data-webtalk-scope="meta"
  data-webtalk-site-id="david888-wiki"
></script>
```

例如：

```html
<meta name="webtalk-page-id" content="ffrk4e" />
```

下一個 Share 頁可以是：

```html
<meta name="webtalk-page-id" content="abc123" />
```

兩個 page ID 會進入不同聊天室。

`scope="meta"` 缺少 `webtalk-page-id` 時，WebTalk 會停止掛載並在瀏覽器 Console 顯示錯誤；它不會退回成 Wiki 全站共用房間。若真的要整站共用，請使用 `data-webtalk-scope="origin"`。

Wiki Edit 頁不要載入 WebTalk script，也不要加入 page meta。

## 6. CRM 登入後顯示

登入前不要自動顯示：

```html
<script
  src="https://你的-project.vercel.app/webtalk.js"
  data-webtalk-auto-mount="false"
  data-webtalk-ai-endpoint="https://你的-project.vercel.app/api/webtalk/ai"
></script>
```

登入成功後：

```js
window.WebTalk.mount({
  scope: 'origin',
  siteId: 'open333crm-uat'
})
```

登出時：

```js
window.WebTalk.unmount()
```

## 7. 可用的 Embed 參數

| Script attribute                | 可用值                   | 說明                              |
| ------------------------------- | ------------------------ | --------------------------------- |
| `data-webtalk-scope`            | `meta`、`origin`、`path` | 房間分流策略，預設為 `meta`       |
| `data-webtalk-page-id`          | page ID                  | 覆寫頁面 meta，通常不使用         |
| `data-webtalk-site-id`          | 穩定字串                 | 建立網站 namespace                |
| `data-webtalk-room-id`          | 任意穩定字串             | 完全指定 room，優先權最高         |
| `data-webtalk-meta-name`        | meta name                | 使用自訂 page meta 名稱           |
| `data-webtalk-auto-mount`       | `true`、`false`          | 是否載入後自動顯示                |
| `data-webtalk-virtual-room`     | `true`、`false`          | 是否加入跨站 Virtual Room         |
| `data-webtalk-mobile-placement` | `bottom`、`top`          | 手機半螢幕覆蓋位置，預設 `bottom` |
| `data-webtalk-ai-endpoint`      | URL                      | 指定 AI proxy endpoint            |

## 8. 常見錯誤

### `No Output Directory named "dist" found`

代表 Vercel 還在使用 `dist` 作為 Output Directory。請確認：

1. GitHub 已有最新的 `vercel.json`
2. Vercel Project 的 Root Directory 是 `./`
3. Output Directory 沒有被手動覆寫成 `dist`
4. 重新建立一個新的 Deployment，不要只重跑舊的失敗 Deployment

### AI 回應 `AI_NOT_CONFIGURED`

通常是 `LLM_API_KEY` 沒有設定到目前 Deployment 的 Environment，或設定後沒有重新部署。

### AI 回應 `ORIGIN_NOT_ALLOWED`

檢查 `WEBTALK_ALLOWED_ORIGINS` 是否包含實際嵌入網站的 origin。不要加入 path，也不要加入最後的 `/`。

### Embed 有載入但 AI 失敗

確認 script 有指定完整的：

```html
data-webtalk-ai-endpoint="https://你的-project.vercel.app/api/webtalk/ai"
```

如果只寫 `/api/webtalk/ai`，瀏覽器會向目前所在的合作網站呼叫，而不是向 Vercel Project 呼叫。

## 9. 安全注意事項

- 不要把 `LLM_API_KEY` 寫進 HTML 或 `webtalk.js`。
- 不要把 API key 放在 GitHub。
- 正式環境必須設定 `WEBTALK_ALLOWED_ORIGINS`。
- 建議在 Vercel 或前置服務加入 rate limit。
- 這個 AI proxy 不保存聊天室 history；聊天本身仍使用現有 WebRTC／P2P 機制。
