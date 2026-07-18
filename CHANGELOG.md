# CHANGELOG

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
